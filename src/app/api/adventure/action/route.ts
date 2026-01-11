import { NextRequest, NextResponse } from 'next/server';
import { actionRequestSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';

export const maxDuration = 60;

const languageInstructions = {
  en: { system: "You are a creative dungeon master. Respond to player actions in a fantasy world." },
  id: { system: "Anda adalah dungeon master kreatif. Respon aksi pemain di dunia fantasi." },
  ja: { system: "あなたは創造的なダンジョンマスターです。プレイヤーの行動に応答してください。" },
};

/**
 * Robust Image Fetcher with gen.pollinations.ai Gateway
 */
async function fetchImageAsBase64(prompt: string, seed: number): Promise<string> {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  const pollUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true&model=flux`;

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      logger.info(`Fetching action image gateway (Attempt ${attempts + 1})`, { prompt, seed, hasKey: !!apiKey });

      const headers: Record<string, string> = { 'Accept': 'image/*' };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await fetch(pollUrl, {
        signal: AbortSignal.timeout(40000),
        headers
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        if (contentType.includes('image')) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return `data:${contentType};base64,${base64}`;
        }
      }
    } catch (e: any) {
      logger.warn(`Pollinations action gateway attempt ${attempts + 1} failed`, { error: e.message });
    }
    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return `https://placehold.co/512x512/1e293b/facc15?text=Vision+Faded+Continue`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, previousScene, language } = actionRequestSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Groq API Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    // Parallel: Text Generation + Translated Keywords
    const [storyResult, translationResult] = await Promise.allSettled([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: lang.system + " Use 3-4 paragraphs with double newlines between them for a novel-like feel. Describe the result of the player's action." },
          { role: 'user', content: `History: ${previousScene}\nAction: ${command}` },
        ],
        temperature: 0.8,
      }),
      groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Translate user command to 3-5 English descriptive visual keywords for an AI image generator. Return ONLY keywords.' },
          { role: 'user', content: command },
        ],
        temperature: 0.1,
      }),
    ]);

    let story = '';
    if (storyResult.status === 'fulfilled') {
      story = storyResult.value.choices?.[0]?.message?.content || '';
    } else {
      logger.error('Story continuation gateway transition failed', { error: storyResult.reason });
      throw new Error('Failed to continue story');
    }

    let keywords = command;
    if (translationResult.status === 'fulfilled') {
      keywords = (translationResult.value.choices?.[0]?.message?.content || command).replace(/[^a-zA-Z0-9, ]/g, '').trim();
    }

    const seed = Math.floor(Math.random() * 9999999);
    const imagePrompt = `pixel art fantasy, ${keywords}, retro RPG scene, highly detailed`;
    const imageResult = await fetchImageAsBase64(imagePrompt, seed);

    return NextResponse.json({
      success: true,
      story,
      imageUrl: imageResult,
    });
  } catch (error: unknown) {
    logger.error('Action gateway fatal error', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

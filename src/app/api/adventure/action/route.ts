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
 * Robust Image Fetcher with Retries
 */
async function fetchImageAsBase64(prompt: string, seed: number): Promise<string> {
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      logger.info(`Fetching image from Pollinations (Attempt ${attempts + 1})`, { prompt, seed });
      const res = await fetch(pollUrl, {
        signal: AbortSignal.timeout(15000),
        headers: { 'Accept': 'image/*' }
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        if (contentType.includes('image')) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return `data:${contentType};base64,${base64}`;
        }
      }
      logger.warn(`Pollinations action attempt ${attempts + 1} failed status ${res.status}`);
    } catch (e) {
      logger.warn(`Pollinations action attempt ${attempts + 1} error`, { error: e });
    }
    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return pollUrl; // Fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, previousScene, language } = actionRequestSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Groq API Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    // Phase 1: Generate Story and English Keywords in parallel
    const [storyResult, translationResult] = await Promise.allSettled([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: lang.system + " 3-4 paragraphs. Describe the result of the player's action." },
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
      logger.error('Story continuation failed', { error: storyResult.reason });
      throw new Error('Failed to continue story');
    }

    let keywords = command;
    if (translationResult.status === 'fulfilled') {
      keywords = (translationResult.value.choices?.[0]?.message?.content || command).replace(/[^a-zA-Z0-9, ]/g, '').trim();
    }

    // Phase 2: Generate Image using keywords (Resilient)
    const seed = Math.floor(Math.random() * 9999999);
    const imagePrompt = `pixel art fantasy, ${keywords}, retro RPG scene, detailed`;
    const imageResult = await fetchImageAsBase64(imagePrompt, seed);

    return NextResponse.json({
      success: true,
      story,
      imageUrl: imageResult,
    });
  } catch (error: unknown) {
    logger.error('Action fatal error', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

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
 * Fetches from Pollinations and converts to Base64
 */
async function fetchImageAsBase64(prompt: string, seed: number): Promise<string> {
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`;

  let attempts = 0;
  const maxAttempts = 3; // Lower for actions to keep it snappy

  while (attempts < maxAttempts) {
    try {
      const res = await fetch(pollUrl, { signal: AbortSignal.timeout(15000) });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        if (contentType.includes('image')) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return `data:${contentType};base64,${base64}`;
        }
      }
    } catch (e) {
      logger.warn(`Pollinations action attempt ${attempts + 1} failed`, { error: e });
    }
    attempts++;
    await new Promise(r => setTimeout(r, 1000));
  }
  return pollUrl; // Fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, previousScene, language } = actionRequestSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    // Parallel: Text Generation + Translated Keywords
    const [storyResult, translationResult] = await Promise.all([
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

    const story = storyResult.choices?.[0]?.message?.content;
    const keywords = (translationResult.choices?.[0]?.message?.content || command).replace(/[^a-zA-Z0-9, ]/g, '').trim();

    // Generate image Base64 after keywords are ready
    const seed = Math.floor(Math.random() * 9999999);
    const imagePrompt = `pixel art fantasy, ${keywords}, retro RPG scene, detailed`;
    const base64Image = await fetchImageAsBase64(imagePrompt, seed);

    return NextResponse.json({
      success: true,
      story,
      imageUrl: base64Image,
    });
  } catch (error: unknown) {
    logger.error('Action error', { error });
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

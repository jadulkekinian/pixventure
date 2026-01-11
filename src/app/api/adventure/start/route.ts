import { NextRequest, NextResponse } from 'next/server';
import { startAdventureSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';

export const maxDuration = 60;

const languageInstructions = {
  en: {
    system: "You are a creative dungeon master. Respond to player actions in a fantasy world.",
    user: "Start a fantasy adventure. The player is at the entrance of a mysterious ancient dungeon.",
  },
  id: {
    system: "Anda adalah dungeon master kreatif. Respon aksi pemain di dunia fantasi.",
    user: "Mulai petualangan fantasi. Pemain berada di depan pintu masuk dungeon kuno yang misterius.",
  },
  ja: {
    system: "あなたは創造的なダンジョンマスターです。プレイヤーの行動に応答してください。",
    user: "ファンタジーアドベンチャーを開始します。プレイヤーは謎めいた古代のダンジョンの入り口にいます。",
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language } = startAdventureSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    // Generate story
    const storyResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: lang.system + " 3-4 paragraphs. Use vivid descriptions. End with a question or choices." },
        { role: 'user', content: lang.user },
      ],
      temperature: 0.8,
    });

    const story = storyResponse.choices?.[0]?.message?.content;
    if (!story) throw new Error('No story generated');

    // Generate image and convert to Base64
    const seed = Math.floor(Math.random() * 9999999);
    const prompt = "pixel art fantasy dungeon entrance, mysterious stone gate, glowing runes, retro RPG style, highly detailed";
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true`;

    let imageUrl = '';
    try {
      const imgRes = await fetch(pollUrl);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        imageUrl = `data:${imgRes.headers.get('content-type') || 'image/jpeg'};base64,${base64}`;
      }
    } catch (e) {
      logger.error('Base64 image generation failed', { error: e });
      // Fallback to direct URL if base64 fails
      imageUrl = pollUrl;
    }

    return NextResponse.json({
      success: true,
      story,
      imageUrl,
    });
  } catch (error: unknown) {
    logger.error('Start adventure error', { error });
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

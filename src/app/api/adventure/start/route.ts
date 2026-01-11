import { NextRequest, NextResponse } from 'next/server';
import { startAdventureSchema } from '@/lib/validation';
import { ValidationError, AIGenerationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';

export const maxDuration = 60; // Allow 60 seconds for AI generation

const languageInstructions = {
  en: {
    system: "You are a creative dungeon master for a fantasy text adventure. Create an immersive opening scene.",
    user: "Start a fantasy adventure. The player is at the entrance of a mysterious ancient dungeon.",
  },
  id: {
    system: "Anda adalah dungeon master kreatif untuk petualangan teks fantasi. Buat adegan pembuka yang imersif.",
    user: "Mulai petualangan fantasi. Pemain berada di depan pintu masuk dungeon kuno yang misterius.",
  },
  ja: {
    system: "あなたはファンタジーテキストアドベンチャーのダンジョンマスターです。没入感のあるオープニングシーンを作成してください。",
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

    // Return direct Pollinations URL with randomized seed
    const seed = Math.floor(Math.random() * 9999999);
    const prompt = "pixel art fantasy dungeon entrance, mysterious stone gate, glowing runes, retro RPG style, highly detailed";
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=768&height=768&seed=${seed}&nologo=true`;

    logger.info('Generated start adventure image URL', { imageUrl });

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

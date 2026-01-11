import { NextRequest, NextResponse } from 'next/server';
import { actionRequestSchema } from '@/lib/validation';
import { ValidationError, AIGenerationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';

export const maxDuration = 60; // Allow 60 seconds for AI generation

const languageInstructions = {
  en: {
    system: `You are a creative adventure game dungeon master running an immersive fantasy text adventure game. Respond in character.`,
  },
  id: {
    system: `Anda adalah penggerak permainan dungeon master kreatif yang menjalankan permainan petualangan teks fantasi. Jawab dalam karakter.`,
  },
  ja: {
    system: `あなたは没入型ファンタジーテキストアドベンチャーのダンジョンマスターです。キャラクターになりきって答えてください。`,
  },
};

async function generateImageBase64(prompt: string): Promise<string | null> {
  try {
    const cleanPrompt = prompt.replace(/[^\w\s,]/gi, '');
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=768&height=768&seed=${seed}&nologo=true`;

    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
  } catch (error) {
    logger.warn('Failed to generate image base64', { error });
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, previousScene, language } = actionRequestSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    // Parallel calls for story and translation
    const [storyResult, translationResult] = await Promise.all([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: lang.system + " 3-4 paragraphs. Vivid sensory details." },
          { role: 'user', content: `Previous: ${previousScene}\nAction: ${command}` },
        ],
        temperature: 0.8,
      }),
      groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Extract 3-5 English keywords for a pixel art image of this action. Keywords only.' },
          { role: 'user', content: command },
        ],
        temperature: 0.1,
      }),
    ]);

    const story = storyResult.choices?.[0]?.message?.content;
    const keywords = translationResult.choices?.[0]?.message?.content || command;

    const imageBase64 = await generateImageBase64(`pixel art, fantasy adventure, ${keywords}, retro game style`);

    return NextResponse.json({
      success: true,
      story,
      imageUrl: imageBase64 || '',
    });
  } catch (error: unknown) {
    logger.error('Action error', { error });
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { startAdventureSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';

export const maxDuration = 60;

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

/**
 * Robust Image Fetcher with gen.pollinations.ai Gateway
 */
async function fetchImageAsBase64(prompt: string, seed: number): Promise<string> {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  // Official gateway endpoint
  const pollUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true&model=flux`;

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      logger.info(`Fetching image gateway (Attempt ${attempts + 1})`, { prompt, seed, hasKey: !!apiKey });

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

      logger.warn(`Pollinations gateway attempt ${attempts + 1} failed status ${res.status}`);
    } catch (e: any) {
      logger.warn(`Pollinations gateway attempt ${attempts + 1} error`, { error: e.message });
    }

    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return `https://placehold.co/512x512/1e293b/facc15?text=Vision+Faded+Try+Action`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language } = startAdventureSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Groq API Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    const seed = Math.floor(Math.random() * 9999999);
    const imagePrompt = "pixel art fantasy dungeon entrance, mysterious stone gate, glowing runes, retro RPG style, highly detailed, vivid colors";

    const [storyResult, imageResult] = await Promise.allSettled([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system', content: lang.system + ` 
          CRITICAL: Your first response must be an EPIC PROLOGUE.
          You must define:
          1. THE WORLD: A unique name and atmosphere (e.g., The Shattered Realms, The Ashlands).
          2. THE IDENTITY: Who is the player? (Exiled Prince, Cursed Scholar, Relic Hunter).
          3. THE TIME: The current era and time of day.
          4. THE QUEST: A specific ultimate goal and why they are starting here.
          
          Use 2-3 short, punchy paragraphs with double newlines. Use vivid, cinematic descriptions.
          
          CRITICAL: Also include RPG metadata at the end in this EXACT format:
          [[RPG:{"hpChange":0,"xpGain":0,"item":null,"actions":["Look around","Check pack","Walk"],"end":null,"day":1,"time":"morning","safe":true,"enemy":null}]]
          - 'day': 1
          - 'time': 'morning'
          - 'safe': true (initial zone is always safe)
          - 'enemy': null
          
          CRITICAL: Provide 'actions' in ${language === 'en' ? 'English' : language === 'id' ? 'Indonesian' : 'Japanese'}.`
          },
          { role: 'user', content: lang.user + " Provide the World Origin and Prologue." },
        ],
        temperature: 0.8,
      }),
      fetchImageAsBase64(imagePrompt, seed)
    ]);

    let story = '';
    if (storyResult.status === 'fulfilled') {
      story = storyResult.value.choices?.[0]?.message?.content || '';
    } else {
      logger.error('Story generation failed', { error: storyResult.reason });
      throw new Error('Failed to generate story');
    }

    let imageUrl = '';
    if (imageResult.status === 'fulfilled') {
      imageUrl = imageResult.value;
    } else {
      imageUrl = `https://placehold.co/512x512/1e293b/facc15?text=Vision+Connection+Issue`;
    }

    return NextResponse.json({
      success: true,
      story,
      imageUrl,
    });
  } catch (error: unknown) {
    logger.error('Start adventure gateway error', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

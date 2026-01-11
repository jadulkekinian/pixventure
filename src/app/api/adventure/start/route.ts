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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language } = startAdventureSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Groq API Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    const seed = Math.floor(Math.random() * 9999999);
    const imagePrompt = "pixel art fantasy world landscape, mysterious ancient setting, retro RPG style, epic scale";

    const [storyResult] = await Promise.allSettled([
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
          - 'hpChange': 0
          - 'day': 1
          - 'time': 'morning'
          - 'safe': true (initial zone is always safe)
          - 'enemy': null
          
          CRITICAL: Provide 'actions' in ${language === 'en' ? 'English' : language === 'id' ? 'Indonesian' : 'Japanese'}.`
          },
          { role: 'user', content: lang.user + " Provide the World Origin and Prologue." },
        ],
        temperature: 0.8,
      })
    ]);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=576&seed=${seed}&nologo=true&model=flux`;

    let story = '';
    if (storyResult.status === 'fulfilled') {
      story = storyResult.value.choices?.[0]?.message?.content || '';
    } else {
      logger.error('Story generation failed', { error: storyResult.reason });
      throw new Error('Failed to generate story');
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

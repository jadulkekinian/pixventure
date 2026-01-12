import { NextRequest, NextResponse } from 'next/server';
import { startAdventureSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';
import { getStartTemplate, generatePlaceholderDataUrl } from '@/lib/story-templates';
import { generateDungeon } from '@/lib/dungeon-generator';

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

    // If no API key, use fallback immediately
    if (!groqApiKey) {
      logger.info('No API key, using fallback template');
      return useFallbackStart(language);
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    const seed = Math.floor(Math.random() * 9999999);
    const imagePrompt = "pixel art fantasy world landscape, mysterious ancient setting, retro RPG style, epic scale";

    try {
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

      // Check if story generation succeeded
      if (storyResult.status === 'fulfilled') {
        const story = storyResult.value.choices?.[0]?.message?.content || '';
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=576&seed=${seed}&nologo=true&model=flux`;

        // Generate dungeon map
        const dungeonMap = generateDungeon(seed, 10);

        return NextResponse.json({
          success: true,
          story,
          imageUrl,
          source: 'ai', // Indicate this came from AI
          dungeonMap, // Include dungeon map
        });
      } else {
        // API failed, use fallback
        logger.warn('Story generation failed, using fallback', { error: storyResult.reason });
        return useFallbackStart(language);
      }
    } catch (apiError: any) {
      // Check if it's a rate limit error
      if (apiError?.status === 429 || apiError?.error?.code === 'rate_limit_exceeded') {
        logger.warn('Rate limit hit, using fallback template');
        return useFallbackStart(language);
      }
      throw apiError;
    }
  } catch (error: unknown) {
    logger.error('Start adventure gateway error', { error });

    // Last resort: use fallback
    try {
      return useFallbackStart('en');
    } catch {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }
}

function useFallbackStart(language: string): NextResponse {
  const template = getStartTemplate(language);
  const seed = Math.floor(Math.random() * 9999999);

  // Try pollinations first, but with fallback keywords
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(template.imageKeywords + ', pixel art, retro RPG')}?width=1024&height=576&seed=${seed}&nologo=true&model=flux`;

  // Generate dungeon map
  const dungeonMap = generateDungeon(seed, 10);

  return NextResponse.json({
    success: true,
    story: template.story,
    imageUrl,
    source: 'template', // Indicate this is from template
    templateId: template.id,
    dungeonMap, // Include dungeon map
  });
}

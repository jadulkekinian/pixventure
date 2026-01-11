import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { startAdventureSchema } from '@/lib/validation';
import { ValidationError, AIGenerationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { saveBase64Image } from '@/lib/image-utils';

export const maxDuration = 60; // Allow 60 seconds for AI generation

const languageInstructions = {
  en: {
    system: `You are a creative adventure game dungeon master. Create a rich, immersive text adventure game story in a fantasy world.

Your role is to:
1. Create an exciting opening scene for a fantasy adventure
2. Describe the environment vividly with sensory details
3. Introduce interesting characters, objects, and locations
4. Present clear choices and paths for the player
5. Keep the story engaging with plot hooks and mysteries
6. Respond to player actions with consequences and new discoveries

Style guidelines:
- Write 3-4 paragraphs for each scene
- Include descriptions of sights, sounds, and atmosphere
- End with hints about what the player can do
- Be creative with magical creatures and fantasy elements
- Make it feel like an epic adventure

IMPORTANT: You are writing a text adventure game. Do not include any meta-commentary about being an AI or game system. Just write the story creatively.`,
    user: 'Start a new fantasy adventure. The player begins standing at the entrance of an ancient, mysterious dungeon. Describe the scene vividly.',
  },
  id: {
    system: `Anda adalah penggerak permainan dungeon master yang kreatif. Buatlah cerita permainan petualangan teks yang kaya dan imersif di dunia fantasi.

Peran Anda adalah:
1. Membuat adegan pembuka yang menarik untuk petualangan fantasi
2. Mendeskripsikan lingkungan dengan rinci menggunakan detail sensoris
3. Memperkenalkan karakter, objek, dan lokasi yang menarik
4. Menyajikan pilihan dan jalur yang jelas bagi pemain
5. Menjaga cerita tetap menarik dengan alur cerita dan misteri
6. Merespons aksi pemain dengan konsekuensi dan penemuan baru

Panduan gaya:
- Tulis 3-4 paragraf untuk setiap adegan
- Sertakan deskripsi tentang pemandangan, suara, dan suasana
- Akhiri dengan petunjuk tentang apa yang bisa dilakukan pemain
- Berkreasi dengan makhluk magis dan elemen fantasi
- Buat terasa seperti petualangan epik

PENTING: Anda menulis permainan petualangan teks. Jangan sertakan komentar meta tentang menjadi AI atau sistem permainan. Hanya tulis cerita secara kreatif.`,
    user: 'Mulai petualangan fantasi baru. Pemain mulai berdiri di pintu masuk dungeon kuno yang misterius. Deskripsikan adegan dengan rinci.',
  },
  ja: {
    system: `あなたは創造的なアドベンチャーゲームのダンジョンマスターです。ファンタジーワールドで豊かで没入感のあるテキストアドベンチャーゲームのストーリーを作成してください。

あなたの役割：
1. ファンタジーアドベンチャーのエキサイティングなオープニングシーンを作成する
2. 感覚的な詳細を使って環境を生き生きと描写する
3. 興味深いキャラクター、物体、場所を紹介する
4. プレイヤーにとって明確な選択肢と道筋を提示する
5. プロットフックと謎でストーリーを魅力的に保つ
6. プレイヤーの行動に結果と新しい発見で応答する

スタイルガイドライン：
- 各シーンで3〜4段落を書く
- 視覚、聴覚、雰囲気の説明を含める
- プレイヤーができることについてのヒントで終わる
- 魔法の生き物とファンタジー要素で創造的になる
- 素晴らしいアドベンチャーのように感じさせる

重要：あなたはテキストアドベンチャーゲームを書いています。AIやゲームシステムについてのメタコメントを含めないでください。ただ創造的にストーリーを書いてください。`,
    user: '新しいファンタジーアドベンチャーを開始してください。プレイヤーは謎めいた古代のダンジョンの入り口に立っています。シーンを生き生きと描写してください。',
  },
};

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = startAdventureSchema.parse(body);
    const { language } = validatedData;

    logger.info('Starting new adventure', { language });

    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;
    const langCode = language === 'en' ? 'English' : language === 'id' ? 'Bahasa Indonesia' : 'Japanese';

    const zaiApiKey = process.env.ZAI_API_KEY;
    if (!zaiApiKey) {
      logger.error('ZAI_API_KEY is not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service is not configured. Please add ZAI_API_KEY to your Vercel environment variables.',
          story: 'As you move forward, the dungeon whispers secrets unknown... [DEMO MODE: Please configure ZAI_API_KEY for the full experience]',
          imageUrl: '',
        },
        { status: 500 }
      );
    }

    // Manual instantiation to bypass the problematic loadConfig() file check
    const zai = new ZAI({
      apiKey: zaiApiKey,
      baseUrl: process.env.ZAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'
    });

    // Generate story and image in parallel for better performance
    // For the start adventure, previousScene and command are not applicable,
    // so we use the initial user prompt for image generation.
    const imagePromptPreview = `${lang.user.substring(0, 200)}. Pixel art style, fantasy video game scene, retro RPG aesthetic, 16-bit graphics`;

    const [storyCompletion, imageResponse] = await Promise.all([
      // Generate story response
      zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: lang.system,
          },
          {
            role: 'user',
            content: lang.user,
          },
        ],
        thinking: { type: 'disabled' },
      }),
      // Generate image in parallel
      zai.images.generations.create({
        prompt: `${imagePromptPreview}. Detailed game environment, magical atmosphere, cinematic view, game screenshot style, vibrant colors, ${langCode} text, digital art`,
        size: '1344x768',
      }),
    ]);

    const story = storyCompletion.choices[0]?.message?.content;
    if (!story) {
      throw new AIGenerationError('No story content generated');
    }

    const imageBase64 = imageResponse.data[0]?.base64;
    if (!imageBase64) {
      throw new AIGenerationError('No image generated');
    }

    // Save image to disk instead of using base64
    let imageUrl: string;
    try {
      imageUrl = await saveBase64Image(imageBase64, 'start');
      logger.info('Start image saved successfully', { imageUrl });
    } catch (imageError) {
      logger.warn('Failed to save image, using fallback', { error: imageError });
      imageUrl = `data:image/png;base64,${imageBase64}`;
    }

    return NextResponse.json({
      success: true,
      story,
      imageUrl,
    });
  } catch (error: unknown) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      logger.warn('Validation error', { error: error.message });
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Handle AI generation errors
    if (error instanceof AIGenerationError) {
      logger.error('AI generation failed', { error: error.message });
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          story: 'You stand before an ancient stone dungeon entrance. Weathered vines climb the dark walls, and a mysterious blue light flickers from within. A weathered sign hangs nearby, but the words are worn away by time. The air is thick with the scent of adventure and danger. What do you do?',
          imageUrl: '',
        },
        { status: 500 }
      );
    }

    // Handle unknown errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error starting adventure', { error: errorMessage, stack: (error instanceof Error ? error.stack : undefined) });
    return NextResponse.json(
      {
        success: false,
        error: `Failed to start adventure: ${errorMessage}`,
        story: 'You stand before an ancient stone dungeon entrance. Weathered vines climb the dark walls, and a mysterious blue light flickers from within. A weathered sign hangs nearby, but the words are worn away by time. The air is thick with the scent of adventure and danger. What do you do?',
        imageUrl: '',
      },
      { status: 500 }
    );
  }
}

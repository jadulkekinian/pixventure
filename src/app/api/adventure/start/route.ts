import { NextRequest, NextResponse } from 'next/server';
import { startAdventureSchema } from '@/lib/validation';
import { ValidationError, AIGenerationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { saveBase64Image } from '@/lib/image-utils';
import { GoogleGenAI, Modality } from '@google/genai';

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

    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleApiKey) {
      logger.error('GOOGLE_AI_API_KEY is not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service is not configured. Please add GOOGLE_AI_API_KEY to your Vercel environment variables.',
          story: 'As you move forward, the dungeon whispers secrets unknown... [DEMO MODE: Please configure GOOGLE_AI_API_KEY for the full experience]',
          imageUrl: '',
        },
        { status: 500 }
      );
    }

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey: googleApiKey });

    // Generate story and image in parallel for better performance
    const imagePrompt = `${lang.user.substring(0, 200)}. Pixel art style, fantasy video game scene, retro RPG aesthetic, 16-bit graphics, detailed game environment, magical atmosphere, cinematic view`;

    const [storyResult, imageResult] = await Promise.allSettled([
      // 1. Generate story (Gemini 2.0 Flash)
      ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${lang.system}\n\n${lang.user}` }],
          },
        ],
      }),

      // 2. Generate image (Imagen 3)
      ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1',
          outputOptions: {
            mimeType: 'image/png',
          },
        },
      }),
    ]);

    // Handle story result
    let story: string;
    if (storyResult.status === 'fulfilled') {
      story = storyResult.value.text || '';
      if (!story) {
        throw new AIGenerationError('No story content generated');
      }
    } else {
      logger.error('Story generation failed', { error: storyResult.reason });
      throw new AIGenerationError(`Story generation failed: ${storyResult.reason}`);
    }

    // Handle image result
    let imageUrl = '';
    if (imageResult.status === 'fulfilled') {
      const imageData = imageResult.value.generatedImages?.[0];
      if (imageData?.image?.imageBytes) {
        // Convert bytes to base64
        const base64Image = Buffer.from(imageData.image.imageBytes).toString('base64');
        try {
          imageUrl = await saveBase64Image(base64Image, 'start');
          logger.info('Start image saved successfully', { imageUrl });
        } catch (imageError) {
          logger.warn('Failed to save image, using fallback', { error: imageError });
          imageUrl = `data:image/png;base64,${base64Image}`;
        }
      } else {
        logger.warn('No image data in response');
      }
    } else {
      logger.warn('Image generation failed, continuing without image', { error: imageResult.reason });
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

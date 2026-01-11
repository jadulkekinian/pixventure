import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { actionRequestSchema } from '@/lib/validation';
import { ValidationError, AIGenerationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { saveBase64Image } from '@/lib/image-utils';

const languageInstructions = {
  en: {
    system: `You are a creative adventure game dungeon master running an immersive fantasy text adventure game.

Your role is to:
1. Respond naturally to player actions with consequences
2. Describe new environments vividly with sensory details
3. Introduce new challenges, puzzles, and discoveries
4. Reward creative thinking with interesting outcomes
5. Keep the story moving forward with plot developments
6. Maintain consistency with previous scenes
7. Create tension and excitement throughout the adventure

Style guidelines:
- Write 3-4 paragraphs for each response
- Describe what happens as a result of the player's action
- Include sights, sounds, smells, and atmosphere
- Introduce new elements to explore (items, NPCs, locations)
- End with hints about further actions or discoveries
- Be creative with magical effects and fantasy elements
- If the player's action doesn't make sense, describe the result or suggest alternate approaches
- Handle combat, exploration, interactions, puzzles with appropriate descriptions

IMPORTANT: Always stay in character as the adventure narrator. Never break the fourth wall or mention you're an AI. Just continue the story naturally based on their action.`,
  },
  id: {
    system: `Anda adalah penggerak permainan dungeon master kreatif yang menjalankan permainan petualangan teks fantasi yang imersif.

Peran Anda adalah:
1. Merespons secara alami terhadap aksi pemain dengan konsekuensi
2. Mendeskripsikan lingkungan baru dengan rinci menggunakan detail sensoris
3. Memperkenalkan tantangan, teka-teki, dan penemuan baru
4. Menghargai pemikiran kreatif dengan hasil yang menarik
5. Menjaga cerita bergerak maju dengan perkembangan plot
6. Menjaga konsistensi dengan adegan sebelumnya
7. Menciptakan ketegangan dan kegembiraan sepanjang petualangan

Panduan gaya:
- Tulis 3-4 paragraf untuk setiap respons
- Deskripsikan apa yang terjadi sebagai akibat dari aksi pemain
- Sertakan pemandangan, suara, bau, dan suasana
- Perkenalkan elemen baru untuk dieksplorasi (item, NPC, lokasi)
- Akhiri dengan petunjuk tentang tindakan atau penemuan lebih lanjut
- Berkreasi dengan efek magis dan elemen fantasi
- Jika aksi pemain tidak masuk akal, deskripsikan hasilnya atau sarankan pendekatan alternatif
- Tangani pertempuran, eksplorasi, interaksi, teka-teki dengan deskripsi yang sesuai

PENTING: Selalu tetap sebagai narator petualangan. Jangan pernah memecahkan dinding keempat atau menyebutkan Anda adalah AI. Lanjutkan cerita secara alami berdasarkan tindakan mereka.`,
  },
  ja: {
    system: `あなたは没入感のあるファンタジーテキストアドベンチャーゲームを実行している創造的なアドベンチャーゲームのダンジョンマスターです。

あなたの役割：
1. プレイヤーの行動に結果を伴って自然に応答する
2. 感覚的な詳細を使って新しい環境を生き生きと描写する
3. 新しい挑戦、パズル、発見を紹介する
4. 興味深い結果で創造的な思考を報酬にする
5. プロットの展開で物語を前進させる
6. 以前のシーンとの一貫性を維持する
7. 冒険全体を通して緊張と興奮を作り出す

スタイルガイドライン：
- 各応答で3〜4段落を書く
- プレイヤーの行動の結果として何が起こるかを描写する
- 視覚、聴覚、匂い、雰囲気を含める
- 探索する新しい要素を紹介する（アイテム、NPC、場所）
- さらなる行動や発見のヒントで終わる
- 魔法の効果とファンタジー要素で創造的になる
- プレイヤーの行動が理にかなっていない場合、結果を説明するか、代替案を提案する
- 戦闘、探索、相互作用、パズルを適切な説明で扱う

重要：常にアドベンチャーナレーターとしてキャラクターを保ってください。第四の壁を壊したり、AIであることに言及したりしないでください。彼らの行動に基づいて物語を自然に続けてください。`,
  },
};

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = actionRequestSchema.parse(body);
    const { command, previousScene, language } = validatedData;

    logger.info('Processing adventure action', { command, language });

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
      baseUrl: process.env.ZAI_BASE_URL || 'https://api.z-ai.cn/v1'
    });

    // Generate story and image in parallel for better performance
    // Use the command and previous scene to create a specific image prompt
    const imagePromptPreview = `${previousScene.substring(0, 200)}. Player action: ${command}. Pixel art style, fantasy video game scene, retro RPG aesthetic, 16-bit graphics`;

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
            content: `Previous scene: ${previousScene}\n\nPlayer action: ${command}\n\nContinue the story based on this action. Describe what happens next.`,
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
      imageUrl = await saveBase64Image(imageBase64, 'action');
      logger.info('Image saved successfully', { imageUrl });
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
          story: 'As you take action, the dungeon seems to shift and change around you. Strange whispers echo through the corridors, and you sense that powerful magic is at work. You press forward, deeper into the unknown...',
          imageUrl: '',
        },
        { status: 500 }
      );
    }

    // Handle unknown errors
    logger.error('Error processing adventure action', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process action. Please try again.',
        story: 'As you take action, the dungeon seems to shift and change around you. Strange whispers echo through the corridors, and you sense that powerful magic is at work. You press forward, deeper into the unknown...',
        imageUrl: '',
      },
      { status: 500 }
    );
  }
}

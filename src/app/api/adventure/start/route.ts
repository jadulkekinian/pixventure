import { NextRequest, NextResponse } from 'next/server';
import { startAdventureSchema } from '@/lib/validation';
import { ValidationError, AIGenerationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';

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

// Generate image using Pollinations.ai and return Base64
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
    const validatedData = startAdventureSchema.parse(body);
    const { language } = validatedData;

    logger.info('Starting new adventure', { language });

    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json({ success: false, error: 'GROQ_API_KEY missing' }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqApiKey });

    // Parallel execution
    const [storyResponse, imageBase64] = await Promise.all([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: lang.system },
          { role: 'user', content: lang.user },
        ],
        temperature: 0.8,
        max_tokens: 1024,
      }),
      generateImageBase64('pixel art fantasy dungeon entrance, mysterious stone ruins, cinematic retro RPG style')
    ]);

    const story = storyResponse.choices?.[0]?.message?.content;
    if (!story) throw new AIGenerationError('No story generated');

    return NextResponse.json({
      success: true,
      story,
      imageUrl: imageBase64 || '',
    });
  } catch (error: unknown) {
    logger.error('Error starting adventure', { error });
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

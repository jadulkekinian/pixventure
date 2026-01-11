import { NextRequest, NextResponse } from 'next/server';
import { actionRequestSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';

export const maxDuration = 60;

const languageInstructions = {
  en: { system: "You are a creative dungeon master. Respond to player actions in a fantasy world." },
  id: { system: "Anda adalah dungeon master kreatif. Respon aksi pemain di dunia fantasi." },
  ja: { system: "あなたは創造的なダンジョンマスターです。プレイヤーの行動に応答してください。" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, previousScene, language } = actionRequestSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ success: false, error: 'Groq API Key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    // Parallel: Text Generation + Translated Keywords
    const [storyResult, translationResult] = await Promise.allSettled([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system', content: lang.system + ` Use 1-2 short, punchy paragraphs with double newlines between them. Describe the result of the player's action.
          
          CRITICAL: Also include RPG metadata at the end in this EXACT format:
          [[RPG:{"hpChange":-5,"xpGain":10,"item":"Torch","actions":["Go Up","Open Door","Rest"],"end":null,"day":1,"time":"morning","safe":false,"enemy":{"name":"Goblin","hp":20,"maxHp":20}}]]
          - 'hpChange': - (damage), + (heal), or 0.
          - 'xpGain': number of XP earned.
          - 'item': name of item found or null.
          - 'actions': 3 short quick contextual actions.
          - 'end': 'win' if goal achieved, 'lose' if HP hits 0 or fatal event, else null.
          - 'day': Current adventure day.
          - 'time': 'morning', 'afternoon', 'evening', or 'night'.
          - 'safe': true if the location is safe (Shrine, Camp, Secure Room), else false.
          - 'enemy': {"name":"Monster Name","hp":number,"maxHp":number} if in combat, else null.
          
          LOGIC GUARD: Reject impossible or anachronistic actions narratively. Explain why it failed and apply a small HP penalty for "mental strain" if the command is insane.
          
          COMBAT RULES: If an enemy is active, player actions should damage the enemy or defend. The AI must manage enemy HP in the metadata. If enemy HP hits 0, it is defeated and you must set 'enemy' to null.
          
          REST RULE: If the player chooses to 'Rest' in a safe zone, provide a positive 'hpChange' (e.g. +50) to heal them.
          
          LANGUAGE: Provide story AND 'actions' in ${language === 'en' ? 'English' : language === 'id' ? 'Indonesian' : 'Japanese'}.`
          },
          { role: 'user', content: `History: ${previousScene}\nAction: ${command}` },
        ],
        temperature: 0.8,
      }),
      groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Translate user command to 3-5 English descriptive visual keywords for an AI image generator. Return ONLY keywords.' },
          { role: 'user', content: command },
        ],
        temperature: 0.1,
      }),
    ]);

    let story = '';
    if (storyResult.status === 'fulfilled') {
      story = storyResult.value.choices?.[0]?.message?.content || '';
    } else {
      logger.error('Story continuation gateway transition failed', { error: storyResult.reason });
      throw new Error('Failed to continue story');
    }

    let keywords = command;
    if (translationResult.status === 'fulfilled') {
      keywords = (translationResult.value.choices?.[0]?.message?.content || command).replace(/[^a-zA-Z0-9, ]/g, '').trim();
    }

    const seed = Math.floor(Math.random() * 9999999);
    const imagePrompt = `pixel art fantasy, ${keywords}, retro RPG scene, highly detailed`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=576&seed=${seed}&nologo=true&model=flux`;

    return NextResponse.json({
      success: true,
      story,
      imageUrl,
    });
  } catch (error: unknown) {
    logger.error('Action gateway fatal error', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

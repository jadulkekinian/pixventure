import { NextRequest, NextResponse } from 'next/server';
import { actionRequestSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';
import { getActionTemplate, detectActionContext, generatePlaceholderDataUrl } from '@/lib/story-templates';

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

    // Check if there's an active enemy in the previous scene
    const hasEnemy = previousScene.includes('"enemy":{') && !previousScene.includes('"enemy":null');

    // If no API key, use fallback immediately
    if (!groqApiKey) {
      logger.info('No API key, using fallback template');
      return useFallbackAction(command, hasEnemy, language);
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const lang = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    try {
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
            - 'end': Use 'win' ONLY if the overall adventure goal is achieved. Use 'lose' ONLY if the player character dies or the mission is permanently failed. Use null for normal scenes (even if a monster dies).
            - 'day': Current adventure day.
            - 'time': 'morning', 'afternoon', 'evening', or 'night'.
            - 'safe': true if the location is safe (Shrine, Camp, Secure Room), else false.
            - 'enemy': {"name":"Monster Name","hp":number,"maxHp":number} if in combat, else null.
            
            LOGIC GUARD: Reject impossible or anachronistic actions narratively. Explain why it failed and apply a small HP penalty for "mental strain" if the command is insane.
            
            COMBAT RULES: If an enemy is active, player actions should damage the enemy or defend. The AI must manage enemy HP in the metadata. If enemy HP hits 0, it is defeated and you must set 'enemy' to null.
            
            SAFEGUARD: Do NOT reduce player HP (hpChange) when a monster is defeated, unless the monster used a self-destruct move. Victory should usually reward XP (xpGain > 0).
            
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

      // Check if story generation succeeded
      if (storyResult.status === 'fulfilled') {
        const story = storyResult.value.choices?.[0]?.message?.content || '';

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
          source: 'ai',
        });
      } else {
        // API failed, use fallback
        logger.warn('Story generation failed, using fallback', { error: storyResult.reason });
        return useFallbackAction(command, hasEnemy, language);
      }
    } catch (apiError: any) {
      // Check if it's a rate limit error
      if (apiError?.status === 429 || apiError?.error?.code === 'rate_limit_exceeded') {
        logger.warn('Rate limit hit, using fallback template');
        return useFallbackAction(command, hasEnemy, language);
      }
      throw apiError;
    }
  } catch (error: unknown) {
    logger.error('Action gateway fatal error', { error });

    // Last resort: use fallback
    try {
      return useFallbackAction('continue', false, 'en');
    } catch {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }
}

function useFallbackAction(command: string, hasEnemy: boolean, language: string): NextResponse {
  const context = detectActionContext(command, hasEnemy);
  const template = getActionTemplate(context, language);
  const seed = Math.floor(Math.random() * 9999999);

  // Generate image URL based on context
  const imagePrompt = `pixel art fantasy, ${template.imageKeywords}, retro RPG scene`;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=576&seed=${seed}&nologo=true&model=flux`;

  return NextResponse.json({
    success: true,
    story: template.story,
    imageUrl,
    source: 'template',
    templateId: template.id,
  });
}

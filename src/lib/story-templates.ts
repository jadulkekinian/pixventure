/**
 * Pre-written story templates for fallback when API limit is reached
 * These provide a complete adventure experience without AI
 */

export interface StoryTemplate {
    id: string;
    story: string;
    imageKeywords: string;
    metadata: {
        hpChange: number;
        xpGain: number;
        item: string | null;
        actions: string[];
        end: 'win' | 'lose' | null;
        day: number;
        time: 'morning' | 'afternoon' | 'evening' | 'night';
        safe: boolean;
        enemy: { name: string; hp: number; maxHp: number } | null;
    };
}

export interface StartTemplate extends StoryTemplate {
    worldName: string;
    playerRole: string;
}

// ===== STARTING STORIES =====
export const startTemplates: Record<string, StartTemplate[]> = {
    en: [
        {
            id: 'start_dungeon_1',
            worldName: 'The Shattered Realms',
            playerRole: 'Exiled Prince',
            story: `**THE SHATTERED REALMS**

You are Kael, the Exiled Prince of the fallen kingdom of Valdris. Three moons have passed since the shadow cult overthrew your father's throne. Now you stand before the entrance of the **Obsidian Crypt** — the ancient dungeon where the legendary Sword of Dawn lies hidden.

The morning mist swirls around moss-covered stone pillars. A cold breeze carries whispers of those who entered before you... and never returned. Your quest is clear: retrieve the Sword, reclaim your kingdom, or die trying.

[[RPG:{"hpChange":0,"xpGain":0,"item":null,"actions":["Enter the crypt","Search the entrance","Check your supplies"],"end":null,"day":1,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'ancient dungeon entrance, misty morning, stone pillars, dark fantasy',
            metadata: { hpChange: 0, xpGain: 0, item: null, actions: ['Enter the crypt', 'Search the entrance', 'Check your supplies'], end: null, day: 1, time: 'morning', safe: true, enemy: null }
        },
        {
            id: 'start_forest_1',
            worldName: 'The Emerald Wilds',
            playerRole: 'Wandering Healer',
            story: `**THE EMERALD WILDS**

You are Liora, a Wandering Healer who has traveled far from your destroyed village. The plague that consumed your home was no natural sickness — it was dark magic from the **Witch of Thornwood**.

Now you stand at the edge of the enchanted forest, where twisted trees block out the morning sun. Somewhere deep within lies the witch's lair and the cure that could save the survivors. Your herbs pouch is full, your resolve unshaken.

[[RPG:{"hpChange":0,"xpGain":0,"item":null,"actions":["Follow the path","Gather herbs","Listen to the forest"],"end":null,"day":1,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'enchanted forest entrance, mystical healer, twisted trees, morning light',
            metadata: { hpChange: 0, xpGain: 0, item: null, actions: ['Follow the path', 'Gather herbs', 'Listen to the forest'], end: null, day: 1, time: 'morning', safe: true, enemy: null }
        },
        {
            id: 'start_castle_1',
            worldName: 'The Frozen Throne',
            playerRole: 'Mercenary Captain',
            story: `**THE FROZEN THRONE**

You are Varn, a battle-hardened Mercenary Captain. The Northern King has offered you a fortune in gold to infiltrate **Castle Rimeholt** and assassinate the Ice Sorcerer who has frozen the kingdom in eternal winter.

The castle looms before you, its spires encased in frost that glitters under the pale morning sun. Your blade is sharp, your skills unmatched. But whispers say the sorcerer commands an army of frost wraiths...

[[RPG:{"hpChange":0,"xpGain":0,"item":null,"actions":["Scout the perimeter","Find a secret entrance","Approach the main gate"],"end":null,"day":1,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'frozen castle, ice and snow, mercenary warrior, winter morning',
            metadata: { hpChange: 0, xpGain: 0, item: null, actions: ['Scout the perimeter', 'Find a secret entrance', 'Approach the main gate'], end: null, day: 1, time: 'morning', safe: true, enemy: null }
        },
    ],
    id: [
        {
            id: 'start_dungeon_1_id',
            worldName: 'Kerajaan yang Hancur',
            playerRole: 'Pangeran Terbuang',
            story: `**KERAJAAN YANG HANCUR**

Kamu adalah Kael, Pangeran Terbuang dari kerajaan Valdris yang telah jatuh. Tiga bulan telah berlalu sejak kultus bayangan menggulingkan tahta ayahmu. Kini kamu berdiri di depan pintu masuk **Makam Obsidian** — ruang bawah tanah kuno tempat Pedang Fajar tersembunyi.

Kabut pagi berputar di sekitar pilar batu berlumut. Angin dingin membawa bisikan dari mereka yang masuk sebelummu... dan tidak pernah kembali. Misimu jelas: ambil Pedang, rebut kembali kerajaanmu, atau mati mencoba.

[[RPG:{"hpChange":0,"xpGain":0,"item":null,"actions":["Masuk ke makam","Periksa pintu masuk","Cek perbekalan"],"end":null,"day":1,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'pintu dungeon kuno, kabut pagi, pilar batu, fantasi gelap',
            metadata: { hpChange: 0, xpGain: 0, item: null, actions: ['Masuk ke makam', 'Periksa pintu masuk', 'Cek perbekalan'], end: null, day: 1, time: 'morning', safe: true, enemy: null }
        },
        {
            id: 'start_forest_1_id',
            worldName: 'Hutan Zamrud',
            playerRole: 'Tabib Pengembara',
            story: `**HUTAN ZAMRUD**

Kamu adalah Liora, seorang Tabib Pengembara yang telah melakukan perjalanan jauh dari desamu yang hancur. Wabah yang melanda rumahmu bukanlah penyakit biasa — itu adalah sihir gelap dari **Penyihir Thornwood**.

Kini kamu berdiri di tepi hutan terlarang, di mana pohon-pohon bengkok menghalangi sinar matahari pagi. Di suatu tempat jauh di dalam hutan terdapat sarang penyihir dan obat yang bisa menyelamatkan para penyintas. Kantong ramuanmu penuh, tekadmu tak tergoyahkan.

[[RPG:{"hpChange":0,"xpGain":0,"item":null,"actions":["Ikuti jalur","Kumpulkan ramuan","Dengarkan hutan"],"end":null,"day":1,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'pintu masuk hutan terlarang, tabib mistis, pohon bengkok, cahaya pagi',
            metadata: { hpChange: 0, xpGain: 0, item: null, actions: ['Ikuti jalur', 'Kumpulkan ramuan', 'Dengarkan hutan'], end: null, day: 1, time: 'morning', safe: true, enemy: null }
        },
    ],
    ja: [
        {
            id: 'start_dungeon_1_ja',
            worldName: '砕かれし王国',
            playerRole: '追放された王子',
            story: `**砕かれし王国**

あなたはケイル、陥落したヴァルドリス王国の追放された王子です。影の教団があなたの父の王座を奪ってから三ヶ月が経ちました。今、あなたは伝説の夜明けの剣が隠されている**黒曜石の地下墳墓**の入り口に立っています。

朝霧が苔むした石柱の周りに渦巻いています。冷たい風があなたより先に入った者たちの囁きを運んできます...そして彼らは二度と戻りませんでした。あなたの使命は明確です：剣を取り戻し、王国を奪還するか、死ぬか。

[[RPG:{"hpChange":0,"xpGain":0,"item":null,"actions":["地下墳墓に入る","入り口を調べる","持ち物を確認"],"end":null,"day":1,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: '古代のダンジョン入口、霧の朝、石柱、ダークファンタジー',
            metadata: { hpChange: 0, xpGain: 0, item: null, actions: ['地下墳墓に入る', '入り口を調べる', '持ち物を確認'], end: null, day: 1, time: 'morning', safe: true, enemy: null }
        },
    ],
};

// ===== ACTION RESPONSE TEMPLATES =====
export const actionTemplates: Record<string, StoryTemplate[]> = {
    // Combat templates
    combat: [
        {
            id: 'combat_hit_1',
            story: `Your blade finds its mark! The creature staggers back, wounded but not defeated. It snarls and prepares to counterattack.

[[RPG:{"hpChange":-5,"xpGain":15,"item":null,"actions":["Strike again","Defend","Use item"],"end":null,"day":1,"time":"morning","safe":false,"enemy":{"name":"Shadow Fiend","hp":35,"maxHp":50}}]]`,
            imageKeywords: 'combat scene, sword strike, wounded monster, fantasy battle',
            metadata: { hpChange: -5, xpGain: 15, item: null, actions: ['Strike again', 'Defend', 'Use item'], end: null, day: 1, time: 'morning', safe: false, enemy: { name: 'Shadow Fiend', hp: 35, maxHp: 50 } }
        },
        {
            id: 'combat_hit_2',
            story: `You dodge the monster's claws and land a powerful strike! The creature howls in pain. Blood drips from its wound, but it's still dangerous.

[[RPG:{"hpChange":-8,"xpGain":20,"item":null,"actions":["Finish it off","Defensive stance","Retreat"],"end":null,"day":1,"time":"afternoon","safe":false,"enemy":{"name":"Cave Troll","hp":25,"maxHp":60}}]]`,
            imageKeywords: 'epic battle, warrior fighting troll, cave combat, blood and steel',
            metadata: { hpChange: -8, xpGain: 20, item: null, actions: ['Finish it off', 'Defensive stance', 'Retreat'], end: null, day: 1, time: 'afternoon', safe: false, enemy: { name: 'Cave Troll', hp: 25, maxHp: 60 } }
        },
        {
            id: 'combat_victory_1',
            story: `With a final devastating blow, the creature collapses! Victory is yours. The adrenaline fades as you catch your breath, surveying the battlefield. Some gold coins glitter among the remains.

[[RPG:{"hpChange":0,"xpGain":50,"item":"Gold Pouch","actions":["Loot the body","Continue forward","Rest here"],"end":null,"day":1,"time":"afternoon","safe":false,"enemy":null}]]`,
            imageKeywords: 'victory scene, defeated monster, treasure, fantasy warrior',
            metadata: { hpChange: 0, xpGain: 50, item: 'Gold Pouch', actions: ['Loot the body', 'Continue forward', 'Rest here'], end: null, day: 1, time: 'afternoon', safe: false, enemy: null }
        },
        {
            id: 'combat_victory_2',
            story: `The beast falls with a thunderous crash! You stand victorious, your weapon dripping with dark ichor. Among its treasures, you find an ancient amulet that pulses with magic.

[[RPG:{"hpChange":0,"xpGain":75,"item":"Ancient Amulet","actions":["Wear the amulet","Store it safely","Examine it"],"end":null,"day":1,"time":"evening","safe":false,"enemy":null}]]`,
            imageKeywords: 'epic victory, magical amulet, fallen beast, triumphant warrior',
            metadata: { hpChange: 0, xpGain: 75, item: 'Ancient Amulet', actions: ['Wear the amulet', 'Store it safely', 'Examine it'], end: null, day: 1, time: 'evening', safe: false, enemy: null }
        },
    ],
    // Combat templates - Indonesian
    combat_id: [
        {
            id: 'combat_hit_1_id',
            story: `Pedangmu mengenai sasaran! Makhluk itu terhuyung mundur, terluka tapi belum kalah. Ia menggeram dan bersiap menyerang balik.

[[RPG:{"hpChange":-5,"xpGain":15,"item":null,"actions":["Serang lagi","Bertahan","Gunakan item"],"end":null,"day":1,"time":"morning","safe":false,"enemy":{"name":"Iblis Bayangan","hp":35,"maxHp":50}}]]`,
            imageKeywords: 'adegan pertarungan, serangan pedang, monster terluka, pertempuran fantasi',
            metadata: { hpChange: -5, xpGain: 15, item: null, actions: ['Serang lagi', 'Bertahan', 'Gunakan item'], end: null, day: 1, time: 'morning', safe: false, enemy: { name: 'Iblis Bayangan', hp: 35, maxHp: 50 } }
        },
        {
            id: 'combat_victory_1_id',
            story: `Dengan serangan terakhir yang menghancurkan, makhluk itu roboh! Kemenangan milikmu. Adrenalin mereda saat kamu mengatur napas, mengamati medan pertempuran. Beberapa koin emas berkilau di antara sisa-sisanya.

[[RPG:{"hpChange":0,"xpGain":50,"item":"Kantong Emas","actions":["Jarah tubuhnya","Lanjut maju","Istirahat di sini"],"end":null,"day":1,"time":"afternoon","safe":false,"enemy":null}]]`,
            imageKeywords: 'adegan kemenangan, monster dikalahkan, harta karun, pejuang fantasi',
            metadata: { hpChange: 0, xpGain: 50, item: 'Kantong Emas', actions: ['Jarah tubuhnya', 'Lanjut maju', 'Istirahat di sini'], end: null, day: 1, time: 'afternoon', safe: false, enemy: null }
        },
    ],
    // Exploration templates
    explore: [
        {
            id: 'explore_treasure_1',
            story: `As you search the area, your fingers brush against something hidden. A small chest, covered in dust and cobwebs! Inside you find a gleaming health potion.

[[RPG:{"hpChange":0,"xpGain":10,"item":"Health Potion","actions":["Drink the potion","Keep exploring","Move on"],"end":null,"day":1,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'treasure chest, hidden treasure, dungeon discovery, potion',
            metadata: { hpChange: 0, xpGain: 10, item: 'Health Potion', actions: ['Drink the potion', 'Keep exploring', 'Move on'], end: null, day: 1, time: 'morning', safe: true, enemy: null }
        },
        {
            id: 'explore_danger_1',
            story: `The corridor opens into a vast chamber. Bones crunch beneath your feet — the remains of previous adventurers. Suddenly, red eyes gleam from the darkness. A Shadow Fiend emerges, blocking your path!

[[RPG:{"hpChange":0,"xpGain":0,"item":null,"actions":["Draw your weapon","Try to flee","Negotiate"],"end":null,"day":1,"time":"afternoon","safe":false,"enemy":{"name":"Shadow Fiend","hp":50,"maxHp":50}}]]`,
            imageKeywords: 'dark chamber, monster encounter, glowing red eyes, danger',
            metadata: { hpChange: 0, xpGain: 0, item: null, actions: ['Draw your weapon', 'Try to flee', 'Negotiate'], end: null, day: 1, time: 'afternoon', safe: false, enemy: { name: 'Shadow Fiend', hp: 50, maxHp: 50 } }
        },
        {
            id: 'explore_safe_1',
            story: `You discover a hidden sanctuary — an ancient shrine untouched by the dungeon's corruption. Magical runes glow softly on the walls. The air here feels pure and calming. This would be a perfect place to rest.

[[RPG:{"hpChange":0,"xpGain":5,"item":null,"actions":["Rest here","Pray at the shrine","Examine the runes"],"end":null,"day":1,"time":"evening","safe":true,"enemy":null}]]`,
            imageKeywords: 'ancient shrine, glowing runes, safe sanctuary, magical atmosphere',
            metadata: { hpChange: 0, xpGain: 5, item: null, actions: ['Rest here', 'Pray at the shrine', 'Examine the runes'], end: null, day: 1, time: 'evening', safe: true, enemy: null }
        },
        {
            id: 'explore_mystery_1',
            story: `Behind a hidden door, you find an ancient library. Dust-covered tomes line the shelves, some radiating faint magical energy. A mysterious book catches your eye — its cover bears the symbol of the lost kingdom.

[[RPG:{"hpChange":0,"xpGain":15,"item":"Ancient Tome","actions":["Read the book","Take the tome","Search for more"],"end":null,"day":1,"time":"afternoon","safe":true,"enemy":null}]]`,
            imageKeywords: 'ancient library, magical books, mysterious tomes, fantasy scholar',
            metadata: { hpChange: 0, xpGain: 15, item: 'Ancient Tome', actions: ['Read the book', 'Take the tome', 'Search for more'], end: null, day: 1, time: 'afternoon', safe: true, enemy: null }
        },
    ],
    // Exploration templates - Indonesian
    explore_id: [
        {
            id: 'explore_treasure_1_id',
            story: `Saat kamu menjelajahi area, jari-jarimu menyentuh sesuatu yang tersembunyi. Sebuah peti kecil, tertutup debu dan sarang laba-laba! Di dalamnya kamu menemukan ramuan kesehatan yang berkilau.

[[RPG:{"hpChange":0,"xpGain":10,"item":"Ramuan Kesehatan","actions":["Minum ramuan","Terus menjelajah","Lanjut pergi"],"end":null,"day":1,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'peti harta, harta tersembunyi, penemuan dungeon, ramuan',
            metadata: { hpChange: 0, xpGain: 10, item: 'Ramuan Kesehatan', actions: ['Minum ramuan', 'Terus menjelajah', 'Lanjut pergi'], end: null, day: 1, time: 'morning', safe: true, enemy: null }
        },
        {
            id: 'explore_danger_1_id',
            story: `Koridor membuka ke ruangan besar. Tulang-tulang berderak di bawah kakimu — sisa-sisa petualang sebelumnya. Tiba-tiba, mata merah berkilau dari kegelapan. Iblis Bayangan muncul, menghalangi jalanmu!

[[RPG:{"hpChange":0,"xpGain":0,"item":null,"actions":["Cabut senjata","Coba melarikan diri","Negosiasi"],"end":null,"day":1,"time":"afternoon","safe":false,"enemy":{"name":"Iblis Bayangan","hp":50,"maxHp":50}}]]`,
            imageKeywords: 'ruangan gelap, pertemuan monster, mata merah menyala, bahaya',
            metadata: { hpChange: 0, xpGain: 0, item: null, actions: ['Cabut senjata', 'Coba melarikan diri', 'Negosiasi'], end: null, day: 1, time: 'afternoon', safe: false, enemy: { name: 'Iblis Bayangan', hp: 50, maxHp: 50 } }
        },
    ],
    // Rest templates
    rest: [
        {
            id: 'rest_heal_1',
            story: `You settle down and take a moment to rest. The magical atmosphere of the sanctuary soothes your wounds. Energy returns to your weary body. After some time, you feel refreshed and ready to continue.

[[RPG:{"hpChange":40,"xpGain":0,"item":null,"actions":["Continue the journey","Explore more","Check inventory"],"end":null,"day":2,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'resting adventurer, healing light, sanctuary, peaceful moment',
            metadata: { hpChange: 40, xpGain: 0, item: null, actions: ['Continue the journey', 'Explore more', 'Check inventory'], end: null, day: 2, time: 'morning', safe: true, enemy: null }
        },
        {
            id: 'rest_heal_2',
            story: `You build a small campfire and rest for the night. The flames dance, casting warm shadows on the ancient walls. Your wounds slowly heal as you drift into a dreamless sleep. Dawn brings renewed strength.

[[RPG:{"hpChange":50,"xpGain":5,"item":null,"actions":["Pack up camp","Scout the area","Eat rations"],"end":null,"day":2,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'campfire, resting warrior, healing sleep, dawn breaking',
            metadata: { hpChange: 50, xpGain: 5, item: null, actions: ['Pack up camp', 'Scout the area', 'Eat rations'], end: null, day: 2, time: 'morning', safe: true, enemy: null }
        },
    ],
    // Rest templates - Indonesian
    rest_id: [
        {
            id: 'rest_heal_1_id',
            story: `Kamu duduk dan meluangkan waktu untuk istirahat. Atmosfer magis dari sanctuary menenangkan luka-lukamu. Energi kembali ke tubuhmu yang lelah. Setelah beberapa saat, kamu merasa segar dan siap melanjutkan.

[[RPG:{"hpChange":40,"xpGain":0,"item":null,"actions":["Lanjutkan perjalanan","Jelajahi lagi","Cek inventaris"],"end":null,"day":2,"time":"morning","safe":true,"enemy":null}]]`,
            imageKeywords: 'petualang beristirahat, cahaya penyembuhan, sanctuary, momen damai',
            metadata: { hpChange: 40, xpGain: 0, item: null, actions: ['Lanjutkan perjalanan', 'Jelajahi lagi', 'Cek inventaris'], end: null, day: 2, time: 'morning', safe: true, enemy: null }
        },
    ],
    // Generic fallback
    generic: [
        {
            id: 'generic_continue_1',
            story: `You proceed deeper into the unknown. The path winds through ancient corridors, each step echoing in the silence. Strange symbols on the walls hint at secrets yet to be uncovered.

[[RPG:{"hpChange":0,"xpGain":5,"item":null,"actions":["Keep moving","Examine symbols","Listen carefully"],"end":null,"day":1,"time":"afternoon","safe":false,"enemy":null}]]`,
            imageKeywords: 'dungeon corridor, ancient symbols, mysterious path, adventure',
            metadata: { hpChange: 0, xpGain: 5, item: null, actions: ['Keep moving', 'Examine symbols', 'Listen carefully'], end: null, day: 1, time: 'afternoon', safe: false, enemy: null }
        },
        {
            id: 'generic_continue_2',
            story: `The passage leads to an intersection. Three paths stretch before you — left into darkness, right toward a faint glow, and straight ahead where you hear distant water. Choose wisely.

[[RPG:{"hpChange":0,"xpGain":3,"item":null,"actions":["Go left","Go right","Go straight"],"end":null,"day":1,"time":"afternoon","safe":false,"enemy":null}]]`,
            imageKeywords: 'three way intersection, dungeon paths, mysterious choices, adventure crossroads',
            metadata: { hpChange: 0, xpGain: 3, item: null, actions: ['Go left', 'Go right', 'Go straight'], end: null, day: 1, time: 'afternoon', safe: false, enemy: null }
        },
    ],
    // Generic fallback - Indonesian
    generic_id: [
        {
            id: 'generic_continue_1_id',
            story: `Kamu melanjutkan lebih dalam ke hal yang tidak diketahui. Jalan berkelok-kelok melalui koridor kuno, setiap langkah bergema dalam kesunyian. Simbol-simbol aneh di dinding mengisyaratkan rahasia yang belum terungkap.

[[RPG:{"hpChange":0,"xpGain":5,"item":null,"actions":["Terus bergerak","Periksa simbol","Dengarkan baik-baik"],"end":null,"day":1,"time":"afternoon","safe":false,"enemy":null}]]`,
            imageKeywords: 'koridor dungeon, simbol kuno, jalur misterius, petualangan',
            metadata: { hpChange: 0, xpGain: 5, item: null, actions: ['Terus bergerak', 'Periksa simbol', 'Dengarkan baik-baik'], end: null, day: 1, time: 'afternoon', safe: false, enemy: null }
        },
    ],
};

// ===== PLACEHOLDER IMAGES =====
export const placeholderImages: Record<string, string[]> = {
    dungeon: [
        '/images/fallback/dungeon_1.webp',
        '/images/fallback/dungeon_2.webp',
    ],
    forest: [
        '/images/fallback/forest_1.webp',
        '/images/fallback/forest_2.webp',
    ],
    combat: [
        '/images/fallback/combat_1.webp',
        '/images/fallback/combat_2.webp',
    ],
    treasure: [
        '/images/fallback/treasure_1.webp',
    ],
    rest: [
        '/images/fallback/rest_1.webp',
    ],
};

// ===== HELPER FUNCTIONS =====
export function getRandomTemplate<T>(templates: T[]): T {
    return templates[Math.floor(Math.random() * templates.length)];
}

export function getStartTemplate(language: string): StartTemplate {
    const langTemplates = startTemplates[language] || startTemplates.en;
    return getRandomTemplate(langTemplates);
}

export function getActionTemplate(context: 'combat' | 'explore' | 'rest' | 'generic', language: string = 'en'): StoryTemplate {
    // Try language-specific template first
    const langContext = `${context}_${language}`;
    if (actionTemplates[langContext] && actionTemplates[langContext].length > 0) {
        return getRandomTemplate(actionTemplates[langContext]);
    }
    // Fallback to default (English) templates
    const templates = actionTemplates[context] || actionTemplates.generic;
    return getRandomTemplate(templates);
}

export function detectActionContext(command: string, hasEnemy: boolean): 'combat' | 'explore' | 'rest' | 'generic' {
    const lowerCmd = command.toLowerCase();

    if (hasEnemy || lowerCmd.includes('attack') || lowerCmd.includes('fight') || lowerCmd.includes('strike') || lowerCmd.includes('serang')) {
        return 'combat';
    }

    if (lowerCmd.includes('rest') || lowerCmd.includes('sleep') || lowerCmd.includes('heal') || lowerCmd.includes('istirahat') || lowerCmd.includes('tidur')) {
        return 'rest';
    }

    if (lowerCmd.includes('search') || lowerCmd.includes('explore') || lowerCmd.includes('look') || lowerCmd.includes('cari') || lowerCmd.includes('lihat')) {
        return 'explore';
    }

    return 'generic';
}

// Generate a simple pixel art placeholder using canvas data URL
export function generatePlaceholderDataUrl(seed: number = 0): string {
    // Return a simple SVG-based placeholder
    const colors = ['#4a1c6b', '#2d1b4e', '#1a1a2e', '#16213e', '#0f3460'];
    const bgColor = colors[seed % colors.length];

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576" viewBox="0 0 1024 576">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
        </linearGradient>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      <text x="512" y="288" font-family="monospace" font-size="24" fill="rgba(255,255,255,0.3)" text-anchor="middle" dominant-baseline="middle">
        ⚔️ ADVENTURE AWAITS ⚔️
      </text>
    </svg>
  `;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

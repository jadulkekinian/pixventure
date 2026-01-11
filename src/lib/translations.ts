/**
 * Translation constants for the Pix Adventure game
 * Supports multiple languages: English, Indonesian, Japanese
 */

export type Language = 'en' | 'id' | 'ja';

export interface Translations {
    title: string;
    subtitle: string;
    feature1: string;
    feature2: string;
    feature3: string;
    feature4: string;
    startButton: string;
    startHint: string;
    adventureLog: string;
    noAdventures: string;
    currentScene: string;
    generatingStory: string;
    waitingForCommand: string;
    sceneWillAppearHere: string;
    inputPlaceholder: string;
    exampleCommands: string;
    adventureStarted: string;
    selectLanguage: string;
    narrate: string;
    stopNarration: string;
    reading: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        title: 'PixVenture',
        subtitle: 'AI-Generated Text & Image Adventure',
        feature1: 'AI-powered storytelling',
        feature2: 'Dynamically generated pixel art scenes',
        feature3: 'Type commands to explore',
        feature4: 'Unlimited adventure possibilities',
        startButton: 'START ADVENTURE',
        startHint: 'Press START to begin your journey',
        adventureLog: 'ADVENTURE LOG',
        noAdventures: 'No adventures yet...',
        currentScene: 'CURRENT SCENE',
        generatingStory: 'Generating story...',
        waitingForCommand: 'Waiting for your command...',
        sceneWillAppearHere: 'Scene will appear here',
        inputPlaceholder: "Enter command (e.g., 'look around', 'go north', 'examine sword')",
        exampleCommands:
            "Example commands: look, search, examine [item], go [direction], use [item], talk to [character]",
        adventureStarted: '🎮 Adventure Started! Type commands to explore.',
        selectLanguage: 'Select Language',
        narrate: 'Narrate Scene',
        stopNarration: 'Stop Narration',
        reading: 'Reading...',
    },
    id: {
        title: 'PixVenture',
        subtitle: 'Petualangan Teks & Gambar AI',
        feature1: 'Cerita bertenaga AI',
        feature2: 'Sene pixel art yang dihasilkan secara dinamis',
        feature3: 'Ketik perintah untuk menjelajahi',
        feature4: 'Kemungkinan petualangan tak terbatas',
        startButton: 'MULAI PETUALANGAN',
        startHint: 'Tekan MULAI untuk memulai perjalanan Anda',
        adventureLog: 'LOG PETUALANGAN',
        noAdventures: 'Belum ada petualangan...',
        currentScene: 'SAAT INI',
        generatingStory: 'Membuat cerita...',
        waitingForCommand: 'Menunggu perintah Anda...',
        sceneWillAppearHere: 'Adegan akan muncul di sini',
        inputPlaceholder: "Masukkan perintah (contoh: 'lihat sekitar', 'pergi utara', 'periksa pedang')",
        exampleCommands:
            "Contoh perintah: lihat, cari, periksa [item], pergi [arah], gunakan [item], bicara dengan [karakter]",
        adventureStarted: '🎮 Petualangan Dimulai! Ketik perintah untuk menjelajahi.',
        selectLanguage: 'Pilih Bahasa',
        narrate: 'Bacakan Adegan',
        stopNarration: 'Hentikan Narasi',
        reading: 'Membaca...',
    },
    ja: {
        title: 'PixVenture',
        subtitle: 'AI生成テキスト＆イメージアドベンチャー',
        feature1: 'AI搭載ストーリーテリング',
        feature2: '動的に生成されるピクセルアートシーン',
        feature3: 'コマンドを入力して探索',
        feature4: '無限の冒険の可能性',
        startButton: '冒険を始める',
        startHint: '開始を押して旅を始めましょう',
        adventureLog: '冒険ログ',
        noAdventures: 'まだ冒険がありません...',
        currentScene: '現在のシーン',
        generatingStory: 'ストーリーを生成中...',
        waitingForCommand: 'コマンドを待っています...',
        sceneWillAppearHere: 'シーンがここに表示されます',
        inputPlaceholder: "コマンドを入力（例：'周りを見る', '北へ行く', '剣を調べる'）",
        exampleCommands:
            "例コマンド: 見る, 探す, 調べる [アイテム], [方向]へ行く, 使う [アイテム], [キャラクター]と話す",
        adventureStarted: '🎮 冒険が始まりました！コマンドを入力して探索してください。',
        selectLanguage: '言語を選択',
        narrate: 'シーンを読み上げる',
        stopNarration: '読み上げを停止',
        reading: '読み上げ中...',
    },
};

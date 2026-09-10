export type GameDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: string;
};

export const GAMES: GameDef[] = [
  {
    id: "tic-tac-toe",
    name: "Tic Tac Toe",
    description: "X ve O ile klasik oyun · AI'ya karşı oyna",
    icon: "⭕",
    color: "#3b82f6",
    difficulty: "Kolay → Zor",
  },
  {
    id: "water-sort",
    name: "Su Sıralama",
    description: "Renkli suları tüpler arasında boşalt",
    icon: "🧪",
    color: "#06b6d4",
    difficulty: "Kolay → Zor",
  },
  {
    id: "onet",
    name: "Eşleştir (Onet)",
    description: "Aynı kartları çizgiyle birleştir",
    icon: "🔗",
    color: "#22c55e",
    difficulty: "Kolay → Orta",
  },
  {
    id: "sudoku",
    name: "Sudoku",
    description: "Sayıları yerleştir, bulmacayı çöz",
    icon: "🔢",
    color: "#f97316",
    difficulty: "Kolay → Zor",
  },
  {
    id: "block-slide",
    name: "Blok Kaydır",
    description: "Blokları kaydırarak yolu aç",
    icon: "🧩",
    color: "#a855f7",
    difficulty: "Orta",
  },
];

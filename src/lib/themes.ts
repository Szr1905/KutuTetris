export type Theme = {
  id: string;
  name: string;
  price: number;
  bgColor: string;
  gridBg: string;
  cellEmpty: string;
  cellBorder: string;
  accent: string;
  textColor: string;
  headerBg: string;
  premium: boolean;
};

export const THEMES: Theme[] = [
  {
    id: "classic",
    name: "Classic",
    price: 0,
    bgColor: "#1a2240",
    gridBg: "#253056",
    cellEmpty: "#33406b",
    cellBorder: "#1a2240",
    accent: "#4d9fff",
    textColor: "#ffffff",
    headerBg: "#20294a",
    premium: false,
  },
  {
    id: "ocean",
    name: "Ocean",
    price: 150,
    bgColor: "#0c1c2b",
    gridBg: "#103a5c",
    cellEmpty: "#1a4d72",
    cellBorder: "#0c1c2b",
    accent: "#06b6d4",
    textColor: "#e0f2fe",
    headerBg: "#0e2a42",
    premium: true,
  },
  {
    id: "forest",
    name: "Forest",
    price: 150,
    bgColor: "#0a1f12",
    gridBg: "#1a3a22",
    cellEmpty: "#234d2c",
    cellBorder: "#0a1f12",
    accent: "#22c55e",
    textColor: "#f0fdf4",
    headerBg: "#102d18",
    premium: true,
  },
  {
    id: "sunset",
    name: "Sunset",
    price: 200,
    bgColor: "#1e0a14",
    gridBg: "#3d1228",
    cellEmpty: "#5c1d3a",
    cellBorder: "#1e0a14",
    accent: "#f97316",
    textColor: "#fff7ed",
    headerBg: "#2d0e1e",
    premium: true,
  },
  {
    id: "candy",
    name: "Candy",
    price: 200,
    bgColor: "#1a0a1e",
    gridBg: "#2d1240",
    cellEmpty: "#3d1a52",
    cellBorder: "#1a0a1e",
    accent: "#ec4899",
    textColor: "#fdf2f8",
    headerBg: "#220e30",
    premium: true,
  },
  {
    id: "midnight",
    name: "Midnight Gold",
    price: 500,
    bgColor: "#0a0a0f",
    gridBg: "#1a1a2e",
    cellEmpty: "#252540",
    cellBorder: "#0a0a0f",
    accent: "#fbbf24",
    textColor: "#fefce8",
    headerBg: "#12121f",
    premium: true,
  },
  {
    id: "neon",
    name: "Neon",
    price: 300,
    bgColor: "#0d0221",
    gridBg: "#1b0a3a",
    cellEmpty: "#2a0f52",
    cellBorder: "#0d0221",
    accent: "#d946ef",
    textColor: "#fdf4ff",
    headerBg: "#140628",
    premium: true,
  },
  {
    id: "cherry",
    name: "Cherry Blossom",
    price: 300,
    bgColor: "#1a0a0f",
    gridBg: "#3d1520",
    cellEmpty: "#5c2235",
    cellBorder: "#1a0a0f",
    accent: "#fb7185",
    textColor: "#fff1f2",
    headerBg: "#2d0e16",
    premium: true,
  },
  {
    id: "emerald",
    name: "Emerald",
    price: 350,
    bgColor: "#021a14",
    gridBg: "#0a3a2a",
    cellEmpty: "#0f5238",
    cellBorder: "#021a14",
    accent: "#10b981",
    textColor: "#ecfdf5",
    headerBg: "#052a1e",
    premium: true,
  },
  {
    id: "royal",
    name: "Royal Blue",
    price: 350,
    bgColor: "#0a0e1a",
    gridBg: "#16224a",
    cellEmpty: "#1e2d5c",
    cellBorder: "#0a0e1a",
    accent: "#818cf8",
    textColor: "#e0e7ff",
    headerBg: "#101634",
    premium: true,
  },
  {
    id: "amber",
    name: "Amber Glow",
    price: 400,
    bgColor: "#1a0f00",
    gridBg: "#3a2410",
    cellEmpty: "#5c3a1a",
    cellBorder: "#1a0f00",
    accent: "#f59e0b",
    textColor: "#fffbeb",
    headerBg: "#281a08",
    premium: true,
  },
  {
    id: "galaxy",
    name: "Galaxy",
    price: 600,
    bgColor: "#0a001a",
    gridBg: "#1a0a3a",
    cellEmpty: "#2a1455",
    cellBorder: "#0a001a",
    accent: "#c084fc",
    textColor: "#faf5ff",
    headerBg: "#14062a",
    premium: true,
  },
];

export type CoinPack = {
  id: string;
  name: string;
  amount: number;
  bonus: number;
  isPremium: boolean;
};

export const COIN_PACKS: CoinPack[] = [
  { id: "pack_100", name: "Küçük Paket", amount: 100, bonus: 0, isPremium: false },
  { id: "pack_300", name: "Orta Paket", amount: 300, bonus: 30, isPremium: false },
  { id: "pack_500", name: "Büyük Paket", amount: 500, bonus: 75, isPremium: false },
  { id: "pack_1000", name: "Mega Paket", amount: 1000, bonus: 200, isPremium: true },
  { id: "pack_2500", name: "Devasa Paket", amount: 2500, bonus: 600, isPremium: true },
  { id: "pack_5000", name: "Efsane Paket", amount: 5000, bonus: 1500, isPremium: true },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

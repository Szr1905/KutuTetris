import { useState, useEffect } from "react";
import type { Theme } from "../../lib/themes";

// 30 Adet Türkçe 5 Harfli Kelime Havuzu
const WORDS_TR = [
  "KİTAP", "MASAL", "DENİZ", "GÜNEŞ", "BULUT",
  "KALEM", "DEMİR", "AHŞAP", "SABAH", "BALIK",
  "RADAR", "ZAMAN", "NEFES", "HAVLU", "CEKET",
  "ŞEHİR", "DÜNYA", "TAVŞAN", "KÖPEK", "ORMAN",
  "KAPAN", "SAPAN", "ŞEKER", "KAZAN", "BİLET",
  "İNSAN", "KAĞIT", "MÜZİK", "DUVAR", "KUTU"
];

// 30 Adet İngilizce 5 Harfli Kelime Havuzu
const WORDS_EN = [
  "APPLE", "HOUSE", "WATER", "SMILE", "PLANT",
  "LIGHT", "MUSIC", "BRAIN", "DREAM", "STONE",
  "BEACH", "CLOUD", "EARTH", "HEART", "SPACE",
  "BIRD", "STORM", "GREEN", "SMART", "FLASH",
  "TIGER", "PANDA", "BREAD", "FRUIT", "SHARK",
  "NIGHT", "CLOCK", "POWER", "PAPER", "TABLE"
];

// Alfabetik Klavye Düzenleri
const ALPHABETICAL_KEYBOARD_TR = [
  ["A", "B", "C", "Ç", "D", "E", "F", "G", "Ğ", "H"],
  ["I", "İ", "J", "K", "L", "M", "N", "O", "Ö", "P"],
  ["R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z"],
  ["SİL", "GÖNDER"]
];

const ALPHABETICAL_KEYBOARD_EN = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
  ["J", "K", "L", "M", "N", "O", "P", "Q", "R"],
  ["S", "T", "U", "V", "W", "X", "Y", "Z"],
  ["DEL", "ENTER"]
];

export default function WordleScreen({
  theme,
  onBack,
  onScore,
}: {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
}) {
  const [lang, setLang] = useState<"tr" | "en">(() => {
    const saved = localStorage.getItem("kutu_tetris_language");
    return (saved as "tr" | "en") || "tr";
  });

  const getRandomWord = (activeLang: "tr" | "en") => {
    const list = activeLang === "tr" ? WORDS_TR : WORDS_EN;
    return list[Math.floor(Math.random() * list.length)];
  };

  const [targetWord, setTargetWord] = useState(() => getRandomWord(lang));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    lang === "tr"
      ? `İlk harf "${targetWord[0]}" - Kelimeyi bul!`
      : `First letter "${targetWord[0]}" - Find the word!`
  );

  const handleKeyPress = (key: string) => {
    if (gameOver || gameWon) return;

    if (key === "SİL" || key === "DEL") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (key === "GÖNDER" || key === "ENTER") {
      const fullGuess = targetWord[0] + currentGuess;
      if (fullGuess.length !== 5) {
        setStatusMessage(lang === "tr" ? "Kelime 5 harfli olmalı!" : "Word must be 5 letters!");
        return;
      }
      const newGuesses = [...guesses, fullGuess];
      setGuesses(newGuesses);

      if (fullGuess === targetWord) {
        setGameWon(true);
        setGameOver(true);
        setStatusMessage(lang === "tr" ? "Tebrikler, Bildin! 🎉" : "Congratulations! 🎉");
        onScore(150);
      } else if (newGuesses.length >= 6) {
        setGameOver(true);
        setStatusMessage(lang === "tr" ? `Oyun Bitti! Kelime: ${targetWord}` : `Game Over! Word: ${targetWord}`);
      } else {
        setCurrentGuess("");
        setStatusMessage(lang === "tr" ? "Devam et!" : "Keep going!");
      }
    } else {
      if (currentGuess.length < 4) {
        setCurrentGuess((prev) => prev + key);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === "BACKSPACE") {
        handleKeyPress(lang === "tr" ? "SİL" : "DEL");
      } else if (key === "ENTER") {
        handleKeyPress(lang === "tr" ? "GÖNDER" : "ENTER");
      } else if (/^[A-ZÇĞİÖŞÜ]$/.test(key)) {
        handleKeyPress(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, gameOver, gameWon, guesses, lang]);

  const restart = (newLang?: "tr" | "en") => {
    const activeLang = newLang || lang;
    const newWord = getRandomWord(activeLang);
    setTargetWord(newWord);
    setGuesses([]);
    setCurrentGuess("");
    setGameOver(false);
    setGameWon(false);
    setStatusMessage(
      activeLang === "tr"
        ? `İlk harf "${newWord[0]}" - Kelimeyi bul!`
        : `First letter "${newWord[0]}" - Find the word!`
    );
  };

  const toggleLanguage = () => {
    const nextLang = lang === "tr" ? "en" : "tr";
    setLang(nextLang);
    restart(nextLang);
  };

  const getLetterStatus = (letter: string, index: number) => {
    if (targetWord[index] === letter) return "correct";
    if (targetWord.includes(letter)) return "present";
    return "absent";
  };

  const keyboard = lang === "tr" ? ALPHABETICAL_KEYBOARD_TR : ALPHABETICAL_KEYBOARD_EN;

  return (
    <div
      style={{
        background: theme.bgColor,
        minHeight: "100vh",
        color: theme.textColor,
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      {/* Üst Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 12,
            padding: "8px 14px",
            color: theme.textColor,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          ← {lang === "tr" ? "Geri" : "Back"}
        </button>

        <button
          onClick={toggleLanguage}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: `1px solid ${theme.accent}`,
            borderRadius: 10,
            padding: "6px 12px",
            color: theme.textColor,
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          🌐 {lang.toUpperCase()}
        </button>

        <button
          onClick={() => restart()}
          style={{
            background: theme.accent,
            border: "none",
            borderRadius: 12,
            padding: "8px 14px",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          {lang === "tr" ? "Yeniden" : "Restart"}
        </button>
      </div>

      <div
        style={{
          background: theme.headerBg,
          padding: "8px 16px",
          borderRadius: 12,
          marginBottom: 12,
          fontWeight: 700,
          fontSize: 14,
          textAlign: "center",
          width: "100%",
          maxWidth: 400,
          boxSizing: "border-box",
        }}
      >
        {statusMessage}
      </div>

      {/* Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
        {[...Array(6)].map((_, rowIndex) => {
          const guess = guesses[rowIndex] || (rowIndex === guesses.length ? targetWord[0] + currentGuess : "");
          const isSubmitted = rowIndex < guesses.length;

          return (
            <div key={rowIndex} style={{ display: "flex", gap: 5 }}>
              {[...Array(5)].map((_, colIndex) => {
                const letter = colIndex === 0 ? targetWord[0] : (guess[colIndex] || "");
                let bg = "rgba(255,255,255,0.08)";
                let borderColor = "rgba(255,255,255,0.15)";
                let color = theme.textColor;

                if (colIndex === 0) {
                  bg = "#22c55e";
                  borderColor = "#22c55e";
                  color = "#fff";
                } else if (isSubmitted) {
                  const status = getLetterStatus(letter, colIndex);
                  if (status === "correct") {
                    bg = "#22c55e";
                    borderColor = "#22c55e";
                    color = "#fff";
                  } else if (status === "present") {
                    bg = "#eab308";
                    borderColor = "#eab308";
                    color = "#fff";
                  } else {
                    bg = "#475569";
                    borderColor = "#475569";
                    color = "#fff";
                  }
                } else if (letter) {
                  borderColor = theme.accent;
                }

                return (
                  <div
                    key={colIndex}
                    style={{
                      width: 48,
                      height: 48,
                      background: bg,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 900,
                      fontFamily: "'Fredoka', sans-serif",
                      color: color,
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Alfabetik Klavye */}
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 5 }}>
        {keyboard.map((row, rIdx) => (
          <div key={rIdx} style={{ display: "flex", justifyContent: "center", gap: 3 }}>
            {row.map((key) => {
              const isAction = key.length > 1;
              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  style={{
                    background: isAction ? theme.accent : "rgba(255,255,255,0.12)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: isAction ? "12px 18px" : "10px 0",
                    flex: isAction ? 2 : 1,
                    fontSize: isAction ? 13 : 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
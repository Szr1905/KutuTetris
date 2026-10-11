import { useState, useEffect } from "react";
import type { Theme } from "../../lib/themes";

const EMOJIS = [
  "🍎", "🍌", "🍇", "🍊", "🍓", "🥕", "🥦", "🌽", 
  "🍆", "🍅", "🥑", "🥔", "🥒", "🥝", "🍍", "🍑",
  "🍉", "🍒", "🍐", "🍋", "🍄", "🧄", "🧅", "🥥"
];

type Card = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

export default function MemoryMatchScreen({
  theme,
  onBack,
  onScore,
}: {
  theme: Theme;
  onBack: () => void;
  onScore: (score: number) => void;
}) {
  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem("memoryMatchLevel");
    return saved ? parseInt(saved, 10) : 1;
  });

  const [cards, setCards] = useState<Card[]>([]);
  const [firstSelection, setFirstSelection] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // Seviyeye göre çift sayısı (Level 1'de 4 çift/8 kart, ilerledikçe 18 çift/36 karta kadar çıkar)
  const getPairsCount = (lvl: number) => {
    return Math.min(4 + (lvl - 1) * 2, 18);
  };

  const startLevel = (lvl: number) => {
    const pairs = getPairsCount(lvl);
    const selectedEmojis = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairs);
    const deck: Card[] = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(deck);
    setFirstSelection(null);
    setIsChecking(false);
    setGameWon(false);
  };

  useEffect(() => {
    startLevel(level);
  }, [level]);

  const handleCardClick = (index: number) => {
    if (isChecking) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    if (firstSelection === null) {
      setFirstSelection(index);
    } else {
      setIsChecking(true);
      const firstCard = cards[firstSelection];
      const secondCard = newCards[index];

      if (firstCard.emoji === secondCard.emoji) {
        // Eşleşti
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstCard.id || c.id === secondCard.id
                ? { ...c, isMatched: true }
                : c
            )
          );
          setFirstSelection(null);
          setIsChecking(false);
          setScore((s) => s + 40);
          onScore(15);

          // Bölümün bittiğini kontrol et
          setTimeout(() => {
            setCards((currentCards) => {
              if (currentCards.every((c) => c.isMatched)) {
                setGameWon(true);
              }
              return currentCards;
            });
          }, 100);
        }, 300);
      } else {
        // Eşleşmedi, kartları geri kapat
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstCard.id || c.id === secondCard.id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFirstSelection(null);
          setIsChecking(false);
        }, 900);
      }
    }
  };

  const nextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    localStorage.setItem("memoryMatchLevel", nextLvl.toString());
  };

  const restartLevel = () => {
    startLevel(level);
  };

  const resetProgress = () => {
    setLevel(1);
    localStorage.setItem("memoryMatchLevel", "1");
    startLevel(1);
    setScore(0);
  };

  const totalCards = cards.length;
  const gridCols = totalCards > 24 ? 6 : totalCards > 12 ? 4 : 4;

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
        padding: 20,
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      {/* Üst Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
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
          ← Geri
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", margin: 0 }}>
          🃏 Hafıza Oyunu (Seviye {level})
        </h2>
        <button
          onClick={resetProgress}
          title="Başa Dön"
          style={{
            background: theme.accent,
            border: "none",
            borderRadius: 12,
            padding: "8px 12px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Sıfırla
        </button>
      </div>

      {/* Skor Paneli */}
      <div
        style={{
          background: theme.headerBg,
          padding: "8px 20px",
          borderRadius: 12,
          marginBottom: 16,
          fontWeight: 800,
          fontSize: 16,
          textAlign: "center",
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Skor: <strong style={{ color: theme.accent }}>{score}</strong></span>
        <button
          onClick={restartLevel}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 8,
            padding: "4px 10px",
            color: theme.textColor,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Yeniden Başlat
        </button>
      </div>

      {/* Oyun Alanı */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          minHeight: 320,
          background: "#1e293b",
          borderRadius: 16,
          padding: 12,
          display: "grid",
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: 8,
          alignContent: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          border: `4px solid ${theme.accent}`,
          position: "relative",
        }}
      >
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(index)}
            style={{
              aspectRatio: "1 / 1",
              background: card.isFlipped || card.isMatched ? "#334155" : theme.accent,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: totalCards > 24 ? 22 : 28,
              cursor: card.isMatched ? "default" : "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
              transition: "transform 0.15s, background 0.15s",
              opacity: card.isMatched ? 0.4 : 1,
            }}
          >
            {card.isFlipped || card.isMatched ? card.emoji : "❓"}
          </div>
        ))}

        {gameWon && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              zIndex: 10,
            }}
          >
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, margin: "0 0 8px 0" }}>Tebrikler! 🎉</h2>
            <p style={{ fontSize: 15, opacity: 0.8, marginBottom: 16 }}>Seviye {level} Tamamlandı!</p>
            <button
              onClick={nextLevel}
              style={{
                background: theme.accent,
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                color: "#fff",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Fredoka', sans-serif",
              }}
            >
              Sonraki Seviye →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
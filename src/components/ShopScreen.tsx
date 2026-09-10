import { useState } from "react";
import type { Theme } from "../lib/themes";
import { THEMES, COIN_PACKS, getTheme } from "../lib/themes";

type ShopScreenProps = {
  theme: Theme;
  coins: number;
  ownedThemes: string[];
  currentThemeId: string;
  onBuy: (themeId: string, cost: number) => void;
  onEquip: (themeId: string) => void;
  onBuyCoins: (amount: number) => void;
  onBack: () => void;
};

type Tab = "themes" | "coins";

export default function ShopScreen({
  theme,
  coins,
  ownedThemes,
  currentThemeId,
  onBuy,
  onEquip,
  onBuyCoins,
  onBack,
}: ShopScreenProps) {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [confirmCoinPack, setConfirmCoinPack] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("themes");

  const handleBuyCoins = (packId: string) => {
    setConfirmCoinPack(packId);
  };

  const confirmCoinPurchase = () => {
    if (!confirmCoinPack) return;
    const pack = COIN_PACKS.find((p) => p.id === confirmCoinPack);
    if (pack) {
      onBuyCoins(pack.amount + pack.bonus);
    }
    setConfirmCoinPack(null);
  };

  const handleBuyTheme = (themeId: string) => {
    setShowConfirm(themeId);
  };

  const confirmThemePurchase = () => {
    if (!showConfirm) return;
    const t = getTheme(showConfirm);
    onBuy(t.id, t.price);
    setShowConfirm(null);
  };

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
      }}
    >
      {/* Top bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 12,
            padding: "10px 16px",
            color: theme.textColor,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          ← Geri
        </button>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "'Fredoka', sans-serif",
            margin: 0,
          }}
        >
          🛒 Mağaza
        </h2>
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          🪙 {coins}
        </div>
      </div>

      {/* Tab selector */}
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          display: "flex",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => setTab("themes")}
          style={{
            flex: 1,
            background: tab === "themes" ? theme.accent : "rgba(255,255,255,0.08)",
            color: tab === "themes" ? "#fff" : theme.textColor,
            border: "none",
            borderRadius: 12,
            padding: "12px 16px",
            fontWeight: 800,
            fontSize: 16,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
            transition: "background 0.2s",
          }}
        >
          🎨 Temalar
        </button>
        <button
          onClick={() => setTab("coins")}
          style={{
            flex: 1,
            background: tab === "coins" ? theme.accent : "rgba(255,255,255,0.08)",
            color: tab === "coins" ? "#fff" : theme.textColor,
            border: "none",
            borderRadius: 12,
            padding: "12px 16px",
            fontWeight: 800,
            fontSize: 16,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
            transition: "background 0.2s",
          }}
        >
          🪙 Coin Paketleri
        </button>
      </div>

      {/* Tab content */}
      {tab === "themes" && (
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {THEMES.map((t) => {
              const owned = ownedThemes.includes(t.id);
              const equipped = currentThemeId === t.id;
              const canAfford = coins >= t.price;

              return (
                <div
                  key={t.id}
                  style={{
                    background: theme.headerBg,
                    borderRadius: 16,
                    overflow: "hidden",
                    transition: "transform 0.2s",
                    border: equipped ? `2px solid ${t.accent}` : "2px solid transparent",
                  }}
                >
                  <div
                    style={{
                      background: t.bgColor,
                      padding: 16,
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gridTemplateRows: "repeat(3, 1fr)",
                      gap: 3,
                      height: 90,
                    }}
                  >
                    {[...Array(12)].map((_, i) => {
                      const filled = [0, 2, 4, 5, 7, 9, 11].includes(i);
                      return (
                        <div
                          key={i}
                          style={{
                            background: filled
                              ? ["#ef4444", "#f97316", "#22c55e", "#3b82f6", "#ec4899"][i % 5]
                              : t.cellEmpty,
                            borderRadius: 4,
                          }}
                        />
                      );
                    })}
                  </div>

                  <div style={{ padding: "12px 14px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</span>
                      {t.premium && !owned && (
                        <span
                          style={{
                            fontSize: 11,
                            background: "rgba(251,191,36,0.2)",
                            color: "#fbbf24",
                            padding: "2px 8px",
                            borderRadius: 8,
                            fontWeight: 700,
                          }}
                        >
                          Premium
                        </span>
                      )}
                    </div>

                    {equipped ? (
                      <div
                        style={{
                          textAlign: "center",
                          background: `${t.accent}22`,
                          color: t.accent,
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontWeight: 800,
                          fontSize: 14,
                        }}
                      >
                        ✓ Aktif
                      </div>
                    ) : owned ? (
                      <button
                        onClick={() => onEquip(t.id)}
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.1)",
                          color: theme.textColor,
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                          fontFamily: "'Nunito', sans-serif",
                        }}
                      >
                        Kullan
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford) handleBuyTheme(t.id);
                        }}
                        disabled={!canAfford}
                        style={{
                          width: "100%",
                          background: canAfford ? t.accent : "rgba(255,255,255,0.08)",
                          color: canAfford ? "#fff" : "rgba(255,255,255,0.4)",
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontWeight: 800,
                          fontSize: 14,
                          cursor: canAfford ? "pointer" : "not-allowed",
                          fontFamily: "'Nunito', sans-serif",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        🪙 {t.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 24,
              textAlign: "center",
              opacity: 0.5,
              fontSize: 14,
            }}
          >
            Oynayarak coin kazan! Her satır temizlediğinde coin kazanırsın.
          </div>
        </div>
      )}

      {tab === "coins" && (
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {COIN_PACKS.map((pack) => {
              const total = pack.amount + pack.bonus;
              return (
                <div
                  key={pack.id}
                  style={{
                    background: theme.headerBg,
                    borderRadius: 16,
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: pack.isPremium
                      ? `2px solid ${theme.accent}44`
                      : "2px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: pack.isPremium
                          ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent}88)`
                          : "rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        flexShrink: 0,
                      }}
                    >
                      🪙
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          marginBottom: 4,
                        }}
                      >
                        {pack.name}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          opacity: 0.8,
                        }}
                      >
                        {pack.amount.toLocaleString("tr")} coin
                        {pack.bonus > 0 && (
                          <span
                            style={{
                              color: "#22c55e",
                              marginLeft: 8,
                              fontWeight: 800,
                            }}
                          >
                            + {pack.bonus.toLocaleString("tr")} bonus!
                          </span>
                        )}
                      </div>
                      {pack.isPremium && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 4,
                            fontSize: 11,
                            background: "rgba(251,191,36,0.2)",
                            color: "#fbbf24",
                            padding: "2px 8px",
                            borderRadius: 8,
                            fontWeight: 700,
                          }}
                        >
                          En İyi Değer
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuyCoins(pack.id)}
                    style={{
                      background: theme.accent,
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 20px",
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif",
                      whiteSpace: "nowrap",
                      transition: "transform 0.15s",
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    Al
                  </button>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 24,
              textAlign: "center",
              opacity: 0.5,
              fontSize: 14,
            }}
          >
            Coin paketleriyle temaları daha hızlı aç!
          </div>
        </div>
      )}

      {/* Theme purchase confirmation modal */}
      {showConfirm && (() => {
        const t = getTheme(showConfirm);
        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowConfirm(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: theme.headerBg,
                borderRadius: 20,
                padding: "32px 36px",
                textAlign: "center",
                maxWidth: 320,
                width: "90%",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎨</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px 0" }}>
                {t.name} temasını satın al
              </h3>
              <p style={{ opacity: 0.7, fontSize: 15, marginBottom: 24 }}>
                Bu temayı {t.price} coin karşılığında satın almak istiyor musun?
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowConfirm(null)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.1)",
                    color: theme.textColor,
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={confirmThemePurchase}
                  style={{
                    flex: 1,
                    background: t.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  🪙 {t.price}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Coin purchase confirmation modal */}
      {confirmCoinPack && (() => {
        const pack = COIN_PACKS.find((p) => p.id === confirmCoinPack)!;
        const total = pack.amount + pack.bonus;
        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setConfirmCoinPack(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: theme.headerBg,
                borderRadius: 20,
                padding: "32px 36px",
                textAlign: "center",
                maxWidth: 320,
                width: "90%",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🪙</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px 0" }}>
                {pack.name}
              </h3>
              <p style={{ opacity: 0.7, fontSize: 15, marginBottom: 24 }}>
                {total.toLocaleString("tr")} coin hesabına eklenecek. Onaylıyor musun?
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirmCoinPack(null)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.1)",
                    color: theme.textColor,
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={confirmCoinPurchase}
                  style={{
                    flex: 1,
                    background: theme.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

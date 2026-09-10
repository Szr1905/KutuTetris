import type { Theme } from "../lib/themes";

type BadgesScreenProps = {
  theme: Theme;
  badges: string[];
  onBack: () => void;
};

const BADGES = [
  { id: "first-line", title: "İlk Satır", detail: "İlk satırını temizle", icon: "✦", color: "#27c7eb" },
  { id: "combo-3", title: "Combo Başlangıcı", detail: "3 combo yap", icon: "⚡", color: "#ffb52f" },
  { id: "combo-5", title: "Combo Ustası", detail: "5 combo yap", icon: "⚡", color: "#ff8c1a" },
  { id: "combo-10", title: "Combo Efsanesi", detail: "10 combo yap", icon: "⚡", color: "#ff5c1a" },
  { id: "score-100", title: "Yüzlük", detail: "100 puana ulaş", icon: "★", color: "#4ade80" },
  { id: "score-500", title: "Beş Yüzlük", detail: "500 puana ulaş", icon: "★", color: "#22d3ee" },
  { id: "score-1000", title: "Binlik", detail: "1000 puana ulaş", icon: "★", color: "#8e6bea" },
  { id: "score-2500", title: "Usta", detail: "2500 puana ulaş", icon: "★", color: "#f05c86" },
  { id: "score-5000", title: "Deha", detail: "5000 puana ulaş", icon: "★", color: "#ffd447" },
  { id: "score-10000", title: "Efsane Puan", detail: "10000 puana ulaş", icon: "★", color: "#ff4757" },
  { id: "multi-2", title: "İkiz", detail: "Tek seferde 2 satır temizle", icon: "◆", color: "#35c969" },
  { id: "multi-3", title: "Üçlü", detail: "Tek seferde 3 satır temizle", icon: "◆", color: "#06b6d4" },
  { id: "multi-4", title: "Dörtlü Patlama", detail: "Tek seferde 4+ satır temizle", icon: "◆", color: "#ef4444" },
  { id: "place-50", title: "Azimli", detail: "50 blok yerleştir", icon: "▣", color: "#a78bfa" },
  { id: "place-200", title: "Hızlı El", detail: "200 blok yerleştir", icon: "▣", color: "#60a5fa" },
  { id: "level-10", title: "Çaylak", detail: "10. bölümü aç", icon: "◆", color: "#34d399" },
  { id: "level-25", title: "Yolcu", detail: "25. bölümü aç", icon: "◆", color: "#35c969" },
  { id: "level-50", title: "Şampiyon", detail: "50. bölümü aç", icon: "♛", color: "#f05c86" },
  { id: "level-75", title: "Fatih", detail: "75. bölümü aç", icon: "♛", color: "#e879f9" },
  { id: "level-100", title: "Efsane", detail: "100. bölümü tamamla", icon: "♕", color: "#ffd447" },
];

export default function BadgesScreen({ theme, badges, onBack }: BadgesScreenProps) {
  return (
    <div style={{ minHeight: "100vh", background: theme.bgColor, color: theme.textColor, fontFamily: "'Nunito', sans-serif", padding: 20, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 460, width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", color: theme.textColor, border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>‹ Geri</button>
          <h1 style={{ margin: 0, fontFamily: "'Fredoka', sans-serif", fontSize: 28 }}>Rozetler</h1>
          <div style={{ width: 70 }} />
        </div>
        <div style={{ textAlign: "center", marginBottom: 24, opacity: 0.7, fontWeight: 700 }}>
          {badges.length} / {BADGES.length} rozet kazanıldı
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {BADGES.map((badge) => {
            const earned = badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                style={{
                  background: earned ? `linear-gradient(145deg, ${badge.color}55, rgba(255,255,255,0.08))` : "rgba(255,255,255,0.06)",
                  borderRadius: 18,
                  padding: 18,
                  textAlign: "center",
                  opacity: earned ? 1 : 0.48,
                  border: earned ? `1px solid ${badge.color}` : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    margin: "0 auto 12px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    color: earned ? badge.color : "#8790a9",
                    background: "rgba(0,0,0,0.18)",
                    boxShadow: earned ? `0 0 20px ${badge.color}55` : "none",
                  }}
                >
                  {earned ? badge.icon : "?"}
                </div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{badge.title}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>{badge.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

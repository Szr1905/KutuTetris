import type { Theme } from "../lib/themes";

type AdventureScreenProps = {
  theme: Theme;
  currentLevel: number;
  onBack: () => void;
  onPlay: () => void;
};

export default function AdventureScreen({ theme, currentLevel, onBack, onPlay }: AdventureScreenProps) {
  return (
    <div style={{ minHeight: "100vh", background: theme.bgColor, color: theme.textColor, fontFamily: "'Nunito', sans-serif", padding: 20, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 460, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", color: theme.textColor, border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>‹ Geri</button>
          <h1 style={{ margin: 0, fontFamily: "'Fredoka', sans-serif", fontSize: 28 }}>Serüven</h1>
          <div style={{ width: 70 }} />
        </div>
        <div style={{ background: "linear-gradient(135deg, #1d75c9, #2bb6e8)", borderRadius: 20, padding: 22, marginBottom: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>Macera ilerlemesi</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <strong style={{ fontSize: 34, fontFamily: "'Fredoka', sans-serif" }}>Bölüm {currentLevel}</strong>
            <span style={{ fontSize: 16, fontWeight: 900 }}>100 bölüm</span>
          </div>
          <div style={{ height: 10, borderRadius: 10, background: "rgba(0,0,0,0.2)", marginTop: 16, overflow: "hidden" }}>
            <div style={{ width: `${(Math.min(currentLevel, 100) / 100) * 100}%`, height: "100%", background: "#ffd83d", borderRadius: 10 }} />
          </div>
        </div>
        <div style={{ background: "rgba(12,24,61,0.72)", borderRadius: 18, padding: 16, marginBottom: 22, border: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <strong style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20 }}>Toplama görevleri</strong>
            <span style={{ color: "#ffd447", fontSize: 24 }}>★</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {[
              { color: "#28c9ef", count: 12, label: "Mavi" },
              { color: "#58d63c", count: 16, label: "Yeşil" },
              { color: "#f5a623", count: 20, label: "Turuncu" },
              { color: "#ffd447", count: 15, label: "Yıldız" },
              { color: "#d848e8", count: 12, label: "Pembe" },
            ].map((task) => (
              <div key={task.label} style={{ textAlign: "center", padding: "8px 2px", borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ width: 22, height: 22, margin: "0 auto 5px", background: task.color, clipPath: task.label === "Yıldız" ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 100%, 50% 73%, 21% 100%, 32% 57%, 2% 35%, 39% 35%)" : "polygon(50% 0%, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%)", boxShadow: `0 0 10px ${task.color}` }} />
                <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>{task.count}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3 }}>{task.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.78, textAlign: "center" }}>Renkleri ve yıldızları topla, görev çubuğunu tamamla.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 22 }}>
          {Array.from({ length: 100 }, (_, index) => {
            const level = index + 1;
            const unlocked = level <= currentLevel;
            const completed = level < currentLevel;
            return (
              <div key={level} style={{ aspectRatio: "1", borderRadius: 14, background: unlocked ? "linear-gradient(145deg, #23c4e8, #1672be)" : "rgba(255,255,255,0.08)", border: level === currentLevel ? "3px solid #ffd83d" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: unlocked ? 1 : 0.5, boxShadow: level === currentLevel ? "0 0 16px #ffd83d88" : "none" }}>
                <span style={{ fontSize: 17, fontWeight: 900 }}>{level}</span>
                <span style={{ fontSize: 12 }}>{completed ? "✓" : unlocked ? "●" : "🔒"}</span>
              </div>
            );
          })}
        </div>
        <button onClick={onPlay} style={{ width: "100%", border: "none", borderRadius: 16, padding: "16px 24px", background: theme.accent, color: "#fff", fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 22px ${theme.accent}55` }}>Bölüm {currentLevel}'i Oyna</button>
        {currentLevel >= 100 && <div style={{ marginTop: 18, textAlign: "center", fontWeight: 900, color: "#ffd83d" }}>En güçlü rozet açıldı</div>}
      </div>
    </div>
  );
}

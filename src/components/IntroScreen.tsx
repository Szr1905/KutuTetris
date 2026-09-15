import { useEffect, useState } from "react";

type IntroScreenProps = {
  onDone: () => void;
};

export default function IntroScreen({ onDone }: IntroScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase(1), 100);
    const t2 = window.setTimeout(() => setPhase(2), 600);
    const t3 = window.setTimeout(() => setPhase(3), 1600);
    const t4 = window.setTimeout(() => setPhase(4), 2300);
    const t5 = window.setTimeout(onDone, 2900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.clearTimeout(t5);
    };
  }, [onDone]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      // Zengin ve modern bir açılış akordu (C Major 9)
      const notes = [261.63, 329.63, 392.00, 493.88, 587.33];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 1.2);
      });
      window.setTimeout(() => ctx.close(), 2000);
    } catch { /* no audio */ }
  };

  useEffect(() => {
    if (phase === 2) {
      const t = window.setTimeout(playChime, 50);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 3000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#000000",
      color: "#fff",
      overflow: "hidden",
      animation: phase >= 4 ? "introFadeOut 0.6s ease forwards" : undefined,
    }}>
      {/* Hafif arka plan ışıması */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, ${phase >= 2 ? "rgba(255,255,255,0.05)" : "transparent"} 0%, transparent 70%)`,
        transition: "background 1s ease",
        pointerEvents: "none",
      }} />

      {/* Ana Başlık - Geriden zoom yaparak ekrana oturma efekti */}
      <div style={{
        position: "relative",
        textAlign: "center",
        transform: phase === 0 ? "scale(0.1)" : phase >= 2 ? "scale(1)" : "scale(0.8)",
        opacity: phase === 0 ? 0 : phase >= 4 ? 0 : 1,
        transition: "transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease",
        filter: phase === 1 ? "blur(10px)" : "blur(0px)",
      }}>
        <h1 style={{
          fontSize: 64,
          fontWeight: 900,
          fontFamily: "'Fredoka', sans-serif",
          margin: 0,
          lineHeight: 1,
          letterSpacing: 6,
          color: "#ffffff",
          textShadow: "0 0 30px rgba(255, 255, 255, 0.6), 0 0 60px rgba(255, 255, 255, 0.2)",
        }}>
          S&amp;V GAMES
        </h1>

        {/* Şık çizgi animasyonu */}
        <div style={{
          width: phase >= 3 ? 180 : 0,
          height: 3,
          borderRadius: 4,
          background: "linear-gradient(90deg, transparent, #ffffff, transparent)",
          margin: "20px auto 0",
          transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 0 15px rgba(255, 255, 255, 0.8)",
        }} />
      </div>
    </div>
  );
}
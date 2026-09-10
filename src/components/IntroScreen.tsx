import { useEffect, useState } from "react";

type IntroScreenProps = {
  onDone: () => void;
};

const BLOCK_COLORS = ["#26d85a", "#26b7e8", "#ffbd20", "#ff5b38", "#8d5ee8"];

export default function IntroScreen({ onDone }: IntroScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase(1), 100);
    const t2 = window.setTimeout(() => setPhase(2), 800);
    const t3 = window.setTimeout(() => setPhase(3), 1600);
    const t4 = window.setTimeout(() => setPhase(4), 2200);
    const t5 = window.setTimeout(onDone, 2800);
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
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.1, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
      window.setTimeout(() => ctx.close(), 1000);
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
      background: "linear-gradient(135deg, #0a0e1a 0%, #0f1525 50%, #131c35 100%)",
      color: "#fff",
      overflow: "hidden",
      animation: phase >= 4 ? "introFadeOut 0.5s ease forwards" : undefined,
    }}>
      {/* Soft animated glow background */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, ${phase >= 1 ? "rgba(38,183,232,0.08)" : "transparent"} 0%, transparent 60%)`,
        transition: "background 0.8s ease",
        pointerEvents: "none",
      }} />

      {/* Floating colored blocks */}
      {BLOCK_COLORS.map((color, i) => (
        <div key={color} style={{
          position: "absolute",
          left: `${10 + i * 20}%`,
          top: `${15 + (i % 3) * 30}%`,
          width: 14,
          height: 14,
          borderRadius: 4,
          background: color,
          boxShadow: `0 0 16px ${color}88`,
          opacity: phase >= 1 ? 0.5 : 0,
          transform: phase >= 1 ? `translateY(${phase >= 3 ? -60 : 0}px) rotate(${phase >= 3 ? 180 : 0}deg)` : "translateY(0)",
          transition: "all 1.5s ease-out",
          animation: `floatBlock ${6 + i}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}

      {/* Main logo */}
      <div style={{
        position: "relative",
        textAlign: "center",
        transform: phase === 0 ? "scale(0.5)" : phase >= 2 ? "scale(1)" : "scale(0.9)",
        opacity: phase === 0 ? 0 : phase >= 4 ? 0 : 1,
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Colored block row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {BLOCK_COLORS.map((color, i) => (
            <div key={color} style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              background: `linear-gradient(135deg, #ffffffcc, ${color} 40%, ${color} 70%, rgba(0,0,0,0.2))`,
              boxShadow: `0 4px 16px ${color}66, inset 0 -2px 0 rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)`,
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? "translateY(0) rotate(0deg)" : `translateY(-30px) rotate(${i * 20}deg)`,
              transition: "all 0.5s ease-out",
              transitionDelay: `${i * 60}ms`,
            }} />
          ))}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 56,
          fontWeight: 700,
          fontFamily: "'Fredoka', sans-serif",
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: 2,
          background: "linear-gradient(135deg, #26d85a 0%, #26b7e8 50%, #ff5b38 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "none",
          filter: `drop-shadow(0 0 20px rgba(38,183,232,0.3))`,
        }}>
          Kutu Tetris
        </h1>

        {/* Subtitle */}
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 8,
          opacity: phase >= 2 ? 0.6 : 0,
          marginTop: 8,
          transition: "opacity 0.5s ease",
          paddingLeft: 8,
          color: "#d7efff",
        }}>
          S&V GAMES
        </div>

        {/* Animated underline */}
        <div style={{
          width: phase >= 3 ? 140 : 0,
          height: 3,
          borderRadius: 4,
          background: "linear-gradient(90deg, #26d85a, #26b7e8, #ff5b38)",
          margin: "24px auto 0",
          transition: "width 0.5s ease",
          boxShadow: "0 0 12px rgba(38,183,232,0.4)",
        }} />
      </div>
    </div>
  );
}

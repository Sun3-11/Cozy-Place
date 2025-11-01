import React from "react";
import { useStore } from "../../stores/store";

export default function Overlay() {
  const focus = useStore((s) => s.focus);
  const setFocus = useStore((s) => s.setFocus);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);

  const tracks = useStore((s) => s.tracks);
  const current = useStore((s) => s.current);
  const playing = useStore((s) => s.playing);
  const play = useStore((s) => s.play);
  const pause = useStore((s) => s.pause);
  const next = useStore((s) => s.next);
  const prev = useStore((s) => s.prev);
  const volume = useStore((s) => s.volume);
  const setVolume = useStore((s) => s.setVolume);

  /** Mood sections */
  const sections = [
    { key: "free", label: "🌏 Free", color: "#A8E6CF" },
    { key: "radio", label: "🎵 Music", color: "#FFD3B6" },
    { key: "notebook", label: "📓 Notes", color: "#FFAAA5" },
    { key: "board", label: "🎨 Board", color: "#D3C1FF" },
    { key: "wall", label: "📍 Pin", color: "#84B1FF" },
    // ✨ القسم الجديد للكتاب
    { key: "book", label: "📖 Book", color: "#F9E79F" },
  ];

  return (
    <>
      {/*  Exit Button */}
      {view === "inside" && (
        <button
          onClick={() => setView("outside")}
          style={{
            position: "absolute",
            top: "2vh",
            left: "2vw",
            background: "#ffffffcc",
            border: "none",
            borderRadius: "20px",
            padding: "8px 16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            zIndex: 20,
          }}
        >
          🏡 Exit
        </button>
      )}

      {/* Mood Bar */}
      <div
        style={{
          position: "absolute",
          bottom: "2vh",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflowX: "auto",
          gap: "clamp(6px, 1vw, 12px)",
          padding: "clamp(6px, 1.2vh, 12px) clamp(12px, 2vw, 24px)",
          borderRadius: "40px",
          background:
            "linear-gradient(90deg, #ff9aa2, #ffb7b2, #ffdac1, #e2f0cb, #a2e1db, #b5ead7, #c7ceea)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          zIndex: 10,
          maxWidth: "90vw",
        }}
      >
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setFocus(s.key)}
            style={{
              flex: "0 0 auto",
              padding: "clamp(8px, 1.5vh, 12px) clamp(14px, 3vw, 20px)",
              borderRadius: "25px",
              border: "none",
              fontWeight: "bold",
              fontSize: "clamp(12px, 2vw, 16px)",
              cursor: "pointer",
              color: focus === s.key ? "#fff" : "#333",
              background: focus === s.key ? s.color : "rgba(255,255,255,0.8)",
              boxShadow:
                focus === s.key
                  ? "0 3px 10px rgba(0,0,0,0.3)"
                  : "0 1px 5px rgba(0,0,0,0.1)",
              transition: "all 0.25s ease",
              whiteSpace: "nowrap",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/*  Music Control */}
      {focus === "radio" && (
        <div
          style={{
            position: "absolute",
            bottom: "14vh",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(15px)",
            borderRadius: "25px",
            padding: "clamp(16px, 2vh, 22px) clamp(20px, 4vw, 35px)",
            boxShadow: "0 8px 25px rgba(127,199,175,0.3)",
            textAlign: "center",
            zIndex: 20,
            width: "min(50vw, 150px)",
            height: "min(50vw, 100px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "1px solid rgba(255,255,255,0.4)",
            animation: "fadeIn 0.6s ease",
          }}
        >
          {/*  Icon */}
          <div
            style={{
              width: "15px",
              height: "15px",
              borderRadius: "20px",
              background: "linear-gradient(145deg, #7FC7AF 0%, #A8E6CF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(127,199,175,0.3)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "3px",
                display: "flex",
                gap: "2px",
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "4px",
                    height: `${6 + (i % 3) * 5}px`,
                    background: "#fff",
                    borderRadius: "2px",
                    animation: `wave ${
                      0.7 + i * 0.1
                    }s infinite ease-in-out alternate`,
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/*  Song Name */}
          <div
            style={{
              fontSize: "clamp(14px, 1.8vw, 10px)",
              fontWeight: "600",
              color: "#333",
              marginBottom: "5px",
              marginTop: "5px",
              textTransform: "capitalize",
            }}
          >
            {tracks[current]?.title || "howl’s moving castle"}
          </div>

          {/*  Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "clamp(10px, 2vw, 14px)",
              marginBottom: "5px",
              marginTop: "5px",
              textAlign: "center",
            }}
          >
            <button style={radioCircleBtn} onClick={prev}>
              ⏮
            </button>
            <button
              style={{
                ...radioCircleBtn,
                background: "linear-gradient(145deg, #7FC7AF 0%, #5ca98e 100%)",
                color: "#fff",
                fontWeight: "bold",
                width: "50px",
                height: "50px",
                textAlign: "center",
              }}
              onClick={() => (playing ? pause() : play())}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button style={radioCircleBtn} onClick={next}>
              ⏭
            </button>
          </div>

          {/*  Volume */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{
              width: "100%",
              accentColor: "#7FC7AF",
              cursor: "pointer",
              marginTop: "4px",
            }}
          />
        </div>
      )}
    </>
  );
}

/* circle button style */
const radioCircleBtn = {
  border: "none",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.85)",
  width: "50px",
  height: "50px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
  cursor: "pointer",
  fontSize: "clamp(18px, 2.5vw, 22px)",
  color: "#333",
  transition: "all 0.25s ease",
};

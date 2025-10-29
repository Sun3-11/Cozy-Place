import { Html, useProgress } from "@react-three/drei";
import React from "react";

export default function CozyLoader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div
        style={{
          background: "linear-gradient(135deg, #fff9f0, #ffe0e0)",
          padding: "18px 32px",
          borderRadius: "25px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          fontFamily: "'Playpen Sans Arabic', sans-serif",
          color: "#333",
          fontWeight: "bold",
          fontSize: "16px",
        }}
      >
        <div
          style={{
            width: "55px",
            height: "55px",
            border: "4px solid rgba(127,199,175,0.3)",
            borderTopColor: "#7FC7AF",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p>Loading {Math.round(progress)}% ☕</p>

        <style>
          {`@keyframes spin { 
              from { transform: rotate(0deg); } 
              to { transform: rotate(360deg); } 
            }`}
        </style>
      </div>
    </Html>
  );
}

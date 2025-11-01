import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useStore } from "../stores/store";
import { supabase } from "../lib/supabaseClient"; // ⬅️ Supabase realtime

/** random seed */
function seededRandom(id) {
  const s = String(id);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = h >>> 0;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x >>>= 0;
    x ^= x << 5;
    x >>>= 0;
    return (x >>> 0) / 4294967296;
  };
}

/** one paper */
function NotePaper({ note, color, tiltDeg, position = [0, 0, 0] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 512);

    // pin
    ctx.beginPath();
    ctx.arc(256, 25, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#d9534f";
    ctx.fill();

    // user name
    ctx.fillStyle = "#333";
    ctx.font = "bold 30px 'Caveat', cursive";
    ctx.fillText(note.user_name || "Visitor", 30, 80);

    // message
    ctx.font = "26px 'Caveat', cursive";
    const lines = (note.message || "").split("\n");
    lines.forEach((line, idx) => ctx.fillText(line, 30, 130 + idx * 34));

    // Date
    ctx.font = "18px monospace";
    ctx.fillStyle = "#666";
    const d = note.created_at ? new Date(note.created_at) : new Date();
    ctx.fillText(d.toLocaleDateString(), 30, 480);

    // border
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, 502, 502);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }, [note.user_name, note.message, note.created_at, color]);

  return (
    <group position={position} rotation={[0, 0, (tiltDeg * Math.PI) / 180]}>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[1.2, 1.2]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.02, -0.01]}>
        <planeGeometry args={[1.22, 1.22]} />
        <meshBasicMaterial color="black" opacity={0.12} transparent />
      </mesh>
    </group>
  );
}

/**  Pin */
export default function Pin({
  position = [0, 2, -4],
  rotation = [0, 0, 0],
  scale = 1,
  ...props
}) {
  const wallRef = useRef();
  const pinnedNotes = useStore((s) => s.pinnedNotes);

  useEffect(() => {
    // register wall as camera target
    const { registerTargetWall } = useStore.getState();
    if (wallRef.current)
      registerTargetWall("wall", wallRef.current, [0, 0.8, 1.8]);
  }, []);

  useEffect(() => {
    const fetchPinned = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("pinned", true);
      if (!error && data) useStore.setState({ pinnedNotes: data });
    };

    fetchPinned();

    const channel = supabase
      .channel("realtime-wall")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        async () => {
          const { data } = await supabase
            .from("notes")
            .select("*")
            .eq("pinned", true);
          useStore.setState({ pinnedNotes: data });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const colors = [
    "#FFF9C4",
    "#FFE0B2",
    "#FFCDD2",
    "#C8E6C9",
    "#BBDEFB",
    "#E1BEE7",
  ];

  return (
    <group
      ref={wallRef}
      position={position}
      rotation={rotation}
      scale={scale}
      {...props}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 1]} intensity={1.1} castShadow />

      {pinnedNotes.map((note, i) => {
        const color = colors[i % colors.length];
        const tilt = (Math.random() - 0.5) * 8;
        const cols = 3; // columns
        const gapX = 1.4;
        const gapY = 1.3;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col - 0.2) * gapX;
        const y = 2.5 - row * gapY;
        const z = -row * 0.01;

        return (
          <NotePaper
            key={note.id ?? i}
            note={note}
            color={color}
            tiltDeg={tilt}
            position={[x, y, z]}
          />
        );
      })}
    </group>
  );
}

import React, { useRef, useEffect, useState } from "react";
import { Html, useGLTF, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../stores/store";
import * as THREE from "three";

export default function Radio(props) {
  const group = useRef();
  const notesGroup = useRef();

  // const particlesRef = useRef();
  const { scene } = useGLTF("/models/rodio.glb");

  const setFocus = useStore((s) => s.setFocus);
  const playing = useStore((s) => s.playing);
  const play = useStore((s) => s.play);
  const pause = useStore((s) => s.pause);

  const [notes, setNotes] = useState([]);
  const [particles, setParticles] = useState([]);
  const [visible, setVisible] = useState(false); // notes visibility

  // register radio as camera target
  useEffect(() => {
    if (!group.current) return;
    useStore.getState().registerTargetRadio("radio", group.current, {
      mode: "front",
      distance: 0.6,
      elev: 2.3,
      invertForward: true,
    });
  }, []);

  // create notes when playing
  useEffect(() => {
    let interval;
    if (playing) {
      setVisible(false);
      const timeout = setTimeout(() => setVisible(true), 100); //

      interval = setInterval(() => {
        setNotes((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            x: (Math.random() - 0) * 0.03,
            y: 0,
            z: (Math.random() - 0.09) * 0.1,
            speed: 0.004 + Math.random() * 0.0004,
            side: Math.random() > 0.5 ? 1 : -1,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            char: Math.random() > 0.5 ? "🎵" : "🎶",
            color: Math.random() > 0.5 ? "#FFD700" : "#FF69B4",
            opacity: 1,
          },
        ]);
      }, 400);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      // fade out notes when paused
      setNotes((prev) => prev.map((n) => ({ ...n, opacity: 0 })));
      setParticles([]);
      setVisible(false);
    }
  }, [playing]);

  // move notes and particles
  useFrame((_, delta) => {
    if (!notesGroup.current) return;

    // update notes
    setNotes((prevNotes) =>
      prevNotes
        .map((n) => {
          const newY = n.y + n.speed;
          const newOpacity = Math.max(n.opacity - delta * 0.4, 0);
          if (newOpacity <= 0) {
            // create sparks when note disappears
            const sparks = Array.from({ length: 10 }).map(() => ({
              id: crypto.randomUUID(),
              x: n.x,
              y: newY,
              z: n.z,
              vx: (Math.random() - 0.5) * 0.02,
              vy: Math.random() * 0.03,
              vz: (Math.random() - 0.5) * 0.02,
              life: 1,
              color: n.color,
            }));
            setParticles((p) => [...p, ...sparks]);
          }
          return { ...n, y: newY, opacity: newOpacity };
        })
        .filter((n) => n.opacity > 0)
    );

    //update particles
    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          z: p.z + p.vz,
          vy: p.vy - delta * 0.01,
          life: p.life - delta * 0.6,
        }))
        .filter((p) => p.life > 0)
    );
  });
  return (
    <group
      ref={group}
      position={[2.2, 10.15, -1.0]}
      rotation={[0, Math.PI / 4, 0]}
      scale={1.8}
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        setFocus("radio");
        // playing ? pause() : play();
        if (!playing) {
          setFocus("radio");
          setTimeout(() => play(), 500);
        } else {
          pause();
        }
      }}
    >
      {/*radio modal*/}
      <primitive object={scene} />

      {/* noates */}
      {visible && (
        <group ref={notesGroup}>
          {notes.map((n) => (
            <Text
              key={n.id}
              position={[n.x, n.y, n.z]}
              fontSize={0.03}
              color={n.color}
              opacity={n.opacity}
              anchorX="center"
              anchorY="middle"
            >
              {n.char}
            </Text>
          ))}
        </group>
      )}
      {/* hint*/}
      <Html position={[0, 0.35, 0]} distanceFactor={9} center>
        {/* <span className="tag">🎵 Click radio</span> */}
      </Html>
    </group>
  );
}

useGLTF.preload("/models/rodio.glb");

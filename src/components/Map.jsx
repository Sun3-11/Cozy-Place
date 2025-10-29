import React, { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useStore } from "../stores/store";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Map(props) {
  const group = useRef();
  const { scene } = useGLTF("/models/map3.glb");
  const mode = useStore((s) => s.mode);
  const isDay = mode === "day";
  const [transition, setTransition] = useState(0); // 0 = day, 1 = night

  useEffect(() => {
    if (!group.current) return;
    group.current.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.material.needsUpdate = true;
      }
    });
    group.current.scale.set(20, 20, 20);
    group.current.position.set(90, -10.2, 28);
    group.current.rotation.set(0, -10, 0);
  }, []);

  useFrame(() => {
    if (!group.current) return;

    //transition between day and night
    const target = isDay ? 0 : 1;
    setTransition((t) => THREE.MathUtils.lerp(t, target, 0.02));

    const warmTone = new THREE.Color("#ffe1b3"); // sunset warm
    const coolTone = new THREE.Color("#9fb0ff"); // night cool
    const baseTone = new THREE.Color("#ffffff");

    group.current.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.color) {
        const color = baseTone.clone();
        if (transition < 0.5) {
          // from day to sunset
          color.lerp(warmTone, transition * 2);
        } else {
          // from sunset to night
          color.lerp(coolTone, (transition - 0.5) * 2);
        }
        obj.material.color.lerp(color, 0.1);
      }
    });
  });

  return <primitive ref={group} object={scene} {...props} />;
}

useGLTF.preload("/models/map3.glb");

import React, { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useStore } from "../stores/store";

export default function House(props) {
  const group = useRef();

  //animation and model loading
  const { scene, animations } = useGLTF("/models/Cotage30.glb");

  // line below to use animations
  const { actions } = useAnimations(animations, group);

  const setView = useStore((s) => s.setView);

  useEffect(() => {
    if (!group.current) return;

    // setting shadows
    group.current.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    // play first animation found
    const firstActionName = Object.keys(actions)[0];
    if (firstActionName) {
      actions[firstActionName].reset().fadeIn(0.5).play();
    }
  }, [actions]);

  return (
    <primitive
      ref={group}
      object={scene}
      {...props}
      onPointerDown={(e) => {
        e.stopPropagation();
        setView("inside"); // cotage clicked
      }}
    />
  );
}

useGLTF.preload("/models/Cotage30.glb");

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

/**  */
export default function useCanvasTexture(width = 1024, height = 768) {
  const [canvas, setCanvas] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const canv = document.createElement("canvas");
    canv.width = width;
    canv.height = height;

    const context = canv.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    const tex = new THREE.CanvasTexture(canv);
    tex.anisotropy = 8;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    setCanvas(canv);
    setCtx(context);
    setTexture(tex);
  }, [width, height]);

  return { canvas, ctx, texture };
}

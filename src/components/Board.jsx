import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../stores/store";
import useCanvasTexture from "../hooks/useCanvasTexture";

export default function Board({
  scale = 0.22,
  position = [-0.7, 4, -2.5],
  rotation = [0, Math.PI / 1.5, 0],
  ...props
}) {
  const group = useRef();
  const surfaceRef = useRef();
  const { scene } = useGLTF("/models/board.glb");

  const { focus, setFocus, setView, brushSize, setBrushSize, cameraControls } =
    useStore();

  const { canvas, ctx, texture } = useCanvasTexture(1500, 1670);
  const [color, setColor] = useState("#222");
  const [drawing, setDrawing] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [bgStyle, setBgStyle] = useState("white");
  const pos = useRef({ x: 0, y: 0 });

  const undoStack = useRef([]);
  const redoStack = useRef([]);

  // click to focus on board
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      setFocus("board");
    },
    [setFocus]
  );

  // texuter update
  useEffect(() => {
    if (surfaceRef.current && texture) {
      const material = new THREE.MeshBasicMaterial({ map: texture });
      material.needsUpdate = true;
      surfaceRef.current.material = material;
    }
  }, [texture]);

  // register board as camera target
  useEffect(() => {
    if (surfaceRef.current) {
      useStore.getState().registerTargetNote("board", surfaceRef.current, {
        mode: "front",
        distance: 1.0,
        elev: 0.0,
        invertForward: true,
      });
    }
  }, []);

  //  count canvas position
  const getPos = (clientX, clientY, rect, canvas) => {
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // start drawing
  const startDraw = useCallback(
    (clientX, clientY, target) => {
      if (!ctx || !canvas) return;
      undoStack.current.push(
        ctx.getImageData(0, 0, canvas.width, canvas.height)
      );
      redoStack.current = [];

      const rect = target.getBoundingClientRect();
      const p = getPos(clientX, clientY, rect, canvas);
      pos.current = p;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      setDrawing(true);
      if (cameraControls) cameraControls.enabled = false;
    },
    [ctx, canvas, cameraControls]
  );

  // drawing function
  const drawAt = useCallback(
    (clientX, clientY, target) => {
      if (!drawing || !ctx || !canvas) return;
      const rect = target.getBoundingClientRect();
      const p = getPos(clientX, clientY, rect, canvas);
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = eraseMode ? ctx.fillStyle : color;
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      texture.needsUpdate = true;
    },
    [drawing, ctx, brushSize, color, eraseMode, texture, canvas]
  );

  // mouse events
  const handleMouseDown = (e) => startDraw(e.clientX, e.clientY, e.target);
  const handleMouseMove = (e) => drawAt(e.clientX, e.clientY, e.target);
  const handleMouseUp = () => {
    setDrawing(false);
    if (cameraControls) cameraControls.enabled = true;
  };

  // touch event
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    if (touch) startDraw(touch.clientX, touch.clientY, e.target);
  };
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    if (touch) drawAt(touch.clientX, touch.clientY, e.target);
  };
  const handleTouchEnd = () => {
    setDrawing(false);
    if (cameraControls) cameraControls.enabled = true;
  };

  // undo
  const undo = useCallback(() => {
    if (!ctx || !canvas) return;
    if (undoStack.current.length > 0) {
      const lastState = undoStack.current.pop();
      redoStack.current.push(
        ctx.getImageData(0, 0, canvas.width, canvas.height)
      );
      ctx.putImageData(lastState, 0, 0);
      texture.needsUpdate = true;
    }
  }, [ctx, texture, canvas]);

  // redo
  const redo = useCallback(() => {
    if (!ctx || !canvas) return;
    if (redoStack.current.length > 0) {
      const redoState = redoStack.current.pop();
      undoStack.current.push(
        ctx.getImageData(0, 0, canvas.width, canvas.height)
      );
      ctx.putImageData(redoState, 0, 0);
      texture.needsUpdate = true;
    }
  }, [ctx, texture, canvas]);

  // clear
  const clear = useCallback(() => {
    if (!ctx || !canvas) return;
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    redoStack.current = [];
    texture.needsUpdate = true;
  }, [ctx, texture, canvas]);

  // save
  const save = useCallback(() => {
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "board_drawing.png";
    a.click();
  }, [canvas]);

  // erase
  const toggleErase = () => setEraseMode((prev) => !prev);

  // background color
  const changeBackground = useCallback(
    (style) => {
      if (!ctx || !canvas) return;
      setBgStyle(style);
      ctx.save();

      switch (style) {
        case "dark":
          ctx.fillStyle = "#1c1c1c";
          break;
        case "blue":
          ctx.fillStyle = "#d6f0ff";
          break;
        case "grid":
          ctx.fillStyle = "#ffffff";
          break;
        default:
          ctx.fillStyle = "#ffffff";
      }

      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // draw grid
      if (style === "grid") {
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 0.5;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      ctx.restore();
      texture.needsUpdate = true;
    },
    [ctx, canvas, texture]
  );

  // init background
  useEffect(() => {
    if (ctx && canvas) changeBackground(bgStyle);
  }, [ctx, canvas]);

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={scale}
      {...props}
      onClick={handleClick}
    >
      <primitive object={scene} />

      <mesh ref={surfaceRef} position={[0.1, 8, 1.6]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[3.6, 4]} />
      </mesh>

      {focus === "board" && (
        <Html
          transform
          occlude
          position={[0.1, 7.7, 1.8]}
          rotation={[-0.15, 0, 0]}
          distanceFactor={1}
        >
          <div
            style={{
              width: "800px",
              height: "900px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(255,255,255,0.96)",
              borderRadius: "12px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              padding: "1rem",
            }}
          >
            {/*  Canvas */}
            <div
              ref={(wrapper) => {
                if (wrapper && canvas) {
                  wrapper.innerHTML = "";
                  wrapper.appendChild(canvas);
                  canvas.style.cursor = drawing ? "grabbing" : "crosshair";
                  canvas.style.border = "2px solid #7FC7AF";
                  canvas.style.borderRadius = "8px";
                  canvas.style.background = "white";
                  canvas.style.width = "1500px";
                  canvas.style.height = "1900px";
                  canvas.style.touchAction = "none";

                  canvas.onmousedown = handleMouseDown;
                  canvas.onmousemove = handleMouseMove;
                  canvas.onmouseup = handleMouseUp;
                  canvas.onmouseleave = handleMouseUp;

                  canvas.ontouchstart = handleTouchStart;
                  canvas.ontouchmove = handleTouchMove;
                  canvas.ontouchend = handleTouchEnd;
                }
              }}
              style={{
                width: "800px",
                height: "600px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            />

            {/* tools*/}
            <div
              style={{
                marginTop: "70%",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <label>
                🖌️ :
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  style={{ marginLeft: "6px" }}
                />
              </label>

              <label>
                🎨 :
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={eraseMode}
                  style={{ marginLeft: "6px" }}
                />
              </label>

              <button
                onClick={toggleErase}
                style={{
                  background: eraseMode ? "#ff8080" : "#999",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                {eraseMode ? "🧽 Erasing" : "✏️ Draw"}
              </button>

              <button
                onClick={undo}
                style={{
                  background: "#ffb84d",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                ↩️ Undo
              </button>

              <button
                onClick={redo}
                style={{
                  background: "#4d94ff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                ↪️ Redo
              </button>

              <button
                onClick={() => changeBackground("white")}
                style={{
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                🩶 White
              </button>

              <button
                onClick={() => changeBackground("dark")}
                style={{
                  background: "#1c1c1c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                🖤 Dark
              </button>

              <button
                onClick={() => changeBackground("blue")}
                style={{
                  background: "#d6f0ff",
                  border: "1px solid #8ccfff",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                📘 Blue
              </button>

              <button
                onClick={() => changeBackground("grid")}
                style={{
                  background: "#eaeaea",
                  border: "1px solid #bbb",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                📄 Grid
              </button>

              <button
                onClick={clear}
                style={{
                  background: "#ccc",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                🧼 Clear
              </button>

              <button
                onClick={save}
                style={{
                  background: "#7FC7AF",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                💾 Save
              </button>

              <button
                onClick={() => {
                  setFocus("free");
                  setView("inside");
                }}
                style={{
                  background: "#555",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                🏡 Back
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload("/models/board.glb");

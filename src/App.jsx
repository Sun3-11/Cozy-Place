import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, OrbitControls, Stars } from "@react-three/drei";
import FocusRig from "./components/FocusRig";
import House from "./components/House";
import Radio from "./components/Radio";
import Notebook from "./components/Notebook";
import Overlay from "./components/ui/Overlay";
import AudioManager from "./components/AudioManager";
import { useStore } from "./stores/store";
import Map from "./components/Map";
import "./App.css";
import Board from "./components/Board";
import Pin from "./components/Pin";
import * as THREE from "three";
import CozyLoader from "./components/CozyLoader";

/** Mood and Light Manager*/
function LightingManager() {
  const mode = useStore((s) => s.mode);
  const mood = useStore((s) => s.mood);
  const isDay = mode === "day";
  const [transition, setTransition] = useState(0);

  const hemiLight = useRef();
  const dirLight = useRef();
  const ambient = useRef();
  const rainGroup = useRef();
  const snowGroup = useRef();

  // create rain and snow particles
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const rainTexture = loader.load("/particles/13.png");
    const snowTexture = loader.load("/particles/3.png");

    if (!rainGroup.current || !snowGroup.current) return;

    const rainCount = 2000;
    const snowCount = 1500;

    //Bounding Box to avoid creating particles inside the house
    const houseArea = {
      minX: -8,
      maxX: 8,
      minZ: -12,
      maxZ: 12,
    };

    /**rain */
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = [];

    while (rainPos.length / 3 < rainCount) {
      const x = (Math.random() - 0.5) * 100;
      const y = Math.random() * 60 + 10;
      const z = (Math.random() - 0.5) * 100;

      //don't create point inside the house
      if (
        x > houseArea.minX &&
        x < houseArea.maxX &&
        z > houseArea.minZ &&
        z < houseArea.maxZ
      )
        continue;

      rainPos.push(x, y, z);
    }

    rainGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(rainPos, 3)
    );

    const rainMat = new THREE.PointsMaterial({
      size: 0.5,
      map: rainTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: "#448dd6",
    });
    const rain = new THREE.Points(rainGeo, rainMat);
    rainGroup.current.add(rain);

    /**snow*/
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = [];

    while (snowPos.length / 3 < snowCount) {
      const x = (Math.random() - 0.5) * 100;
      const y = Math.random() * 60 + 10;
      const z = (Math.random() - 0.5) * 100;

      // don't create point inside the house
      if (
        x > houseArea.minX &&
        x < houseArea.maxX &&
        z > houseArea.minZ &&
        z < houseArea.maxZ
      )
        continue;

      snowPos.push(x, y, z);
    }

    snowGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(snowPos, 3)
    );

    const snowMat = new THREE.PointsMaterial({
      size: 0.8,
      map: snowTexture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: "#ffffff",
    });
    const snow = new THREE.Points(snowGeo, snowMat);
    snowGroup.current.add(snow);
  }, []);

  useFrame(({ scene }) => {
    // transition from day to night
    const target = isDay ? 0 : 1;
    setTransition((t) => THREE.MathUtils.lerp(t, target, 0.01));

    // sky color
    const skyColor = new THREE.Color();
    if (transition < 0.5) {
      skyColor.lerpColors(
        new THREE.Color("#d6ecff"),
        new THREE.Color("#ffb26b"),
        transition * 2
      );
    } else {
      skyColor.lerpColors(
        new THREE.Color("#ffb26b"),
        new THREE.Color("#090a14"),
        (transition - 0.5) * 2
      );
    }

    if (!scene.background) scene.background = new THREE.Color(skyColor);
    else scene.background.lerp(skyColor, 0.05);

    // Light intensities
    const targetDir = THREE.MathUtils.lerp(1.2, 0.25, transition);
    const targetHemi = THREE.MathUtils.lerp(0.7, 0.2, transition);
    const targetAmb = THREE.MathUtils.lerp(0.5, 0.15, transition);

    if (dirLight.current)
      dirLight.current.intensity +=
        (targetDir - dirLight.current.intensity) * 0.05;
    if (hemiLight.current)
      hemiLight.current.intensity +=
        (targetHemi - hemiLight.current.intensity) * 0.05;
    if (ambient.current)
      ambient.current.intensity +=
        (targetAmb - ambient.current.intensity) * 0.05;

    // Directional light color
    if (dirLight.current) {
      const warm = new THREE.Color("#ffd599");
      const cool = new THREE.Color("#aaccff");
      const mixed = warm.clone().lerp(cool, transition);
      dirLight.current.color.lerp(mixed, 0.05);
    }

    // Fog
    const fogColors = {
      sad: "#5c5c70",
      happy: "#dff9fb",
      storm: "#1b1b1f",
      snow: "#e8f8ff",
      rain: "#6a7b91",
      clear: "#ffffff",
    };
    const fogDensity = {
      sad: 0.02,
      happy: 0.003,
      storm: 0.05,
      snow: 0.01,
      rain: 0.03,
      clear: 0.0,
    };
    const color = fogColors[mood] || "#ffffff";
    const density = fogDensity[mood] || 0.0;
    scene.fog = density > 0 ? new THREE.FogExp2(color, density) : null;

    // rain and snow animation
    if (rainGroup.current && mood === "rain") {
      rainGroup.current.children.forEach((mesh) => {
        const pos = mesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          pos.array[i * 3 + 1] -= 0.6; // speed
          if (pos.array[i * 3 + 1] < -10) pos.array[i * 3 + 1] = 60; //up
        }
        pos.needsUpdate = true;
      });
    }

    if (snowGroup.current && mood === "snow") {
      snowGroup.current.children.forEach((mesh) => {
        const pos = mesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          pos.array[i * 3 + 1] -= 0.15; // speed
          pos.array[i * 3] += Math.sin(i + Date.now() * 0.001) * 0.01;
          if (pos.array[i * 3 + 1] < -10) pos.array[i * 3 + 1] = 60;
        }
        pos.needsUpdate = true;
      });
    }
  });

  return (
    <>
      <hemisphereLight ref={hemiLight} intensity={0.7} />
      <directionalLight
        ref={dirLight}
        position={[12, 20, 8]}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <ambientLight ref={ambient} intensity={0.5} />

      {/* Weather efect */}
      <group ref={rainGroup} visible={mood === "rain"} />
      <group ref={snowGroup} visible={mood === "snow"} />
    </>
  );
}

/** Cotage light*/
function CabinLight() {
  const mode = useStore((s) => s.mode);
  const isDay = mode === "day";
  const light = useRef();

  useFrame(() => {
    if (!light.current) return;
    const target = isDay ? 0 : 0.8;
    light.current.intensity += (target - light.current.intensity) * 0.05;
  });

  return (
    <pointLight
      ref={light}
      position={[1.9, 5.2, -6.69]}
      intensity={10}
      distance={10}
      color={"#ffb775"}
      castShadow
    />
  );
}

/**Audio */
function MoodAudioNative() {
  const mood = useStore((s) => s.mood);
  const enabled = useStore((s) => s.soundEnabled);
  const audiosRef = useRef({});

  useEffect(() => {
    const make = (src) => {
      const a = new Audio(src);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0;
      return a;
    };
    audiosRef.current = {
      rain: make("/audio/rain.mp3"),
      snow: make("/audio/lofi.mp3"),
      storm: make("/audio/storm.mp3"),
      birds: make("/audio/birds.mp3"),
      sad: make("/audio/sad.mp3"),
    };
    return () =>
      Object.values(audiosRef.current).forEach((a) => {
        a.pause();
        a.src = "";
      });
  }, []);

  const fadeTo = (audio, target = 0.5, ms = 800) => {
    if (!audio) return;
    const steps = 20;
    const step = (target - audio.volume) / steps;
    clearInterval(audio.__fadeTimer);
    audio.__fadeTimer = setInterval(() => {
      audio.volume = Math.max(0, Math.min(1, audio.volume + step));
      if (Math.abs(audio.volume - target) < 0.01)
        clearInterval(audio.__fadeTimer);
    }, ms / steps);
  };

  const stopWithFade = (audio, ms = 600) => {
    if (!audio) return;
    const steps = 15;
    const step = audio.volume / steps;
    clearInterval(audio.__fadeTimer);
    audio.__fadeTimer = setInterval(() => {
      audio.volume = Math.max(0, audio.volume - step);
      if (audio.volume <= 0.01) {
        clearInterval(audio.__fadeTimer);
        audio.pause();
        audio.currentTime = 0;
      }
    }, ms / steps);
  };

  useEffect(() => {
    const A = audiosRef.current;
    if (!A || !A.rain) return;
    Object.values(A).forEach((a) => stopWithFade(a, 300));
    if (!enabled) return;

    const playAndFade = async (a, vol = 0.5) => {
      try {
        await a.play();
        fadeTo(a, vol, 900);
      } catch {}
    };

    if (mood === "rain") playAndFade(A.rain, 0.55);
    else if (mood === "snow") playAndFade(A.snow, 0.5);
    else if (mood === "sad") playAndFade(A.sad, 0.5);
    else if (mood === "storm") playAndFade(A.storm, 0.6);
    else if (mood === "happy" || mood === "clear") playAndFade(A.birds, 0.45);
  }, [mood, enabled]);

  return null;
}

/** Scene */
export default function App() {
  const mode = useStore((s) => s.mode);
  const isDay = mode === "day";

  return (
    <>
      <Canvas shadows camera={{ position: [6, 8, 15], fov: 45 }}>
        {/* <Suspense
          fallback={
            <Html center>
              <div className="tag">Loading☕...</div>
            </Html>
          }
        > */}
        <Suspense fallback={<CozyLoader />}>
          <LightingManager />
          <group>
            <House />
            <CabinLight />
            <group position={[0, 0, 0]}>
              <Radio position={[0.1, 5.33, -6]} />
              <Notebook position={[2.4, 5.2, -3.9]} />
              <Board position={[-1.3, 4, -2.3]} />
              <Pin
                position={[-1.61, 6.2, -4.5]}
                rotation={[1, 1.4, -1]}
                scale={0.2}
              />
            </group>
            <Environment preset={isDay ? "sunset" : "night"} />
            <Map />
          </group>
        </Suspense>

        <OrbitControls
          minDistance={1}
          maxDistance={20}
          enableDamping
          dampingFactor={0.1}
        />
        <FocusRig />
      </Canvas>

      <ModeToggle />
      <MoodToggle />
      <Overlay />
      <SoundToggle />
      <MoodAudioNative />
      <AudioManager />
    </>
  );
}

/** Mode button*/
function ModeToggle() {
  const mode = useStore((s) => s.mode);
  const toggle = useStore((s) => s.toggleMode);

  return (
    <button
      onClick={toggle}
      style={{
        position: "absolute",
        top: "2vh",
        right: "3vw",
        padding: "clamp(6px, 1.5vh, 12px) clamp(10px, 2vw, 18px)",
        borderRadius: "30px",
        border: "none",
        background: "linear-gradient(135deg, #fff9f0 0%, #7FC7AF 100%)",
        color: "#333",
        fontWeight: "bold",
        fontSize: "clamp(12px, 1.5vw, 16px)",
        cursor: "pointer",
        boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
        transition: "transform 0.2s, box-shadow 0.2s",
        zIndex: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 5px 12px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.2)";
      }}
    >
      {mode === "day" ? " 🌙" : " 🌞"}
    </button>
  );
}

/** sound button*/
function SoundToggle() {
  const enabled = useStore((s) => s.soundEnabled);
  const setEnabled = useStore((s) => s.setSoundEnabled);

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      style={{
        position: "absolute",
        bottom: "3vh",
        left: "3vw",
        width: "clamp(45px, 8vw, 70px)",
        height: "clamp(45px, 8vw, 70px)",
        borderRadius: "50%",
        border: "none",
        background: enabled
          ? "linear-gradient(145deg, #7FC7AF 0%, #5ca98e 100%)"
          : "rgba(255,255,255,0.9)",
        color: enabled ? "#fff" : "#333",
        fontSize: "clamp(18px, 4vw, 28px)",
        cursor: "pointer",
        boxShadow: enabled
          ? "0 4px 15px rgba(127,199,175,0.6)"
          : "0 2px 10px rgba(0,0,0,0.15)",
        transition: "all 0.25s ease",
        zIndex: 10,
      }}
      title="Toggle ambient sounds"
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}

/** Mood button*/
function MoodToggle() {
  const mood = useStore((s) => s.mood);
  const setMood = useStore((s) => s.setMood);
  const moods = [
    { key: "clear", icon: "☀️" },
    { key: "rain", icon: "🌧️" },
    { key: "snow", icon: "❄️" },
    { key: "storm", icon: "🌩️" },
    { key: "sad", icon: "😢" },
    { key: "happy", icon: "😊" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: "14vh",
        right: "2vw",
        background: "rgba(255, 255, 255, 0.54)",
        borderRadius: "18px",
        padding: "clamp(6px, 2vh, 6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(6px, 1.5vh, 12px)",
        boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
        backdropFilter: "blur(6px)",
        zIndex: 10,
      }}
    >
      {moods.map((m) => (
        <button
          key={m.key}
          onClick={() => setMood(m.key)}
          style={{
            border: "none",
            borderRadius: "50%",
            width: "clamp(35px, 6vw, 55px)",
            height: "clamp(35px, 6vw, 55px)",
            cursor: "pointer",
            fontSize: "clamp(18px, 3vw, 20px)",
            background: m.key === mood ? "#7FC7AF" : "#eee",
            color: m.key === mood ? "#fff" : "#333",
            boxShadow:
              m.key === mood
                ? "0 4px 12px rgba(127,199,175,0.5)"
                : "0 2px 5px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
}

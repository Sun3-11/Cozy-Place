import { useEffect, useRef } from "react";
import { useStore } from "../stores/store";

export default function MoodAudioNative() {
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

    return () => {
      Object.values(audiosRef.current).forEach((a) => {
        try {
          a.pause();
          a.src = "";
        } catch {}
      });
    };
  }, []);

  const fadeTo = (audio, target = 0.5, ms = 800) => {
    if (!audio) return;
    const steps = 20;
    const step = (target - audio.volume) / steps;
    let i = 0;
    clearInterval(audio.__fadeTimer);
    audio.__fadeTimer = setInterval(() => {
      i++;
      audio.volume = Math.max(0, Math.min(1, audio.volume + step));
      if (i >= steps) clearInterval(audio.__fadeTimer);
    }, ms / steps);
  };

  const stopWithFade = (audio, ms = 600) => {
    if (!audio) return;
    const steps = 15;
    const step = audio.volume / steps;
    let i = 0;
    clearInterval(audio.__fadeTimer);
    audio.__fadeTimer = setInterval(() => {
      i++;
      audio.volume = Math.max(0, audio.volume - step);
      if (i >= steps) {
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
      } catch (e) {
        console.log("Mood audio play error:", e);
      }
    };

    if (mood === "sad") playAndFade(A.rain, 0.55);
    else if (mood === "snowy") playAndFade(A.snow, 0.5);
    else if (mood === "stormy") playAndFade(A.storm, 0.6);
    else if (mood === "happy" || mood === "calm") playAndFade(A.birds, 0.45);
  }, [mood, enabled]);

  return null;
}

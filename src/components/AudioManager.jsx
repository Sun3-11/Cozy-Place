import React, { useEffect, useRef } from "react";
import { useStore } from "../stores/store";

/** Hidden HTML audio player controlled by Zustand. */
export default function AudioManager() {
  const ref = useRef(null);
  const tracks = useStore((s) => s.tracks);
  const current = useStore((s) => s.current);
  const playing = useStore((s) => s.playing);
  const volume = useStore((s) => s.volume);
  const next = useStore((s) => s.next);

  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.src = tracks[current]?.url || "";
    if (playing) {
      ref.current.play().catch(() => {});
    } else {
      ref.current.pause();
    }
  }, [tracks, current, playing]);

  return <audio ref={ref} onEnded={next} loop={false} />;
}

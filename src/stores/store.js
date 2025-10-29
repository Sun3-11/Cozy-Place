import { create } from "zustand";

export const useStore = create((set, get) => ({
  /** camera and focus */
  focus: "free",
  view: "outside", // possible values: outside, inside
  setView: (v) => set({ view: v }),

  targets: {},
  setFocus: (key) => set({ focus: key }),
  cameraControls: null,
  setCameraControls: (controls) => set({ cameraControls: controls }),

  registerTargetNote: (
    key,
    obj,
    offset = [0, 1.2, 2],
    rotation = [0, -40, 0]
  ) =>
    set((state) => ({
      targets: {
        ...state.targets,
        [key]: { obj, offset, rotation },
      },
    })),

  registerTargetRadio: (
    key,
    obj,
    offset = [0, 5.5, 25],
    rotation = [-0.2, 20, 0]
  ) =>
    set((state) => ({
      targets: { ...state.targets, [key]: { obj, offset, rotation } },
    })),

  registerTargetBoard: (
    key,
    obj,
    offset = [0, 5.2, 2],
    rotation = [10, -40, 40]
  ) =>
    set((state) => ({
      targets: {
        ...state.targets,
        [key]: { obj, offset, rotation },
      },
    })),
  registerTargetWall: (
    key,
    obj,
    offset = [0, 3, 2], // default offset
    rotation = [0, 0, 0]
  ) =>
    set((state) => ({
      targets: {
        ...state.targets,
        [key]: { obj, offset, rotation },
      },
    })),

  /** sounds*/
  tracks: [
    { title: "Lofi", url: "/audio/Lofi.m4a" },
    { title: "فلربما", url: "/audio/falaRobama.m4a" },
    { title: "howl's moving castle", url: "/audio/Howl.mp3" },
    {
      title: "Mia _ Sebastian_s Theme",
      url: "/audio/Mia _ Sebastian_s Theme.mp3",
    },
    { title: "RelaxingPiano", url: "/audio/RelaxingPiano.mp3" },
    {
      title: "Yanni - Marching Season",
      url: "/audio/Yanni - Marching Season.mp3",
    },
    {
      title: "new place to begin",
      url: "/audio/new place to begin.mp3",
    },
    {
      title: "natural beauty",
      url: "/audio/natural beauty.mp3",
    },
  ],
  current: 0,
  playing: false,
  volume: 0.5,

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  next: () =>
    set((s) => ({
      current: (s.current + 1) % s.tracks.length,
      playing: true,
    })),
  prev: () =>
    set((s) => ({
      current: (s.current - 1 + s.tracks.length) % s.tracks.length,
      playing: true,
    })),
  setVolume: (v) => set({ volume: v }),

  /** draw tools */
  brushSize: 4,
  setBrushSize: (n) => set({ brushSize: n }),

  /**notes tools*/
  /** notes */
  notes: [],
  pinnedNotes: [],

  addNote: (note) =>
    set((state) => ({
      notes: [note, ...state.notes],
    })),

  togglePin: (id) =>
    set((state) => {
      const note = state.notes.find((n) => n.id === id);
      if (!note) return state;
      const isPinned = state.pinnedNotes.some((p) => p.id === id);
      return {
        pinnedNotes: isPinned
          ? state.pinnedNotes.filter((p) => p.id !== id)
          : [...state.pinnedNotes, note],
      };
    }),
  /**mood and wether*/
  mood: "clear", // clear | rain | storm | snow | sad | happy
  setMood: (mood) => set({ mood }),

  /** day and night */
  mode: "day", // or "night"
  toggleMode: () =>
    set((state) => ({
      mode: state.mode === "day" ? "night" : "day",
    })),
  /** sound */
  soundEnabled: false,
  setSoundEnabled: (v) => set({ soundEnabled: v }),
  mood: "calm",
  setMood: (m) => set({ mood: m }),
}));

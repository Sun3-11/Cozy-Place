import React, { useEffect, useRef, useState } from "react";
import { Html, useGLTF } from "@react-three/drei";
import { supabase } from "../lib/supabaseClient";
import { useStore } from "../stores/store";

export default function Notebook({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, -2, 0],
}) {
  const group = useRef();
  const screenRef = useRef();
  const { scene } = useGLTF("/models/Pc.glb");

  const focus = useStore((s) => s.focus);
  const setFocus = useStore((s) => s.setFocus);

  const notes = useStore((s) => s.notes);
  const addNote = useStore((s) => s.addNote);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // register notebook as camera target
  useEffect(() => {
    if (!group.current || !screenRef.current) return;
    useStore.getState().registerTargetNote("notebook", screenRef.current, {
      mode: "front",
      distance: 0.12,
      elev: 0.05,
      invertForward: true,
    });
  }, []);

  // load notes from supabase
  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) useStore.setState({ notes: data });
  };

  useEffect(() => {
    fetchNotes();
    const channel = supabase
      .channel("notes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        fetchNotes
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // add a new note
  const handleAddNote = async () => {
    if (text.trim() === "") return;
    setLoading(true);
    const newNote = {
      user_name: "Anon_" + Math.floor(Math.random() * 999),
      message: text,
    };
    const { error } = await supabase.from("notes").insert([newNote]);
    if (error) console.error(error);
    setText("");
    fetchNotes();
    setLoading(false);
  };
  // pin/unpin note (admin only)
  const handlePinToggle = async (note) => {
    const { error } = await supabase
      .from("notes")
      .update({ pinned: !note.pinned })
      .eq("id", note.id);

    if (error) {
      console.error(error);
    } else {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      useStore.setState({
        notes: data,
        pinnedNotes: data.filter((n) => n.pinned),
      });
    }
  };

  //admin login
  const loginAsOwner = () => {
    const pass = prompt("Enter admin password:");
    if (pass === import.meta.env.VITE_ADMIN) {
      setIsOwner(true);
      alert("Welcome, root 👑");
    } else {
      alert("Access Denied ⚠️");
    }
  };

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        setFocus("notebook");
      }}
    >
      <primitive object={scene} />
      <group
        ref={screenRef}
        position={[0, 0.136, -0.15]}
        rotation={[-0.33, 0, 0]}
      />

      <Html
        transform
        occlude
        position={[0, 0.133, -0.154]}
        rotation={[-0.33, 0, 0]}
        distanceFactor={0.24}
      >
        {focus === "notebook" && (
          <div
            style={{
              width: "540px",
              height: "300px",
              background: "#000",
              color: "#00ff9f",
              fontFamily: "Courier New, monospace",
              border: "2px solid #00ff9f",
              borderRadius: "6px",
              padding: "8px",
              overflow: "hidden",
              boxShadow: "0 0 20px rgba(0,255,100,0.3)",
              display: "flex",
              flexDirection: "column",
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* hac style*/}
            <div
              style={{
                fontSize: "13px",
                borderBottom: "1px solid #00ff9f",
                marginBottom: "6px",
                paddingBottom: "4px",
                color: "#0f0",
              }}
            >
              <span style={{ color: "#00ffaa" }}>root@cozy:</span>~$ guestbook
            </div>

            {/* mess show*/}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                fontSize: "13px",
                lineHeight: "1.3em",
                paddingRight: "5px",
              }}
            >
              {notes.length === 0 ? (
                <p style={{ color: "#007700" }}>No entries yet...</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} style={{ marginBottom: "6px" }}>
                    <span style={{ color: "#00ffaa" }}>
                      {n.user_name || "Anon"}
                    </span>
                    <span style={{ color: "#555" }}>
                      {" "}
                      [{new Date(n.created_at).toLocaleTimeString()}]
                    </span>
                    <br />
                    <span style={{ color: "#00ff9f" }}>{"> " + n.message}</span>
                    {isOwner && (
                      <button
                        onClick={async () => {
                          const { error } = await supabase
                            .from("notes")
                            .delete()
                            .eq("id", n.id);
                          if (!error) fetchNotes();
                        }}
                        style={{
                          background: "none",
                          border: "1px solid #0f0",
                          color: "#0f0",
                          fontSize: "10px",
                          marginLeft: "6px",
                          cursor: "pointer",
                        }}
                      >
                        ✖ delete
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => handlePinToggle(n)}
                        style={{
                          background: "none",
                          border: "1px solid #0f0",
                          color: "#0f0",
                          fontSize: "10px",
                          marginLeft: "6px",
                          cursor: "pointer",
                        }}
                      >
                        📌 {n.pinned ? "Unpin" : "Pin"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* mass input*/}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderTop: "1px solid #00ff9f",
                paddingTop: "4px",
                marginTop: "4px",
              }}
            >
              <span style={{ color: "#00ffaa" }}>guest@cozy:</span>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="type your message..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#0f0",
                  outline: "none",
                  marginLeft: "6px",
                  fontFamily: "Courier New, monospace",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNote();
                }}
              />
            </div>

            {isOwner ? null : (
              <button
                onClick={loginAsOwner}
                style={{
                  position: "absolute",
                  bottom: "1px",
                  right: "6px",
                  background: "transparent",
                  border: "1px solid #00ff9f",
                  color: "#00ff9f",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                root login
              </button>
            )}
          </div>
        )}
      </Html>
    </group>
  );
}

useGLTF.preload("/models/Pc.glb");

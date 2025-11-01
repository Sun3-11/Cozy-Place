import React, { useRef, useEffect, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../stores/store";
import * as THREE from "three";

export default function Book(props) {
  const group = useRef();
  const { scene } = useGLTF("/models/open_book.glb");
  const setFocus = useStore((s) => s.setFocus);
  const focus = useStore((s) => s.focus);

  //  Story inspired by “The Old Man and the Sea” by Ernest Hemingway
  const stories = [
    "In a quiet Cuban village by the sea, there lived an old fisherman named Santiago. For eighty-four days, he had caught nothing. The younger fishermen laughed and said his luck was gone, but the old man still rose before dawn each morning, whispering: “Every day is a new chance.” ",

    "He had a young friend, Manolin, who used to fish with him. But Manolin’s parents told him to sail with luckier boats. Still, the boy cared deeply for Santiago. He brought him food and said softly, 'You are still the best fisherman, even if the fish forget it for a while.' Santiago smiled: 'Thank you, my boy. A man can be destroyed but not defeated.' ",

    "On the eighty-fifth day, Santiago set out alone, sailing farther than ever before. The sea was calm, the dawn golden. 'Today,' he thought, 'I will find the fish meant for me.' Around noon, he felt a heavy pull — a huge marlin had taken his bait . The fish was so strong that it began dragging his small boat deep into the sea.",

    "For two days and nights, the old man fought alone against the marlin. His hands were bleeding, his back was sore, and his body trembled with exhaustion. But his spirit stayed unbroken. He whispered to the fish, 'Brother, I love you. I have never seen or heard of anyone like you. But I will kill you — because I must live.' ",

    "The marlin leapt out of the water, silver and blue, shining in the sun. Santiago admired its beauty. 'You are my equal,' he said. 'Perhaps even my better.' Still, he tightened the line with tired hands and finally struck. The fish circled the boat, then grew still. Santiago’s eyes filled with tears. 'Thank you, great fish,' he said, 'for letting me test myself today.' ",

    "As he tied the marlin beside his boat, the old man looked at its size — longer than his own vessel. He smiled proudly, dreaming of how the villagers would marvel at it. But the sea had one more test for him. By dusk, the first shark appeared. Santiago fought it with a harpoon, shouting, 'You’ll not take my fish without a fight!' ",

    "One shark after another came, tearing the marlin apart. Santiago fought them all — with the harpoon, with an oar, even with his bare hands. His muscles burned, but he did not stop. When the last shark left, only bones and a great tail remained. He whispered, 'They beat me, yet they did not defeat me.' ",

    "At dawn, Santiago reached the shore. He was too weak to carry his gear, so he left it in the boat and walked home slowly. He lay on his bed and dreamed — not of fish or battles — but of lions playing freely on an African beach, as he had seen when he was young .",

    "When the villagers saw the marlin’s skeleton the next morning, they were silent. The young fishermen stood in awe. They realized that even in loss, the old man had won something greater — respect, pride, and peace.",

    "This story reminds us that greatness is not in victory itself, but in the strength to endure, to dream, and to keep fighting even when everything seems lost. ",

    "— Story based on *The Old Man and the Sea* by Ernest Hemingway 🖋️",
  ];

  const [storyIndex, setStoryIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");

  // register book as camera target
  useEffect(() => {
    if (group.current) {
      useStore.getState().registerTargetBook("book", group.current);
    }
  }, []);

  useFrame(() => {
    if (group.current) {
      const targetRot = focus === "book" ? Math.PI / 12 : 0;
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetRot,
        0.05
      );
    }
  });

  // typewriter effect for story text
  useEffect(() => {
    if (focus !== "book") return;
    setDisplayedText("");
    const fullText = stories[storyIndex];
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 45);
    return () => clearInterval(timer);
  }, [storyIndex, focus]);

  const nextStory = () => {
    setStoryIndex((prev) => (prev + 1) % stories.length);
  };

  return (
    <group ref={group} {...props}>
      <primitive
        object={scene}
        scale={0.52}
        onPointerDown={(e) => {
          e.stopPropagation();
          setFocus("book");
        }}
      />

      {focus === "book" && (
        <Html
          position={[-0.86, 0.021, -0.03]}
          rotation={[-Math.PI / 2, 0, 0]}
          transform
        >
          <div
            style={{
              width: "58px",
              height: "105px",
              //   background:
              //     "url('/textures/parchment_texture.jpg') center/cover no-repeat",
              borderRadius: "4px",
              //   border: "1px solid rgba(60,40,20,0.3)",
              //   boxShadow: "inset 0 0 4px rgba(0,0,0,0.2)",
              color: "#3a2a1a",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "4.5px",
              lineHeight: "1.4em",
              padding: "3px 4px",
              textAlign: "center",
              transform: "scale(1)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: "bold",
                fontSize: "5px",
                marginBottom: "2px",
                textAlign: "center",
                color: "#4b3522",
              }}
            >
              A Little Tale
            </h3>

            <p
              style={{
                fontStyle: "italic",
                whiteSpace: "pre-wrap",
                textShadow: "0 0.5px 0 rgba(255,255,255,0.3)",
              }}
            >
              {displayedText}
            </p>

            <button
              onClick={nextStory}
              style={{
                position: "absolute",
                bottom: "2px",
                right: "3px",
                background: "rgba(150,110,70,0.85)",
                border: "none",
                borderRadius: "3px",
                color: "#fffbe6",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "4px",
                padding: "1px 3px",
                cursor: "pointer",
              }}
            >
              ➜
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload("/models/open_book.glb");

import { useEffect, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../stores/store";

export default function FocusRig() {
  const ref = useRef();
  const focus = useStore((s) => s.focus);
  const view = useStore((s) => s.view);
  const targets = useStore((s) => s.targets);

  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    useStore.setState({ cameraControls: controls });

    // camera settings
    controls.smoothTime = 0.7;
    controls.dollySpeed = 0.4;
    controls.truckSpeed = 0.6;
    controls.minDistance = 0.5;
    controls.maxDistance = 15;

    /** outside */
    if (view === "outside") {
      controls.setLookAt(6, 8, 15, 0, 5, 0, true);
      return;
    }

    /** inside */
    if (view === "inside") {
      controls.setLookAt(0, -5.5, 6, 0, 5, -3, true);
      controls.minDistance = -19.5;
      controls.maxDistance = 8;
    }

    /** */
    const cinematicAngles = {
      notebook: {
        distance: 1.3,
        elev: 0.1,
        offset: new THREE.Vector3(0.3, -0.3, 0.3),
      },
      board: {
        distance: 1.6,
        elev: 0.2,
        offset: new THREE.Vector3(0.3, 0.2, 0.2),
      },
      wall: {
        distance: 2.0,
        elev: 0.1,
        offset: new THREE.Vector3(-1.2, 0.5, -0.5),
      },
      radio: {
        distance: 1.5,
        elev: 0.15,
        offset: new THREE.Vector3(-0.4, -0, -0.5),
      },
      book: {
        distance: -0.9,
        elev: -0.5,
        offset: new THREE.Vector3(0.1, 0.9, 1.2),
      },
    };

    /** focus*/
    if (focus !== "free") {
      const entry = targets[focus];
      if (!entry || !entry.obj) return;

      const obj = entry.obj;
      const target = new THREE.Vector3();
      obj.getWorldPosition(target);

      const q = new THREE.Quaternion();
      obj.getWorldQuaternion(q);

      // direction the object is facing
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
      if (entry.invertForward) forward.multiplyScalar(-1);

      // camera preset
      const preset = cinematicAngles[focus] || {};
      const distance = preset.distance ?? entry.distance ?? 1.5;
      const elev = preset.elev ?? entry.elev ?? 0.2;
      const offset = preset.offset ?? new THREE.Vector3(0, 0, 0);

      // target position
      const eye = target
        .clone()
        .addScaledVector(forward, distance)
        .add(new THREE.Vector3(0, elev, 0))
        .add(offset);

      controls.setLookAt(
        eye.x,
        eye.y,
        eye.z,
        target.x,
        target.y,
        target.z,
        true
      );
    }

    /** free roam*/
    if (focus === "free") {
      controls.setLookAt(0, 6, -2, 0, 6, -3, true);
    }
  }, [focus, view, targets]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={0.5}
      maxDistance={15}
      smoothTime={0.7}
      dollySpeed={0.4}
      truckSpeed={0.6}
      polarRotateSpeed={0.8}
    />
  );
}

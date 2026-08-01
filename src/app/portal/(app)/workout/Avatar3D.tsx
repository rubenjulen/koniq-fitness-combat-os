"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type Frame = { move: string; phase: number; t: number; mode: string; rep: number };

/**
 * Zelfstandige 3D-avatar (three.js) die de oefening voordoet. Procedureel geript —
 * geen modelbestand of licentie nodig. Een echt geript mensmodel (bv. Mixamo GLB)
 * kan later via GLTFLoader dit figuur vervangen; de aansturing (frameRef) blijft gelijk.
 */
export function Avatar3D({ frameRef, onFail }: { frameRef: React.MutableRefObject<Frame>; onFail?: () => void }) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let raf = 0, disposed = false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch { onFail?.(); return; } // geen WebGL → 2D-fallback blijft zichtbaar
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 1.15, 4.3);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x30202a, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(2.5, 5, 3.5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 20;
    key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xf59e0b, 0.7); rim.position.set(-3, 2, -2); scene.add(rim);

    // ground shadow catcher
    const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: 0.28 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    // ---- materials ----
    const body = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.55, metalness: 0.05 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.05 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.6 });

    // ---- rig ----
    const root = new THREE.Group(); scene.add(root);
    const joint = (parent: THREE.Object3D, x: number, y: number, z: number) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
    const limb = (j: THREE.Object3D, len: number, rad: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(rad, Math.max(0.01, len - 2 * rad), 6, 12), mat);
      m.position.y = -len / 2; m.castShadow = true; j.add(m); return m;
    };

    const hips = joint(root, 0, 0.95, 0);
    new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.12, 6, 12), dark).position.copy(new THREE.Vector3(0, 0.02, 0));
    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), dark); pelvis.castShadow = true; hips.add(pelvis);

    const spine = joint(hips, 0, 0.05, 0);
    limb(spine, 0.5, 0.15, body); // torso
    const chest = joint(spine, 0, 0.5, 0);
    const head = joint(chest, 0, 0.16, 0);
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), accent); headMesh.position.y = 0.14; headMesh.castShadow = true; head.add(headMesh);

    const shoulderL = joint(chest, -0.2, 0.05, 0), shoulderR = joint(chest, 0.2, 0.05, 0);
    limb(shoulderL, 0.34, 0.075, body); limb(shoulderR, 0.34, 0.075, body);
    const elbowL = joint(shoulderL, 0, -0.34, 0), elbowR = joint(shoulderR, 0, -0.34, 0);
    limb(elbowL, 0.34, 0.07, body); limb(elbowR, 0.34, 0.07, body);
    const fistL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), accent); fistL.position.y = -0.34; fistL.castShadow = true; elbowL.add(fistL);
    const fistR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), accent); fistR.position.y = -0.34; fistR.castShadow = true; elbowR.add(fistR);

    const thighL = joint(hips, -0.11, -0.05, 0), thighR = joint(hips, 0.11, -0.05, 0);
    limb(thighL, 0.42, 0.1, body); limb(thighR, 0.42, 0.1, body);
    const kneeL = joint(thighL, 0, -0.42, 0), kneeR = joint(thighR, 0, -0.42, 0);
    limb(kneeL, 0.42, 0.09, body); limb(kneeR, 0.42, 0.09, body);

    // rest / idle pose baseline for arms (hang slightly out)
    const set = (j: THREE.Group, x: number, y: number, z: number) => { j.rotation.set(x, y, z); };

    function pose(f: Frame, t: number) {
      const resting = f.mode === "rest" || f.mode === "ready" || f.mode === "done";
      const p = f.phase % 1, sp = Math.sin(p * Math.PI); // 0..1..0
      // reset transforms
      root.position.set(0, 0, 0); root.rotation.set(0, 0, 0);
      set(hips, 0, 0, 0); set(spine, 0, 0, 0); set(chest, 0, 0, 0); set(head, 0, 0, 0);
      set(shoulderL, 0, 0, 0.08); set(shoulderR, 0, 0, -0.08); set(elbowL, 0, 0, 0); set(elbowR, 0, 0, 0);
      set(thighL, 0, 0, 0.04); set(thighR, 0, 0, -0.04); set(kneeL, 0, 0, 0); set(kneeR, 0, 0, 0);

      if (resting) { // idle breathing
        const b = Math.sin(t * 1.6) * 0.03;
        set(spine, b, 0, 0); set(shoulderL, 0.1, 0, 0.16 + b); set(shoulderR, 0.1, 0, -0.16 - b); set(elbowL, 0.2, 0, 0); set(elbowR, 0.2, 0, 0);
        return;
      }
      if (f.move === "jack") {
        const o = sp; root.position.y = o * 0.05;
        set(shoulderL, 0, 0, 0.12 + o * (Math.PI * 0.92)); set(shoulderR, 0, 0, -0.12 - o * (Math.PI * 0.92));
        set(thighL, 0, 0, 0.05 + o * 0.3); set(thighR, 0, 0, -0.05 - o * 0.3);
      } else if (f.move === "squat") {
        const d = sp; root.position.y = -d * 0.34; set(spine, d * 0.42, 0, 0);
        set(thighL, d * 0.95, 0, 0.05); set(thighR, d * 0.95, 0, -0.05);
        set(kneeL, -d * 1.75, 0, 0); set(kneeR, -d * 1.75, 0, 0);
        set(shoulderL, -1.25, 0, 0.1); set(shoulderR, -1.25, 0, -0.1); set(elbowL, -0.15, 0, 0); set(elbowR, -0.15, 0, 0);
      } else if (f.move === "punch") {
        const e = sp, left = f.rep % 2 === 0;
        set(spine, 0, (left ? 1 : -1) * e * 0.28, 0);
        if (left) { set(shoulderL, -1.42, 0, 0.05); set(elbowL, -1.15 * (1 - e), 0, 0); set(shoulderR, -1.0, 0, -0.05); set(elbowR, -1.7, 0, 0); }
        else { set(shoulderR, -1.42, 0, -0.05); set(elbowR, -1.15 * (1 - e), 0, 0); set(shoulderL, -1.0, 0, 0.05); set(elbowL, -1.7, 0, 0); }
      } else { // pushup / plank — horizontal
        const d = f.move === "plank" ? Math.sin(t * 2) * 0.06 + 0.06 : sp;
        root.rotation.x = -Math.PI * 0.47; root.position.set(0, 0.5, 0.15);
        set(shoulderL, 1.5, 0, 0.1); set(shoulderR, 1.5, 0, -0.1); // arms toward floor
        set(elbowL, -d * 1.1, 0, 0); set(elbowR, -d * 1.1, 0, 0);
        set(spine, 0.05, 0, 0);
      }
    }

    function resize() {
      const w = el!.clientWidth || 1, h = el!.clientHeight || 1;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    const clock = new THREE.Clock();
    function loop() {
      if (disposed) return;
      const t = clock.getElapsedTime();
      pose(frameRef.current, t);
      camera.position.x = Math.sin(t * 0.18) * 0.55; camera.position.z = 4.3; camera.lookAt(0, 0.95, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect();
      renderer.dispose(); renderer.forceContextLoss?.();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      scene.traverse((o) => { const mm = o as THREE.Mesh; if (mm.geometry) mm.geometry.dispose(); });
    };
  }, [frameRef]);

  return <div ref={mount} style={{ position: "absolute", inset: 0 }} />;
}

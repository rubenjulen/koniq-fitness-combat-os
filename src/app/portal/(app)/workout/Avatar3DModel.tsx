"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Frame } from "./Avatar3D";

export type AvatarModelConfig = {
  model: string;                         // pad naar de geripte skinned mesh (GLB)
  animations: Record<string, string>;    // move-key → GLB met die animatie (Mixamo "Without Skin")
  scale?: number;
  yOffset?: number;
};

/**
 * Fotorealistisch geript model (bv. Mixamo) via GLTFLoader. Speelt per oefening de
 * bijbehorende clip, gesynchroniseerd op de rep/tempo-engine (frameRef): rep-oefeningen
 * worden per rep gescrubd, getimede oefeningen spelen natuurlijk. Faalt de load → onFail()
 * → app valt terug op de procedurele 3D-avatar. Zet een manifest in /public/models/ om dit
 * te activeren (zie README daar). Mixamo-rigs delen botnamen, dus animaties uit losse
 * exports retargeten op het basismodel.
 */
export function Avatar3DModel({ frameRef, config, onFail }: { frameRef: React.MutableRefObject<Frame>; config: AvatarModelConfig; onFail?: () => void }) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let raf = 0, disposed = false;

    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { onFail?.(); return; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.2, 4.2);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x30202a, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 5, 3.5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -2; key.shadow.camera.right = 2; key.shadow.camera.top = 3; key.shadow.camera.bottom = -1;
    scene.add(key);
    scene.add(new THREE.DirectionalLight(0xf59e0b, 0.6).translateX(-3).translateY(2));
    const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: 0.3 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    let mixer: THREE.AnimationMixer | null = null;
    const actions: Record<string, THREE.AnimationAction> = {};
    let currentKey = "";

    function resize() { const w = el!.clientWidth || 1, h = el!.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);
    const clock = new THREE.Clock();

    (async () => {
      try {
        const loader = new GLTFLoader();
        const base = await loader.loadAsync(config.model);
        if (disposed) return;
        const scaleV = config.scale ?? 1;
        base.scene.scale.setScalar(scaleV);
        base.scene.position.y = config.yOffset ?? 0;
        base.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; } });
        scene.add(base.scene);
        mixer = new THREE.AnimationMixer(base.scene);

        // any clip already in the base model (often an idle)
        base.animations.forEach((c) => { actions["idle"] = mixer!.clipAction(c); });

        await Promise.all(Object.entries(config.animations).map(async ([keyName, url]) => {
          try {
            const g = await loader.loadAsync(url);
            const clip = g.animations[0];
            if (clip) actions[keyName] = mixer!.clipAction(clip);
          } catch { /* clip ontbreekt — val terug op idle */ }
        }));
        if (disposed) return;
        if (Object.keys(actions).length === 0) { onFail?.(); return; }
      } catch { if (!disposed) onFail?.(); return; }
    })();

    function pickKey(f: Frame): string {
      const resting = f.mode === "rest" || f.mode === "ready" || f.mode === "done";
      if (resting && actions["idle"]) return "idle";
      if (actions[f.move]) return f.move;
      return actions["idle"] ? "idle" : Object.keys(actions)[0] ?? "";
    }

    function loop() {
      if (disposed) return;
      const dt = clock.getDelta(), f = frameRef.current;
      if (mixer && Object.keys(actions).length) {
        const key2 = pickKey(f);
        if (key2 && key2 !== currentKey) {
          const prev = actions[currentKey]; if (prev) prev.stop();
          const a = actions[key2]; a.reset(); a.enabled = true; a.play();
          currentKey = key2;
        }
        const a = actions[currentKey];
        if (a) {
          const dur = a.getClip().duration || 1;
          const resting = f.mode === "rest" || f.mode === "ready" || f.mode === "done";
          const rep = currentKey === f.move && !resting && a.getClip().duration > 0;
          const scrub = rep && workoutIsReps(f);
          if (scrub) { a.paused = true; a.time = (f.phase % 1) * dur; mixer.update(0); }
          else { a.paused = false; mixer.update(dt); }
        }
      }
      const t = clock.getElapsedTime();
      camera.position.x = Math.sin(t * 0.16) * 0.5; camera.lookAt(0, 1.0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    // reps vs time: reps have phase that resets each rep (0..1); time-mode phase grows past 1.
    function workoutIsReps(f: Frame) { return f.mode === "work" && f.phase <= 1.0001; }
    loop();

    return () => {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect();
      mixer?.stopAllAction();
      renderer.dispose(); renderer.forceContextLoss?.();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
    };
  }, [frameRef, config, onFail]);

  return <div ref={mount} style={{ position: "absolute", inset: 0 }} />;
}

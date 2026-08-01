"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Avatar3D, type Frame } from "./Avatar3D";

export type Exercise = { name: string; cat: string; move: string; mode: "reps" | "time"; target: number; tempo?: number; videoUrl?: string };

/** Render a coach demo video (mp4/webm, YouTube or Vimeo) as a looping muted clip. */
function DemoMedia({ url }: { url: string }) {
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    const id = yt[1];
    return <iframe key={u} src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0`} className="w-full h-full" style={{ border: 0 }} allow="autoplay; encrypted-media" title="Oefeningsvideo" />;
  }
  const vm = u.match(/vimeo\.com\/(\d+)/);
  if (vm) return <iframe key={u} src={`https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&loop=1&background=1`} className="w-full h-full" style={{ border: 0 }} allow="autoplay" title="Oefeningsvideo" />;
  return <video key={u} src={u} autoPlay loop muted playsInline className="w-full h-full" style={{ objectFit: "cover" }} />;
}

const REST = 8;
const BRAND = "#e11d48", AMBER = "#f59e0b";
const R = 43, CIRC = 2 * Math.PI * R;

export function WorkoutPlayer({ workout, completeAction }: { workout: Exercise[]; completeAction: (fd: FormData) => void | Promise<void> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const acRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<Frame>({ move: "jack", phase: 0, t: 0, mode: "ready", rep: 0 });
  const s = useRef({ idx: 0, phase: 0, reps: 0, mode: "ready" as "ready" | "work" | "rest" | "done", rest: 0, paused: true, last: 0, lastc: -1, lastr: -1, t: 0 });
  const [ui, setUi] = useState({ idx: 0, reps: 0, mode: "ready" as string, restNum: REST });
  const [webgl, setWebgl] = useState(true);
  const cur = workout[Math.min(ui.idx, workout.length - 1)];

  function beep(f: number, d = 0.08) {
    try {
      const ac = acRef.current ?? (acRef.current = new (window.AudioContext || (window as any).webkitAudioContext)());
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ac.destination); g.gain.value = 0.12; o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d); o.stop(ac.currentTime + d);
    } catch { /* no audio */ }
  }
  function ring(frac: number) { if (ringRef.current) ringRef.current.style.strokeDashoffset = String(CIRC * (1 - Math.max(0, Math.min(1, frac)))); }

  useEffect(() => {
    const cv = canvasRef.current!; const ctx = cv.getContext("2d")!;
    let raf = 0;
    const seg = (col: string, w: number, x1: number, y1: number, x2: number, y2: number) => { ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    const dot = (col: string, x: number, y: number, r: number) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };

    function draw(move: string, ph: number, reps: number, tsec: number) {
      ctx.clearRect(0, 0, 840, 440);
      const cx = 420, cy = 250, sc = 2.7, W = 17 * sc, sp = Math.sin(ph * Math.PI);
      if (move === "jack") {
        const o = sp, hipY = cy + (o ? -8 : 0) * sc, neck = cy - 46 * sc, spread = (6 + o * 22) * sc, footY = cy + 52 * sc;
        seg(BRAND, W, cx - 13 * sc, hipY, cx - spread, footY); seg(BRAND, W, cx + 13 * sc, hipY, cx + spread, footY);
        seg(BRAND, W, cx, hipY, cx, neck);
        const ang = Math.PI * (0.62 - o * 0.72), ax = Math.sin(ang) * 40 * sc, ay = -Math.cos(ang) * 40 * sc;
        seg(BRAND, W, cx - 15 * sc, neck + 3 * sc, cx - 15 * sc + ax, neck + 3 * sc + ay);
        seg(BRAND, W, cx + 15 * sc, neck + 3 * sc, cx + 15 * sc - ax, neck + 3 * sc + ay);
        dot(AMBER, cx, neck - 16 * sc, 13 * sc);
      } else if (move === "squat") {
        const d = sp, hipY = cy + d * 30 * sc, footL = cx - 22 * sc, footR = cx + 22 * sc, footY = cy + 55 * sc, kneeY = (hipY + footY) / 2, ko = (10 + d * 8) * sc, neck = hipY - 44 * sc;
        seg(BRAND, W, cx - 11 * sc, hipY, cx - ko, kneeY); seg(BRAND, W, cx - ko, kneeY, footL, footY);
        seg(BRAND, W, cx + 11 * sc, hipY, cx + ko, kneeY); seg(BRAND, W, cx + ko, kneeY, footR, footY);
        seg(BRAND, W, cx, hipY, cx, neck);
        seg(BRAND, W, cx - 12 * sc, neck + 4 * sc, cx - 16 * sc, neck - 16 * sc + d * 6 * sc);
        seg(BRAND, W, cx + 12 * sc, neck + 4 * sc, cx + 16 * sc, neck - 16 * sc + d * 6 * sc);
        dot(AMBER, cx, neck - 15 * sc, 13 * sc);
      } else if (move === "punch") {
        const e = sp, left = reps % 2 === 0, hipY = cy + 6 * sc, neck = cy - 42 * sc, footY = cy + 55 * sc, reach = e * 46 * sc;
        seg(BRAND, W, cx - 9 * sc, hipY, cx - 20 * sc, footY); seg(BRAND, W, cx + 9 * sc, hipY, cx + 18 * sc, footY);
        seg(BRAND, W, cx, hipY, cx, neck);
        if (left) { seg(BRAND, W, cx - 14 * sc, neck + 3 * sc, cx - 20 * sc - reach, neck + 8 * sc + reach * 0.25); seg(BRAND, W, cx + 14 * sc, neck + 3 * sc, cx + 9 * sc, neck - 9 * sc); }
        else { seg(BRAND, W, cx + 14 * sc, neck + 3 * sc, cx + 20 * sc + reach, neck + 8 * sc + reach * 0.25); seg(BRAND, W, cx - 14 * sc, neck + 3 * sc, cx - 9 * sc, neck - 9 * sc); }
        dot(AMBER, cx, neck - 15 * sc, 13 * sc);
        if (e > 0.6) dot(BRAND, left ? cx - 20 * sc - reach : cx + 20 * sc + reach, neck + 9 * sc + reach * 0.25, 7 * sc);
      } else { // pushup / plank (side view)
        const d = move === "plank" ? Math.sin(tsec * 2) * 0.1 + 0.1 : sp;
        const feetX = cx + 70 * sc, feetY = cy + 22 * sc, hipX = cx + 22 * sc, hipY = cy + 8 * sc;
        const shX = cx - 34 * sc, shY = cy - 6 * sc + d * 20 * sc, headX = cx - 58 * sc, headY = cy - 12 * sc + d * 20 * sc, handX = cx - 30 * sc, handY = cy + 40 * sc;
        seg(BRAND, W, feetX, feetY, hipX, hipY); seg(BRAND, W, hipX, hipY, shX, shY); seg(BRAND, W, shX, shY, handX, handY);
        dot(AMBER, headX, headY, 13 * sc);
        ctx.strokeStyle = "rgba(150,140,160,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(120, feetY + 6); ctx.lineTo(720, feetY + 6); ctx.stroke();
      }
    }

    function loop(t: number) {
      const st = s.current; if (!st.last) st.last = t; let dt = (t - st.last) / 1000; st.last = t; if (dt > 0.1) dt = 0.1; st.t = t / 1000;
      const w = workout[st.idx];
      if (!st.paused && st.mode === "work") {
        if (w.mode === "reps") {
          st.phase += dt / (w.tempo ?? 1.2);
          if (st.phase >= 1) { st.phase -= 1; st.reps++; beep(660); setUi((u) => ({ ...u, reps: st.reps })); if (st.reps >= w.target) { st.mode = "rest"; st.rest = REST; setUi((u) => ({ ...u, mode: "rest", restNum: REST })); } }
          ring(st.phase);
        } else {
          st.phase += dt; ring(1 - st.phase / w.target);
          const left = Math.ceil(w.target - st.phase);
          if (w.target - st.phase <= 3.05 && left !== st.lastc) { st.lastc = left; beep(880, 0.07); setUi((u) => ({ ...u })); }
          if (st.phase >= w.target) { st.mode = "rest"; st.rest = REST; setUi((u) => ({ ...u, mode: "rest", restNum: REST })); }
        }
      } else if (!st.paused && st.mode === "rest") {
        st.rest -= dt; const r = Math.ceil(st.rest);
        if (r !== st.lastr) { st.lastr = r; setUi((u) => ({ ...u, restNum: r })); if (r <= 3 && r > 0) beep(520, 0.06); }
        if (st.rest <= 0) {
          if (st.idx + 1 >= workout.length) { st.mode = "done"; st.paused = true; setUi((u) => ({ ...u, mode: "done" })); }
          else { st.idx++; st.mode = "work"; st.phase = 0; st.reps = 0; st.lastc = -1; ring(0); setUi({ idx: st.idx, reps: 0, mode: "work", restNum: REST }); }
        }
      }
      const w2 = workout[st.idx];
      const figPhase = st.mode === "rest" ? 0 : (w2.mode === "reps" ? st.phase : st.t);
      frameRef.current = { move: w2.move, phase: figPhase, t: st.t, mode: st.mode, rep: st.reps };
      draw(w2.move, figPhase, st.reps, st.t);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [workout]);

  function toggle() {
    const st = s.current;
    if (st.mode === "ready") { st.mode = "work"; st.phase = 0; st.reps = 0; st.lastc = -1; ring(0); setUi({ idx: 0, reps: 0, mode: "work", restNum: REST }); }
    st.paused = !st.paused; if (!st.paused) beep(440, 0.05);
    setUi((u) => ({ ...u }));
  }
  function skip() { const st = s.current; if (st.mode === "done") return; if (st.mode === "rest") { st.rest = 0; } else { st.mode = "rest"; st.rest = REST; setUi((u) => ({ ...u, mode: "rest", restNum: REST })); } }

  const paused = s.current.paused;
  const done = ui.mode === "done";
  const nextName = ui.idx + 1 < workout.length ? workout[ui.idx + 1].name : null;

  return (
    <div className="card overflow-hidden" style={{ padding: 0 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--brand)" }}>{cur.cat}</p>
          <p className="text-lg font-extrabold leading-tight">{done ? "Klaar!" : cur.name}</p>
        </div>
        <span className="text-xs muted tabular-nums">{Math.min(ui.idx + 1, workout.length)} / {workout.length}</span>
      </div>

      <div className="relative" style={{ background: "var(--bg-subtle)", height: 240, display: "grid", placeItems: "center" }}>
        <canvas ref={canvasRef} width={840} height={440} style={{ width: "100%", height: "100%", display: done || webgl ? "none" : "block" }} />
        {!done && webgl && <Avatar3D frameRef={frameRef} onFail={() => setWebgl(false)} />}
        {!done && cur.videoUrl && ui.mode !== "rest" && (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}><DemoMedia url={cur.videoUrl} /></div>
        )}
        <svg viewBox="0 0 100 100" style={{ position: "absolute", top: 14, right: 14, width: 90, height: 90, display: done ? "none" : "block" }}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border-strong)" strokeWidth="8" />
          <circle ref={ringRef} cx="50" cy="50" r={R} fill="none" stroke={BRAND} strokeWidth="8" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC} transform="rotate(-90 50 50)" />
        </svg>
        {!done && ui.mode !== "rest" && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
            <div className="text-center">
              <div className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{cur.mode === "reps" ? ui.reps : Math.max(0, Math.ceil(cur.target - s.current.phase))}</div>
              <div className="text-[10px] uppercase tracking-wide muted">{cur.mode === "reps" ? `/ ${cur.target} reps` : "seconden"}</div>
            </div>
          </div>
        )}
        {ui.mode === "rest" && !done && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "color-mix(in srgb, var(--bg-subtle) 82%, transparent)" }}>
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-widest muted">Rust</div>
              <div className="text-5xl font-extrabold tabular-nums" style={{ color: AMBER }}>{ui.restNum}</div>
              {nextName && <div className="text-sm font-semibold mt-1">Volgende: {nextName}</div>}
            </div>
          </div>
        )}
        {done && (
          <div className="text-center px-6 py-8">
            <div className="mx-auto w-14 h-14 rounded-full grid place-items-center mb-3" style={{ background: "var(--brand)", color: "#fff" }}><Icon name="check" size={28} /></div>
            <p className="font-extrabold text-lg">Workout voltooid!</p>
            <p className="text-sm muted mt-1">{workout.length} oefeningen · bewaar in je voortgang</p>
            <form action={completeAction} className="mt-4">
              <input type="hidden" name="summary" value="Geleide workout" />
              <input type="hidden" name="rpe" value="7" />
              <button type="submit" className="btn btn-primary">Bewaar &amp; terug naar home</button>
            </form>
          </div>
        )}
      </div>

      {!done && (
        <>
          <div style={{ height: 5, background: "var(--bg-subtle)" }}><div style={{ height: "100%", width: `${(ui.idx / workout.length) * 100}%`, background: "var(--brand)", transition: "width .2s" }} /></div>
          <div className="flex gap-2 p-3">
            <button onClick={toggle} className="btn btn-primary flex-1">{s.current.mode === "ready" ? "▶ Start workout" : paused ? "▶ Hervat" : "❚❚ Pauze"}</button>
            <button onClick={skip} className="btn btn-secondary">Volgende ›</button>
          </div>
        </>
      )}
    </div>
  );
}

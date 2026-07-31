import Link from "next/link";
import { requireMember } from "@/lib/portal-auth";
import { queryOne } from "@/db/client";
import { Icon } from "@/components/icons";
import { WorkoutPlayer, type Exercise } from "./WorkoutPlayer";
import { completeWorkout } from "../actions";

export const dynamic = "force-dynamic";

const BASE: Exercise[] = [
  { name: "Jumping Jacks", cat: "Warming-up", move: "jack", mode: "reps", target: 20, tempo: 0.85 },
  { name: "Squats", cat: "Kracht", move: "squat", mode: "reps", target: 12, tempo: 1.45 },
  { name: "Jab – Cross", cat: "Combat", move: "punch", mode: "reps", target: 20, tempo: 0.62 },
  { name: "Push-ups", cat: "Kracht", move: "pushup", mode: "reps", target: 10, tempo: 1.7 },
  { name: "Shadowbox jab-cross", cat: "Combat", move: "punch", mode: "reps", target: 24, tempo: 0.55 },
  { name: "Plank", cat: "Core", move: "plank", mode: "time", target: 25 },
];

/** Nudge the mix toward the member's training goal. */
function buildWorkout(goal: string | null): Exercise[] {
  if (goal === "fight_camp" || goal === "technique") {
    return [
      { name: "Jumping Jacks", cat: "Warming-up", move: "jack", mode: "reps", target: 20, tempo: 0.8 },
      { name: "Jab – Cross", cat: "Combat", move: "punch", mode: "reps", target: 24, tempo: 0.6 },
      { name: "Squats", cat: "Kracht", move: "squat", mode: "reps", target: 12, tempo: 1.4 },
      { name: "Shadowbox combinaties", cat: "Combat", move: "punch", mode: "reps", target: 30, tempo: 0.5 },
      { name: "Push-ups", cat: "Kracht", move: "pushup", mode: "reps", target: 12, tempo: 1.6 },
      { name: "Plank", cat: "Core", move: "plank", mode: "time", target: 30 },
    ];
  }
  if (goal === "weight_loss") {
    return [
      { name: "Jumping Jacks", cat: "Cardio", move: "jack", mode: "reps", target: 30, tempo: 0.7 },
      { name: "Squats", cat: "Kracht", move: "squat", mode: "reps", target: 15, tempo: 1.3 },
      { name: "Shadowbox tempo", cat: "Cardio", move: "punch", mode: "reps", target: 30, tempo: 0.5 },
      { name: "High tempo jacks", cat: "Cardio", move: "jack", mode: "reps", target: 25, tempo: 0.65 },
      { name: "Plank", cat: "Core", move: "plank", mode: "time", target: 30 },
    ];
  }
  return BASE;
}

export default async function WorkoutPage() {
  const m = await requireMember();
  const plan = await queryOne<{ goal: string | null; name: string }>(
    `SELECT goal, name FROM training_plans WHERE tenant_id=$1 AND member_id=$2 AND status='active' ORDER BY created_at DESC LIMIT 1`,
    [m.tenantId, m.id]
  );
  const workout = buildWorkout(plan?.goal ?? null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/portal" className="btn btn-ghost btn-sm"><Icon name="chevronRight" size={16} className="rotate-180" /> Home</Link>
        <div className="ml-1">
          <h1 className="text-xl font-extrabold leading-tight">Workout van vandaag</h1>
          <p className="text-xs muted">{workout.length} oefeningen · volg het tempo en de reps</p>
        </div>
      </div>

      <WorkoutPlayer workout={workout} completeAction={completeWorkout} />

      <div className="card p-4">
        <p className="text-sm font-semibold mb-1 flex items-center gap-1.5"><Icon name="fire" size={15} className="tprimary" /> Zo werkt het</p>
        <ul className="text-sm muted space-y-1 mt-1">
          <li>De figuur doet elke oefening voor — volg de houding.</li>
          <li>De ring telt het tempo af; bij elke rep hoor je een tik en loopt de teller op.</li>
          <li>Getimede oefeningen (plank) tellen af met een piep in de laatste 3 seconden.</li>
          <li>Na de rust start automatisch de volgende oefening; aan het eind wordt je workout bewaard.</li>
        </ul>
      </div>
    </div>
  );
}

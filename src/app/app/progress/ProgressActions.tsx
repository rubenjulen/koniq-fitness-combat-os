"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { addGoal, logMetric } from "./actions";

type Member = { id: string; first_name: string | null; last_name: string | null };

function memberLabel(m: Member): string {
  return `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "—";
}

export function NewGoalModal({ members }: { members: Member[] }) {
  return (
    <Modal trigger={{ label: "Nieuw doel", icon: "target", variant: "primary" }} title="Nieuw doel">
      <form action={addGoal} className="space-y-3">
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="" disabled>Kies een lid…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{memberLabel(m)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Doel *</label>
          <input name="title" className="input" required placeholder="bv. 5 km hardlopen onder 25 min" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Startwaarde</label><input name="baseline" className="input" placeholder="bv. 30 min" /></div>
          <div><label className="label">Streefwaarde</label><input name="target" className="input" placeholder="bv. 25 min" /></div>
        </div>
        <div>
          <label className="label">Streefdatum</label>
          <input name="target_date" type="date" className="input" />
        </div>
        <div className="flex justify-end pt-1">
          <SubmitButton icon="check">Doel opslaan</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

export function LogMetricModal({ members }: { members: Member[] }) {
  return (
    <Modal trigger={{ label: "Meting loggen", icon: "scan", variant: "secondary" }} title="Lichaamsmeting loggen">
      <form action={logMetric} className="space-y-3">
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="" disabled>Kies een lid…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{memberLabel(m)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Gemeten op</label>
          <input name="measured_on" type="date" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Gewicht (kg)</label><input name="weight" type="number" min="0" step="0.1" className="input" /></div>
          <div><label className="label">Vetpercentage (%)</label><input name="body_fat" type="number" min="0" step="0.1" className="input" /></div>
        </div>
        <div>
          <label className="label">Notitie</label>
          <textarea name="note" className="textarea" rows={2} placeholder="Optionele notitie…" />
        </div>
        <p className="text-xs faint">Metingen zijn privé en alleen zichtbaar voor bevoegde begeleiders.</p>
        <div className="flex justify-end pt-1">
          <SubmitButton icon="check">Meting opslaan</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { awardPromotion, scheduleAssessment } from "./actions";

type Member = { id: string; first_name: string | null; last_name: string | null };
type Rank = { id: string; name: string };
type Coach = { id: string; name: string };

function memberLabel(m: Member): string {
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || "Onbekend lid";
}

export function AwardPromotionModal({ members, ranks, coaches }: { members: Member[]; ranks: Rank[]; coaches: Coach[] }) {
  return (
    <Modal trigger={{ label: "Promotie vastleggen", icon: "trophy", variant: "primary" }} title="Promotie vastleggen">
      <form action={awardPromotion} className="space-y-3">
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="" disabled>Kies lid…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{memberLabel(m)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Rank *</label>
          <select name="rank_id" className="select" required defaultValue="">
            <option value="" disabled>Kies rank…</option>
            {ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Discipline</label>
            <select name="discipline" className="select"><option value="">—</option><option value="muay_thai">Muay Thai</option><option value="kickboxing">Kickboxing</option><option value="boxing">Boxing</option><option value="bjj">BJJ</option><option value="mma">MMA</option></select>
          </div>
          <div>
            <label className="label">Toegekend door</label>
            <select name="promoted_by" className="select"><option value="">—</option>{coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
        </div>
        <div><label className="label">Notitie</label><textarea name="note" className="textarea" rows={2} placeholder="Bijzonderheden bij de promotie…" /></div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Promotie vastleggen</SubmitButton></div>
      </form>
    </Modal>
  );
}

export function ScheduleGradingModal({ members, coaches }: { members: Member[]; coaches: Coach[] }) {
  return (
    <Modal trigger={{ label: "Grading plannen", icon: "clipboard", variant: "secondary" }} title="Grading plannen">
      <form action={scheduleAssessment} className="space-y-3">
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="" disabled>Kies lid…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{memberLabel(m)}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Datum</label><input name="scheduled_for" type="date" className="input" /></div>
          <div>
            <label className="label">Beoordelaar</label>
            <select name="assessor_id" className="select"><option value="">—</option>{coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
        </div>
        <div><label className="label">Notitie</label><textarea name="note" className="textarea" rows={2} placeholder="Onderwerp / verwachtingen…" /></div>
        <p className="text-xs faint">Wordt vastgelegd als geplande grading en verschijnt bij de aankomende assessments.</p>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Grading inplannen</SubmitButton></div>
      </form>
    </Modal>
  );
}

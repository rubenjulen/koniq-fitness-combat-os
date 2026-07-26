"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { generateAiPlan } from "./actions";

type MemberOpt = { id: string; first_name: string; last_name: string; is_minor: boolean };

export function GenerateAiPlanModal({ members }: { members: MemberOpt[] }) {
  return (
    <Modal trigger={{ label: "Genereer AI-plan", icon: "sparkles", variant: "primary" }} title="AI-weekplan genereren">
      <form action={generateAiPlan} className="space-y-3">
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="" disabled>— Kies lid —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}{m.is_minor ? " (jeugd)" : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Doel</label>
          <select name="goal" className="select" defaultValue="general_fitness">
            <option value="general_fitness">Algemene fitness</option>
            <option value="technique">Techniek</option>
            <option value="fight_camp">Fight camp</option>
            <option value="weight_loss">Gewichtsverlies</option>
          </select>
        </div>
        <label className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
          <input type="checkbox" name="medical_flag" value="1" className="mt-0.5" />
          <span>Medische aandachtspunten bekend (blessure, aandoening, herstel)</span>
        </label>
        <p className="text-xs faint">
          Plannen voor minderjarigen of met een medische vlag worden automatisch geblokkeerd en geëscaleerd naar een coach voor menselijke review.
        </p>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Genereer plan</SubmitButton></div>
      </form>
    </Modal>
  );
}

"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createTrainingPlan } from "./actions";

type MemberOpt = { id: string; first_name: string; last_name: string };
type TemplateOpt = { id: string; name: string; goal: string | null };

export function NewTrainingPlanModal({ members, templates }: { members: MemberOpt[]; templates: TemplateOpt[] }) {
  return (
    <Modal trigger={{ label: "Nieuw plan", icon: "plus", variant: "primary" }} title="Nieuw trainingsplan" wide>
      <form action={createTrainingPlan} className="space-y-3">
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="" disabled>— Kies lid —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
        </div>
        <div><label className="label">Naam van het plan *</label><input name="name" className="input" required placeholder="bv. Basis fitness — 4 weken" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Doel</label>
            <select name="goal" className="select" defaultValue="general_fitness">
              <option value="general_fitness">Algemene fitness</option>
              <option value="technique">Techniek</option>
              <option value="fight_camp">Fight camp</option>
              <option value="weight_loss">Gewichtsverlies</option>
            </select>
          </div>
          <div>
            <label className="label">Sjabloon (optioneel)</label>
            <select name="template_id" className="select" defaultValue="">
              <option value="">Geen — vrij opzetten</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Oefeningen (optioneel)</label>
          <textarea name="exercises" className="textarea" rows={3} placeholder="Eén per regel of komma-gescheiden — worden over de trainingsdagen verdeeld. Leeg = standaardweek." />
        </div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Plan aanmaken</SubmitButton></div>
      </form>
    </Modal>
  );
}

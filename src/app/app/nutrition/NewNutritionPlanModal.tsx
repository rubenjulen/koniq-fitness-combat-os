"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createNutritionPlan } from "./actions";

type Member = { id: string; first_name: string | null; last_name: string | null };

function memberLabel(m: Member): string {
  return `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "—";
}

export function NewNutritionPlanModal({ members }: { members: Member[] }) {
  return (
    <Modal trigger={{ label: "Nieuw voedingsplan", icon: "apple", variant: "primary" }} title="Nieuw voedingsplan" wide>
      <form action={createNutritionPlan} className="space-y-3">
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="" disabled>Kies een lid…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{memberLabel(m)}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Doel</label>
            <select name="goal" className="select" defaultValue="maintain">
              <option value="maintain">Onderhoud</option>
              <option value="lose_fat">Vetverlies</option>
              <option value="gain_muscle">Spieropbouw</option>
              <option value="performance">Prestatie</option>
            </select>
          </div>
          <div>
            <label className="label">Stijl</label>
            <select name="style" className="select" defaultValue="balanced">
              <option value="balanced">Gebalanceerd</option>
              <option value="high_protein">Eiwitrijk</option>
              <option value="vegetarian">Vegetarisch</option>
              <option value="low_carb">Koolhydraatarm</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Calorieën (kcal/dag)</label>
          <input name="calories" type="number" min="0" step="10" className="input" placeholder="bv. 2200" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Eiwit (g)</label><input name="protein" type="number" min="0" step="1" className="input" /></div>
          <div><label className="label">Koolhydraten (g)</label><input name="carbs" type="number" min="0" step="1" className="input" /></div>
          <div><label className="label">Vet (g)</label><input name="fat" type="number" min="0" step="1" className="input" /></div>
        </div>
        <div>
          <label className="label">Professionele controle nodig?</label>
          <select name="needs_pro_review" className="select" defaultValue="false">
            <option value="false">Nee</option>
            <option value="true">Ja</option>
          </select>
        </div>
        <div className="flex justify-end pt-1">
          <SubmitButton icon="check">Voedingsplan opslaan</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

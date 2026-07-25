"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createCoach } from "./actions";

export function NewCoachModal() {
  return (
    <Modal trigger={{ label: "Nieuwe coach", icon: "plus", variant: "primary" }} title="Nieuwe coach toevoegen" wide>
      <form action={createCoach} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Naam *</label><input name="name" className="input" required /></div>
          <div>
            <label className="label">Rol</label>
            <select name="role" className="select" defaultValue="coach">
              <option value="head_coach">Head coach</option>
              <option value="coach">Coach</option>
              <option value="assistant">Assistent</option>
              <option value="pt">Personal trainer</option>
              <option value="frontdesk">Frontdesk</option>
            </select>
          </div>
        </div>
        <div><label className="label">Specialiteiten</label><input name="specialties" className="input" placeholder="bv. Muay Thai, boksen, clinch…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">E-mail</label><input name="email" type="email" className="input" /></div>
          <div><label className="label">Telefoon / WhatsApp</label><input name="phone" className="input" placeholder="+597 …" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Dienstverband</label>
            <select name="employment" className="select" defaultValue="employee">
              <option value="employee">Werknemer</option>
              <option value="contractor">Zzp / contractor</option>
              <option value="volunteer">Vrijwilliger</option>
            </select>
          </div>
          <div>
            <label className="label">Vergoedingstype</label>
            <select name="comp_type" className="select" defaultValue="fixed">
              <option value="fixed">Vast</option>
              <option value="per_class">Per les</option>
              <option value="pt_split">PT-verdeling</option>
            </select>
          </div>
          <div><label className="label">Tarief</label><input name="comp_rate" type="number" step="0.01" min="0" className="input" placeholder="0.00" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <SubmitButton icon="check">Coach toevoegen</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

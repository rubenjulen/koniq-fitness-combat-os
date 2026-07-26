"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createCampaign } from "./actions";

export function NewCampaignModal() {
  return (
    <Modal trigger={{ label: "Nieuwe campagne", icon: "plus", variant: "primary" }} title="Nieuwe campagne" wide>
      <form action={createCampaign} className="space-y-3">
        <div><label className="label">Naam *</label><input name="name" className="input" required placeholder="bv. Zomer-actie Muay Thai" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Kanaal</label>
            <select name="channel" className="select" defaultValue="meta">
              <option value="meta">Meta</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
              <option value="referral">Referral</option>
            </select>
          </div>
          <div><label className="label">Budget</label><input name="budget" type="number" step="0.01" min="0" className="input" defaultValue="0" /></div>
        </div>
        <div><label className="label">Doelstelling</label><input name="objective" className="input" placeholder="bv. proeflessen genereren" /></div>
        <div><label className="label">Doelgroep</label><input name="audience" className="input" placeholder="bv. 18-35, Paramaribo" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Startdatum</label><input name="start_date" type="date" className="input" /></div>
          <div><label className="label">Einddatum</label><input name="end_date" type="date" className="input" /></div>
        </div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Campagne starten</SubmitButton></div>
      </form>
    </Modal>
  );
}

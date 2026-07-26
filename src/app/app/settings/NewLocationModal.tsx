"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createLocation } from "./actions";

export function NewLocationModal() {
  return (
    <Modal trigger={{ label: "Nieuwe locatie", icon: "plus", variant: "secondary" }} title="Nieuwe locatie">
      <form action={createLocation} className="space-y-3">
        <div><label className="label">Naam *</label><input name="name" className="input" required placeholder="bv. Hoofdvestiging" /></div>
        <div><label className="label">Adres</label><input name="address" className="input" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">District</label><input name="district" className="input" /></div>
          <div><label className="label">Telefoon</label><input name="phone" className="input" placeholder="+597 …" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Capaciteit</label><input name="capacity" type="number" min={0} className="input" placeholder="aantal personen" /></div>
          <div>
            <label className="label">Hoofdvestiging</label>
            <select name="is_headquarters" className="select" defaultValue="false"><option value="false">Nee</option><option value="true">Ja</option></select>
          </div>
        </div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Locatie toevoegen</SubmitButton></div>
      </form>
    </Modal>
  );
}

"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createEquipment } from "./actions";

export function NewEquipmentModal({ locations }: { locations: { id: string; name: string }[] }) {
  return (
    <Modal trigger={{ label: "Nieuw materiaal", icon: "plus", variant: "primary" }} title="Materiaal registreren">
      <form action={createEquipment} className="space-y-3">
        <div><label className="label">Naam *</label><input name="name" className="input" required placeholder="bv. Bokszak #3" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Categorie</label>
            <select name="category" className="select" defaultValue="bag">
              <option value="bag">Bokszak</option>
              <option value="ring">Ring</option>
              <option value="mat">Mat</option>
              <option value="gloves">Handschoenen</option>
              <option value="weights">Gewichten</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>
          <div>
            <label className="label">Locatie</label>
            <select name="location_id" className="select" defaultValue="">
              <option value="">— Geen —</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">Aanschafdatum</label><input name="purchase_date" type="date" className="input" /></div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Materiaal toevoegen</SubmitButton></div>
      </form>
    </Modal>
  );
}

"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createPackage } from "./actions";

export function NewPackageModal() {
  return (
    <Modal trigger={{ label: "Nieuw pakket", icon: "plus", variant: "primary" }} title="Nieuw pakket aanmaken" wide>
      <form action={createPackage} className="space-y-3">
        <div><label className="label">Naam *</label><input name="name" className="input" required placeholder="bv. Onbeperkt maandabonnement" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select name="type" className="select" defaultValue="membership">
              <option value="membership">Abonnement</option>
              <option value="class_pack">Rittenkaart</option>
              <option value="drop_in">Losse les</option>
              <option value="family">Gezinspakket</option>
              <option value="youth">Jeugd</option>
              <option value="private">Privé / PT</option>
              <option value="competition">Competitie</option>
            </select>
          </div>
          <div>
            <label className="label">Facturatieperiode</label>
            <select name="billing_period" className="select" defaultValue="month">
              <option value="month">Per maand</option>
              <option value="quarter">Per kwartaal</option>
              <option value="year">Per jaar</option>
              <option value="one_off">Eenmalig</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Prijs</label><input name="price" type="number" step="0.01" min="0" className="input" placeholder="0.00" /></div>
          <div><label className="label">Lessen / week</label><input name="classes_per_week" type="number" min="0" className="input" placeholder="optioneel" /></div>
          <div><label className="label">Credits</label><input name="credits" type="number" min="0" className="input" placeholder="optioneel" /></div>
        </div>
        <div>
          <label className="label">Zichtbaar op website</label>
          <select name="is_public" className="select" defaultValue="true">
            <option value="true">Ja — publiek</option>
            <option value="false">Nee — intern</option>
          </select>
        </div>
        <div><label className="label">Omschrijving</label><textarea name="description" className="textarea" rows={2} placeholder="Korte omschrijving van het pakket…" /></div>
        <div className="flex justify-end gap-2 pt-1">
          <SubmitButton icon="check">Pakket aanmaken</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

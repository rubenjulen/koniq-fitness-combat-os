"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createMember } from "./actions";

export function NewMemberModal({ packages }: { packages: { id: string; name: string; price: number }[] }) {
  return (
    <Modal trigger={{ label: "Nieuw lid", icon: "plus", variant: "primary" }} title="Nieuw lid inschrijven" wide>
      <form action={createMember} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Voornaam *</label><input name="first_name" className="input" required /></div>
          <div><label className="label">Achternaam *</label><input name="last_name" className="input" required /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Geboortedatum</label><input name="dob" type="date" className="input" /></div>
          <div>
            <label className="label">Geslacht</label>
            <select name="gender" className="select"><option value="">—</option><option value="m">Man</option><option value="v">Vrouw</option><option value="x">Anders</option></select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Telefoon / WhatsApp</label><input name="phone" className="input" placeholder="+597 …" /></div>
          <div><label className="label">E-mail</label><input name="email" type="email" className="input" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Ervaring</label>
            <select name="experience" className="select"><option value="">—</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
          </div>
          <div>
            <label className="label">Bron</label>
            <select name="source" className="select"><option value="walk_in">Walk-in</option><option value="website">Website</option><option value="meta">Meta / social</option><option value="whatsapp">WhatsApp</option><option value="referral">Referral</option></select>
          </div>
        </div>
        <div><label className="label">Doel</label><input name="goal" className="input" placeholder="fitter worden, zelfverdediging, wedstrijdsport…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Status</label>
            <select name="status" className="select" defaultValue="trial"><option value="trial">Trial</option><option value="active">Actief</option><option value="prospect">Prospect</option></select>
          </div>
          <div>
            <label className="label">Pakket (optioneel)</label>
            <select name="package_id" className="select">
              <option value="">Geen — later koppelen</option>
              {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs faint">Bij een gekozen pakket wordt direct een actief lidmaatschap + eerste factuur aangemaakt.</p>
        <div className="flex justify-end gap-2 pt-1">
          <SubmitButton icon="check">Lid inschrijven</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

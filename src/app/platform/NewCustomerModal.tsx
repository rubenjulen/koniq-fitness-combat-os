"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { EDITIONS } from "@/lib/editions";
import { createCustomer } from "./actions";

export function NewCustomerModal() {
  return (
    <Modal trigger={{ label: "Nieuwe klant", icon: "plus", variant: "primary" }} title="Nieuwe klant (sportschool) aanmaken" wide>
      <form action={createCustomer} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Naam sportschool *</label><input name="name" className="input" required placeholder="bv. Paramaribo Fight Club" /></div>
          <div><label className="label">Slug (subdomein) *</label><input name="slug" className="input" required placeholder="paramaribo-fight-club" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Editie *</label>
            <select name="edition" className="select" defaultValue="starter">
              {EDITIONS.map((e) => <option key={e.key} value={e.key}>{e.name} — ${e.priceMonth}/mnd</option>)}
            </select>
          </div>
          <div>
            <label className="label">Valuta</label>
            <select name="currency" className="select" defaultValue="SRD"><option>SRD</option><option>USD</option><option>EUR</option></select>
          </div>
        </div>
        <div><label className="label">Slogan (optioneel)</label><input name="tagline" className="input" placeholder="Discipline • Kracht • Respect" /></div>
        <div className="pt-2 mt-1 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide faint mb-2">Eerste eigenaar-login</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Naam eigenaar *</label><input name="owner_name" className="input" required /></div>
            <div><label className="label">E-mail *</label><input name="owner_email" type="email" className="input" required placeholder="eigenaar@school.sr" /></div>
          </div>
          <div className="mt-3"><label className="label">Wachtwoord *</label><input name="owner_password" className="input" required minLength={6} placeholder="min. 6 tekens" /></div>
        </div>
        <p className="text-xs faint">Er wordt een tenant aangemaakt met de gekozen editie, de standaardrollen (eigenaar/manager/receptie/coach) en dit eigenaar-account.</p>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Klant aanmaken</SubmitButton></div>
      </form>
    </Modal>
  );
}

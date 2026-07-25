"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { Icon } from "@/components/icons";
import { createLead, advanceLead, convertLead } from "./actions";

const STATUS_OPTS = [
  ["new", "Nieuw"], ["contacted", "Gecontacteerd"], ["trial_booked", "Trial geboekt"],
  ["trial_attended", "Trial gevolgd"], ["offer", "Aanbod"], ["won", "Gewonnen"], ["lost", "Verloren"],
];

export function NewLeadModal() {
  return (
    <Modal trigger={{ label: "Nieuwe lead", icon: "plus", variant: "primary" }} title="Nieuwe lead">
      <form action={createLead} className="space-y-3">
        <div><label className="label">Naam *</label><input name="name" className="input" required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Telefoon / WhatsApp</label><input name="phone" className="input" placeholder="+597 …" /></div>
          <div><label className="label">E-mail</label><input name="email" type="email" className="input" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Bron</label>
            <select name="source" className="select"><option value="walk_in">Walk-in</option><option value="website">Website</option><option value="meta">Meta / social</option><option value="whatsapp">WhatsApp</option><option value="referral">Referral</option><option value="phone">Telefoon</option></select>
          </div>
          <div>
            <label className="label">Discipline</label>
            <select name="discipline" className="select"><option value="">—</option><option value="muay_thai">Muay Thai</option><option value="kickboxing">Kickboxing</option><option value="boxing">Boxing</option><option value="fitness">Fitness</option></select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Leeftijdsgroep</label>
            <select name="age_group" className="select"><option value="adult">Volwassene</option><option value="youth">Jeugd</option></select>
          </div>
          <div><label className="label">Interesse (pakket)</label><input name="package_interest" className="input" placeholder="bv. Onbeperkt Maand" /></div>
        </div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Lead toevoegen</SubmitButton></div>
      </form>
    </Modal>
  );
}

export function LeadRowActions({ leadId, status }: { leadId: string; status: string }) {
  const done = status === "won" || status === "lost";
  return (
    <div className="flex items-center justify-end gap-1.5">
      <form action={advanceLead}>
        <input type="hidden" name="leadId" value={leadId} />
        <select name="status" defaultValue={status} className="select" style={{ padding: "0.3rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}>
          {STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </form>
      {!done && (
        <form action={convertLead}>
          <input type="hidden" name="leadId" value={leadId} />
          <SubmitButton icon="arrowRight" variant="secondary" className="btn-sm" pendingLabel="…">Converteer</SubmitButton>
        </form>
      )}
    </div>
  );
}

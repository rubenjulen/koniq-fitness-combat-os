"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { setMemberStatus, addEmergencyContact } from "../actions";

const STATUS_OPTS: [string, string][] = [
  ["prospect", "Prospect"],
  ["trial", "Trial"],
  ["active", "Actief"],
  ["frozen", "Bevroren"],
  ["overdue", "Achterstallig"],
  ["cancelled", "Opgezegd"],
  ["alumni", "Alumnus"],
];

export function StatusChanger({ memberId, status }: { memberId: string; status: string }) {
  return (
    <form action={setMemberStatus}>
      <input type="hidden" name="memberId" value={memberId} />
      <select
        name="status"
        defaultValue={status}
        className="select"
        style={{ padding: "0.3rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {STATUS_OPTS.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </form>
  );
}

export function AddEmergencyContactModal({ memberId }: { memberId: string }) {
  return (
    <Modal trigger={{ label: "Toevoegen", icon: "plus", variant: "secondary" }} title="Noodcontact toevoegen">
      <form action={addEmergencyContact} className="space-y-3">
        <input type="hidden" name="memberId" value={memberId} />
        <div><label className="label">Naam *</label><input name="name" className="input" required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Relatie</label><input name="relationship" className="input" placeholder="bv. partner, ouder" /></div>
          <div><label className="label">Telefoon</label><input name="phone" className="input" placeholder="+597 …" /></div>
        </div>
        <div><label className="label">Medische notitie</label><textarea name="medical_note" className="textarea" rows={3} placeholder="Allergieën, aandachtspunten…" /></div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Noodcontact opslaan</SubmitButton></div>
      </form>
    </Modal>
  );
}

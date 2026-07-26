"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { addDocument } from "./actions";

type MemberOpt = { id: string; first_name: string; last_name: string };

export function NewDocumentModal({ members }: { members: MemberOpt[] }) {
  return (
    <Modal trigger={{ label: "Nieuw document", icon: "plus", variant: "primary" }} title="Document toevoegen">
      <form action={addDocument} className="space-y-3">
        <div><label className="label">Naam *</label><input name="name" className="input" required placeholder="bv. Waiver 2026 — J. Doe" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Categorie *</label>
            <select name="category" className="select" required defaultValue="waiver">
              <option value="waiver">Waiver</option>
              <option value="contract">Contract</option>
              <option value="medical">Medisch</option>
              <option value="certificate">Certificaat</option>
              <option value="id">ID</option>
              <option value="consent">Toestemming</option>
            </select>
          </div>
          <div><label className="label">Vervaldatum</label><input name="expires_at" type="date" className="input" /></div>
        </div>
        <div>
          <label className="label">Lid (optioneel)</label>
          <select name="member_id" className="select" defaultValue="">
            <option value="">Geen — niet aan lid gekoppeld</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Document opslaan</SubmitButton></div>
      </form>
    </Modal>
  );
}

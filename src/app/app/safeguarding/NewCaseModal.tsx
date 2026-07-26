"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createCase } from "./actions";

type MemberOpt = { id: string; first_name: string; last_name: string };

export function NewCaseModal({ members }: { members: MemberOpt[] }) {
  return (
    <Modal trigger={{ label: "Nieuw dossier", icon: "plus", variant: "primary" }} title="Vertrouwelijk dossier melden">
      <form action={createCase} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type *</label>
            <select name="type" className="select" required defaultValue="">
              <option value="" disabled>— Kies type —</option>
              <option value="bullying">Pesten</option>
              <option value="harassment">Intimidatie</option>
              <option value="misconduct">Wangedrag</option>
              <option value="welfare">Welzijn</option>
            </select>
          </div>
          <div>
            <label className="label">Ernst</label>
            <select name="severity" className="select" defaultValue="medium">
              <option value="low">Laag</option>
              <option value="medium">Middel</option>
              <option value="high">Hoog</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Betrokken lid (optioneel)</label>
          <select name="member_id" className="select" defaultValue="">
            <option value="">Geen — niet aan lid gekoppeld</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Omschrijving *</label>
          <textarea name="description" className="textarea" rows={4} required placeholder="Beschrijf de zorg of het incident zo feitelijk mogelijk." />
        </div>
        <p className="text-xs faint">Het dossier wordt vertrouwelijk aangemaakt en aan jou toegewezen. Toegang wordt vastgelegd in de audit-log.</p>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Dossier aanmaken</SubmitButton></div>
      </form>
    </Modal>
  );
}

"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createRetentionTask } from "./actions";

export function NewTaskModal({ members }: { members: { id: string; first_name: string | null; last_name: string | null }[] }) {
  return (
    <Modal trigger={{ label: "Nieuwe taak", icon: "plus", variant: "primary" }} title="Nieuwe retentietaak">
      <form action={createRetentionTask} className="space-y-3">
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="">— Kies lid —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{[m.first_name, m.last_name].filter(Boolean).join(" ") || "Naamloos lid"}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select name="type" className="select" defaultValue="at_risk">
              <option value="at_risk">At-risk</option>
              <option value="winback">Win-back</option>
              <option value="check_in">Check-in</option>
              <option value="freeze_recovery">Freeze recovery</option>
            </select>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input name="due_date" type="date" className="input" />
          </div>
        </div>
        <div><label className="label">Reden</label><input name="reason" className="input" placeholder="bv. 3 weken geen bezoek" /></div>
        <div><label className="label">Notitie</label><textarea name="note" className="textarea" rows={2} placeholder="Aanpak / afspraak…" /></div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Taak aanmaken</SubmitButton></div>
      </form>
    </Modal>
  );
}

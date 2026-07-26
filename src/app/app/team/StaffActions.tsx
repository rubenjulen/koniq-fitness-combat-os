"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createStaffUser, toggleStaffUser } from "./actions";

export function NewStaffUserModal({ roles }: { roles: { id: string; name: string; key: string }[] }) {
  return (
    <Modal trigger={{ label: "Nieuwe gebruiker", icon: "plus", variant: "primary" }} title="Nieuwe gebruiker">
      <form action={createStaffUser} className="space-y-3">
        <div><label className="label">Naam *</label><input name="name" className="input" required /></div>
        <div><label className="label">E-mail *</label><input name="email" type="email" className="input" required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Wachtwoord *</label><input name="password" type="password" className="input" minLength={6} required placeholder="min. 6 tekens" /></div>
          <div>
            <label className="label">Rol</label>
            <select name="role_id" className="select">
              <option value="">— Geen rol</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs faint">De gebruiker kan hiermee direct inloggen. Rollen bepalen de rechten.</p>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Gebruiker aanmaken</SubmitButton></div>
      </form>
    </Modal>
  );
}

export function StaffToggleButton({ userId, active }: { userId: string; active: boolean }) {
  return (
    <form action={toggleStaffUser}>
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton icon={active ? "lock" : "check"} variant={active ? "ghost" : "secondary"} className="btn-sm" pendingLabel="…">
        {active ? "Deactiveren" : "Activeren"}
      </SubmitButton>
    </form>
  );
}

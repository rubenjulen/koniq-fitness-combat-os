"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { logIncident } from "./actions";

export function LogIncidentModal({ locations, members }: {
  locations: { id: string; name: string }[];
  members: { id: string; first_name: string | null; last_name: string | null }[];
}) {
  return (
    <Modal trigger={{ label: "Incident melden", icon: "alert", variant: "primary" }} title="Incident registreren" wide>
      <form action={logIncident} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select name="type" className="select" defaultValue="injury">
              <option value="injury">Blessure</option>
              <option value="accident">Ongeval</option>
              <option value="near_miss">Bijna-ongeval</option>
              <option value="medical">Medisch</option>
              <option value="emergency">Noodgeval</option>
            </select>
          </div>
          <div>
            <label className="label">Ernst</label>
            <select name="severity" className="select" defaultValue="low">
              <option value="low">Laag</option>
              <option value="medium">Middel</option>
              <option value="high">Hoog</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Lid (optioneel)</label>
            <select name="member_id" className="select" defaultValue="">
              <option value="">— Geen —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{[m.first_name, m.last_name].filter(Boolean).join(" ") || "Naamloos lid"}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Locatie (optioneel)</label>
            <select name="location_id" className="select" defaultValue="">
              <option value="">— Geen —</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">Omschrijving *</label><textarea name="description" className="textarea" rows={3} required placeholder="Wat is er gebeurd?" /></div>
        <div><label className="label">Ondernomen actie</label><textarea name="action_taken" className="textarea" rows={2} placeholder="EHBO, doorverwezen, gestopt met training…" /></div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Incident vastleggen</SubmitButton></div>
      </form>
    </Modal>
  );
}

"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { registerForEvent } from "./actions";

type EventOpt = { id: string; name: string };
type MemberOpt = { id: string; first_name: string; last_name: string };

export function RegisterModal({ events, members }: { events: EventOpt[]; members: MemberOpt[] }) {
  return (
    <Modal trigger={{ label: "Inschrijven", icon: "plus", variant: "primary" }} title="Deelnemer inschrijven">
      <form action={registerForEvent} className="space-y-3">
        <div>
          <label className="label">Event *</label>
          <select name="event_id" className="select" required defaultValue="">
            <option value="" disabled>Kies een event…</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="" disabled>Kies een lid…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Betaald</label>
          <select name="paid" className="select" defaultValue="false">
            <option value="false">Nee</option>
            <option value="true">Ja</option>
          </select>
        </div>
        <div className="flex justify-end pt-1">
          <SubmitButton icon="check">Inschrijven</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

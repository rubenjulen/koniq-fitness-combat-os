"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { sendMessage, createAnnouncement } from "./actions";

type Member = { id: string; first_name: string | null; last_name: string | null };
type Template = { id: string; key: string; name: string };

function memberLabel(m: Member): string {
  return `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "—";
}

export function SendMessageModal({ members, templates }: { members: Member[]; templates: Template[] }) {
  return (
    <Modal trigger={{ label: "Bericht sturen", icon: "chat", variant: "secondary" }} title="Bericht versturen">
      <form action={sendMessage} className="space-y-3">
        <div>
          <label className="label">Lid *</label>
          <select name="member_id" className="select" required defaultValue="">
            <option value="" disabled>Kies een lid…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{memberLabel(m)}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Kanaal</label>
            <select name="channel" className="select" defaultValue="whatsapp">
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
              <option value="in_app">In-app</option>
            </select>
          </div>
          <div>
            <label className="label">Template (optioneel)</label>
            <select name="template_key" className="select" defaultValue="">
              <option value="">Geen template</option>
              {templates.map((tpl) => <option key={tpl.id} value={tpl.key}>{tpl.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Bericht *</label>
          <textarea name="body" className="textarea" rows={4} required placeholder="Typ je bericht…" />
        </div>
        <div className="flex justify-end pt-1">
          <SubmitButton icon="check">Verstuur</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

export function NewAnnouncementModal() {
  return (
    <Modal trigger={{ label: "Aankondiging", icon: "megaphone", variant: "primary" }} title="Nieuwe aankondiging">
      <form action={createAnnouncement} className="space-y-3">
        <div>
          <label className="label">Titel *</label>
          <input name="title" className="input" required placeholder="bv. Feestdagen-rooster" />
        </div>
        <div>
          <label className="label">Segment</label>
          <select name="segment" className="select" defaultValue="all">
            <option value="all">Alle leden</option>
            <option value="youth_parents">Ouders van jeugdleden</option>
            <option value="competition_team">Wedstrijdteam</option>
            <option value="beginners">Beginners</option>
          </select>
        </div>
        <div>
          <label className="label">Bericht *</label>
          <textarea name="body" className="textarea" rows={4} required placeholder="Typ je aankondiging…" />
        </div>
        <div className="flex justify-end pt-1">
          <SubmitButton icon="check">Plaatsen</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

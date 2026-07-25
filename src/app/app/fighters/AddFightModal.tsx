"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { addFight } from "./actions";

type FighterOpt = { id: string; name: string };

export function AddFightModal({ fighters }: { fighters: FighterOpt[] }) {
  return (
    <Modal trigger={{ label: "Partij vastleggen", icon: "fire", variant: "primary" }} title="Partij vastleggen" wide>
      <form action={addFight} className="space-y-3">
        <div>
          <label className="label">Fighter *</label>
          <select name="fighter_id" className="select" required defaultValue="">
            <option value="" disabled>Kies fighter…</option>
            {fighters.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Event</label><input name="event_name" className="input" placeholder="bv. Paramaribo Fight Night" /></div>
          <div><label className="label">Datum</label><input name="fight_date" type="date" className="input" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Discipline</label>
            <select name="discipline" className="select"><option value="">—</option><option value="muay_thai">Muay Thai</option><option value="kickboxing">Kickboxing</option><option value="boxing">Boxing</option><option value="bjj">BJJ</option><option value="mma">MMA</option></select>
          </div>
          <div><label className="label">Tegenstander</label><input name="opponent" className="input" placeholder="Naam tegenstander" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Uitslag</label>
            <select name="result" className="select" defaultValue="win"><option value="win">Winst</option><option value="loss">Verlies</option><option value="draw">Gelijkspel</option><option value="nc">No contest</option></select>
          </div>
          <div>
            <label className="label">Methode</label>
            <select name="method" className="select"><option value="">—</option><option value="ko">KO</option><option value="tko">TKO</option><option value="decision">Beslissing</option><option value="submission">Submission</option></select>
          </div>
        </div>
        <div><label className="label">Notitie</label><textarea name="note" className="textarea" rows={2} placeholder="Verloop, ronden, bijzonderheden…" /></div>
        <p className="text-xs faint">Bij winst, verlies of gelijkspel wordt het record van de fighter automatisch bijgewerkt.</p>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Partij vastleggen</SubmitButton></div>
      </form>
    </Modal>
  );
}

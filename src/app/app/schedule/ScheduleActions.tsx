"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createClass, createClassType } from "./actions";

const WEEKDAY_OPTS: [string, string][] = [
  ["1", "Maandag"], ["2", "Dinsdag"], ["3", "Woensdag"], ["4", "Donderdag"],
  ["5", "Vrijdag"], ["6", "Zaterdag"], ["7", "Zondag"],
];

export function NewClassModal({
  classTypes,
  coaches,
  locations,
}: {
  classTypes: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}) {
  return (
    <Modal trigger={{ label: "Nieuwe les", icon: "plus", variant: "primary" }} title="Nieuwe les inplannen" wide>
      <form action={createClass} className="space-y-3">
        <div><label className="label">Titel *</label><input name="title" className="input" required placeholder="bv. Muay Thai Basis" /></div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Weekdag</label>
            <select name="weekday" className="select" defaultValue="1">
              {WEEKDAY_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div><label className="label">Starttijd</label><input name="start_time" type="time" className="input" /></div>
          <div><label className="label">Eindtijd</label><input name="end_time" type="time" className="input" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Lesvorm</label>
            <select name="class_type_id" className="select">
              <option value="">— Geen</option>
              {classTypes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Coach</label>
            <select name="coach_id" className="select">
              <option value="">— Geen</option>
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Locatie</label>
            <select name="location_id" className="select">
              <option value="">— Geen</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div><label className="label">Capaciteit</label><input name="capacity" type="number" min="0" className="input" defaultValue={20} /></div>
          <div>
            <label className="label">Sparring</label>
            <select name="is_sparring" className="select" defaultValue="false">
              <option value="false">Nee</option>
              <option value="true">Ja</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Les inplannen</SubmitButton></div>
      </form>
    </Modal>
  );
}

export function NewClassTypeModal() {
  return (
    <Modal trigger={{ label: "Nieuwe lesvorm", icon: "belt", variant: "secondary" }} title="Nieuwe lesvorm">
      <form action={createClassType} className="space-y-3">
        <div><label className="label">Naam *</label><input name="name" className="input" required placeholder="bv. Kickboxing Advanced" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Discipline</label>
            <select name="discipline" className="select">
              <option value="">—</option>
              <option value="muay_thai">Muay Thai</option>
              <option value="kickboxing">Kickboxing</option>
              <option value="boxing">Boxing</option>
              <option value="bjj">BJJ</option>
              <option value="fitness">Fitness</option>
              <option value="conditioning">Conditioning</option>
            </select>
          </div>
          <div>
            <label className="label">Doelgroep</label>
            <select name="age_group" className="select" defaultValue="all">
              <option value="all">Iedereen</option>
              <option value="youth">Jeugd</option>
              <option value="adult">Volwassenen</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Niveau</label><input name="level" className="input" placeholder="beginner…" /></div>
          <div>
            <label className="label">Intensiteit</label>
            <select name="intensity" className="select" defaultValue="medium">
              <option value="low">Laag</option>
              <option value="medium">Middel</option>
              <option value="high">Hoog</option>
            </select>
          </div>
          <div><label className="label">Kleur</label><input name="color" type="text" className="input" placeholder="#ef4444" /></div>
        </div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Lesvorm opslaan</SubmitButton></div>
      </form>
    </Modal>
  );
}

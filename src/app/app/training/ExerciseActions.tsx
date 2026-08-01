"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { Icon } from "@/components/icons";
import { updateExercise, createExercise } from "./actions";

export function ExerciseVideoModal({ exercise }: { exercise: { id: string; name: string; video_url: string | null; instructions: string | null; safety_notes: string | null } }) {
  const has = !!exercise.video_url;
  return (
    <Modal trigger={{ label: has ? "Video" : "Video koppelen", icon: has ? "eye" : "camera", variant: "ghost" }} title={`Demo — ${exercise.name}`}>
      <form action={updateExercise} className="space-y-3">
        <input type="hidden" name="exerciseId" value={exercise.id} />
        <div>
          <label className="label">Video-URL (YouTube, Vimeo of directe .mp4)</label>
          <input name="video_url" className="input" defaultValue={exercise.video_url ?? ""} placeholder="https://youtube.com/watch?v=… of https://…/demo.mp4" />
          <p className="text-xs faint mt-1">Leden zien deze video in de workout-speler i.p.v. de standaardanimatie.</p>
        </div>
        <div><label className="label">Instructies</label><textarea name="instructions" className="textarea" rows={2} defaultValue={exercise.instructions ?? ""} placeholder="Korte uitleg van de uitvoering…" /></div>
        <div><label className="label">Veiligheidsnotitie (optioneel)</label><input name="safety_notes" className="input" defaultValue={exercise.safety_notes ?? ""} placeholder="bv. geen zware belasting bij knieklachten" /></div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Opslaan</SubmitButton></div>
      </form>
    </Modal>
  );
}

export function NewExerciseModal() {
  return (
    <Modal trigger={{ label: "Nieuwe oefening", icon: "plus", variant: "primary" }} title="Nieuwe oefening" wide>
      <form action={createExercise} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Naam *</label><input name="name" className="input" required placeholder="bv. Teep (push kick)" /></div>
          <div>
            <label className="label">Categorie</label>
            <select name="category" className="select" defaultValue="technique">
              <option value="combat_drill">Combat drill</option><option value="strength">Kracht</option><option value="conditioning">Conditie</option>
              <option value="mobility">Mobiliteit</option><option value="recovery">Herstel</option><option value="technique">Techniek</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Materiaal</label>
            <select name="equipment" className="select"><option value="">Geen</option><option value="bag">Bokszak</option><option value="pads">Pads</option><option value="gloves">Handschoenen</option><option value="weights">Gewichten</option><option value="bands">Elastieken</option></select>
          </div>
          <div>
            <label className="label">Niveau</label>
            <select name="level" className="select"><option value="beginner">Beginner</option><option value="intermediate">Gevorderd</option><option value="advanced">Vergevorderd</option></select>
          </div>
        </div>
        <div><label className="label">Demo-video-URL (optioneel)</label><input name="video_url" className="input" placeholder="https://youtube.com/… of https://…/demo.mp4" /></div>
        <div><label className="label">Instructies</label><textarea name="instructions" className="textarea" rows={2} placeholder="Korte uitleg…" /></div>
        <div><label className="label">Veiligheidsnotitie (optioneel)</label><input name="safety_notes" className="input" /></div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Oefening toevoegen</SubmitButton></div>
      </form>
    </Modal>
  );
}

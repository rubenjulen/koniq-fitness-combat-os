"use client";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/FormControls";
import { createPage, togglePagePublished } from "./actions";

export function NewPageModal() {
  return (
    <Modal trigger={{ label: "Nieuwe pagina", icon: "plus", variant: "primary" }} title="Nieuwe pagina" wide>
      <form action={createPage} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Titel *</label><input name="title" className="input" required placeholder="bv. Over ons" /></div>
          <div><label className="label">Slug *</label><input name="slug" className="input" required placeholder="over-ons" /></div>
        </div>
        <div><label className="label">Inhoud</label><textarea name="body" className="textarea" rows={6} placeholder="Paginatekst…" /></div>
        <div>
          <label className="label">Publiceren</label>
          <select name="published" className="select" defaultValue="false">
            <option value="false">Nee — concept</option>
            <option value="true">Ja — direct publiceren</option>
          </select>
        </div>
        <div className="flex justify-end pt-1"><SubmitButton icon="check">Pagina opslaan</SubmitButton></div>
      </form>
    </Modal>
  );
}

export function PagePublishToggle({ pageId, published }: { pageId: string; published: boolean }) {
  return (
    <form action={togglePagePublished} className="inline-flex justify-end">
      <input type="hidden" name="pageId" value={pageId} />
      <SubmitButton
        icon={published ? "eye" : "check"}
        variant={published ? "ghost" : "secondary"}
        className="btn-sm"
        pendingLabel="…"
      >
        {published ? "Depubliceren" : "Publiceren"}
      </SubmitButton>
    </form>
  );
}

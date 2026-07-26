"use client";
import { SubmitButton } from "@/components/FormControls";
import { EDITIONS } from "@/lib/editions";
import { setTenantEdition, setTenantStatus, impersonateTenant } from "./actions";

export function EditionSelect({ tenantId, edition }: { tenantId: string; edition: string }) {
  return (
    <form action={setTenantEdition}>
      <input type="hidden" name="tenantId" value={tenantId} />
      <select name="edition" defaultValue={edition} className="select" style={{ padding: "0.3rem 0.5rem", fontSize: "0.82rem", width: "auto" }}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}>
        {EDITIONS.map((ed) => <option key={ed.key} value={ed.key}>{ed.name}</option>)}
      </select>
    </form>
  );
}

export function CustomerActions({ tenantId, status }: { tenantId: string; status: string }) {
  const suspended = status === "suspended";
  return (
    <div className="flex items-center justify-end gap-1.5">
      <form action={impersonateTenant}>
        <input type="hidden" name="tenantId" value={tenantId} />
        <SubmitButton icon="eye" variant="secondary" className="btn-sm" pendingLabel="…">Open</SubmitButton>
      </form>
      <form action={setTenantStatus}>
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="status" value={suspended ? "active" : "suspended"} />
        <SubmitButton icon={suspended ? "check" : "lock"} variant={suspended ? "ghost" : "ghost"} className="btn-sm" pendingLabel="…">
          {suspended ? "Activeren" : "Schorsen"}
        </SubmitButton>
      </form>
    </div>
  );
}

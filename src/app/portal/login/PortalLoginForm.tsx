"use client";
import { useActionState } from "react";
import { memberLoginAction } from "../../(auth)/portal-actions";
import { Icon } from "@/components/icons";

export function PortalLoginForm() {
  const [state, action, pending] = useActionState(memberLoginAction, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="input" defaultValue="jason@example.sr" required autoComplete="username" />
      </div>
      <div>
        <label className="label" htmlFor="password">Wachtwoord</label>
        <input id="password" name="password" type="password" className="input" defaultValue="demo12345" required autoComplete="current-password" />
      </div>
      {state?.error && <p className="text-sm flex items-center gap-1.5" style={{ color: "#dc2626" }}><Icon name="alert" size={15} />{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Bezig…" : "Inloggen"}</button>
    </form>
  );
}

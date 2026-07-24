"use client";
import { useActionState } from "react";
import { loginAction } from "../(auth)/actions";
import { Icon } from "@/components/icons";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="input" placeholder="owner@demo.koniq" defaultValue="owner@demo.koniq" required autoComplete="username" />
      </div>
      <div>
        <label className="label" htmlFor="password">Wachtwoord</label>
        <input id="password" name="password" type="password" className="input" placeholder="••••••••" defaultValue="demo12345" required autoComplete="current-password" />
      </div>
      {state?.error && (
        <p className="text-sm flex items-center gap-1.5" style={{ color: "#dc2626" }}><Icon name="alert" size={15} />{state.error}</p>
      )}
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Bezig…" : "Inloggen"}
      </button>
    </form>
  );
}

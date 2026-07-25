import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoFull } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const s = await getSession();
  if (s?.tenantId) redirect("/app");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 combat-bg">
        <LogoFull size={30} />
        <div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight" style={{ color: "#fff", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>
            Eén member.<br />Eén platform.<br /><span style={{ color: "#fb7185" }}>Volledige controle.</span>
          </h1>
          <p className="mt-4 max-w-sm" style={{ color: "rgba(244,238,242,0.78)" }}>
            Van eerste lead tot zwarte band: leden, betalingen, agenda, attendance, curriculum, fighters en coaching in één systeem.
          </p>
        </div>
        <p className="text-xs" style={{ color: "rgba(244,238,242,0.5)" }}>KoniQ Fitness &amp; Combat Sports OS · Suriname</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><LogoFull size={26} /></div>
          <h2 className="text-xl font-bold mb-1">Inloggen</h2>
          <p className="text-sm muted mb-6">Log in op het beheerplatform van je sportschool.</p>
          <LoginForm />
          <div className="mt-6 p-3 rounded-lg text-xs muted" style={{ background: "var(--bg-subtle)" }}>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Demo-toegang</p>
            <p>owner@demo.koniq · receptie@demo.koniq · coach@demo.koniq</p>
            <p>Wachtwoord: <code>demo12345</code></p>
          </div>
          <p className="mt-6 text-sm muted text-center">
            <Link href="/" className="link">&larr; Terug naar de website</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

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
          <div className="mt-6 card p-3.5">
            <p className="text-xs font-semibold faint uppercase tracking-wide mb-2">Demo-accounts · wachtwoord <code>demo12345</code></p>
            <div className="space-y-1">
              {[
                ["admin@koniq.app", "KoniQ platform-admin"],
                ["owner@demo.koniq", "Ravi — Eigenaar (klant)"],
                ["receptie@demo.koniq", "Priya — Receptie"],
                ["coach@demo.koniq", "Kenji — Coach"],
              ].map(([email, role]) => (
                <div key={email} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs">{email}</span>
                  <span className="faint text-xs">{role}</span>
                </div>
              ))}
            </div>
            <div className="mt-2.5 pt-2.5 border-t text-xs muted" style={{ borderColor: "var(--border)" }}>
              Lid/klant-app? Log in via de <Link href="/portal/login" className="link">member-app →</Link> (bv. <span className="font-mono">jason@example.sr</span>)
            </div>
          </div>
          <p className="mt-6 text-sm muted text-center">
            <Link href="/" className="link">&larr; Terug naar de website</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/portal-auth";
import { LogoFull } from "@/components/Logo";
import { PortalLoginForm } from "./PortalLoginForm";

export const dynamic = "force-dynamic";

export default async function PortalLogin() {
  if (await getMemberSession()) redirect("/portal");
  return (
    <div className="min-h-screen flex items-center justify-center p-6 hero-grad">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center"><LogoFull size={28} subtitle="Member app" /></div>
        <div className="card p-6">
          <h1 className="text-xl font-bold mb-1">Welkom terug 🥊</h1>
          <p className="text-sm muted mb-5">Log in op je member app.</p>
          <PortalLoginForm />
          <div className="mt-5 p-3 rounded-lg text-xs muted" style={{ background: "var(--bg-subtle)" }}>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Demo</p>
            <p>jason@example.sr · sanne@example.sr · devon@example.sr</p>
            <p>Wachtwoord: <code>demo12345</code></p>
          </div>
        </div>
        <p className="mt-5 text-sm muted text-center"><Link href="/" className="link">&larr; Naar de website</Link></p>
      </div>
    </div>
  );
}

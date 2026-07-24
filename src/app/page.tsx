import Link from "next/link";
import { LogoFull } from "@/components/Logo";
import { Icon } from "@/components/icons";
import { EDITIONS, FEATURES, PACK_META, type PackKey } from "@/lib/editions";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

const chain = ["Acquire", "Trial", "Register", "Screen", "Package", "Pay", "Book", "Check-In", "Train", "Progress", "Compete", "Retain", "Renew"];

const pillars = [
  { icon: "users", title: "Member 360", body: "Eén lid, één account, één betaal- en attendancehistorie. Family- en guardian-accounts inbegrepen." },
  { icon: "belt", title: "Combat curriculum", body: "Techniekbibliotheek, skill sign-off, ranks/prajioud, sparring readiness en promoties." },
  { icon: "trophy", title: "Fighters & competitie", body: "Fighterprofielen, weight class, fight record, medische documenten en corner team." },
  { icon: "sparkles", title: "AI Coach met guardrails", body: "Adaptieve weekplannen uit een goedgekeurde oefenbibliotheek — met human override en veiligheidsregels." },
  { icon: "coins", title: "Betalingen voor Suriname", body: "Cash, banktransfer, wallet (Mopé) en online via adapters. Dunning, reconciliation en family billing." },
  { icon: "shield", title: "Veilig & compliant", body: "Health screening (PAR-Q+), safeguarding voor jeugd, en enterprise security (NIST/OWASP/ISO)." },
];

export default function Landing() {
  return (
    <div>
      {/* nav */}
      <header className="sticky top-0 z-20 border-b" style={{ background: "color-mix(in srgb, var(--bg) 85%, transparent)", backdropFilter: "blur(10px)" }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <LogoFull size={26} />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium muted">
            <a href="#product" className="hover:text-[var(--text)]">Product</a>
            <a href="#modules" className="hover:text-[var(--text)]">Modules</a>
            <a href="#pricing" className="hover:text-[var(--text)]">Edities</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/portal" className="btn btn-ghost btn-sm hidden sm:inline-flex">Member app</Link>
            <Link href="/login" className="btn btn-primary btn-sm">Inloggen</Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="hero-grad">
        <div className="max-w-6xl mx-auto px-5 py-20 lg:py-28 text-center">
          <span className="badge mb-5" style={{ background: "var(--brand-soft)", color: "var(--brand)", borderColor: "transparent" }}>
            <Icon name="fire" size={13} /> Voor kickboks-, Muay Thai- & fitnessscholen in Suriname
          </span>
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] max-w-4xl mx-auto">
            Eén platform voor je hele sportschool.<br /><span className="tprimary">Van eerste lead tot zwarte band.</span>
          </h1>
          <p className="text-lg muted mt-6 max-w-2xl mx-auto">
            Geen losse apps meer voor agenda, betalingen, workouts en social media. Website, CRM, leden, betalingen,
            attendance, curriculum, fighters, coaching en AI — rond één member-core.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href="/login" className="btn btn-primary">Bekijk de demo <Icon name="arrowRight" size={16} /></Link>
            <a href="#pricing" className="btn btn-secondary">Edities & prijzen</a>
          </div>
          {/* value chain */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {chain.map((c, i) => (
              <span key={c} className="inline-flex items-center gap-2">
                <span className="badge">{c}</span>
                {i < chain.length - 1 && <Icon name="chevronRight" size={13} className="faint" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* pillars */}
      <section id="product" className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="text-3xl font-bold text-center">Gebouwd voor de vechtsport- en fitnessbranche</h2>
        <p className="muted text-center mt-2 max-w-2xl mx-auto">Niet zomaar ledenadministratie — een volwaardig operating platform.</p>
        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {pillars.map((p) => (
            <div key={p.title} className="card p-6">
              <div className="w-11 h-11 rounded-xl grid place-items-center mb-3" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                <Icon name={p.icon} size={22} />
              </div>
              <h3 className="font-bold text-lg">{p.title}</h3>
              <p className="text-sm muted mt-1.5">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* modules by pack */}
      <section id="modules" className="border-y" style={{ background: "var(--bg-elevated)" }}>
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-bold text-center">33 modules, logisch opgedeeld</h2>
          <p className="muted text-center mt-2 max-w-2xl mx-auto">Start klein en groei mee — elke module is aan- en uit te zetten per klant.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mt-10">
            {(["starter", "pro", "combat", "performance", "enterprise"] as PackKey[]).map((pack) => {
              const meta = PACK_META[pack];
              const items = FEATURES.filter((f) => f.pack === pack);
              return (
                <div key={pack} className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
                    <h3 className="font-bold">{meta.label}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((f) => (
                      <li key={f.key} className="flex items-start gap-1.5 text-sm muted">
                        <Icon name="check" size={14} style={{ color: meta.color, marginTop: 3 }} /> {f.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* pricing / editions */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="text-3xl font-bold text-center">Kies de editie die je club nu past</h2>
        <p className="muted text-center mt-2 max-w-2xl mx-auto">Een kleine kickboksschool stapt in zonder enterprisecomplexiteit; dezelfde technologie schaalt later mee naar meerdere vestigingen.</p>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mt-10 items-stretch">
          {EDITIONS.map((e, i) => {
            const featured = e.key === "combat";
            return (
              <div key={e.key} className="card p-5 flex flex-col" style={featured ? { borderColor: "var(--brand)", boxShadow: "0 0 0 2px var(--ring)" } : {}}>
                {featured && <span className="badge mb-2 self-start" style={{ background: "var(--brand-soft)", color: "var(--brand)", borderColor: "transparent" }}>Populair</span>}
                <h3 className="font-bold text-lg">{e.name}</h3>
                <p className="text-xs muted mt-1 min-h-[48px]">{e.tagline}</p>
                <p className="text-2xl font-extrabold mt-3">{money(e.priceMonth, "USD")}<span className="text-sm faint font-normal">/mnd</span></p>
                <div className="mt-3 flex flex-wrap gap-1 mb-4">
                  {e.packs.map((p) => <span key={p} className="badge" style={{ fontSize: 10, background: `${PACK_META[p].color}1a`, color: PACK_META[p].color, borderColor: "transparent" }}>{PACK_META[p].label}</span>)}
                </div>
                <Link href="/login" className={`btn ${featured ? "btn-primary" : "btn-secondary"} mt-auto w-full`}>Start</Link>
                {i === 0 && <p className="text-[11px] faint mt-2 text-center">Indicatieve prijs in USD</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* motto / CTA */}
      <section className="border-t" style={{ background: "var(--bg-elevated)" }}>
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <Icon name="belt" size={30} className="tprimary mx-auto" />
          <p className="text-2xl lg:text-3xl font-bold mt-4 leading-snug">
            &ldquo;Eén member. Eén account. Eén betaalhistorie. Eén trainings- en progressieprofiel.
            <span className="tprimary"> Eén platform voor de volledige sportschool.</span>&rdquo;
          </p>
          <p className="muted mt-4 font-semibold uppercase tracking-wider text-sm">KoniQ — in control, van mat tot management.</p>
          <div className="mt-8"><Link href="/login" className="btn btn-primary">Bekijk de demo <Icon name="arrowRight" size={16} /></Link></div>
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm muted">
          <LogoFull size={22} />
          <p>© {new Date().getFullYear()} KoniQ · Fitness &amp; Combat Sports OS · Suriname</p>
        </div>
      </footer>
    </div>
  );
}

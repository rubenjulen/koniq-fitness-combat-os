import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, Section, InfoRow, FeatureLocked } from "@/components/ui";
import { edition, FEATURE_KEYS } from "@/lib/editions";
import { EditionManager } from "./EditionManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await guard({ cap: "settings.read" });
  if (!user.ok) return <FeatureLocked feature="Instellingen" />;

  const rows = await query<{ feature_key: string; enabled: boolean }>(
    `SELECT feature_key, enabled FROM tenant_features WHERE tenant_id=$1`, [user.tenantId]
  );
  const explicit = new Map(rows.map((r) => [r.feature_key, r.enabled]));
  const editionDefaults = new Set(edition(user.tenant.planKey).packs.flatMap(() => [] as string[]));
  // effective enabled set (same precedence as entitlements.loadFeatures)
  const enabled = FEATURE_KEYS.filter((k) => user.features.has(k));
  void editionDefaults;

  const ed = edition(user.tenant.planKey);
  const brand = user.tenant.brand as { tagline?: string };

  return (
    <>
      <PageHeader title="Instellingen" subtitle="Edities, pakketten en clubinstellingen" icon="settings" />

      <Section title="Edities & pakketten">
        <p className="text-sm muted mb-4 max-w-3xl">
          Het platform is opgedeeld in vijf commerciële edities. De klant betaalt voor de gekozen editie; hieronder zet je precies aan wat is inbegrepen.
          Modules kunnen daarna per stuk worden bij- of afgeschakeld.
        </p>
        <EditionManager current={ed.key} enabled={enabled} />
      </Section>

      <Section title="Club & branding">
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold mb-3">Organisatie</h3>
            <InfoRow label="Naam">{user.tenant.name}</InfoRow>
            <InfoRow label="Editie">{ed.name}</InfoRow>
            <InfoRow label="Valuta">{user.tenant.currency}</InfoRow>
            <InfoRow label="Tijdzone">{user.tenant.timezone}</InfoRow>
            <InfoRow label="Slogan">{brand?.tagline ?? "—"}</InfoRow>
          </Card>
          <Card>
            <h3 className="font-semibold mb-3">Actieve modules</h3>
            <p className="text-3xl font-extrabold">{enabled.length}<span className="text-base faint font-normal"> / {FEATURE_KEYS.length}</span></p>
            <p className="text-sm muted mt-1">modules ingeschakeld voor deze tenant.</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {enabled.slice(0, 24).map((f) => <span key={f} className="badge">{f}</span>)}
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}

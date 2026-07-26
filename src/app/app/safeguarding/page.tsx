import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, Progress, InfoRow, FeatureLocked } from "@/components/ui";
import { dateNL, fullName, titleCase } from "@/lib/format";
import { Icon } from "@/components/icons";
import { can } from "@/lib/rbac";
import { NewCaseModal } from "./NewCaseModal";

export const dynamic = "force-dynamic";

type CaseRow = {
  id: string;
  type: string;
  severity: string | null;
  status: string;
  confidential: boolean;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  assigned_name: string | null;
};

type CertRow = {
  id: string;
  name: string;
  expires_at: string | null;
  coach_name: string | null;
};

const SEVERITY_TONE: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  low: "slate",
  medium: "amber",
  high: "red",
};

const TYPE_TONE: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  bullying: "amber",
  harassment: "red",
  misconduct: "red",
  welfare: "blue",
};

/** Mask a member name to initials for confidential cases. */
function maskInitials(first?: string | null, last?: string | null): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "??";
}

export default async function SafeguardingPage() {
  const user = await guard({ feature: "safeguarding", cap: "safeguarding.read" });
  if (!user.ok) return <FeatureLocked feature="Safeguarding" pack="enterprise" />;
  const t = user.tenantId;
  const canWrite = can(user, "safeguarding.write");

  const [cases, certs, kpiRows, consentRows, memberOpts] = await Promise.all([
    query<CaseRow>(
      `SELECT sc.id, sc.type, sc.severity, sc.status, sc.confidential, sc.created_at,
              m.first_name, m.last_name,
              u.name AS assigned_name
         FROM safeguarding_cases sc
         LEFT JOIN members m ON m.id = sc.member_id AND m.tenant_id = $1
         LEFT JOIN users u ON u.id = sc.assigned_to AND u.tenant_id = $1
        WHERE sc.tenant_id = $1
        ORDER BY (sc.status <> 'resolved') DESC, sc.created_at DESC`,
      [t]
    ),
    query<CertRow>(
      `SELECT cq.id, cq.name, cq.expires_at, c.name AS coach_name
         FROM coach_qualifications cq
         JOIN coaches c ON c.id = cq.coach_id AND c.tenant_id = $1
        WHERE cq.tenant_id = $1 AND cq.name ILIKE '%safeguard%'
          AND cq.expires_at < CURRENT_DATE + INTERVAL '60 days'
        ORDER BY cq.expires_at NULLS LAST`,
      [t]
    ),
    query<{
      open_cases: number;
      confidential_cases: number;
      minors: number;
      consents_missing: number;
    }>(
      `SELECT
         (SELECT count(*)::int FROM safeguarding_cases WHERE tenant_id = $1 AND status <> 'resolved') AS open_cases,
         (SELECT count(*)::int FROM safeguarding_cases WHERE tenant_id = $1 AND confidential) AS confidential_cases,
         (SELECT count(*)::int FROM members WHERE tenant_id = $1 AND is_minor) AS minors,
         (SELECT count(*)::int FROM members m WHERE m.tenant_id = $1 AND m.is_minor
            AND NOT EXISTS (SELECT 1 FROM consents c WHERE c.member_id = m.id AND c.tenant_id = $1
                              AND c.type = 'guardian_consent' AND c.granted)) AS consents_missing`,
      [t]
    ),
    query<{ guardian_granted: number; coc_granted: number; members_total: number }>(
      `SELECT
         (SELECT count(DISTINCT member_id)::int FROM consents
            WHERE tenant_id = $1 AND type = 'guardian_consent' AND granted) AS guardian_granted,
         (SELECT count(DISTINCT member_id)::int FROM consents
            WHERE tenant_id = $1 AND type = 'code_of_conduct' AND granted) AS coc_granted,
         (SELECT count(*)::int FROM members WHERE tenant_id = $1) AS members_total`,
      [t]
    ),
    query<{ id: string; first_name: string; last_name: string }>(
      `SELECT id, first_name, last_name FROM members WHERE tenant_id = $1 ORDER BY first_name, last_name`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { open_cases: 0, confidential_cases: 0, minors: 0, consents_missing: 0 };
  const c = consentRows[0] ?? { guardian_granted: 0, coc_granted: 0, members_total: 0 };
  const guardianPct = k.minors > 0 ? (c.guardian_granted / k.minors) * 100 : 100;
  const cocPct = c.members_total > 0 ? (c.coc_granted / c.members_total) * 100 : 0;

  return (
    <>
      <PageHeader title="Safeguarding" subtitle="Bescherming van jeugdleden — vertrouwelijk" icon="shield" actions={canWrite ? <NewCaseModal members={memberOpts} /> : undefined} />

      <Card className="mb-6" >
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: "rgba(239,68,68,.12)", color: "#dc2626" }}>
            <Icon name="lock" size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Vertrouwelijk — toegang beperkt</p>
            <p className="text-sm muted mt-0.5">
              Deze module bevat gevoelige informatie over minderjarigen. Toegang is beperkt tot bevoegde rollen en elke
              raadpleging wordt vastgelegd in de audit-log. Namen van vertrouwelijke dossiers worden gemaskeerd tot initialen.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open dossiers" value={k.open_cases} icon="clipboard" tone={k.open_cases > 0 ? "red" : "slate"} />
        <StatCard label="Vertrouwelijke dossiers" value={k.confidential_cases} icon="lock" tone="indigo" />
        <StatCard label="Jeugdleden" value={k.minors} icon="heart" tone="purple" sub="minderjarig" />
        <StatCard label="Consents ontbreken" value={k.consents_missing} icon="alert" tone={k.consents_missing > 0 ? "amber" : "slate"} sub="ouderlijke toestemming" />
      </div>

      <Section title="Dossiers">
        {cases.length === 0 ? (
          <EmptyState icon="shield" title="Geen dossiers" subtitle="Meld een zorg of incident vertrouwelijk aan de safeguarding lead." />
        ) : (
          <DataTable head={<><th>Betrokkene</th><th>Type</th><th>Ernst</th><th>Status</th><th>Toegewezen</th><th className="text-right">Aangemaakt</th></>}>
            {cases.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.confidential ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={maskInitials(row.first_name, row.last_name)} size={30} />
                      <span className="font-medium tabular-nums">{maskInitials(row.first_name, row.last_name)}</span>
                      <Icon name="lock" size={13} style={{ color: "var(--text-faint)" }} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={fullName(row)} size={30} />
                      <span className="font-medium">{fullName(row)}</span>
                    </div>
                  )}
                </td>
                <td><Badge tone={TYPE_TONE[row.type] ?? "slate"}>{titleCase(row.type)}</Badge></td>
                <td>{row.severity ? <Badge tone={SEVERITY_TONE[row.severity] ?? "slate"}>{titleCase(row.severity)}</Badge> : <span className="faint">—</span>}</td>
                <td><StatusBadge status={row.status} /></td>
                <td className="muted text-sm">{row.assigned_name ?? <span className="faint">Niet toegewezen</span>}</td>
                <td className="text-right faint text-sm">{dateNL(row.created_at)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Toestemmingen">
          <Card>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm muted">Ouderlijke toestemming (jeugd)</span>
                <span className="text-sm font-semibold tabular-nums">{c.guardian_granted} / {k.minors}</span>
              </div>
              <Progress value={guardianPct} tone={guardianPct >= 90 ? "green" : guardianPct >= 60 ? "amber" : "red"} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm muted">Gedragscode geaccepteerd (alle leden)</span>
                <span className="text-sm font-semibold tabular-nums">{c.coc_granted} / {c.members_total}</span>
              </div>
              <Progress value={cocPct} tone={cocPct >= 90 ? "green" : cocPct >= 60 ? "amber" : "red"} />
            </div>
            <div className="mt-4">
              <InfoRow label="Jeugdleden zonder toestemming">
                <span style={{ color: k.consents_missing > 0 ? "#b45309" : "var(--text)" }}>{k.consents_missing}</span>
              </InfoRow>
            </div>
          </Card>
        </Section>

        <Section title="Safeguarding-certificaten (verlopen binnen 60 dagen)">
          {certs.length === 0 ? (
            <Card><p className="text-sm muted">Geen aflopende safeguarding-certificaten. Alle staf is actueel gecertificeerd.</p></Card>
          ) : (
            <DataTable head={<><th>Coach</th><th>Certificaat</th><th className="text-right">Verloopt</th></>}>
              {certs.map((cert) => (
                <tr key={cert.id}>
                  <td className="font-medium">{cert.coach_name ?? "—"}</td>
                  <td className="muted text-sm">{cert.name}</td>
                  <td className="text-right text-sm" style={{ color: "#b45309" }}>{dateNL(cert.expires_at)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>
      </div>
    </>
  );
}

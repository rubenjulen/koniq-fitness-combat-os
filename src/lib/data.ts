import "server-only";
import { query, queryOne } from "@/db/client";

/** Shared query helpers used across module pages. All are tenant-scoped. */

export async function dashboardStats(tenantId: string) {
  return queryOne<Record<string, number>>(
    `SELECT
      (SELECT count(*) FROM members WHERE tenant_id=$1 AND status='active')::int AS active_members,
      (SELECT count(*) FROM members WHERE tenant_id=$1 AND status='trial')::int AS trials,
      (SELECT count(*) FROM members WHERE tenant_id=$1 AND status='overdue')::int AS overdue_members,
      (SELECT count(*) FROM leads WHERE tenant_id=$1 AND status NOT IN ('won','lost'))::int AS open_leads,
      (SELECT coalesce(sum(amount),0) FROM invoices WHERE tenant_id=$1 AND status IN ('due','overdue','partial'))::float AS open_amount,
      (SELECT coalesce(sum(amount),0) FROM invoices WHERE tenant_id=$1 AND status='paid' AND issued_at >= date_trunc('month', current_date))::float AS mrr,
      (SELECT count(*) FROM attendance WHERE tenant_id=$1 AND session_date >= current_date - 7)::int AS checkins_week,
      (SELECT count(*) FROM retention_tasks WHERE tenant_id=$1 AND status='open')::int AS retention_open`,
    [tenantId]
  );
}

export async function attendanceTrend(tenantId: string, days = 14) {
  return query<{ d: string; n: number }>(
    `SELECT to_char(session_date,'YYYY-MM-DD') AS d, count(*)::int AS n
       FROM attendance WHERE tenant_id=$1 AND session_date >= current_date - $2::int
      GROUP BY session_date ORDER BY session_date`,
    [tenantId, days]
  );
}

export async function todayClasses(tenantId: string) {
  // weekday: JS getDay 0=Sun..6=Sat → 1=Mon..7=Sun
  const wd = ((new Date().getDay() + 6) % 7) + 1;
  return query<{ id: string; title: string; start_time: string; end_time: string; coach: string | null; cap: number; booked: number; color: string | null }>(
    `SELECT c.id, c.title, c.start_time, c.end_time, co.name AS coach, c.capacity AS cap,
            (SELECT count(*) FROM bookings b WHERE b.class_id=c.id AND b.session_date=current_date AND b.status IN ('booked','attended'))::int AS booked,
            ct.color
       FROM classes c
       LEFT JOIN coaches co ON co.id=c.coach_id
       LEFT JOIN class_types ct ON ct.id=c.class_type_id
      WHERE c.tenant_id=$1 AND c.weekday=$2 AND c.active
      ORDER BY c.start_time`,
    [tenantId, wd]
  );
}

export async function recentLeads(tenantId: string, limit = 6) {
  return query<{ id: string; name: string; source: string | null; status: string; created_at: string; discipline: string | null }>(
    `SELECT id, name, source, status, created_at, discipline FROM leads WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2`,
    [tenantId, limit]
  );
}

export async function upcomingBirthdays(tenantId: string) {
  return query<{ id: string; first_name: string; last_name: string; dob: string }>(
    `SELECT id, first_name, last_name, dob FROM members
      WHERE tenant_id=$1 AND dob IS NOT NULL
        AND to_char(dob,'MM-DD') BETWEEN to_char(current_date,'MM-DD') AND to_char(current_date + 7,'MM-DD')
      ORDER BY to_char(dob,'MM-DD') LIMIT 6`,
    [tenantId]
  );
}

export async function atRiskMembers(tenantId: string) {
  return query<{ id: string; member_id: string; first_name: string; last_name: string; reason: string | null; type: string | null }>(
    `SELECT rt.id, rt.member_id, m.first_name, m.last_name, rt.reason, rt.type
       FROM retention_tasks rt JOIN members m ON m.id=rt.member_id
      WHERE rt.tenant_id=$1 AND rt.status='open' ORDER BY rt.due_date NULLS LAST LIMIT 6`,
    [tenantId]
  );
}

export async function listCoaches(tenantId: string) {
  return query<{ id: string; name: string }>(`SELECT id, name FROM coaches WHERE tenant_id=$1 AND active ORDER BY name`, [tenantId]);
}

export async function listPackages(tenantId: string) {
  return query<{ id: string; name: string; price: number }>(`SELECT id, name, price FROM packages WHERE tenant_id=$1 AND active ORDER BY sort`, [tenantId]);
}

export async function listMembersBrief(tenantId: string) {
  return query<{ id: string; first_name: string; last_name: string; status: string }>(
    `SELECT id, first_name, last_name, status FROM members WHERE tenant_id=$1 ORDER BY first_name`, [tenantId]
  );
}

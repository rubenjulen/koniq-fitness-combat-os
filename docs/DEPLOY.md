# Deploy — KoniQ Fitness & Combat Sports OS

Productie-target (KoniQ-stack): **Supabase** (Postgres) + **Coolify op Hetzner** (container) + **Cloudflare** (domein/proxy). Voorstel-domein: `fit.koniq.app`.

De app is deploy-klaar: `output: "standalone"`, `Dockerfile` aanwezig, dual-driver schakelt automatisch naar Postgres zodra `DATABASE_URL` is gezet. Het schema wordt bij de eerste request idempotent toegepast (`CREATE TABLE IF NOT EXISTS`).

## 0. Vereisten
- Supabase-project (of eigen Postgres 16).
- Coolify-instantie op Hetzner (of elke Docker-host).
- Cloudflare-zone voor het domein.

## 1. Database (Supabase)
1. Maak een Supabase-project aan (regio dicht bij gebruikers).
2. Neem de **pooler**-connectiestring (Transaction, poort 6543):
   `postgresql://postgres.<ref>:<wachtwoord>@aws-0-<regio>.pooler.supabase.com:6543/postgres`
3. ⚠️ **Pooler-valkuil**: de app gebruikt al `prepare:false` (serverless-veilig achter de transaction pooler). Niet wijzigen.
4. Schema komt automatisch bij eerste boot. Voor een schone productie-DB **zonder** demodata: zet `SEED_ON_BOOT=false`.

## 2. Environment variabelen
| Variabele | Waarde |
|---|---|
| `DATABASE_URL` | Supabase pooler-string (stap 1) |
| `SEED_ON_BOOT` | `false` in productie (of `true` voor een demo-omgeving) |
| `NODE_ENV` | `production` |
| `PORT` | `3040` |
| `PGLITE_DIR` | alleen relevant als `DATABASE_URL` leeg is (fallback) |

Zet secrets in Coolify (niet in git). `.env.example` staat in de repo als sjabloon.

## 3. Container (Coolify op Hetzner)
1. **New Resource → Application** → koppel de git-repo (of deploy via de meegeleverde `Dockerfile`).
2. Build pack: **Dockerfile**. Coolify bouwt het `standalone` image (`node server.js`).
3. Port: **3040**. Health check: `GET /` (verwacht 200).
4. Zet de env-variabelen uit stap 2.
5. Deploy. Eerste boot past het schema toe; check de logs op “schema toegepast”.

Handmatig bouwen/draaien kan ook:
```bash
docker build -t koniq-fitness .
docker run -p 3040:3040 -e DATABASE_URL="postgresql://…6543/postgres" -e SEED_ON_BOOT=false koniq-fitness
```

## 4. Domein (Cloudflare)
1. DNS: `fit.koniq.app` → Coolify-server (A/AAAA of CNAME), **proxied** (oranje wolk).
2. Coolify: domein `https://fit.koniq.app` toewijzen aan de app; Let's Encrypt-certificaat aanzetten.
3. SSL/TLS-mode in Cloudflare op **Full (strict)**.

## 5. Eerste inrichting na go-live
- Log in als platform-/eigenaarsaccount en maak de echte tenant(s) aan, of seed één keer met `SEED_ON_BOOT=true` en zet daarna weer op `false`.
- **Instellingen → Edities & pakketten**: kies de editie die de klant afneemt.
- **Branding**: naam, kleuren, slogan per tenant.
- Wachtwoorden van demo-accounts wijzigen/verwijderen vóór productiegebruik.

## 6. Backups & DR (3-2-1)
- Supabase automatische backups aanzetten (PITR indien beschikbaar).
- Periodieke `pg_dump` naar off-site opslag (bijv. B2/Hetzner Storage Box), zoals in de KoniQ-DR-lijn.

## Checklist
- [ ] Supabase-project + pooler-URL
- [ ] Coolify-app op Hetzner, port 3040, Dockerfile
- [ ] Env: `DATABASE_URL`, `SEED_ON_BOOT=false`
- [ ] Cloudflare DNS + SSL (Full strict)
- [ ] Eerste tenant + editie + branding
- [ ] Demo-wachtwoorden verwijderd
- [ ] Backups/PITR aan

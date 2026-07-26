# Deploy-draaiboek — KoniQ Fitness & Combat Sports OS

Stap-voor-stap live zetten op de KoniQ-stack: **Supabase** (database) + **Coolify op Hetzner** (app-container) + **Cloudflare** (domein/SSL). Voorbeelddomein: `fit.koniq.app`.

De app is deploy-klaar: `output: "standalone"`, `Dockerfile` + `docker-compose.yml` aanwezig, `/api/health` als health check, en de dual-driver schakelt automatisch naar Postgres zodra `DATABASE_URL` is gezet. Het schema wordt bij de eerste boot idempotent aangemaakt.

> Reken op ~30–45 min de eerste keer.

---

## Voorbereiding (eenmalig)
- [ ] Toegang tot een **Git-host** (GitHub of jullie Gitea).
- [ ] Een draaiende **Coolify** op een Hetzner-server (zelfde als ArchOS) — je hebt het server-IP nodig.
- [ ] Een **Supabase**-account.
- [ ] **Cloudflare** beheer over het domein `koniq.app`.

---

## FASE A — Code online zetten (Git)

Coolify bouwt vanuit een Git-repo, dus de code moet naar een repo.

### A1. Maak een lege repo
- GitHub: linksboven **+ → New repository** → naam `koniq-fitness-combat-os` → **Private** → **NIET** "Add a README" aanvinken → **Create repository**.
- (Gitea werkt identiek: **+ → New Repository**.)

### A2. Push de code
Open een terminal in de projectmap en voer uit (vervang de URL door die van A1):
```bash
git remote add origin https://github.com/<jouw-account>/koniq-fitness-combat-os.git
git push -u origin main
```
Vraagt hij om inloggen: gebruik een **Personal Access Token** (GitHub → Settings → Developer settings → Tokens) als wachtwoord.

### ✅ Controle A
De repo-pagina toont je bestanden en de commits (`v0.1.0 …` t/m `feat: health-endpoint …`).

---

## FASE B — Database (Supabase)

### B1. Nieuw project
1. app.supabase.com → **New project**.
2. **Organization**: kies/maak er een.
3. **Name**: `koniq-fitness` · **Database Password**: klik **Generate a password** en **bewaar 'm** (heb je zo nodig).
4. **Region**: kies dichtbij (bv. `Central EU (Frankfurt)`).
5. **Create new project** → wacht ~2 min tot "Project is ready".

### B2. Haal de pooler-connectiestring op
1. Bovenin klik **Connect** (of **Project Settings → Database**).
2. Kies tab/sectie **Connection pooling** → mode **Transaction** → **poort 6543**.
3. Kopieer de URI. Die ziet er zo uit:
   `postgresql://postgres.<projectref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres`
4. Vervang `[YOUR-PASSWORD]` door het wachtwoord uit B1. **Dit is je `DATABASE_URL`.**

> Waarom de pooler (6543) en niet 5432? De app draait met `prepare:false` en is gebouwd voor de transaction pooler — serverless-veilig. Niet wijzigen.

### ✅ Controle B
Je hebt één regel `DATABASE_URL=postgresql://…6543/postgres` klaarliggen.

---

## FASE C — App draaien (Coolify)

### C1. Project + resource
1. Coolify → **Projects → + Add** → naam `KoniQ` → open het project → **Production** environment.
2. **+ New Resource**.
3. Bron kiezen:
   - **Private repo** → eerst **Sources → + Add → GitHub App** koppelen (eenmalig), daarna repo kiezen. Of gebruik een **Deploy Key**.
   - Publieke repo → **Public Repository** → plak de repo-URL.
4. **Branch**: `main`.

### C2. Build-instellingen
1. **Build Pack**: zet op **Dockerfile** (niet Nixpacks).
2. **Ports Exposes**: `3040`.
3. **Health Check** (tab General → Health Check): **Enable**, Path `/api/health`, Port `3040`.

### C3. Environment variables
Ga naar **Environment Variables → + Add** en voeg toe (elk als aparte var):
| Name | Value |
|---|---|
| `DATABASE_URL` | de pooler-string uit B2 |
| `SEED_ON_BOOT` | `false` |
| `NODE_ENV` | `production` |

> Wil je een **demo-omgeving mét voorbeelddata**? Zet `SEED_ON_BOOT=true` (en later terug op `false`).

### C4. Deploy
1. Klik **Deploy** (rechtsboven).
2. Open **Deployments → Logs** en volg de build. Verwacht: `npm run gen:schema` → `next build` → container start → `node server.js`.
3. Eerste request past het schema toe (kan enkele seconden duren).

### ✅ Controle C
In Coolify staat de resource op **Running** (groen). Klik de tijdelijke Coolify-URL of test straks via het domein.

---

## FASE D — Domein + HTTPS (Cloudflare + Coolify)

Belangrijk: voor het eerste Let's Encrypt-certificaat moet Coolify de server rechtstreeks kunnen bereiken. Daarom eerst **zonder** Cloudflare-proxy, dan aanzetten.

### D1. DNS-record (eerst grijs)
1. Cloudflare → domein `koniq.app` → **DNS → Add record**.
2. Type **A** · Name **fit** · IPv4 = **publiek IP van je Coolify-server** · Proxy status **DNS only** (grijze wolk) · **Save**.

### D2. Domein in Coolify + certificaat
1. Coolify → je app → **Domains** → vul in: `https://fit.koniq.app` → **Save**.
2. Coolify vraagt automatisch een Let's Encrypt-certificaat aan (Traefik/Caddy). Wacht tot dit lukt (Logs tonen "certificate obtained").

### D3. Proxy + strikte SSL aanzetten
1. Cloudflare → DNS → het `fit`-record → zet Proxy status op **Proxied** (oranje wolk) → Save.
2. Cloudflare → **SSL/TLS → Overview** → mode **Full (strict)**.

### ✅ Controle D
Open in de browser: `https://fit.koniq.app/api/health` → verwacht `{"status":"ok","db":"up",...}` en een geldig slotje.

---

## FASE E — Eerste inrichting & hardening

1. Ga naar `https://fit.koniq.app/login`.
2. **Eerste tenant**:
   - Snelste demo: zet in Coolify `SEED_ON_BOOT=true`, **Redeploy**, log in als `owner@demo.koniq / demo12345`, en zet daarna `SEED_ON_BOOT=false` + Redeploy.
   - Schoon: houd `SEED_ON_BOOT=false` en richt je eerste sportschool handmatig in (tenant/gebruiker aanmaken).
3. **Instellingen → Edities & pakketten**: kies de editie die de klant afneemt (Starter/Pro/Combat/Performance+/Enterprise). Uitgeschakelde modules verdwijnen meteen uit het menu.
4. **Branding**: clubnaam, kleuren, slogan.
5. **Hardening (verplicht vóór echt gebruik)**:
   - Verwijder/wijzig de demo-accounts (`owner@demo.koniq`, `receptie@…`, `coach@…`) en het platform-admin-account.
   - Zet in Supabase **Point-in-Time Recovery / dagelijkse backups** aan.
6. **DR (3-2-1)**: plan een periodieke `pg_dump` naar off-site opslag (B2 / Hetzner Storage Box), conform de KoniQ-DR-lijn.

---

## Snelle deploy zonder Coolify (alternatief)
Op een kale Hetzner-VM met Docker:
```bash
git clone <REPO_URL> && cd koniq-fitness-combat-os
DATABASE_URL="postgresql://…6543/postgres" SEED_ON_BOOT=false docker compose up -d --build
# app luistert op poort 3040; zet er een reverse proxy (Caddy/Traefik) met HTTPS voor.
```

---

## Troubleshooting
| Symptoom | Oorzaak / oplossing |
|---|---|
| `/api/health` geeft 503 `db:"down"` | `DATABASE_URL` fout of pooler-poort niet 6543. Controleer wachtwoord (geen `[YOUR-PASSWORD]` meer). |
| Build faalt op types | Draai lokaal `npm run build` om de fout te zien; los op en push opnieuw. |
| Certificaat lukt niet | Zet DNS tijdelijk op **DNS only** (grijs), laat Coolify het cert halen, zet daarna weer **Proxied** + **Full (strict)**. |
| 521/522 via Cloudflare | Server-IP/poort klopt niet of Coolify draait niet; check dat de app **Running** is en poort 3040 open staat. |
| Wil geen demodata | `SEED_ON_BOOT=false` (staat standaard zo in dit draaiboek). |

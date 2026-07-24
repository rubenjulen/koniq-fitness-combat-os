# FITNESS & COMBAT SPORTS OS SURINAME — FULL PRODUCT / ENTERPRISE REQUIREMENT BASELINE v1.0

## Executive Summary
Deze baseline definieert een volwassen, multi-tenant Sportschool & Combat Sports Operating Platform voor Suriname. Het product is ontworpen voor kickboks-/Muay Thai-scholen die jeugd en volwassenen bedienen, maar kan ook algemene gyms, boutique studios en multi-location clubs ondersteunen.

Het platform bestrijkt de volledige keten:

**Acquire → Trial → Register → Screen → Select Package → Pay → Book → Check-In → Train → Progress → Compete → Retain → Renew**

Website, Meta, WhatsApp en toekomstige kanalen zijn geen losse administraties: zij voeden dezelfde CRM/member core.

## Reference Model
Het samengestelde referentiemodel combineert fitness-facility safety en exercise-screening best practices (ACSM/PAR-Q+/WHO), fitness club quality en professional competence (EuropeActive/EN 17229), martial-arts operations (Zen Planner/Gymdesk/WAKO/IFMA), digital coaching (Trainerize/Virtuagym), club operations (Mindbody/Glofox/PushPress/Wodify), youth safeguarding (IOC/SafeSport), en enterprise security/privacy/payment frameworks.

## Scope
De baseline bevat **330 genummerde requirements** verdeeld over **33 productdomeinen**.

## Safety Position on AI Coaching
De AI-laag is bedoeld om algemene training op schaal te personaliseren, niet om medische beoordeling, safeguarding decisions, sparring clearance of competition medical clearance te vervangen. Voor minderjarigen, injury/medical flags, pregnancy, return-to-play, extreme weight-loss/weight-cutting en therapeutische/restrictieve diëten gelden extra menselijke/professionele gates.

Een personal trainer kan voor laag-risico algemene programming voor veel members sterk worden geautomatiseerd; bij combat technique, sparring, jeugd, injuries en competition blijft qualified human coaching een essentiële control.

## STR — Strategy, Governance & Operating Model
**Target:** R0 — Strategy & Safety

**STR-001 — Product Vision**  
Positioneer het product als Fitness & Combat Sports Operating Platform, niet alleen als ledenadministratie.

**STR-002 — Business Models**  
Ondersteun kickboks-/Muay Thai-scholen, algemene gyms, boutique studios, PT-studio's, multi-location clubs en hybride online/offline coaching.

**STR-003 — Capability Map**  
Beheer een formele capability map voor acquisition, memberships, billing, scheduling, coaching, combat sports, safety, finance en analytics.

**STR-004 — Process Ownership**  
Wijs proceseigenaren aan voor Lead-to-Member, Member-to-Renewal, Schedule-to-Attendance, Train-to-Progress en Invoice-to-Cash.

**STR-005 — KPI Governance**  
Definieer centraal KPI's voor leads, conversion, active members, attendance, ARPU, churn, overdue, class utilization en retention.

**STR-006 — Policy Management**  
Beheer policies voor memberships, cancellations, freezes, access, no-show, sparring, youth safety, refunds en nutrition coaching.

**STR-007 — Decision Rights**  
Leg vast wie packages, prijzen, discounts, refunds, competition eligibility en safety exceptions mag goedkeuren.

**STR-008 — Continuous Improvement**  
Gebruik feedback, incidenten, churnredenen en operationele data voor structurele verbetercycli.

**STR-009 — Maturity Model**  
Ondersteun een groeipad van WhatsApp/papier naar digitaal clubmanagement, digital coaching en enterprise multi-location.

**STR-010 — Operating Review**  
Maak periodieke business- en safety reviews onderdeel van de platformwerkwijze.

## LOC — Suriname Localization & Adoption
**Target:** R1 — Commercial Core

**LOC-001 — Local First**  
Ontwerp voor sportscholen die vandaag werken met WhatsApp, social media, cash/banktransfer en losse agenda's.

**LOC-002 — Mobile First**  
Optimaliseer member app, coach app, frontdesk en salesflows voor smartphones en wisselende bandbreedte.

**LOC-003 — Languages**  
Ondersteun minimaal Nederlands en Engels; maak extra talen configureerbaar.

**LOC-004 — Currencies**  
Ondersteun minimaal SRD, USD en EUR met oorspronkelijke valuta per financiële transactie.

**LOC-005 — Local Payments**  
Maak lokale wallets, banktransfers en toekomstige lokale payment rails via adapters koppelbaar.

**LOC-006 — Cash Payments**  
Ondersteun cashbetalingen, kasregistratie, receipt en reconciliation als first-class workflow.

**LOC-007 — Bank Transfer**  
Ondersteun banktransfer met betalingsreferentie, bewijsupload, pending status en gecontroleerde reconciliation.

**LOC-008 — Local Address**  
Ondersteun vrije adresregels, district, ressort, buurt, landmark en GPS voor members en locaties.

**LOC-009 — Low Barrier Onboarding**  
Laat kleine clubs starten zonder ERP, boekhoudpakket, toegangspoort of bestaande website.

**LOC-010 — Migration**  
Bied imports uit Excel/CSV en begeleide migratie van bestaande leden-, betalings- en attendance-lijsten.

## SAA — SaaS Platform & Multi-Tenancy
**Target:** R1 — Commercial Core

**SAA-001 — Multi-Tenant**  
Ondersteun meerdere volledig geïsoleerde sportscholen in één SaaS-platform.

**SAA-002 — Multi-Location**  
Ondersteun meerdere locaties, zalen en brands onder één organisatie.

**SAA-003 — White Label**  
Laat tenantlogo, kleuren, eigen domein, e-mailafzender en branded member experience configureren.

**SAA-004 — Feature Entitlements**  
Dwing features backend-side af op basis van producteditie en add-ons.

**SAA-005 — Configuration**  
Maak statussen, labels, waiver templates, packages en automationregels configureerbaar zonder codeforks.

**SAA-006 — Tenant Lifecycle**  
Ondersteun trial, activatie, suspension, export en gecontroleerde offboarding.

**SAA-007 — Subscription Billing**  
Maak SaaS-billing, seats, locations en add-ons koppelbaar aan een billingprovider.

**SAA-008 — Usage Metering**  
Meet opslag, actieve members, messages, AI-usage en andere billable metrics.

**SAA-009 — Partner Access**  
Ondersteun implementatiepartners en marketingagencies met delegated, beperkte toegang.

**SAA-010 — Platform Admin**  
Bied platformbrede tenant health, supportdiagnostiek en audit zonder standaard businessdata breed zichtbaar te maken.

## IAM — Identity, Access & Security
**Target:** R1 — Commercial Core

**IAM-001 — Authentication**  
Ondersteun veilige login en MFA voor gevoelige rollen.

**IAM-002 — RBAC**  
Gebruik capability-based role-based access control.

**IAM-003 — Record Scope**  
Ondersteun eigen, team-, locatie- en tenantbrede recordscope.

**IAM-004 — Sensitive Health Data**  
Beperk health-, injury-, nutrition- en safeguardingdata met aparte permissions.

**IAM-005 — Segregation of Duties**  
Scheid rechten voor refunds, payment adjustments, member deletion en safety approvals.

**IAM-006 — Guardian Access**  
Laat guardians uitsluitend gekoppelde minderjarige profielen en toegestane informatie zien.

**IAM-007 — Service Accounts**  
Gebruik scoped service identities voor integrations en automations.

**IAM-008 — Session Security**  
Ondersteun veilige tokens, timeouts, revocation en device/session management.

**IAM-009 — SSO**  
Maak enterprise SSO mogelijk voor grotere organisaties.

**IAM-010 — Access Reviews**  
Ondersteun periodieke review van rollen, coaches, contractors en ex-medewerkers.

## CRM — Lead Acquisition, CRM & Sales
**Target:** R1 — Commercial Core

**CRM-001 — Lead Capture**  
Ontvang leads uit website, Meta, WhatsApp, telefoon, walk-in, referral en handmatige invoer.

**CRM-002 — Lead Inbox**  
Bied één lead inbox met bron, leeftijd, interesse, package en verantwoordelijke.

**CRM-003 — Deduplication**  
Detecteer dubbele personen op telefoon, WhatsApp, e-mail en guardianrelaties.

**CRM-004 — Lead Pipeline**  
Ondersteun New, Contacted, Trial Booked, Trial Attended, Offer, Won en Lost.

**CRM-005 — Lead Routing**  
Routeer leads handmatig, round-robin, op locatie, programma of leeftijdsgroep.

**CRM-006 — SLA**  
Meet first response en escalaties voor niet-opgevolgde leads.

**CRM-007 — Qualification**  
Leg doelen, leeftijd, ervaring, gewenste trainingsdagen, discipline en interesse vast.

**CRM-008 — Trial Conversion**  
Converteer een trial zonder dubbele invoer naar member, package en onboarding.

**CRM-009 — Lost Reasons**  
Registreer gestructureerde redenen zoals prijs, tijd, locatie, geen reactie en concurrent.

**CRM-010 — Sales Analytics**  
Meet source-to-trial, trial-to-member, sales cycle, conversion en salesperformance.

## MKT — Marketing, Social Media & Growth
**Target:** R2 — Growth & Engagement

**MKT-001 — Campaigns**  
Beheer campagnes met doel, budget, audience, kanaal en periode.

**MKT-002 — Meta Leads**  
Integreer Meta lead ads via CRM/lead ingestion zonder handmatige overtypstappen.

**MKT-003 — Conversions Feedback**  
Stuur toegestane downstream lead-, trial- en membershipevents terug naar advertentieplatformen.

**MKT-004 — WhatsApp Marketing**  
Gebruik WhatsApp Business Platform voor toegestane lead- en membercommunicatie via templates en webhooks.

**MKT-005 — Content Calendar**  
Plan social, website, e-mail en eventcontent in één kalender.

**MKT-006 — Asset Library**  
Beheer foto's, video's, coachprofielen, fightmedia en brand assets centraal.

**MKT-007 — Referral Programs**  
Ondersteun member-get-member referral codes, credits en rewards.

**MKT-008 — Campaign Attribution**  
Bewaar UTM, referrer, ad/campaign IDs en eerste/laatste touchcontext.

**MKT-009 — Reviews Reputation**  
Faciliteer reviewverzoeken en reputatieflows na geschikte membermoments.

**MKT-010 — Marketing ROI**  
Meet spend → leads → trials → memberships → revenue per campagne.

## WEB — Website, CMS & Digital Experience
**Target:** R1 — Commercial Core

**WEB-001 — Integrated Website**  
Lever een responsive website direct gevoed door platformdata.

**WEB-002 — CMS**  
Beheer pagina's, navigation, news, blog, FAQs en landingpages zonder code.

**WEB-003 — Programs**  
Publiceer jeugd, volwassenen, beginners, advanced, fitness kickboxing, Muay Thai, sparring en andere programma's.

**WEB-004 — Schedule**  
Publiceer actuele class schedule vanuit dezelfde scheduling engine.

**WEB-005 — Packages**  
Toon packagevergelijking, prijzen, voorwaarden en CTA's vanuit centrale membershipconfiguratie.

**WEB-006 — Online Registration**  
Laat prospects trial, registratie en packagekeuze online starten.

**WEB-007 — Coach Profiles**  
Publiceer goedgekeurde coachbios, kwalificaties en specialismen.

**WEB-008 — Events**  
Publiceer seminars, camps, grading events, fights en open days.

**WEB-009 — SEO**  
Ondersteun lokale SEO, structured data, sitemap, canonical URLs en social previews.

**WEB-010 — Accessibility**  
Ontwerp website en self-service flows richting WCAG 2.2 AA.

## ENR — Registration, Intake & Onboarding
**Target:** R1 — Commercial Core

**ENR-001 — Digital Registration**  
Laat nieuwe members volledig digitaal registreren.

**ENR-002 — Identity Data**  
Leg naam, geboortedatum, contactgegevens, adres en noodcontact vast.

**ENR-003 — Goal Intake**  
Leg verwachtingen vast zoals fitter worden, zelfverdediging, afvallen, wedstrijdsport, techniek of sociaal doel.

**ENR-004 — Experience Intake**  
Leg eerdere sport-, martial arts- en competitionervaring vast.

**ENR-005 — Health Screening**  
Neem preparticipation screening en safety questions op vóór trainingsadvies.

**ENR-006 — Waivers**  
Laat vereiste informed consent, waiver en clubregels digitaal accepteren.

**ENR-007 — Package Selection**  
Laat de prospect direct een geschikt package selecteren of advies vragen.

**ENR-008 — Payment Setup**  
Laat betaalwijze en eerste betaling binnen onboarding worden ingericht.

**ENR-009 — Orientation**  
Plan introductie, beginner orientation of eerste class na registratie.

**ENR-010 — Onboarding Checklist**  
Toon member en club welke profiel-, waiver-, payment- en safetyonderdelen nog ontbreken.

## MEM — Member 360, Family & Guardian Management
**Target:** R1 — Commercial Core

**MEM-001 — Member 360**  
Bied één memberprofiel met memberships, payments, attendance, goals, training, progress en communicatie.

**MEM-002 — Family Accounts**  
Ondersteun één household/family account met meerdere members.

**MEM-003 — Guardian Relationship**  
Koppel één of meerdere guardians aan minderjarige members met relationship type.

**MEM-004 — Guardian Billing**  
Laat een guardian voor één of meerdere kinderen betalen via één payer account.

**MEM-005 — Emergency Contacts**  
Ondersteun meerdere emergency contacts en medische noodinformatie met beperkte toegang.

**MEM-006 — Member Status**  
Gebruik duidelijke statussen zoals Prospect, Trial, Active, Frozen, Overdue, Cancelled en Alumni.

**MEM-007 — Custom Fields**  
Laat clubs configureerbare memberfields toevoegen zonder kernschema te breken.

**MEM-008 — Documents**  
Toon membergerelateerde waivers, medische clearances, certificates en contracts.

**MEM-009 — Timeline**  
Toon contact, bookings, payments, check-ins, promotions, incidents en belangrijke events chronologisch.

**MEM-010 — Household Communication**  
Stuur family/guardian communicatie gericht per kind, huishouden of programma.

## PKG — Memberships, Packages & Contracts
**Target:** R1 — Commercial Core

**PKG-001 — Membership Plans**  
Ondersteun maand-, kwartaal-, jaar-, onbeperkt-, x-per-week- en custom memberships.

**PKG-002 — Class Packs**  
Ondersteun punch cards, 10-lessenkaart, credits en expiratie.

**PKG-003 — Drop-In**  
Ondersteun single class, day pass, guest en tourist/drop-in producten.

**PKG-004 — Family Plans**  
Ondersteun family pricing, sibling discounts en household caps.

**PKG-005 — Youth Plans**  
Ondersteun leeftijdsgebonden youth packages en guardian payer.

**PKG-006 — Private Training**  
Ondersteun PT/private lesson packs naast group memberships.

**PKG-007 — Competition Team**  
Ondersteun aparte competition-team fees, camps en supplementary packages.

**PKG-008 — Freeze Hold**  
Ondersteun freeze, medical hold, vacation hold en configurable policies.

**PKG-009 — Upgrade Downgrade**  
Ondersteun packagewissels met configureerbare prorataregels.

**PKG-010 — Cancellation Renewal**  
Beheer opzegging, notice, auto-renewal, expiry en win-backflows.

## BIL — Billing, Payments & Dunning
**Target:** R1 — Commercial Core

**BIL-001 — Member Ledger**  
Houd per payer/member een ledger met invoices, charges, payments, credits en balance.

**BIL-002 — Recurring Billing**  
Genereer recurring dues volgens membership schedule.

**BIL-003 — Payment Status**  
Toon Paid, Due, Partially Paid, Overdue, Failed, Waived en Written Off.

**BIL-004 — Payment Methods**  
Ondersteun cash, banktransfer, wallet, card/online en custom methods.

**BIL-005 — Dunning**  
Automatiseer reminders, retries en escalaties bij mislukte of gemiste betalingen.

**BIL-006 — Grace Period**  
Ondersteun configurable grace periods voordat accessregels wijzigen.

**BIL-007 — Access Policy**  
Koppel betalingsstatus configureerbaar aan check-in warnings of access restrictions.

**BIL-008 — Receipts Invoices**  
Genereer receipts/invoices met transaction reference en betaalhistorie.

**BIL-009 — Reconciliation**  
Reconcilieer bank/wallet/provider settlements met open dues.

**BIL-010 — Aging Collections**  
Rapporteer arrears aging, collection status en promise-to-pay.

## APP — Member App & Self-Service
**Target:** R2 — Growth & Engagement

**APP-001 — Member Home**  
Toon vandaag, next class, payment status, training plan en persoonlijke aandachtspunten.

**APP-002 — Booking**  
Laat members classes en private sessions boeken, annuleren en waitlists beheren.

**APP-003 — Check-In**  
Ondersteun app-based QR check-in.

**APP-004 — Membership**  
Laat members package, expiry, credits en accountstatus bekijken.

**APP-005 — Payments**  
Laat members invoices, betalingsstatus en beschikbare betaalopties bekijken.

**APP-006 — Training**  
Toon weekplan, oefenvideo's, workout logging en adherence.

**APP-007 — Progress**  
Toon attendance streaks, skills, rank, measurements en persoonlijke milestones.

**APP-008 — Communication**  
Bied in-app announcements, direct messages en group/community updates.

**APP-009 — Documents**  
Laat members toegestane waivers, policies en certificates bekijken.

**APP-010 — Family View**  
Laat guardians meerdere children profiles vanuit één app beheren.

## SCH — Scheduling, Classes & Booking
**Target:** R1 — Commercial Core

**SCH-001 — Recurring Schedule**  
Maak terugkerende class schedules met uitzonderingen voor feestdagen en events.

**SCH-002 — Class Types**  
Ondersteun classes per discipline, leeftijd, level, goal en intensity.

**SCH-003 — Capacity**  
Beheer maximale class capacity en bezetting.

**SCH-004 — Waitlist**  
Ondersteun geautomatiseerde waitlist en vrijgekomen plekken.

**SCH-005 — Prerequisites**  
Beperk advanced/sparring classes op leeftijd, level, coach approval of safety eligibility.

**SCH-006 — Coach Assignment**  
Koppel primary en assistant coaches aan classes.

**SCH-007 — Facility Resource**  
Koppel zaal, ring, mat, bag area of andere resource aan sessies.

**SCH-008 — Late Cancel No Show**  
Ondersteun policies, fees, warnings en attendance impact.

**SCH-009 — Private Sessions**  
Plan 1-op-1 en small-group coaching met availability.

**SCH-010 — Calendar Integration**  
Synchroniseer coachafspraken optioneel naar Google/Microsoft calendars.

## ATT — Attendance, Check-In & Access
**Target:** R1 — Commercial Core

**ATT-001 — Check-In Kiosk**  
Ondersteun frontdesk/kiosk check-in via QR, barcode, naam of member number.

**ATT-002 — Attendance Ledger**  
Bewaar immutable attendance history per class/member.

**ATT-003 — Eligibility**  
Valideer active membership, credits, class prerequisites en safety restrictions bij check-in.

**ATT-004 — Payment Warning**  
Toon configurable waarschuwing bij overdue zonder gevoelige financiële details openbaar te tonen.

**ATT-005 — Offline Check-In**  
Laat beperkte offline check-in toe bij internetstoring en synchroniseer later.

**ATT-006 — Guardian Pickup**  
Ondersteun check-in/out en geautoriseerde pickupinformatie voor jeugdprogramma's.

**ATT-007 — Guest Attendance**  
Registreer trial guests en visitors zonder direct full memberaccount.

**ATT-008 — Coach Roll Call**  
Laat coach attendance bevestigen/corrigeren met reason en audit.

**ATT-009 — Attendance Streaks**  
Bereken attendance frequency, streaks en milestones.

**ATT-010 — At-Risk Absence**  
Signaleer members die onverwacht minder komen trainen.

## MAR — Martial Arts Curriculum, Skills & Rank
**Target:** R3 — Digital Coaching & Combat Performance

**MAR-001 — Curriculum**  
Beheer curriculum per discipline, level en age group.

**MAR-002 — Skill Library**  
Leg technieken vast zoals stance, guard, footwork, punches, kicks, knees, elbows, clinch en defense.

**MAR-003 — Progress Criteria**  
Definieer attendance-, skill-, coach- en assessmentcriteria voor progression.

**MAR-004 — Ranks Levels**  
Ondersteun belts, stripes, internal levels of andere ranks zonder één universeel systeem af te dwingen.

**MAR-005 — Coach Sign-Off**  
Laat bevoegde coaches skills en readiness aftekenen.

**MAR-006 — Assessment**  
Plan grading/assessment sessions en leg resultaten vast.

**MAR-007 — Promotion History**  
Bewaar volledige rank- en promotionhistorie.

**MAR-008 — Certificates**  
Genereer certificates/badges bij promotions waar de club dat gebruikt.

**MAR-009 — Class Eligibility**  
Gebruik rank/skill readiness voor advanced class eligibility.

**MAR-010 — Curriculum Analytics**  
Toon welke skills members beheersen en waar cohorts achterblijven.

## COA — Coaches, Staff & Workforce
**Target:** R1 — Commercial Core

**COA-001 — Coach Profiles**  
Beheer staffprofielen met rol, specialisme, contact en employment/contract status.

**COA-002 — Qualifications**  
Leg certificaten, first aid, coaching credentials en expiraties vast.

**COA-003 — Availability**  
Beheer coachavailability en recurring schedules.

**COA-004 — Assignments**  
Wijs coaches toe aan programs, classes, members en competition teams.

**COA-005 — Compensation**  
Ondersteun fixed pay, per-class pay, PT split en configurable coach compensation.

**COA-006 — Time Tracking**  
Registreer gewerkte classes, private sessions en eventuren.

**COA-007 — Performance**  
Meet attendance, member feedback, retention en salesbijdrage zonder ongepaste rankings.

**COA-008 — Substitution**  
Beheer coach replacement en notifications bij afwezigheid.

**COA-009 — Education**  
Volg required training, safeguarding en internal certifications.

**COA-010 — Coach App**  
Bied mobiele roster, attendance, member notes en sessionplanfuncties.

## HSC — Health Screening, Safety & Emergency
**Target:** R0 — Strategy & Safety

**HSC-001 — Preparticipation Screening**  
Bied een gestandaardiseerde preparticipation health screening geïnspireerd op PAR-Q+/ACSM.

**HSC-002 — Medical Flags**  
Leg injuries, medical conditions, medications en exercise restrictions afgeschermd vast.

**HSC-003 — Referral Rules**  
Escalate red flags naar medische/professionele beoordeling voordat high-risk training wordt geadviseerd.

**HSC-004 — Emergency Contacts**  
Maak noodcontacten snel beschikbaar voor geautoriseerde medewerkers.

**HSC-005 — Emergency Action Plan**  
Beheer schriftelijke emergency procedures, rollen en periodieke drills.

**HSC-006 — Incident Log**  
Registreer injuries, accidents, near misses en emergency response.

**HSC-007 — AED First Aid**  
Volg AED/first-aid availability, inspections en staff qualifications waar relevant.

**HSC-008 — Return to Training**  
Ondersteun restriction, modified training en clearance na injury/illness.

**HSC-009 — Heat Hydration**  
Maak hydration/heat alerts en sessionaanpassingen mogelijk gezien klimaat en intensity.

**HSC-010 — Safety Audit**  
Voer periodieke facility, equipment en program safety checks uit.

## TRN — Exercise Library & Training Programming
**Target:** R3 — Digital Coaching & Combat Performance

**TRN-001 — Exercise Library**  
Beheer een gevalideerde exercise library met video, instructions, equipment, level en safety notes.

**TRN-002 — Combat Drills**  
Ondersteun shadowboxing, bag, pads, footwork, defense, clinch drills en conditioning.

**TRN-003 — Strength Conditioning**  
Ondersteun strength, mobility, cardio, recovery en prehab exercises.

**TRN-004 — Program Templates**  
Maak templates voor beginner, general fitness, technique, fight camp en home training.

**TRN-005 — Weekly Plan**  
Plan duidelijke sessies per dag met duration, intensity, sets/reps/time en recovery.

**TRN-006 — Progression Regression**  
Definieer progression/regression rules per exercise en skill.

**TRN-007 — RPE**  
Laat members RPE, soreness, pain flags en session completion loggen.

**TRN-008 — Equipment Context**  
Genereer programma's voor gym, home, no-equipment of beperkte equipmentcontext.

**TRN-009 — Age Suitability**  
Classificeer exercises en loads op leeftijd, experience en safety suitability.

**TRN-010 — Coach Override**  
Laat coaches ieder automatisch of templateplan aanpassen met auditbare reden.

## AIC — AI Coach & Adaptive Programming
**Target:** R3 — Digital Coaching & Combat Performance

**AIC-001 — AI Intake**  
Gebruik age, height, weight, goals, experience, available days, equipment, screening en preferences als gecontroleerde inputs.

**AIC-002 — Plan Generator**  
Genereer weekplannen uit goedgekeurde exercise libraries en programming rules, niet uitsluitend vrije LLM-tekst.

**AIC-003 — Adaptation**  
Pas toekomstige belasting aan op completion, RPE, progress, fatigue signals en attendance.

**AIC-004 — Explainability**  
Leg uit waarom een exercise, volume of progression wordt voorgesteld.

**AIC-005 — Safety Guardrails**  
Blokkeer of escalatieer plannen bij medical red flags, pain, pregnancy, injury of andere configured risks.

**AIC-006 — Combat Limits**  
Laat AI geen zelfstandige clearance geven voor sparring, wedstrijddeelname of return-to-play.

**AIC-007 — Minor Limits**  
Gebruik voor minderjarigen extra guardian- en coachcontrols en beperk autonome intensity/weight-lossadviezen.

**AIC-008 — Video Feedback**  
Sta optionele pose/video-analysis toe voor laag-risico drills, maar presenteer dit niet als medische of gegarandeerde techniekcertificering.

**AIC-009 — Human Override**  
Laat coach of gekwalificeerde professional alle AI-plannen reviewen, aanpassen of blokkeren.

**AIC-010 — AI Audit**  
Log use-case, model/provider, relevante inputcontext, outputversie en human override waar passend.

## NUT — Nutrition, Hydration & Meal Guidance
**Target:** R3 — Digital Coaching & Combat Performance

**NUT-001 — Nutrition Intake**  
Leg goal, allergies, preferences, culture, budget, activity en relevante health restrictions vast.

**NUT-002 — Healthy Diet Baseline**  
Baseer default guidance op balans, adequacy, moderation en diversity in plaats van één fad diet.

**NUT-003 — Meal Planning**  
Bied meal templates, recipes, grocery lists en portion guidance met lokale voedingsopties.

**NUT-004 — Macro Tracking**  
Ondersteun optioneel calorie-/macrodoelen en food logging voor geschikte volwassenen.

**NUT-005 — Hydration**  
Plan hydration prompts rond training, warmte en session load.

**NUT-006 — Diet Styles**  
Ondersteun configureerbare templates zoals balanced, high-protein, vegetarian en adult low-carb/keto onder safetyregels.

**NUT-007 — Keto Guardrail**  
Adviseer keto/zeer koolhydraatarme plannen niet automatisch aan minors en escalatieer relevante medische situaties naar professionals.

**NUT-008 — Eating Disorder Risk**  
Signaleer extreme restriction, rapid weight-loss goals en andere risk indicators voor menselijke follow-up.

**NUT-009 — Professional Approval**  
Laat therapeutic diets en high-risk nutrition plans uitsluitend via bevoegde professional of externe dietitian workflow activeren.

**NUT-010 — Adherence**  
Meet meal-plan adherence, energy, hunger en performancefeedback zonder beschamende social ranking.

## PRO — Progress, Assessments & Wearables
**Target:** R2 — Growth & Engagement

**PRO-001 — Goal Tracking**  
Beheer meerdere doelen met baseline, target, target date en status.

**PRO-002 — Body Metrics**  
Leg gewicht, lengte en optioneel body composition measurements tijdgebonden vast.

**PRO-003 — Privacy**  
Behandel body measurements en progress photos als gevoelige memberdata.

**PRO-004 — Fitness Assessments**  
Ondersteun configureerbare strength, cardio, mobility en skill assessments.

**PRO-005 — Personal Bests**  
Log relevante performance PR's, bag rounds, conditioning tests en lifting metrics.

**PRO-006 — Progress Photos**  
Ondersteun private progress photos met expliciete consent en visibility.

**PRO-007 — Wearables**  
Maak integraties met wearables mogelijk via optionele adapters.

**PRO-008 — Trends**  
Toon persoonlijke trends in attendance, training load, recovery en measurements.

**PRO-009 — Milestones**  
Vier veilige milestones zoals attendance, consistency, technique en rank progress.

**PRO-010 — Coach Review**  
Laat coach/professional periodieke reviews en next-phase decisions vastleggen.

## FGT — Fighter & Competition Management
**Target:** R3 — Digital Coaching & Combat Performance

**FGT-001 — Fighter Profile**  
Beheer fighterstatus, discipline, stance, level, age category en competition history.

**FGT-002 — Weight Class**  
Leg current weight, target class en event-specific weigh-in context vast.

**FGT-003 — Fight Record**  
Bewaar opponent, event, date, discipline, result en notes.

**FGT-004 — Medical Documents**  
Volg medical certificate, questionnaire, clearance, waiver en expiry per competition requirement.

**FGT-005 — Parental Consent**  
Vereis guardian consent/documenten voor minderjarige competitionflows volgens toepasselijke regels.

**FGT-006 — Fight Camp**  
Genereer camp schedule met technical, conditioning, recovery en coach assignments.

**FGT-007 — Weight Management**  
Blokkeer extreme automatische weight-cuttingadviezen en vereis menselijke professional review voor risicovolle cuts.

**FGT-008 — Event Registration**  
Beheer registrations, deadlines, fees, travel, weigh-in en accreditation documents.

**FGT-009 — Corner Team**  
Registreer coaches/corner team en event roles.

**FGT-010 — Competition Eligibility**  
Gebruik age, membership, coach approval, medical status en federation/event rules als configurable eligibility checks.

## EVT — Events, Seminars, Camps & Gradings
**Target:** R2 — Growth & Engagement

**EVT-001 — Event Management**  
Beheer seminars, workshops, camps, open days, grading en social events.

**EVT-002 — Registration**  
Laat members en externen zich online registreren.

**EVT-003 — Capacity**  
Beheer capaciteit, waiting list en age/level restrictions.

**EVT-004 — Event Pricing**  
Ondersteun member, non-member, early-bird en family pricing.

**EVT-005 — Payments**  
Koppel eventfees aan dezelfde payment ledger.

**EVT-006 — Waivers**  
Vereis event-specific waivers of medical forms waar nodig.

**EVT-007 — Check-In**  
Gebruik QR/event check-in en attendance.

**EVT-008 — Staffing**  
Plan coaches, volunteers, officials en resources.

**EVT-009 — Communication**  
Stuur confirmations, reminders, changes en follow-up.

**EVT-010 — Event Analytics**  
Meet registrations, attendance, revenue, lead generation en conversion.

## COM — Communication, Community & Engagement
**Target:** R2 — Growth & Engagement

**COM-001 — Unified Communication**  
Koppel WhatsApp, e-mail, push en in-app messages aan member/lead context.

**COM-002 — Announcements**  
Stuur announcements per locatie, program, class, family of segment.

**COM-003 — Automated Messages**  
Automatiseer welkom, trial reminder, missed class, renewal, birthday en payment notices.

**COM-004 — Community Feed**  
Bied optionele clubcommunity voor posts, achievements en events.

**COM-005 — Groups**  
Ondersteun groups voor kids parents, competition team, beginners en coaches.

**COM-006 — Challenges**  
Maak attendance-, skills- of healthy-habit challenges mogelijk.

**COM-007 — Privacy Controls**  
Laat members bepalen welke achievements/communitydata zichtbaar zijn.

**COM-008 — Minor Communication**  
Dwing guardian-aware communicatie en safeguardingregels af bij minderjarigen.

**COM-009 — Templates**  
Beheer approved message templates en tone of voice.

**COM-010 — Engagement Analytics**  
Meet delivery, read/response en engagement zonder onnodige surveillance.

## RET — Retention, Churn & Member Success
**Target:** R2 — Growth & Engagement

**RET-001 — At-Risk Detection**  
Signaleer attendance decline, failed payments, low engagement en approaching expiry.

**RET-002 — Retention Tasks**  
Maak automatisch member-success tasks voor coaches/frontdesk.

**RET-003 — Check-In Conversations**  
Laat staff korte wellbeing/goal check-ins vastleggen.

**RET-004 — Cancellation Workflow**  
Verzamel cancellation reason, effective date en eventuele save-offer.

**RET-005 — Freeze Recovery**  
Plan reactivation rond einde freeze/medical hold.

**RET-006 — Win-Back**  
Ondersteun segmentgerichte alumni/win-backcampagnes.

**RET-007 — NPS CSAT**  
Meet member satisfaction op geschikte momenten.

**RET-008 — Milestones**  
Gebruik promotions, 25/50/100 classes en anniversaries voor retentionmomenten.

**RET-009 — Cohort Analytics**  
Meet retention per join cohort, package, program, age group en source.

**RET-010 — Retention Playbooks**  
Beheer configureerbare playbooks voor nieuwe members, youth families en competition athletes.

## POS — Point of Sale, Retail & Gear
**Target:** R2 — Growth & Engagement

**POS-001 — POS**  
Verkoop gear, drinks, wraps, gloves, shin guards, shirts en services via frontdesk POS.

**POS-002 — Product Catalog**  
Beheer retail SKU, barcode, price, tax config en stock.

**POS-003 — Member Purchase**  
Koppel aankopen optioneel aan memberaccount.

**POS-004 — Inventory**  
Houd on-hand en adjustments per locatie bij.

**POS-005 — Discounts**  
Ondersteun member pricing, staff discount en promotions.

**POS-006 — Bundles**  
Verkoop starter kits met membership of event registration.

**POS-007 — Receipts**  
Gebruik dezelfde receipt- en paymentinfrastructuur.

**POS-008 — Returns**  
Ondersteun retail returns/refunds met permissions.

**POS-009 — Low Stock**  
Signaleer reorder thresholds voor veelgebruikte gear.

**POS-010 — Sales Analytics**  
Meet retail omzet, marge en attach rate bij memberships.

## FAC — Facility, Equipment & Operations
**Target:** R1 — Commercial Core

**FAC-001 — Locations**  
Beheer locaties, training areas, ring, mats, bag zones, changing areas en capaciteit.

**FAC-002 — Equipment Register**  
Beheer equipment, aankoopdatum, status en locatie.

**FAC-003 — Inspection**  
Plan equipment- en facility inspections.

**FAC-004 — Maintenance**  
Maak maintenance tickets en servicehistory.

**FAC-005 — Cleaning**  
Plan schoonmaak- en mat hygiene checklists.

**FAC-006 — Opening Closing**  
Gebruik opening/closing checklists per locatie.

**FAC-007 — Access Devices**  
Integreer optioneel deur/gate access via adapters.

**FAC-008 — Occupancy**  
Monitor class- en facility capacity voor safety en planning.

**FAC-009 — Incident Link**  
Koppel facility/equipment aan relevante incidenten.

**FAC-010 — Asset Analytics**  
Meet downtime, maintenance cost en recurring defects.

## FIN — Finance, Revenue & Management Accounting
**Target:** R2 — Growth & Engagement

**FIN-001 — Revenue Categories**  
Rapporteer memberships, PT, events, retail en andere omzet apart.

**FIN-002 — Receivables**  
Volg open dues, aging en collections.

**FIN-003 — Cash Reconciliation**  
Reconcilieer frontdesk cash per shift/dag.

**FIN-004 — Provider Reconciliation**  
Reconcilieer wallet/card/bank settlements met platformpayments.

**FIN-005 — Refunds Credits**  
Beheer refunds, credits, write-offs en approvals.

**FIN-006 — Coach Pay**  
Bereken per-class, PT splits of andere coach compensation.

**FIN-007 — Tax Configuration**  
Maak tax rules configureerbaar; hardcode lokale belastingtarieven niet in kerncode.

**FIN-008 — Accounting Export**  
Exporteer journals/invoices/payments naar boekhouding of integreer via API.

**FIN-009 — P&L Analytics**  
Toon revenue, direct costs en contribution per location/program waar data beschikbaar is.

**FIN-010 — Forecasting**  
Forecast recurring revenue, expected collections, churn impact en capacity.

## DOC — Documents, Contracts & E-Sign
**Target:** R1 — Commercial Core

**DOC-001 — Document Repository**  
Sla contracts, waivers, medical clearances en certificates veilig op.

**DOC-002 — Templates**  
Beheer membership contracts, waivers, parental consent en event forms als templates.

**DOC-003 — E-Sign**  
Integreer optioneel e-sign providers via adapters.

**DOC-004 — Versioning**  
Bewaar documentversies en welke versie door wie is geaccepteerd.

**DOC-005 — Expiry**  
Volg expiry van medical, qualifications en competition documents.

**DOC-006 — Secure Access**  
Gebruik tijdelijke signed URLs en permission checks voor gevoelige documenten.

**DOC-007 — Entity Links**  
Koppel documenten aan member, guardian, coach, event, fighter en incident.

**DOC-008 — Bulk Signing**  
Ondersteun campaign-style acceptance bij belangrijke policy updates.

**DOC-009 — Audit**  
Log view, upload, sign, replace en download voor kritieke documenten.

**DOC-010 — Retention**  
Maak documentretentie configureerbaar per categorie en legal policy.

## SAF — Youth Safeguarding & Conduct
**Target:** R0 — Strategy & Safety

**SAF-001 — Guardian Consent**  
Vereis aantoonbare guardian consent voor minderjarige deelname waar toepasselijk.

**SAF-002 — Adult Minor Interactions**  
Ondersteun policies die ongeobserveerde één-op-één volwassen/minderjarige interacties beperken.

**SAF-003 — Communication Rules**  
Routeer of kopieer communicatie met minors volgens club safeguarding policy naar guardians/toegestane channels.

**SAF-004 — Pickup Authorization**  
Beheer wie minderjarige members mag ophalen of begeleiden.

**SAF-005 — Staff Screening**  
Volg background/safeguarding checks en expiraties waar wettelijk en operationeel passend.

**SAF-006 — Code of Conduct**  
Laat coaches, parents en athletes relevante gedragsregels accepteren.

**SAF-007 — Incident Reporting**  
Bied veilige reporting en escalation van bullying, harassment, misconduct of safeguarding concerns.

**SAF-008 — Case Confidentiality**  
Beperk safeguardingcases tot expliciet bevoegde rollen met sterke audit.

**SAF-009 — Training**  
Volg mandatory safeguarding education voor staff/coaches.

**SAF-010 — Youth Privacy**  
Beperk publicatie van foto's, rankings, body metrics en contactdata van minors op basis van consent en policy.

## INT — Integration Hub & External Ecosystem
**Target:** R2 — Growth & Engagement

**INT-001 — API First**  
Bied kernfunctionaliteit via versioned API's aan.

**INT-002 — Webhooks**  
Ondersteun signed inbound/outbound webhooks met retries en idempotency.

**INT-003 — Meta Adapter**  
Koppel Meta leads/conversion events via beheerde adapter.

**INT-004 — WhatsApp Adapter**  
Koppel WhatsApp Business Platform via Cloud API/webhooks.

**INT-005 — Payment Adapters**  
Koppel lokale en internationale paymentproviders zonder kernbilling te herschrijven.

**INT-006 — Calendar Adapters**  
Koppel Google/Microsoft calendars zonder interne schedule source of truth te verliezen.

**INT-007 — Wearable Adapters**  
Maak Apple/Google/Fitbit/Garmin-achtige integraties vervangbaar via adapterlaag.

**INT-008 — Access Control Adapters**  
Koppel QR/NFC/gate devices zonder membershiplogic in hardwareintegratie te plaatsen.

**INT-009 — Accounting Adapter**  
Koppel boekhoudsoftware met mapping, syncstatus en errors.

**INT-010 — Integration Health**  
Toon connected status, laatste sync, errors, retries en credential expiry.

## ANA — Analytics, BI & Decision Support
**Target:** R2 — Growth & Engagement

**ANA-001 — Executive Dashboard**  
Toon active members, MRR/revenue, overdue, churn, leads, conversions en attendance.

**ANA-002 — Sales Funnel**  
Meet Lead → Trial → Member → 30/90-day retained.

**ANA-003 — Membership Analytics**  
Meet package mix, ARPU, freezes, upgrades en renewal rate.

**ANA-004 — Attendance Analytics**  
Meet frequency, class utilization, no-show en cohortattendance.

**ANA-005 — Billing Analytics**  
Meet collection rate, overdue aging, failure rate en recovery.

**ANA-006 — Retention Analytics**  
Meet churn, at-risk cohorts en cancellation reasons.

**ANA-007 — Coach Analytics**  
Meet classes, capacity, attendance en member feedback met context.

**ANA-008 — Training Analytics**  
Meet plan adherence, progress en program outcomes zonder medische claims.

**ANA-009 — Combat Analytics**  
Meet rank progression, fighter activity en competition outcomes.

**ANA-010 — Marketing Analytics**  
Meet source/campaign cost en conversion tot betaalde membership.

## NFR — Security, Privacy, Reliability & Accessibility
**Target:** R0 — Strategy & Safety

**NFR-001 — Security Framework**  
Gebruik NIST CSF 2.0 als cyber-risk governance reference.

**NFR-002 — Application Security**  
Gebruik OWASP ASVS 5.0 als verificatiebasis voor web/mobile backend security.

**NFR-003 — ISMS**  
Richt security governance in lijn met ISO/IEC 27001:2022-principes.

**NFR-004 — Privacy Management**  
Gebruik ISO/IEC 27701:2025-principes voor PII en gevoelige health/memberdata.

**NFR-005 — Payment Security**  
Gebruik PCI DSS 4.0.1 controls wanneer cardholder data scope van toepassing is.

**NFR-006 — Tenant Isolation**  
Test tenantisolatie automatisch op API-, data- en objectstorage-niveau.

**NFR-007 — Encryption**  
Versleutel gevoelige data in transit en at rest met professioneel secrets/key management.

**NFR-008 — Availability**  
Definieer SLO's, backups, restoretests, monitoring en incident response.

**NFR-009 — Low Bandwidth**  
Optimaliseer app/web voor compressie, resumable uploads en beperkte connectivity.

**NFR-010 — Accessibility**  
Ontwerp publieke en self-service interfaces richting WCAG 2.2 AA.

## Product Editions
**STARTER** — CRM, website, registration, member management, packages, basic payments, schedule, attendance.

**PRO** — Automations, Meta/WhatsApp, member app, family billing, retention, POS, finance dashboards.

**COMBAT** — Curriculum, skills, rank/level progression, sparring eligibility, fighter/competition management.

**PERFORMANCE+** — Adaptive training plans, nutrition guidance, progress analytics, wearables and AI coach.

**ENTERPRISE** — Multi-location, SSO, advanced integrations, data warehouse, governance and enterprise support.

## Definitief Baselinebesluit
De sportschool wordt niet gedigitaliseerd met losse apps voor agenda, betalingen, workout plans en social media. De centrale kern bestaat uit Lead, Person/Household, Member, Membership, Payment Ledger, Class, Attendance, Training Plan, Skill Progression, Health/Safety Profile en Communication Timeline. Alle kanalen en add-ons werken rondom diezelfde kern.
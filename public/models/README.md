# 3D-modelslot voor de workout-speler

Zolang hier **geen `manifest.json`** staat, gebruikt de app de ingebouwde **procedurele 3D-avatar**
(geen modelbestand nodig). Zet je hier een geript model + animaties + een `manifest.json`, dan
schakelt de speler automatisch over op dat model. De aansturing (rep/tempo-sync) blijft gelijk.

## Zo voeg je een Mixamo-model toe (gratis)

1. Ga naar **mixamo.com** (gratis Adobe-account) en kies een character (bv. een realistisch model).
2. **Download het basismodel mét skin** één keer:
   - Format **glTF Binary (.glb)**, Pose **T-pose** (of een idle-animatie).
   - Bewaar als `character.glb` in deze map.
3. **Download per oefening de animatie "Without Skin"** (kleiner; alleen de beweging):
   - Zoek bv. *Jumping Jacks, Squat, Cross Punch / Jab, Push Up, Plank/Idle*.
   - Format **glTF Binary (.glb)**, **Skin: Without Skin**, In Place aanzetten waar mogelijk.
   - Bewaar als: `jumping-jacks.glb`, `squat.glb`, `jab-cross.glb`, `pushups.glb`, `plank.glb`, `idle.glb`.
4. Kopieer **`manifest.example.json` → `manifest.json`** en pas de paden aan.
5. Commit + redeploy. Klaar — de speler gebruikt nu het model.

## Waarom losse animatiebestanden?
Mixamo exporteert per download één animatie, en noemt élke clip intern "mixamo.com".
Daarom laden we per beweging een apart GLB en koppelen we die zelf aan de juiste move-sleutel.
Alle Mixamo-rigs delen dezelfde botnamen, dus de animaties retargeten op het basismodel.

## Sleutels (move-keys) die de speler gebruikt
`jack` · `squat` · `punch` · `pushup` · `plank` · `idle`
(Ontbreekt een animatie, dan valt die oefening terug op `idle`.)

## Tips
- Houd bestanden compact (< ~5 MB elk) voor snel laden op de telefoon.
- `scale`/`yOffset` in het manifest corrigeren grootte/hoogte t.o.v. de vloer.
- Eigen model i.p.v. Mixamo mag ook, mits het een standaard humanoïde rig heeft.

# Push 2 — intégration (PARKÉE)

> ⚠️ Code **non fonctionnel / parké**. Pas chargé par le device actuel.
> Si tu remets ces `js` dans le patch, déplace-les d'abord à la racine
> (à côté du `.amxd`) ou ajoute ce dossier au search path de Max.

## Deux approches testées

### 1. `push2_map.js` — MIDI brut (ABANDONNÉE)
Envoyer des note-on de couleur au port User du Push via `noteout`/`midiout`.
**Ne marche pas** : un device M4L ne peut pas viser un port matériel (sa sortie
est verrouillée sur la piste → les note-ons jouent l'instrument au lieu d'aller
au Push). À oublier.

### 2. `push2_api.js` — API Control Surface (À REPRENDRE)
Bonne approche. Le device « emprunte » la matrice de pads à Live :
- Push 2 doit être **Control Surface** dans Live (Préférences MIDI), **pas** User mode.
- On trouve le Push : itérer `control_surfaces N`, repérer celui qui a le
  contrôle `Button_Matrix` (333 contrôles).
- `get_control_by_name "Button_Matrix"` → id (négatif, normal).
- LEDs : `matrix.call("send_value", col, row, color)`.
- Pressions : observer `matrix.property = "value"`.

**Blocage actuel** : `grab_control` ne prend pas réellement la main. Les pads
gardent le layout de notes de Live, et ni les LEDs ni les pressions ne passent.
C'est un piège connu du framework Push 2 (il faut probablement grab le
**sous-composant** qui possède la matrice à l'instant, pas le contrôle top-level).

## Ce qui est déjà prêt côté moteur (réutilisable tel quel)
- `broadcastGrid()` diffuse aussi `flatGrid` + `gCols`/`gBor` (grille 2D).
- `playcell(col, row)` : joue la case par position → notes via les `noteout`
  → **enregistrable** (on ne joue PAS via l'API, donc pas le défaut de Chord-O-Mat).
- Couleurs par type dans `push2_api.js` (`colorForFn`).

## Pour reprendre
1. Trouver un device M4L Push 2 open-source qui allume vraiment les pads.
2. Copier sa séquence exacte de `grab_control` / `send_value`.
3. Brancher : moteur outlet 7 → push2_api (grille) ; push2_api → moteur (jeu).
4. `init` au load via `live.thisdevice` ; re-`init`/`update` au focus via `active`.

## Références
- edsko.net — « Designing a custom Push2 instrument in Max for Live/JavaScript »
- Cycling '74 — « Max for Live Focus: The Push 2 as a Max Controller »
- Forums Cycling '74 : « push 2, how to grab controls? »

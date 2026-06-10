# Tuple Bot

Bot Discord officiel pour la communauté Tuple.

## Fonctions
**Harmonie (mini-Tuple)** — logique dans `harmony.js`, miroir de `device/chord_engine.js` :
- `/scale root scale` — notes d'une gamme
- `/diatonic root [scale]` — accords diatoniques + rangée borrowed (la grille Tuple)
- `/chord name` — décompose un nom d'accord (alias acceptés : `Cmaj7`, `Cm7b5`, `C-7`…)

**Communauté** :
- `/bug` — formulaire (modal) → post numéroté `Bug #00N` dans #bug-reports
- `/suggest` — formulaire → `Suggestion #00N` dans #feature-requests + votes 👍/👎
- `/support topic` — ouvre un fil public d'aide dans #general-help

**Infos (self-service)** — contenu éditable dans `config.js` (`INFO`, `ROADMAP`, `TIPS`) :
- `/version` — version Tuple · `/links` — liens officiels · `/roadmap` — à venir · `/tip` — astuce au hasard
- ⚠️ Avant la release : dans `config.js > INFO`, passer `version` à `"1.0"`, remplacer `site`, renseigner `maxforlive` et `donate` (null = masqué / "coming soon").

**Suggestions intelligentes** (`events/messageCreate.js`) — nécessite l'intent **Message Content** (Developer Portal → Bot) :
- **@mention** du bot → il répond toujours (accord → décomposé ; gamme → renvoi `/diatonic`/`/scale` ; sinon aide)
- **auto-détection** (seulement dans #harmony + #general-help) → suggère une commande sur motif franc : accord (`Cmaj7`), `X major/dorian…`, mots « bug/crash », « would be cool if… ». Cooldown 1/min/salon, racine majuscule + suffixe requis → pas de faux positifs (« am », notes seules ignorées).
- Salons configurables : `autoChannels()` dans `events/messageCreate.js`.

**Base** :
- `/faq` — FAQ (embed)
- `/help` — liste des commandes
- `/announce` — *(staff)* poste une annonce dans #announcements
- `/setup` — *(staff)* poste **ou met à jour** les contenus des salons (welcome, rules, faq, bug-reports, feature-requests, announcements)
- Auto-rôle Member + message de bienvenue à l'arrivée

**Permissions requises pour le bot** : Send Messages + Embed Links dans
#bug-reports et #feature-requests, **Add Reactions** dans #feature-requests,
**Create Public Threads + Send Messages in Threads** dans #general-help.
La numérotation bug/suggestion est persistée dans `posted-messages.json`
(clés `counter:*`).

## Lancer le bot (Windows)
- `start-bot.bat` — démarre le bot (installe les dépendances la 1re fois)
- `stop-bot.bat` — arrête le bot (où qu'il ait été lancé)
- `deploy-commands.bat` — (ré)enregistre les slash-commands ; à refaire à chaque ajout/modif de commande
- Règle : **texte visible par les membres = ANGLAIS** (serveur anglophone)

---

## Mise à jour depuis la v1

Cette version ajoute la commande `/setup` et de nouveaux fichiers
(`content.js`, `store.js`, `commands/setup.js`). Le `.env` a besoin de
**nouveaux IDs de salons** (voir `.env.example`) :

```
RULES_CHANNEL_ID=...
FAQ_CHANNEL_ID=...
BUG_REPORTS_CHANNEL_ID=...
FEATURE_REQUESTS_CHANNEL_ID=...
```

(WELCOME_CHANNEL_ID et ANNOUNCEMENTS_CHANNEL_ID existaient déjà.)

Ajoute-les à ton `.env`, puis :

```bash
npm install         # au cas où
npm run deploy      # ré-enregistre les commandes (ajoute /setup)
npm start
```

## Utiliser /setup

Dans Discord (en tant que staff) :
- `/setup target:all` → poste/maj tous les salons d'un coup
- `/setup target:faq` → un seul salon

Le bot retient l'ID de chaque message qu'il poste (dans `posted-messages.json`).
Au prochain `/setup`, il **édite** ce message au lieu d'en reposter un.
→ Édite `content.js`, relance `/setup`, le salon reflète la nouvelle version.

**Important — permissions :** pour les salons read-only (welcome, rules,
announcements), ajoute un override autorisant le rôle du bot à
**Envoyer des messages** + **Intégrer des liens**, sinon /setup échouera sur
ces salons.

## Modifier le contenu
- Contenus des salons : `content.js` → puis `/setup`.
- FAQ de la commande /faq et message de bienvenue : `config.js`.
- Emojis (IDs) : `emojis.js`.
- Après modif de la **structure** d'une commande : `npm run deploy`.
- Après modif de **texte** seulement : `npm start` suffit.

## Note
`posted-messages.json` est créé automatiquement et ignoré par git.
Ne le supprime pas si tu veux conserver le lien vers les messages déjà postés.

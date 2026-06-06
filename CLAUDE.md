Harmonia

Harmonia is a Max for Live harmonic composition tool.

The project is NOT a sequencer.

The primary goal is to provide a fast and musical workflow for selecting, exploring and performing chords.

Core Principles
The chord grid is the main feature.
Show the maximum number of valid chords for the selected key and scale.
Never hide chords behind a page or wizard — full access stays one click away (EXT toggle).
Borrowed chords remain inside the main grid.

NOTE (tradeoff temporaire, à améliorer) : pour rester lisible ET compatible Push
(8 lignes max), la grille cape à 8 accords par colonne par défaut, le toggle EXT
révèle le reste. Ce n'est PAS optimal — trouver une meilleure solution (densité /
sizing intelligent / page Push dédiée) reste un objectif. Voir docs/roadmap.md.
The UI should remain performance-oriented.
Keep a one-screen workflow whenever possible.
UI Structure
Tonality

Contains:

Key
Scale
Sync

Sync belongs to the tonality section because it imports the current Ableton Live scale.

Chord Style

Contains:

Octave
Voicing
Voice Leading
Voice Leading Mode

Order is important.

Reasoning:

Octave controls register.
Voicing controls note distribution.
Voice Leading controls movement.
Voice Leading Mode controls the movement algorithm.

These parameters should be treated as one coherent section.

Grid

The grid is always visible.

The grid should always display the maximum number of available chords for the selected scale.

Borrowed chords stay inside the grid.

Monitor

Contains:

Current notes
Hold

Hold is considered an output/performance feature.

Advanced Mode

Advanced mode reveals settings.

Advanced mode must NOT hide chords.

Examples:

Push 2 settings
Expert Voice Leading settings
Future advanced harmonic features
Debug tools
Push 2

Push 2 integration is planned.

Current design philosophy:

Columns:

I
II
III
IV
V
VI
VII
Borrowed

Rows:

Chord types

Push should extend the grid, not replace it.

Development Rules
Avoid spaghetti patching.
Separate UI from harmonic logic.
Keep harmonic logic inside the engine.
Maintain a single source of truth.
Prefer maintainable solutions over clever solutions.
Current Priorities
Fix remaining bugs.
Improve UI.
Improve workflow.
Push 2 integration.
Future chord bank system.

## Session start

READ FIRST at the beginning of every session, in this order:
1. `docs/session-log.md` — où on en est + prochaines étapes (point d'entrée).
2. `docs/roadmap.md`, `docs/decisions.md`, `docs/bugs.md` au besoin.
3. `docs/architecture.md`, `docs/chord-types.md` pour le détail technique.

The engine (`chord_engine.js`) is the single source of truth. UI = `chord_ui.js`.

## Documentation Rules

Whenever an important architectural, UI or workflow decision is made:

- Update docs/decisions.md (append-only, chronological, keep rationale)
- Update docs/session-log.md (current state + next steps) at session end
- Do not overwrite previous decisions
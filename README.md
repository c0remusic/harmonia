# Tuple

A Max for Live harmonic composition tool for Ableton Live.

**Tuple** gives you instant access to every valid chord for your key and scale — organized in a grid, always one click away. It's not a sequencer. It's a tool for exploring, performing and recording chords in real time.

→ **[harmonia-three-theta.vercel.app](https://harmonia-three-theta.vercel.app)**

---

## Quick Start

### Installation (Ableton Live)

1. Download the latest `.amxd` from [Releases](https://github.com/c0remusic/tuple/releases)
2. Unzip and keep all files in the same folder
3. Drag `tuple.amxd` onto a **MIDI track** in Ableton Live, **before an instrument**

**Requires**: Ableton Live 11+ with Max for Live

### Development Setup

This is a **npm monorepo** with two workspaces:

```bash
# Install all workspaces
npm install

# Develop device (Max for Live)
cd device
# Edit chord_ui.js and chord_engine.js

# Develop website
npm run -w website dev

# Build website
npm run -w website build
```

---

## Project Structure

```
device/          → Max for Live device (source of truth)
docs/            → Markdown documentation
site/            → Website + screenshots (deployed to Vercel)
push/            → Push 2 integration (parked, needs rewrite)
package.json     → Root workspace config
```

**Development**: See `docs/session-log.md` for current state.  
**Architecture**: See `docs/decisions.md` and `docs/architecture.md`.  
**Git**: `/device/` and `/docs/` only (website deployed separately).

---

## Key Files

| File | Purpose |
|------|---------|
| `device/chord_engine.js` | Harmonic logic (source of truth) |
| `device/chord_ui.js` | UI rendering & interaction |
| `docs/session-log.md` | Current state & next steps |
| `docs/decisions.md` | Design decisions (append-only) |
| `docs/architecture.md` | Technical architecture |

---

## Features

- **Instant chord access** — grid of all valid chords for your key/scale
- **Voice leading** — 3 modes (ANCHOR, RELAT, PIANO) for smooth transitions
- **10 voicings** — Classic, Piano, Open, Spread, House, Prog, Rootless A/B, Drop 2/3
- **Borrowed chords** — modal interchange & secondary dominants always visible
- **Performance-friendly** — one-screen workflow, live playable
- **Ableton Live integration** — SYNC button imports key/scale from Live

---

## Support

Tuple is free. If it's useful to you, consider a donation:

☕ [paypal.me/HarmoniaDevice](https://paypal.me/HarmoniaDevice)

---

## License

MIT

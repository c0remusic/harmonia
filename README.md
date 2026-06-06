# Harmonia

**A Max for Live harmonic composition tool for Ableton Live.**

Harmonia gives you instant access to every valid chord for your key and scale — organized in a grid, always one click away. It's not a sequencer. It's a tool for exploring, performing and recording chords in real time.

→ **[harmonia-three-theta.vercel.app](https://harmonia-three-theta.vercel.app)**

---

## Installation

1. Download the latest `.zip` from the [releases page](https://github.com/c0remusic/harmonia/releases) or the [website](https://harmonia-three-theta.vercel.app)
2. Unzip — keep **all files in the same folder**
3. Drag `harmonia_v1.amxd` onto a **MIDI track** in Ableton Live, **before an instrument**

> Requires **Ableton Live 11+** with **Max for Live**

---

## Quick Start

1. Select your **KEY** and **SCALE**
2. Click any chord in the grid to play it
3. Adjust **VOICING** and **OCT** to shape the sound
4. Turn on **VL** for smooth chord-to-chord movement

---

## The Grid

The grid is the heart of Harmonia. Each **column** is a scale degree (I through VII), each **row** is a chord type.

- Click any cell to play that chord
- The **BORROWED** column adds modal interchange chords and secondary dominants — always visible, no hidden menus
- The **EXT** toggle reveals additional chord types when you need more

---

## Controls

### Tonality
| | |
|---|---|
| **SYNC ♪** | Import the current key & scale directly from Ableton Live |
| **KEY** | Root note — 12 options |
| **SCALE** | Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Harmonic Minor |

### Chord Style
| | |
|---|---|
| **OCT** | Octave offset from -3 to +3 |
| **VOICING** | How the notes are spread across registers (see below) |
| **VL** | Voice leading on/off — minimizes note movement between chords |
| **VLMODE** | Voice leading algorithm: **ANCHOR**, **RELAT**, or **PIANO** |

### Monitor
| | |
|---|---|
| **Note display** | Shows the notes of the current chord in real time |
| **Mini keyboard** | Visual feedback on active pitches |
| **HOLD / LATCH** | HOLD sustains the chord · LATCH toggles it on/off |

---

## Voicings

| Name | Description |
|---|---|
| Classic | Close position |
| Piano | Low bass + grouped upper voices |
| Open | 2nd voice raised one octave |
| Spread | Alternating voices spread wide |
| House | Chord + bass doubling |
| Prog | Wide bass/treble split |
| Rootless A | No root · 3–5–7–9 |
| Rootless B | No root · 7–9–3–5 |
| Drop 2 | 2nd voice from top lowered one octave |
| Drop 3 | 3rd voice from top lowered one octave |

---

## Recording Your Chords

Ableton doesn't record MIDI Effect output directly in the source clip. Here's the workaround:

1. Create a **2nd MIDI track**
2. Set its **MIDI From** to the Harmonia track
3. Arm the 2nd track and hit record

---

## Tips

- Hit **SYNC** to instantly match whatever key Ableton Live is in
- **ANCHOR** mode is great for ambient and minimal music
- **RELAT** mode works beautifully for jazz and neo-soul
- Try OCT **-1** or **-2** for warmer, denser textures
- The **BORROWED** column is your shortcut to chromatic color without leaving the grid

---

## Support

Harmonia is free. If it's useful to you, consider a small donation — it helps keep the project going.

☕ [paypal.me/HarmoniaDevice](https://paypal.me/HarmoniaDevice)

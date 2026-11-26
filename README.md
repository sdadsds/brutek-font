# Typography101 — Complete Typeface & Vietnamese Edition

A bold modular neo-grotesque display typeface expanded from `TYPOGRAPHY101.ai` into a complete, installable, typeable font family (**315 glyphs** per style) in **Regular** and **20° Italic**, with full **Extended Latin** and **Vietnamese Keyboard (Telex / VNI)** support.

![Typography101 Complete Specimen](specimens/typography101-specimen-poster.png)

## Design DNA
- **Original Lowercase (`a–z`)**: Losslessly extracted from `TYPOGRAPHY101.ai` preserving the exact original cubic Bézier geometry, `216 × 216` lowercase module, `93–94u` ultra-heavy vertical stems, `24u` horizontal bars, and `30u` signature asymmetric counter slits.
- **Capitalizations (`A–Z`) & Numerals (`0–9`)**: Engineered at `324u` cap/figure height (`100u` stems, `28u` bars, `40u` asymmetric counter slits) with C1-smooth curves, selective directional corner rounding, and chamfered diagonal wedges (`A, V, W, Y`).
- **Special Letters & Extended Latin**: Bespoke `ß, Æ, æ, Œ, œ, Ø, ø, Ð, ð, Þ, þ, Ł, ł` plus Western/Central European accented letters and matching punctuation, math, and currency symbols.
- **Vietnamese Keyboard Edition (`Typography101 VN`)**: All 135 Vietnamese characters (`Đ, đ, ₫`, plus all 6 tones across `A, Ă, Â, E, Ê, I, O, Ô, Ơ, U, Ư, Y` upper & lower) with authentic side-nested circumflex + tone diacritics and attached curved horns.
- **20° Italic**: True `20°` oblique slant matching Page 2 of `TYPOGRAPHY101.ai`.

![Typography101 VN Vietnamese Specimen](specimens/typography101-vietnamese-specimen.png)

---

## Downloads & Installation

Grab the ready-to-use ZIP archive from `release/Typography101-Complete-Font-Pack.zip` (or the [GitHub Releases](../../releases) page), or install directly from `dist/`:

### Font Families Included (315 Glyphs Each)
| Family | Style | OTF (Print / Design) | TTF (Desktop / Office) | WOFF2 (Web) |
| --- | --- | --- | --- | --- |
| **Typography101** | Regular | `dist/Typography101-Regular.otf` | `dist/Typography101-Regular.ttf` | `dist/Typography101-Regular.woff2` |
| **Typography101** | 20° Italic | `dist/Typography101-Italic.otf` | `dist/Typography101-Italic.ttf` | `dist/Typography101-Italic.woff2` |
| **Typography101 VN** | Regular | `dist/Typography101VN-Regular.otf` | `dist/Typography101VN-Regular.ttf` | `dist/Typography101VN-Regular.woff2` |
| **Typography101 VN** | 20° Italic | `dist/Typography101VN-Italic.otf` | `dist/Typography101VN-Italic.ttf` | `dist/Typography101VN-Italic.woff2` |

> Both **Typography101** and **Typography101 VN** include full English, Extended Latin, and Vietnamese (Telex / VNI) support.

### Installing on Windows / macOS
- **Windows**: Select the `.otf` (or `.ttf`) files in `dist/`, right-click → **Install** (or double-click each file and click **Install**).
- **macOS**: Double-click the `.otf` files to open in **Font Book** and click **Install Font**.

---

## Project Structure
- `dist/` — Compiled installable fonts (`.otf`, `.ttf`, `.woff2`)
- `vectors/` — Adobe Illustrator-ready organized SVG sets (`set1` through `set6`) + `vectors/glyphs/` (312 individual clean SVG glyphs)
- `specimens/` — High-resolution specimen posters (PNG & SVG) and OTF/TTF binary verification proof
- `demo/index.html` — Interactive browser live type-tester (English & Tiếng Việt presets, Regular/Italic toggle, size & tracking sliders)
- `source/TYPOGRAPHY101.ai` — Original Adobe Illustrator source artwork
- `src/` — Modular vector geometry engine, glyph definitions, optical metrics/kerning, and font/specimen build scripts
- `release/Typography101-Complete-Font-Pack.zip` — Complete zipped distribution pack

---

## Rebuilding from Source
```bash
npm install
npm run build
```

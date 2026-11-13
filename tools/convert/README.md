# Converter

Turns exercises of the old app into item folders of a Compass pack, and generates `course.toml`.
The format is defined in `docs/ARCHITECTURE.md` (the sections "A pack" and "Conversion").

```
npm run convert -w @compass/convert -- --from <old repo> --track verilog --out content/verilog <slug>...
npm run convert -w @compass/convert -- --from <old repo> --track verilog --out content/verilog --all
npm run convert -w @compass/convert -- --from <old repo> --track vhdl --out content/vhdl --all
```

A relative `--out` resolves from the repository root (the nearest ancestor holding `compass.config.toml`).
The command prints one line per exercise and a summary, and exits with 1 when an exercise was refused or failed.

## Behaviour

- Reads `tracks/<track>/config.json`, the exercise folders, `concepts/` and `VERILOG_SYLLABUS.md`; never writes to the
  old repository (VHDL uses the curriculum section of its track README), and refuses an `--out` inside it. It never writes outside `--out`.
- Maps `icarus-cocotb-v1`, `icarus-native-v1`, `ghdl-cocotb-v1` and `ghdl-native-v1` to the corresponding
  versioned Compass kinds. Unknown runners and runners of a different language are refused.
- Native items override the course runner and hide the circuit pane unless the source explicitly enables it.
  VHDL retains its top entity, source analysis order and `.vhd`/`.vhdl` stage files. Only snapshots attached to
  declared tasks are imported; obsolete snapshots in practice folders with no tasks are omitted.
- JSON wrong solutions and stage snapshots remain bundles of solution text and editable support-file text,
  validated before replacement. The mapping is documented in `docs/ARCHITECTURE.md`.
- A full learning-path conversion becomes published; partial conversions stay draft. VHDL has real items and no
  planned entries; SystemVerilog is not touched.
- Copies code and test files byte for byte. Markdown goes through the table in `src/substitutions.ts`
  (`**Schematic**` to `**Circuit**`, `**Waveforms**` to `**Waveform**`); the syllabus is copied unchanged.
  Every substitution is reported.
- Writes each `item.toml` and `course.toml` with `smol-toml` in the key order of the architecture document, and
  validates the written TOML with `ItemManifest` and `CourseManifest`.
- `course.toml` lists the items present in `<out>/items/` in learning-path order, and the concepts they teach,
  practise or require. Rerunning gives the same bytes.

## Tests

`npm test -w @compass/convert` converts a small fake old track in a temp directory.

## Pack-owned files

`icon.svg` in an item folder, and `icon.svg` and `category-icon.svg` at the pack root, come from the pack and not from
the old app. The converter keeps an item's icon when it rebuilds the item and never touches the root icons; the names
are listed in `src/pack-files.ts`. The generated `course.toml` carries the `[category]` table (`rtl-design`).

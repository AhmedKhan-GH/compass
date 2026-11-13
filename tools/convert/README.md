# Converter

Turns exercises of the old app into item folders of a Compass pack, and generates `course.toml`.
The format is defined in `docs/ARCHITECTURE.md` (the sections "A pack" and "Conversion").

```
npm run convert -w @compass/convert -- --from <old repo> --track verilog --out content/verilog <slug>...
npm run convert -w @compass/convert -- --from <old repo> --track verilog --out content/verilog --all
```

A relative `--out` resolves from the repository root (the nearest ancestor holding `compass.config.toml`).
The command prints one line per exercise and a summary, and exits with 1 when an exercise was refused or failed.

## Behaviour

- Reads `tracks/<track>/config.json`, the exercise folders, `concepts/` and `VERILOG_SYLLABUS.md`; never writes to the
  old repository, and refuses an `--out` inside it. It never writes outside `--out`.
- Refuses an exercise whose runner is not `icarus-cocotb-v1`, and converts nothing for it.
- Copies code and test files byte for byte. Markdown goes through the table in `src/substitutions.ts`
  (`**Schematic**` to `**Circuit**`, `**Waveforms**` to `**Waveform**`); the syllabus is copied unchanged.
  Every substitution is reported.
- Writes each `item.toml` and `course.toml` with `smol-toml` in the key order of the architecture document, and
  validates the written TOML with `ItemManifest` and `CourseManifest`.
- `course.toml` lists the items present in `<out>/items/` in learning-path order, and the concepts they teach,
  practise or require. Rerunning gives the same bytes.

## Tests

`npm test -w @compass/convert` converts a small fake old track in a temp directory.

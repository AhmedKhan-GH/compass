# Admit a library

Compass has no package manager and no system-package dependencies: every third-party library is **admitted** into the curated catalog (`PLATFORM.md` §5.2), built statically from source by Layer 0, and consumed only through a namespaced CMake target. This page is the recipe; the [library catalog](../reference/library-catalog.md) is the current state.

## The admission test — all five must hold

1. **A real consumer exists.** An instrument or the framework needs it *now*. Nothing enters speculatively — extract-don't-invent applies to dependencies too.
2. **Statically linkable**, with a license compatible with shipping inside a closed static binary.
3. **Built by Layer 0** — pinned version, built from source under `cmake/External/`, no system-package assumptions.
4. **Wrapped as a `compass::` target** carrying complete usage requirements (include paths, definitions, link deps) — consumers write `target_link_libraries(... compass::foo)` and include headers; never a raw path.
5. **Cataloged** — one row in the catalog table, one paragraph in the docs saying what it's for and what *not* to use it for.

## The admission PR — one PR, four parts

Per `PLATFORM.md` §5.8, a single PR adds:

1. The `cmake/External/<lib>.cmake` build (pinned version, static, from source)
2. The `compass::<lib>` wrapper target with full usage requirements
3. The catalog row in [the catalog page](../reference/library-catalog.md) *and* `PLATFORM.md` §5.2
4. **The first real use** — the consumer that justified admission

## What not to do

- **No vendored snippets** — a `.h` copied into the tree is an unpinned, unlicensed, unbuildable dependency.
- **No system packages** — `find_package` against Homebrew/apt breaks the fresh-install guarantee (system OpenGL is the one sanctioned exception).
- **No "while I'm at it" admissions** — a library without a consumer in the same PR fails condition 1.

## Anticipated admissions (waiting on their consumers)

| Library | Consumer that will justify it | When |
|---|---|---|
| GLAD (GL 3.3-core loader) | `Canvas3D` GL modernization — replaces GLEW | I1 |
| EDF/WFDB parser | Signal Workbench | I3 |
| SQLite **or** DuckDB | first instrument needing persistence beyond documents (DuckDB tiebreaker: opens Caliper's run/artifact stores read-only) | on demand |

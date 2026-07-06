# Development basics

What building on Compass actually looks like: what code you write, what the framework already gives you, where every library comes from, and the edit-build-run loop. Read this before [Your first app](first-app.md).

## The mental model

Compass has **no plugin host and no ABI**. Your instrument code, the framework (`libcompass`), and the curated libraries all **compile together into one static binary** by one toolchain in one build. `libcompass` is a library you *code against*, not a running program you plug into — so everything is ordinary modern C++ (real classes, `std::` types, RAII across every interface), and the compiler re-checks every caller on every build.

That means the division of labor is the opposite of a plugin system's. You don't avoid touching the window or the GL context because a host owns them — you *reuse* the framework's versions because writing them again is wasted work. The rule of thumb (`PLATFORM.md` §5.3): **if the second instrument would copy-paste it from the first, it belongs in `libcompass`.**

**What `libcompass` already provides** (`libcompass/include/compass/`):

| Class | Gives you |
|---|---|
| `compass::App` | the `wxApp` subclass — startup, app/vendor identity, follow-system dark mode, PNG handler |
| `compass::Document` / `UndoableDocument<State>` | document state with dirty-tracking and memento undo/redo; you subclass it with your own `State` |
| `compass::DocumentFrame` | the workspace shell — AUI docking, menu/toolbar construction, layout persistence, native file dialogs wired to your document |
| `compass::Canvas2D` | the OpenGL 3.3-core viewport — owns the context, loads GLAD once, and applies the pixel-space rule in one place |

**What you write** depends on which shape you're building:

- **A document instrument** (the real thing): a `Document` subclass (your state + load/save + undo commands), the view panels, and — if the document is spatial — a `Canvas2D` draw callback. Start from `templates/instrument/`.
- **A bare visual app** (a demo): just a `wxApp` + `wxFrame` + a `Canvas2D` subclass, no document at all. [Your first app](first-app.md) walks exactly this shape.

## Where every library comes from

The short answer to "is it using libraries we have installed?": **no — there are no system packages and no package manager.** Every third-party dependency is built from source *inside the repo* by the [three-layer build system](../reference/build-system.md) (Layer 0) and exposed as a namespaced `compass::` **catalog target**. You link the target and include its headers; you never name a raw path.

| Target | Comes from | Role |
|---|---|---|
| `compass::wx` | `third_party/wxWidgets` (submodule), built static in-tree | all native UI — frames, AUI, property grids, dialogs, `wxGraphicsContext` 2D |
| `compass::gl` | `third_party/glad` (vendored) | the GL 3.3-core loader; only GL instruments link it (via the framework shell) |
| `compass::glm` | `third_party/glm` (pinned) | geometry math for viewport code |
| `compass::json` | `third_party/nlohmann` (vendored) | document/sidecar serialization |

See the [library catalog](../reference/library-catalog.md) for the full list and what *not* to use each for. A new library enters the catalog only through the [admission policy](../howto/admit-a-library.md) — one PR adds the `cmake/External/` build, the `compass::` wrapper, the catalog row, and the first real use. No vendored snippets, no "please install X first."

## The one CMake entry point

An instrument's entire build is one call — `compass_add_instrument()` links `libcompass` plus any catalog targets you name and applies the static-binary flags (`/MT`, static wx). This is the template's build file, embedded verbatim so it can't drift:

```cmake
--8<-- "templates/instrument/CMakeLists.txt"
```

Registration is **explicit, not magic**: you add your directory with `add_subdirectory()` in the root `CMakeLists.txt` and register document factories in an explicit list. Compass never relies on self-registering static initializers — under static linking the linker dead-strips unreferenced object files, which would silently eat them (`PLATFORM.md` §5.4).

## The development loop

```bash
# 1. start from a skeleton — copy the template, rename the target
cp -r templates/instrument instruments/my_instrument
#    edit its CMakeLists.txt: compass_add_instrument(my_instrument ...)
#    then add `add_subdirectory(instruments/my_instrument)` to the root CMakeLists.txt

# 2. build just your target
cmake --build build --target my_instrument -j

# 3. run it
./build/instruments/my_instrument/my_instrument   # .exe on Windows
```

In CLion, reload the CMake project once after adding the directory and the `my_instrument` target appears in the run dropdown.

**Testing without a window:** document logic is wx-light by construction — the `Canvas2D` callback is the only render-bound code. Your `Document` subclass (parsing, state, undo, serialization) is unit-tested headlessly with doctest under CTest; see the suites in `tests/` and run them with `ctest --test-dir build`.

## The rules (each guards something real)

- **Link only `compass::` catalog targets** — never a raw `third_party/` include. The catalog is the only door, and CI greps instrument sources to enforce it (`PLATFORM.md` §5.6).
- **Need a new library? Admission first** ([how-to](../howto/admit-a-library.md)) — no vendored headers, no system packages.
- **Custom GL goes through `Canvas2D`** — it owns the 3.3-core context and the pixel-space conversion. Never create your own GL context or multiply by the content-scale factor yourself; the context is forward-compatible, so fixed-function GL won't even link.
- **Explicit registration, no self-registering statics** — static linking dead-strips them.
- **Ship nothing the OS doesn't** — the [static-binary principle](../explanation/static-binary.md): no runtime the target machine must install first.

## Reading order

1. [Building from source](building-from-source.md) — get the tree compiling.
2. This page — the lay of the land.
3. [Your first app](first-app.md) — walk `hello_gl` (window + button + animated GL) piece by piece.
4. `templates/instrument/` — the document-instrument skeleton; copy it to start the real thing.
5. Reference: the [build system](../reference/build-system.md) and the [library catalog](../reference/library-catalog.md), when you need exact semantics.

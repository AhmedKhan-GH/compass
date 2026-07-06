# The static-binary principle

Compass's founding constraint (CD1), the way zero-copy is Caliper's: a user on a factory-fresh macOS or Windows machine downloads **one file** and double-clicks it. The audience — a collaborator, clinician, student, reviewer — is often on a locked-down machine where "please install X first" is a dead end.

## Per-platform mechanism

| Platform | Mechanism |
|---|---|
| macOS | static wx + system frameworks only → single Mach-O. Codesign/notarize at I4. |
| Windows | static CRT (`/MT`) + static wx (msw) → single `.exe`, no VC++ redistributable. With no plugin boundary, `/MT` is simply the default (CD3). |
| Linux (later) | GTK3 cannot be honestly statically linked; ships later as an AppImage-style bundle — same one-file UX, honestly labeled. Until then Linux is a dev platform. |

## Forbidden, permanently

Any feature requiring a runtime the OS doesn't ship: no .NET, JVM, Python, WebView2 — no "please install X first" dialog, ever. An instrument that needs a heavyweight optional capability ships it statically or doesn't ship it.

Distribution follows the same identity (CD11): a zipped single `.exe` on Windows, a notarized `.dmg` on macOS, **no installers, ever**. An in-app update *check* is permitted polish; an auto-update daemon is not.

## Verifying it

Every shipped binary must pass the dependency audit:

```bash
# macOS: nothing outside /usr/lib and /System/Library may appear
otool -L <binary> | grep -vE '/usr/lib/|/System/Library/'
```

Expected output: none. Any Homebrew or `@rpath` line is a release blocker. The `hello_world` demo (6.1 MB, zero non-system deps) is the standing proof the toolchain delivers this.

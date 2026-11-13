# Rules for agents working on Compass

Read `docs/ARCHITECTURE.md` before changing anything. It is the contract between the parts.

## Boundaries

- Courses are data. Never add course-specific code, names or lists to `apps/web` or `packages/ui`.
- Only `packages/content` reads packs. `apps/web` reads the content index through `apps/web/src/server/content.ts`
  and imports neither `packages/content` nor `services/runner`.
- The checks file of an item must never reach the browser. Pages and API responses use `CourseView` and `ItemView`.
- The site never runs pack code. Checks run only in the runner's containers.
- The runner service binds to `127.0.0.1` only.
- A released runner image is not changed in a way that alters results. A tool upgrade is a new kind (`@2`) in a new
  directory, with a new registry entry.
- Contracts live in `packages/schema`. Change a contract and `docs/ARCHITECTURE.md` in the same commit.

## Style of the interface

- Use the role names from `vendor/sternbild/1.0.0/sternbild.css` (`--sb-surface`, `--sb-text`, `--sb-accent`).
  Never write a raw colour value, and never use the `--sb-palette-*` names.
- Bronze is the only accent. Corners are square. Rules are 1 px.
- Labels are nouns or short noun phrases. No taglines, slogans, colon subtitles, Roman numerals or explanatory
  sentences on the surface.
- Where a thumbnail goes, show the placeholder tile: square, dark, with a 1 px parchment border.
- Build the interface in the app and judge it by screenshots of the running app at 1440 × 900. No HTML mockups.

## Code

- TypeScript in strict mode. No `any`; validate data that crosses a boundary with the schemas in `packages/schema`.
- Workspace packages are consumed as TypeScript source; import with the `.ts` extension.
- Tests use `node:test` and run with `tsx`. A test that needs Docker is named `*.docker.test.ts` and runs under
  `npm run test:docker`, never under `npm test`.
- `npm run check` (lint, typecheck, unit tests) passes before every commit.

## Running

- The web app uses port 3100 and the runner 3101. Override the runner with `COMPASS_RUNNER_PORT` and
  `COMPASS_RUNNER_URL` when 3101 is taken.
- `npm run runner:images` builds the images, `npm run runner` starts the service, `npm run dev` builds the content
  index and starts the site.
- `compass content check` validates the packs; `--static` skips the runs.

## Commits

- Small commits, one per meaningful step, with a plain descriptive subject and a short body.
- Never commit secrets, `node_modules`, build output, `.compass/` or databases.
- Never put an email address or any personal detail in a web request or a header.

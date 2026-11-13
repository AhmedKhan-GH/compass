# Compass

Compass is Sternbild's practice platform: courses of short exercises, checked by a sandboxed runner. The first
course is RTL design with Verilog.

```
npm install
npm run runner:images     # build the runner images (needs Docker)
npm run runner            # start the runner service on 127.0.0.1:3101
npm run dev               # build the content index and start the site on 127.0.0.1:3100
npm run check             # lint, typecheck and unit tests
npm run content:check     # validate the packs, running every reference and wrong solution
```

The architecture is described in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and the rules for contributors and
agents in [`AGENTS.md`](AGENTS.md).

/* The circuit viewer. DigitalJS runs in this isolated frame (sandbox="allow-scripts", an opaque origin). ELK
   arranges the measured cells; simulation and source positions stay with the DigitalJS cells. The page sends
   { type: "compass-circuit", circuit?, active? } and receives { loaded }, { ready }, { error } and { selection }.
   Signal colours are the Sternbild data roles, read from the stylesheet. */
(() => {
  const TYPE = "compass-circuit";
  let circuit;
  let paper;
  let data;
  let active = true;
  let paused = false;
  let scale = 1;
  let fitted = true;
  let fields = [];
  let generation = 0;
  let layoutBounds;
  let cancelLayout;
  // Fitting shows the whole circuit, never larger than 100 % and never below this scale.
  const MIN_FIT_SCALE = 0.3;

  const role = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const SIGNAL = {
    high: role("--sb-data-verdigris"),
    low: role("--sb-data-smalt"),
    def: role("--sb-data-olive-ochre"),
    undef: role("--sb-data-madder"),
  };

  // Recolour every cell view's signal and lamp states. Each view class holds its own copy of the attrs.
  for (const View of Object.values(digitaljs.cells)) {
    const attrs =
      View && View.prototype && Object.prototype.hasOwnProperty.call(View.prototype, "attrs") && View.prototype.attrs;
    if (!attrs) continue;
    for (const group of ["signal", "lamp"]) {
      for (const [state, selectors] of Object.entries(attrs[group] || {})) {
        const colour = SIGNAL[state];
        if (!colour) continue;
        for (const selector of Object.values(selectors)) {
          if ("stroke" in selector) selector.stroke = colour;
          if ("fill" in selector) selector.fill = colour;
        }
      }
    }
  }

  // DigitalJS's WireView adds delete, reconnect and vertex tools on hover even when the paper is not interactive.
  // Keep the inspection events and never add tools.
  const ReadOnlyWireView = digitaljs.cells.WireView.extend({
    addTools() {
      return this;
    },
  });
  // Configure before the paper creates any views, nested circuit papers included.
  Object.assign(digitaljs.paperOptions, {
    linkView: () => ReadOnlyWireView,
    interactive: false,
    validateMagnet: () => false,
    validateConnection: () => false,
  });

  const byId = (id) => document.getElementById(id);
  const send = (message) => parent.postMessage({ type: TYPE, ...message }, "*");
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const report = (message) => {
    byId("error").textContent = message;
    byId("error").hidden = false;
  };

  function shutdown() {
    generation++;
    if (cancelLayout) {
      cancelLayout();
      cancelLayout = null;
    }
    if (circuit) circuit.shutdown();
    if (paper) paper.remove();
    circuit = null;
    paper = null;
    layoutBounds = null;
    byId("paper").replaceChildren();
  }

  function updateValues() {
    if (!circuit) return;
    for (const { cell, element, kind } of fields) {
      const value = (kind === "output" ? cell.getOutput() : cell.get("outputSignals").out).toBin();
      if (kind === "output") element.textContent = value;
      else if (element.tagName === "BUTTON") {
        element.textContent = value;
        element.setAttribute("aria-pressed", String(value === "1"));
      } else if (document.activeElement !== element && element.validity.valid) element.value = value;
    }
  }

  function playState() {
    if (!circuit) return;
    circuit.stop();
    if (active && !paused && layoutBounds) circuit.start();
    byId("play").textContent = paused ? "Resume" : "Pause";
    byId("status").textContent = paused ? "Paused" : "Simulating";
  }

  function refreshScale() {
    if (!paper || !layoutBounds) return;
    paper.scale(scale);
    // Include the rendered labels, port circles and routes, not just the model boxes. The first fit after a scale
    // change measures from the old origin, so it runs twice.
    for (let pass = 0; pass < 2; pass++)
      paper.fitToContent({ padding: 8, allowNewOrigin: "any", useModelGeometry: false });
    byId("zoom-level").textContent = Math.round(scale * 100) + "%";
  }

  // Fits the whole circuit to the viewport. Called when a circuit is built, when the viewport changes size and
  // when the frame is shown again, until the learner zooms; a new build fits again.
  function fit() {
    fitted = true;
    if (!paper || !layoutBounds) return;
    const viewport = byId("viewport");
    if (!viewport.clientWidth || !viewport.clientHeight) return;
    scale = Math.max(
      MIN_FIT_SCALE,
      Math.min(1, (viewport.clientWidth - 16) / layoutBounds.width, (viewport.clientHeight - 16) / layoutBounds.height),
    );
    refreshScale();
    // The rendered labels can reach past the layout's boxes; shrink once more if the drawing still overflows.
    const over = Math.max(viewport.scrollWidth / viewport.clientWidth, viewport.scrollHeight / viewport.clientHeight);
    if (over > 1.001 && scale > MIN_FIT_SCALE) {
      scale = Math.max(MIN_FIT_SCALE, scale / over);
      refreshScale();
    }
    viewport.scrollTo({ left: 0, top: 0 });
  }

  function describe(view) {
    const cell = view.model;
    const positions = cell.get("source_positions") || [];
    const where = positions
      .filter((p) => p.name && p.from && p.to)
      .map((p) => p.name.split("/").pop() + ":" + p.from.line + (p.to.line !== p.from.line ? "–" + p.to.line : ""))
      .join(", ");
    const label = cell.get("net") || cell.get("netname") || cell.get("label") || cell.get("type");
    const bits = cell.get("bits");
    byId("selection").textContent = [
      label,
      Number.isInteger(bits) ? bits + (bits === 1 ? " bit" : " bits") : "",
      where || "No source position",
    ]
      .filter(Boolean)
      .join(" · ");
    for (const selected of byId("paper").querySelectorAll(".is-selected")) selected.classList.remove("is-selected");
    view.el.classList.add("is-selected");
    if (positions.length) send({ selection: positions });
  }

  function prepareCells(modelCircuit) {
    for (const cell of modelCircuit._graph.getElements()) {
      cell.attr("label/fontSize", 12);
      cell.attr("label/refDy", 8);
      const type = cell.get("type");
      if (type === "Subcircuit" && cell.get("celltype")?.startsWith("$paramod")) {
        // Yosys specializes parameterized modules into long internal names. Shorten only the displayed heading.
        const moduleName = cell.get("celltype").split("\\")[1];
        if (moduleName) cell.attr("type/text", moduleName);
      }
      if (["BusGroup", "BusUngroup", "Mux"].includes(type)) {
        const ports = cell.getPorts().filter((port) => port.group === "in" || port.group === "out");
        const count = Math.max(
          ports.filter((p) => p.group === "in").length,
          ports.filter((p) => p.group === "out").length,
        );
        cell.resize(cell.size().width, Math.max(cell.size().height, (count + 1) * 24));
      }
      // Ports are inspection targets, not connection handles. Smaller circles separate close gate inputs.
      for (const port of cell.getPorts()) cell.portProp(port.id, "attrs/port/r", 4);
    }
    for (const wire of modelCircuit._graph.getLinks()) {
      // The net name repeated beside every fan-out branch; it stays in the model and the selection line.
      wire.labels([]);
      wire.router("normal");
      wire.connector("jumpover", { size: 5, jump: "gap" });
    }
  }

  async function arrange(currentPaper, token) {
    const graph = currentPaper.model;
    const envelopes = new Map();
    const nodes = graph.getElements().map((cell) => {
      const view = currentPaper.findViewByModel(cell);
      const bounds = view.el.getBBox();
      const pad = 4;
      const box = {
        x: bounds.x - pad,
        y: bounds.y - pad,
        width: bounds.width + pad * 2,
        height: bounds.height + pad * 2,
      };
      envelopes.set(cell.id, box);
      const position = cell.position();
      const ports = cell.getPorts().map((port, index) => {
        const circle = view.findPortNode(port.id, "port");
        const rect = circle.getBoundingClientRect();
        const center = currentPaper.clientToLocalPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        const side = port.group === "in2" ? "NORTH" : port.dir === "out" ? "EAST" : "WEST";
        const x = side === "WEST" ? 0 : side === "EAST" ? box.width : center.x - position.x - box.x;
        const y = side === "NORTH" ? 0 : center.y - position.y - box.y;
        return {
          id: cell.id + ":" + port.id,
          x,
          y,
          width: 0,
          height: 0,
          layoutOptions: { "elk.port.side": side, "elk.port.index": String(index) },
        };
      });
      return {
        id: cell.id,
        width: box.width,
        height: box.height,
        ports,
        layoutOptions: {
          "elk.portConstraints": "FIXED_POS",
          "elk.layered.layering.layerConstraint": ["Input", "Clock", "Constant"].includes(cell.get("type"))
            ? "FIRST"
            : cell.get("type") === "Output"
              ? "LAST"
              : "NONE",
        },
      };
    });
    const edges = graph.getLinks().map((wire) => {
      const source = wire.source();
      const target = wire.target();
      return { id: wire.id, sources: [source.id + ":" + source.port], targets: [target.id + ":" + target.port] };
    });
    // The frame has an opaque origin. A blob bootstrap loads the fixed worker asset without same-origin rights.
    const workerScript = new URL("/vendor/elkjs/elk-worker.min.js", location.href).href;
    const workerUrl = URL.createObjectURL(
      new Blob(["importScripts(" + JSON.stringify(workerScript) + ");"], { type: "text/javascript" }),
    );
    let worker;
    let deadline;
    let placed;
    try {
      worker = new Worker(workerUrl);
      const elk = new ELK({ workerFactory: () => worker });
      const interrupted = new Promise((_, reject) => {
        cancelLayout = () => reject(new Error("The layout was replaced."));
        worker.addEventListener("error", () => reject(new Error("The layout worker could not be loaded.")));
        deadline = setTimeout(() => reject(new Error("The layout took longer than 10 s.")), 10000);
      });
      placed = await Promise.race([
        interrupted,
        elk.layout({
          id: "circuit",
          children: nodes,
          edges,
          layoutOptions: {
            "elk.algorithm": "layered",
            "elk.direction": "RIGHT",
            "elk.edgeRouting": "ORTHOGONAL",
            "elk.padding": "[top=12,left=12,bottom=12,right=12]",
            "elk.spacing.nodeNode": "10",
            "elk.spacing.edgeNode": "6",
            "elk.spacing.edgeEdge": "5",
            "elk.layered.spacing.nodeNodeBetweenLayers": "32",
            "elk.layered.spacing.edgeNodeBetweenLayers": "10",
            "elk.layered.spacing.edgeEdgeBetweenLayers": "5",
            "elk.layered.nodePlacement.favorStraightEdges": "true",
            "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
            "elk.separateConnectedComponents": "false",
          },
        }),
      ]);
    } finally {
      clearTimeout(deadline);
      worker?.terminate();
      URL.revokeObjectURL(workerUrl);
      if (token === generation) cancelLayout = null;
    }
    if (token !== generation) return false;
    currentPaper.freeze();
    for (const node of placed.children) {
      const box = envelopes.get(node.id);
      graph.getCell(node.id).position(node.x - box.x, node.y - box.y);
    }
    for (const edge of placed.edges) {
      const section = edge.sections?.[0];
      if (!section) throw new Error("A wire could not be routed.");
      graph.getCell(edge.id).vertices([section.startPoint, ...(section.bendPoints || []), section.endPoint]);
    }
    const rendered = new Promise((resolve) => currentPaper.once("render:done", resolve));
    currentPaper.unfreeze();
    await rendered;
    await nextFrame();
    if (token !== generation) return false;
    layoutBounds = { width: placed.width, height: placed.height };
    byId("paper").dataset.layout = "ready";
    byId("paper").style.visibility = "visible";
    return true;
  }

  function buildControls() {
    for (const kind of ["input", "output"]) {
      const group = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.textContent = kind === "input" ? "Inputs" : "Outputs";
      group.append(legend);
      const cells = kind === "input" ? circuit.getInputCells() : circuit.getOutputCells();
      for (const cell of cells) {
        const bits = cell.get("bits");
        const field = document.createElement(kind === "input" ? "label" : "div");
        field.className = "io-field";
        let control;
        if (kind === "output") {
          field.append(document.createTextNode(cell.get("net")));
          control = document.createElement("output");
          control.setAttribute("aria-label", "Output " + cell.get("net"));
        } else {
          const Vector = cell.get("outputSignals").out.constructor;
          cell.setInput(Vector.fromBin("0".repeat(bits), bits));
          if (bits === 1) {
            field.append(document.createTextNode(cell.get("net")));
            control = document.createElement("button");
            control.type = "button";
            control.setAttribute("aria-label", "Toggle " + cell.get("net"));
            control.addEventListener("click", () => {
              cell.toggleInput();
              updateValues();
            });
          } else {
            field.append(document.createTextNode(cell.get("net") + " [" + bits + "]"));
            control = document.createElement("input");
            control.type = "text";
            control.setAttribute("aria-label", cell.get("net") + " in binary");
            control.maxLength = bits;
            control.style.width = Math.min(32, Math.max(4, bits)) + 1 + "ch";
            control.spellcheck = false;
            control.autocomplete = "off";
            control.addEventListener("input", () => control.setCustomValidity(""));
            control.addEventListener("change", () => {
              if (!/^[01]+$/.test(control.value) || control.value.length > bits) {
                control.setCustomValidity("Up to " + bits + " binary digits");
                control.reportValidity();
                return;
              }
              control.setCustomValidity("");
              cell.setInput(Vector.fromBin(control.value.padStart(bits, "0"), bits));
              control.value = control.value.padStart(bits, "0");
            });
          }
        }
        field.append(control);
        group.append(field);
        fields.push({ cell, element: control, kind });
      }
      if (cells.length) byId("io").append(group);
    }
  }

  // The layout measures the labels, so the faces must be loaded before the first drawing.
  const fonts = Promise.all([
    document.fonts.load('12px "IBM Plex Sans Condensed"'),
    document.fonts.load('12px "Source Code Pro"'),
  ]).catch(() => undefined);

  async function load(next) {
    shutdown();
    const token = generation;
    await fonts;
    if (token !== generation) return;
    try {
      data = next;
      fitted = true;
      scale = 1;
      byId("error").hidden = true;
      byId("paper").style.visibility = "hidden";
      byId("paper").dataset.layout = "pending";
      byId("status").textContent = "Arranging";
      fields = [];
      byId("io").replaceChildren();
      byId("selection").textContent = "";
      const model = structuredClone(data);
      const names = {
        And: "AND",
        Or: "OR",
        Not: "NOT",
        Xor: "XOR",
        Xnor: "XNOR",
        Nand: "NAND",
        Nor: "NOR",
        Mux: "Select",
        Dff: "Register",
        Eq: "Equal",
        BusGroup: "Pack",
        BusUngroup: "Split",
        BusSlice: "Slice",
      };
      for (const block of [model, ...Object.values(model.subcircuits || {})]) {
        for (const cell of Object.values(block.devices)) {
          if (["Input", "Output", "Constant", "$constant"].includes(cell.type)) cell.numbase = "bin";
          if (cell.label?.startsWith("$") || (!cell.label && names[cell.type]))
            cell.label = names[cell.type] || cell.type.replace(/([a-z])([A-Z])/g, "$1 $2");
        }
      }
      // The main graph is arranged below, after its labels are measured. Nested circuits keep DigitalJS's layout.
      circuit = new digitaljs.Circuit(model, { layoutEngine: "dagre" });
      if (!circuit._graph.getElements().length) throw new Error("The design has no cells.");
      circuit._graph.set("laid_out", true);
      circuit.on("new:paper", (p) => p.fixed(true));
      prepareCells(circuit);
      buildControls();
      paper = circuit.displayOn($("<div>").appendTo("#paper"));
      // DigitalJS refits the paper after every render with its own padding, which would undo the fit; the
      // viewer sizes the paper itself.
      circuit.stopListening(paper, "render:done");
      paper.on("render:done", () => {
        if (layoutBounds) refreshScale();
      });
      paper.on("element:pointerclick link:pointerclick", describe);
      await new Promise((resolve) => paper.once("render:done", resolve));
      await nextFrame();
      if (token !== generation) return;
      if (!(await arrange(paper, token))) return;
      circuit.on("postUpdateGates userChange", updateValues);
      updateValues();
      fit();
      playState();
      send({ ready: true });
    } catch (error) {
      if (token !== generation) return;
      shutdown();
      report(error.message);
      send({ error: error.message });
    }
  }

  byId("play").addEventListener("click", () => {
    paused = !paused;
    playState();
  });
  byId("reset").addEventListener("click", () => {
    if (data) {
      paused = false;
      load(data);
    }
  });
  function changeZoom(factor) {
    if (!layoutBounds) return;
    fitted = false;
    scale = Math.max(0.4, Math.min(2.5, scale * factor));
    refreshScale();
  }
  byId("zoom-in").addEventListener("click", () => changeZoom(1.2));
  byId("zoom-out").addEventListener("click", () => changeZoom(1 / 1.2));
  byId("fit").addEventListener("click", fit);
  let resizeFrame;
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => (fitted ? fit() : refreshScale()));
  });
  resize.observe(byId("viewport"));
  window.addEventListener("message", (event) => {
    if (event.source !== parent || event.data?.type !== TYPE) return;
    const shown = event.data.active === true && !active;
    if (typeof event.data.active === "boolean") active = event.data.active;
    if (event.data.circuit) load(event.data.circuit);
    else {
      playState();
      if (shown && fitted) requestAnimationFrame(fit);
    }
  });
  // Keys with a modifier, and the function keys, belong to the workspace (run, submit, tabs, panes). The frame hands
  // them to the page, which applies its own bindings, so the keys work while focus is in the drawing.
  document.addEventListener(
    "keydown",
    (event) => {
      if (["Shift", "Alt", "Meta", "Control"].some((name) => event.code.startsWith(name))) return;
      if (!event.altKey && !event.metaKey && !event.ctrlKey && !/^F\d{1,2}$/.test(event.code)) return;
      if (event.altKey || event.code === "Enter" || /^F\d{1,2}$/.test(event.code)) event.preventDefault();
      const { code, key, altKey, metaKey, ctrlKey, shiftKey } = event;
      send({ key: { code, key, altKey, metaKey, ctrlKey, shiftKey } });
    },
    true,
  );
  window.addEventListener("pagehide", () => {
    resize.disconnect();
    shutdown();
  });
  send({ loaded: true });
})();

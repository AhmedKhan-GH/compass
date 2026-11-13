"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { RunRecord } from "@compass/schema";
import { KeyButton, Label, WordButton } from "@compass/ui";
import {
  axisTicks,
  displayTime,
  displayValue,
  edgeTimes,
  parseWaveform,
  stepEdge,
  valueAt,
  type WaveSignal,
} from "@/lib/waveform";

const ROW = 24;
const RULER = 22;
const SHOWN = 32;

/** The VCD of the run in view: one trace per signal, a time cursor, and the value of every signal at the cursor. */
export function WaveformPane({ run, earlierSource }: { run: RunRecord | undefined; earlierSource: boolean }) {
  const wave = useMemo(() => parseWaveform(run?.waveform ?? ""), [run?.waveform]);
  const [filter, setFilter] = useState("");
  const [position, setPosition] = useState(0);
  const traces = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = traces.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry?.contentRect.width ?? 0)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [wave]);

  const signals = wave.signals.filter((signal) => signal.name.toLowerCase().includes(filter.toLowerCase()));
  const shown = signals.slice(0, SHOWN);
  const edges = edgeTimes(shown);
  const extent = Math.max(1, wave.endTime);
  const cursor = Math.min(position, wave.endTime);
  const x = (time: number) => Math.round((time / extent) * Math.max(1, width - 1)) + 0.5;

  if (!run?.waveform || !wave.signals.length)
    return (
      <div className="waveform waveform-empty">
        <span className="sb-faint">{run ? "No waveform in this run" : "No run"}</span>
      </div>
    );

  function setFromPointer(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - box.left) / Math.max(1, box.width)));
    setPosition(Math.round(ratio * extent));
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: number | undefined;
    if (event.key === "ArrowLeft") next = stepEdge(edges, cursor, -1, wave.endTime);
    else if (event.key === "ArrowRight") next = stepEdge(edges, cursor, 1, wave.endTime);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = wave.endTime;
    if (next === undefined) return;
    event.preventDefault();
    setPosition(next);
  }
  function download() {
    if (!run?.waveform) return;
    const url = URL.createObjectURL(new Blob([run.waveform], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${run.itemSlug}-${run.id.slice(0, 8)}.vcd`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const ticks = axisTicks(wave.endTime, Math.max(2, Math.floor(width / 110)));
  return (
    <div className="waveform">
      <div className="waveform-toolbar">
        <label className="waveform-filter">
          <Label>Signals</Label>
          <input
            className="sb-field"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter"
            spellCheck={false}
            aria-label="Filter signals"
          />
        </label>
        <span className="waveform-fact">
          {shown.length} of {wave.signals.length}
        </span>
        {earlierSource && <span className="results-flag">Earlier source</span>}
        {wave.truncated && <span className="results-flag">Truncated</span>}
        <span className="sb-spacer" />
        <KeyButton
          chord="ArrowLeft"
          aria-label="Previous change"
          onClick={() => setPosition(stepEdge(edges, cursor, -1, wave.endTime))}
        />
        <span className="waveform-time" aria-live="polite">
          {displayTime(cursor, wave.timescale)}
        </span>
        <KeyButton
          chord="ArrowRight"
          aria-label="Next change"
          onClick={() => setPosition(stepEdge(edges, cursor, 1, wave.endTime))}
        />
        <WordButton onClick={download}>Download VCD</WordButton>
      </div>
      <div className="waveform-body">
        <div className="waveform-names">
          <div className="waveform-ruler-label">
            <Label>Signal</Label>
            <Label>Value</Label>
          </div>
          {shown.map((signal) => (
            <div key={signal.name} className="waveform-name" title={signal.name}>
              <span className="waveform-signal">{signal.name}</span>
              <span className="waveform-value">{displayValue(valueAt(signal, cursor))}</span>
            </div>
          ))}
        </div>
        <div
          ref={traces}
          className="waveform-traces"
          tabIndex={0}
          role="slider"
          aria-label="Waveform time"
          aria-valuemin={0}
          aria-valuemax={wave.endTime}
          aria-valuenow={cursor}
          aria-valuetext={displayTime(cursor, wave.timescale)}
          onKeyDown={onKeyDown}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromPointer(event);
          }}
        >
          {width > 0 && (
            <svg width={width} height={RULER + shown.length * ROW} className="waveform-svg" aria-hidden="true">
              <g className="waveform-ruler">
                {ticks.map((tick) => (
                  <g key={tick}>
                    <line
                      x1={x(tick)}
                      x2={x(tick)}
                      y1={RULER - 6}
                      y2={RULER + shown.length * ROW}
                      className="waveform-grid"
                    />
                    <text
                      x={Math.min(x(tick) + 4, width - 4)}
                      y={RULER - 8}
                      textAnchor={x(tick) + 60 > width ? "end" : "start"}
                    >
                      {displayTime(tick, wave.timescale)}
                    </text>
                  </g>
                ))}
                <line x1={0} x2={width} y1={RULER - 0.5} y2={RULER - 0.5} className="waveform-axis" />
              </g>
              {shown.map((signal, index) => (
                <Trace key={signal.name} signal={signal} top={RULER + index * ROW} x={x} extent={extent} />
              ))}
              <line x1={x(cursor)} x2={x(cursor)} y1={0} y2={RULER + shown.length * ROW} className="waveform-cursor" />
            </svg>
          )}
        </div>
      </div>
      {signals.length > SHOWN && (
        <div className="waveform-footer">
          <span className="sb-faint">
            {SHOWN} of {signals.length} matching signals shown
          </span>
        </div>
      )}
    </div>
  );
}

function Trace({
  signal,
  top,
  x,
  extent,
}: {
  signal: WaveSignal;
  top: number;
  x: (time: number) => number;
  extent: number;
}) {
  const high = top + 5;
  const low = top + ROW - 6;
  const middle = (high + low) / 2;
  const parts = signal.changes.map(([time, bits], index) => {
    const start = x(time);
    const end = x(signal.changes[index + 1]?.[0] ?? extent);
    const unknown = /[xz]/.test(bits);
    if (signal.width === 1 && !unknown) {
      const y = bits === "1" ? high : low;
      const before = signal.changes[index - 1]?.[1];
      const from = before === "1" ? high : before === "0" ? low : y;
      return <path key={time} className="waveform-bit" d={`M${start} ${from}V${y}H${end}`} />;
    }
    const slope = Math.min(3, (end - start) / 2);
    const shape = `M${start} ${middle}L${start + slope} ${high}H${end - slope}L${end} ${middle}L${end - slope} ${low}H${start + slope}Z`;
    const label = signal.width === 1 ? bits : displayValue(bits);
    return (
      <g key={time} className={unknown ? "waveform-unknown" : "waveform-bus"}>
        <path d={shape} />
        {end - start > label.length * 9 + 10 && (
          <text x={start + 6} y={middle + 5}>
            {label}
          </text>
        )}
      </g>
    );
  });
  return (
    <g>
      <line x1={0} x2={x(extent)} y1={top + ROW - 0.5} y2={top + ROW - 0.5} className="waveform-row-rule" />
      {parts}
    </g>
  );
}

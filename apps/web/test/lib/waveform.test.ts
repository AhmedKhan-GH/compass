import assert from "node:assert/strict";
import test from "node:test";
import {
  axisTicks,
  displayTime,
  displayValue,
  edgeTimes,
  parseWaveform,
  stepEdge,
  valueAt,
} from "../../src/lib/waveform.ts";

const trace = `$timescale 1 ps $end
$scope module counter $end
$var wire 1 ! clk $end
$var reg 4 " count [3:0] $end
$scope module child $end
$var wire 1 ! clock_alias $end
$upscope $end
$upscope $end
$enddefinitions $end
#0
0!
bxxxx "
#5000
1!
b0011 "
#10000
0!
bz "
`;

test("waveform reading preserves hierarchy, aliases, time and four-state data", () => {
  const result = parseWaveform(trace);
  assert.equal(result.timescale, "1ps");
  assert.equal(result.endTime, 10000);
  assert.deepEqual(
    result.signals.map((signal) => signal.name),
    ["counter.clk", "counter.count", "counter.child.clock_alias"],
  );
  assert.deepEqual(result.signals[0]?.changes, result.signals[2]?.changes);
  const count = result.signals[1]!;
  assert.equal(valueAt(count, 4999), "xxxx");
  assert.equal(valueAt(count, 5000), "0011");
  assert.equal(valueAt(count, 10000), "zzzz");
  assert.equal(displayValue("0011"), "0x3");
  assert.equal(displayTime(5000, "1ps"), "5 ns");
});

test("malformed and oversized waveform content stays bounded", () => {
  assert.equal(parseWaveform("not a VCD").signals.length, 0);
  const excessive = trace + Array.from({ length: 14000 }, (_, i) => `#${10001 + i}\n${i % 2}!`).join("\n");
  const result = parseWaveform(excessive);
  assert.equal(result.truncated, true);
  assert.ok(result.signals[0]!.changes.length <= 12000);
  assert.ok(Number.isFinite(parseWaveform(trace + "#9999999999999999999999999999\n1!\n").endTime));
});

test("edges step to the previous and next change, and to the ends", () => {
  const result = parseWaveform(trace);
  const edges = edgeTimes(result.signals);
  assert.deepEqual(edges, [0, 5000, 10000]);
  assert.equal(stepEdge(edges, 5000, 1, result.endTime), 10000);
  assert.equal(stepEdge(edges, 5000, -1, result.endTime), 0);
  assert.equal(stepEdge(edges, 10000, 1, result.endTime), 10000);
  assert.equal(stepEdge(edges, 0, -1, result.endTime), 0);
});

test("axis ticks fall on round numbers across the trace", () => {
  assert.deepEqual(axisTicks(10000, 5), [0, 2000, 4000, 6000, 8000, 10000]);
  assert.deepEqual(axisTicks(35, 4), [0, 10, 20, 30]);
  assert.deepEqual(axisTicks(0, 4), [0]);
});

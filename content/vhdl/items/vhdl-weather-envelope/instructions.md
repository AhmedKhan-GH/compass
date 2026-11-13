A hilltop station sends one compact sixteen-bit word over its radio, while the operator screen works with the named ideas temperature, humidity, and validity. The package is the agreement between those two views: it must place every field in a documented slice and recover the same record at the receiver. Complete `weather_pkg`; the supplied wrapper constructs reports with named aggregates and exercises both conversion directions.

## 1. Pack the named fields

Implement `pack` so bits 15–8 contain the signed temperature, bits 7–1 contain humidity, and bit 0 contains `valid`.

Negative temperatures must keep their two's-complement bit pattern. Humidity is never negative, so its seven-bit field uses unsigned conversion. Assign every slice of the local result word before returning it.

**Reason it through:** Which conversion preserves a negative eight-bit temperature?

## 2. Unpack a complete record

Implement `unpack` with a variable of the explicit `weather_report_t` type, assign all fields, and return it.

Decode each slice with the same signed or unsigned interpretation used by `pack`. The returned record must contain all three fields, including the validity bit, so a pack-then-unpack round trip preserves a report.

**Reason it through:** How does a named aggregate make field order irrelevant at a call site?

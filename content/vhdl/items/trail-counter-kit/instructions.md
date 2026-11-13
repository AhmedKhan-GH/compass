Park staff use a reusable arrival counter and threshold lamp. Organize the design as a VHDL package plus three entities so different instances can choose their own widths and warning thresholds.

The editable files are `trail_defs.vhd`, `counter.vhd`, `indicator.vhd`, and `top_module.vhd`. Analyze them in that order.

## 1. Give the kit a shared, overridable default

In package `trail_defs`, declare `TRAIL_COUNT_WIDTH` with default value 8 and declare the shared `reaches_threshold` function. Implement the function in the package body. Entity generics may use the package constant as their default while an instance can still override the generic.

## 2. Make the counter reusable

In `trail_counter`, give synchronous active-high reset priority. On each rising edge, increment `visitors` only when `arrival` is `'1'`; otherwise hold it. Unsigned fixed-width addition naturally wraps.

## 3. Make the milestone lamp reusable

In `trail_indicator`, drive `busy` combinationally when the unsigned visitor count is greater than or equal to `WARNING_AT`. Use the package function and preserve the exact threshold boundary.

## 4. Assemble a complete entrance kit

In `top_module`, instantiate the counter and indicator. Pass `WIDTH` to both and `WARNING_AT` to the indicator. Connect the counter result both to `visitors` and to the indicator input.

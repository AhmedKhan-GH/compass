A maker sells display kits with either three lights or eight, and each model has a test pattern chosen when it is built. Pressing the test button should show that pattern in place of the live input, with a separate indicator reporting whether any displayed light is on. You are building one configurable circuit that gives both sizes of kit these controls.

The module is `configurable_block`. Parameter `WIDTH` defaults to `8`; parameter `RESET_VALUE` defaults to `0` and supplies the model's test pattern. Ports `data` and `shown` have `WIDTH` bits; `clear` and `nonzero` are one bit. In this interface, `clear` selects the configured pattern. There is no clock or stored reset state.

The supplied wrapper builds an eight-bit instance with `RESET_VALUE=8'hA5` and a three-bit instance with `RESET_VALUE=3'b101`.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Select a configured value

The maker wants to test each kit with the pattern chosen for that model. Let the test button switch between the live pattern and that configured pattern, whichever size of kit is built.

When the kit's test button is released (`clear=0`), `shown` follows `data`. While the test button is held (`clear=1`), `shown` displays `RESET_VALUE` limited to `WIDTH` bits.

**Reason it through:** Which values are chosen when the kit is built, and which can change while it runs?

**Check your reasoning:** Test clear in both supplied widths. The narrow instance must carry three bits, not an accidentally fixed eight-bit intermediate.

## 2. Summarize the selected output

The pattern now changes correctly, but the kit also needs a light that says whether anything is displayed. Make that light describe the visible pattern, including while the test button is held.

nonzero reports whether the currently shown word contains any set bit, including when clear selects the configured value.

**Reason it through:** If the live input is zero but the test pattern has lit bits, what should the indicator report?

**Check your reasoning:** Set incoming data to zero and set clear to 1 with a nonzero configured value. The summary must still be 1.

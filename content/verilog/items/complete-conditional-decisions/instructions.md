A pottery workshop uses a drying cabinet whose fan can run at an ordinary or boosted speed. The operator needs the fan to stop when a drying request ends, and the cabinet's blocking control must still take effect when boost is selected. You will build a controller that makes those choices from the current controls, so neither the fan command nor its speed is left over from an earlier setting.

| Signal | Meaning |
| --- | --- |
| `request` | One-bit input: `1` asks the fan to run. |
| `blocked` | One-bit input: `1` forbids running. |
| `boost` | One-bit input: `1` selects the faster setting when running is allowed. |
| `fan_on` | One-bit output: `1` means the fan is commanded on. |
| `speed` | Two-bit output: `0` for stopped, `1` for ordinary speed, `2` for boost. |

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Decide whether the fan runs

Before choosing a drying speed, the controller must decide whether the fan may run at all. Build that decision so ending a request or turning on the block stops the fan immediately.

Set `fan_on=1` only when `request=1` and `blocked=0`; otherwise set it to `0`. `boost` must not start the fan by itself. Use the supplied combinational procedure.

**Reason it through:** Which control can block the request? If the operator cancels the request, is an earlier drying run a reason to keep the fan on?

**Check your reasoning:** Raise request while unblocked, then lower request without changing anything else. fan_on must turn off.

## 2. Choose a complete speed

The workshop can now request a drying run, but it still needs a speed setting. Add ordinary and boosted speeds for allowed runs, and make sure a stopped fan always receives the off setting.

A running fan uses `speed=2` when `boost=1` and `speed=1` otherwise. A stopped or blocked fan uses `speed=0`, even when `boost=1`. Keep `fan_on` working.

**Reason it through:** Do both outputs agree about whether the fan is running for every combination?

**Check your reasoning:** Start boosted, then engage the block. Both outputs must become zero. Inspect Circuit for storage that should not be there.

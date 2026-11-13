In a print workshop, an operator moves between the two ends of a conveyor while handling materials. A button at each end lets them request movement without walking back to the other end, while a shared lock switch blocks those requests during setup. You will build the controls in stages, starting with a light that shows whether operation is available and then adding the two buttons.

| Signal | Meaning |
| --- | --- |
| `button_a`, `button_b` | One-bit inputs: `1` while the button at that end is held down. |
| `blocked` | One-bit input: `1` while the lock switch blocks operation. |
| `available` | One-bit output: `1` lights the ready indicator. |
| `start` | One-bit output: `1` requests that the conveyor run now. |

Despite the name `start`, this is a continuous request, not a pulse or a remembered command. Releasing both buttons must stop it. The exercise models these control signals; the motor itself is outside the entity.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Turn on the ready light when blocked is 0

During setup, the conveyor's lock may be on even though nobody is pressing a button. Give the operator a ready light so they can check the lock before trying to run the conveyor.

Set `available` to `1` when `blocked=0`, and to `0` when `blocked=1`. Pressing either button must not affect this output.

**Reason it through:** Write the two possible lock positions and the required light value. Which operation from the introduction matches those values?

**Check your reasoning:** Toggle only `blocked` in Schematic. Then hold it at 0 and change the buttons; the ready light should remain on.

## 2. Set start to 1 when button A is pressed and blocked is 0

Start with the button at one end of the conveyor. The operator should be able to hold it while working, then release it to stop. Build that request while keeping the lock in control.

With button B released, `start` must be `1` only when `button_a=1` and `blocked=0`. It must be `0` when A is released or the lock is on.

**Reason it through:** There are four combinations of button A and the lock. In how many should the conveyor run?

**Check your reasoning:** Keep A pressed, then turn on the lock. The run request must turn off even though the button stays pressed.

## 3. Let either button set start to 1 when blocked is 0

The operator also needs to work from the other end of the conveyor. Add the second button to the same request circuit, so either position works and the shared lock still blocks both.

Either `button_a=1` or `button_b=1` may set `start` to `1` when `blocked=0`. Both buttons together also count as a request. Set `start=0` when neither is pressed or when `blocked=1`. Keep `available` working.

**Reason it through:** Should adding a second button change the rule for the lock? Which input combinations would expose a lock that protects only button A?

**Check your reasoning:** Compare B alone, A alone, and both together, first unlocked and then locked. With neither pressed, the ready light may be on while the run request is off.

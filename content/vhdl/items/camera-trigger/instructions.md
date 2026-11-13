A bird feeder camera should take a picture when its motion detector makes a request, but the owner also needs to be able to turn it off. Even while it is on, the storage controller may be busy and unable to accept a picture. You will build the decision that passes a request to the camera only when those other controls allow it.

## Required behavior

| Port | Meaning |
| --- | --- |
| `request` | `1` when the motion detector requests a picture. |
| `enabled` | `1` when the camera controller is on. |
| `inhibit` | `1` when the storage controller blocks pictures. |
| `capture` | Output: `1` while the camera should take the requested picture. |

All ports are one bit. Set `capture=0` if `request=0`, `enabled=0`, or `inhibit=1`. Otherwise set it to `1`. The output follows the current controls; it does not produce a timed pulse.

## Before you code

List all eight input combinations. Which one allows a picture? Which control can still block a request while the camera is on?

## Check your reasoning

Hold `request` and `enabled` high, then change `inhibit` from `0 → 1 → 0`. Predict each output before trying it in Schematic.

Keep the supplied entity interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.

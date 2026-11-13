A service technician visiting a vending machine needs to check whether it is ready, whether a fault is present, and which mode it is using. The machine sends all of this information through one small diagnostic connection, so each part must arrive in the right place. You will start by checking that connection with a fixed pattern, then use it to carry and read the machine's live status.

| Port or internal wire | Meaning |
| --- | --- |
| `ready`, `fault` | One-bit inputs: `1` means ready or fault present, respectively. |
| `mode` | Two-bit input containing the operating mode code. |
| `packed_status` | Internal connection carrying the complete four-bit message. |
| `status` | Four-bit output connected to `packed_status`. |
| `fault_seen` | One-bit output reporting the received fault flag. |
| `mode_seen` | Two-bit output reporting the received mode code. |
| `service_mode` | One-bit output: `1` when the received mode is `10`. |

This connection carries all four bits at once; you are not building a serial transmitter.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Carry the four bits 1010

Before using the vending machine's live signals, the technician wants to check the diagnostic connection itself. Send a fixed test pattern that needs all four positions, so a connection that is too narrow becomes visible.

During this check, `status` must carry the four-bit pattern `1010`. The starter's internal `packed_status` currently has room for only one bit. Keep the supplied connection from `packed_status` to `status`.

**Reason it through:** How many bit positions must this internal connection preserve? Which part of `1010` would fit on a one-bit wire?

**Check your reasoning:** Task 1 checks the pattern at one input setting. Circuit should show all four positions rather than only the final zero.

## 2. Join ready, fault, and mode into one word

The fixed pattern shows that the connection can carry a word, but it says nothing about the machine. Replace it with the current flags and mode so the technician can inspect a working machine.

Bit 3 of `packed_status` carries `ready`; bit 2 carries `fault`; bits 1 and 0 carry `mode` in its existing order. For `ready=1`, `fault=0`, and `mode=11`, the result is `1011`.

**Reason it through:** Are you adding three numeric values, or placing their bits side by side? Count the bits before choosing an expression.

**Check your reasoning:** Try ready=1, fault=0, mode=10: the original diagnostic case should still pass. Then change just fault and predict which output position changes.

## 3. Read the fault bit from the word

The service tool has a fault lamp, so the technician does not have to read the whole status word to spot a problem. Connect that lamp to the fault information in the message.

The one-bit output `fault_seen` must recover the fault flag from `packed_status`. Changes in `ready` or `mode` must not change this result.

**Reason it through:** Which position in the word contains the flag? How is a position different from the numeric value of the entire word?

**Check your reasoning:** With packed status 0110, predict fault_seen. Then vary the two mode bits and confirm the fault output is unchanged.

## 4. Read the two mode bits from the word

The technician also needs to know which operating mode the machine has selected. Recover that part of the message for the service tool, keeping enough information to distinguish every mode code.

The two-bit output `mode_seen` must recover the mode field from `packed_status`, preserving its bit order.

**Reason it through:** Which two adjacent positions belong to the mode, and how many bits must the destination hold?

**Check your reasoning:** Check modes `01` and `10` separately. Reversing those bits changes the code, while reversing `00` or `11` would look the same.

## 5. Check whether mode is 10

The tool needs a separate indicator for service mode. Add a yes-or-no answer so the technician can recognize that setting without reading the binary mode code. The other modes must leave this indicator off.

Mode `10` means service mode. Set `service_mode` to `1` for `mode_seen=10`, and to `0` for `00`, `01`, and `11`.

**Reason it through:** Why is looking only at the left mode bit insufficient?

**Check your reasoning:** Compare modes 10 and 11 in Circuit. Both have their left bit set, but only one should activate the service output.

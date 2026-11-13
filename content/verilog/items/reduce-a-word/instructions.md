An eight-compartment parcel locker reports the state of each compartment separately, but its front panel also needs answers that can be read at a glance. It should show whether any parcels are waiting and whether the locker is full. You will turn the individual occupancy bits into those simple indicators, then add the summaries needed by its service connection and older front panel.

`status[7:0]` has one bit per compartment; `1` means occupied. Build the one-bit outputs `any_set`, `all_set`, `odd_parity`, and `logical_present`. The older front-panel connector calls its occupied indicator `logical_present`; it must agree with the new `any_set` indicator for these known binary inputs. All outputs describe the current word.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Summarize any and all bits

Someone collecting a parcel needs to know whether any compartment is occupied. A delivery driver needs to know whether all compartments are full. Give the front panel those two answers from the same set of signals.

Set `any_set` to `1` when at least one bit of `status` is `1`, and to `0` otherwise. Set `all_set` to `1` only when every bit is `1`, and to `0` otherwise.

**Reason it through:** Could you answer either question by checking only the lowest bit? Find a pattern that shows why this would fail.

**Check your reasoning:** Compare 00000000, 10000000, and 11111111. Predict both answers before running tests.

## 2. Compute parity and logical presence

The service connection needs an odd-or-even check of the occupancy pattern, while the older front panel needs its own occupied signal. Add both outputs without changing the two indicators you already built.

Set `odd_parity` to `1` for an odd count of set bits and to `0` for an even count. Set `logical_present` to `1` when `status` is nonzero and to `0` otherwise. Keep `any_set` and `all_set` working.

**Reason it through:** A second parcel arrives while another remains in its compartment. Should the collect indicator change? Should the odd/even summary change?

**Check your reasoning:** Change status from 00000001 to 00000011. The collect indicator stays on, but the odd-parity result must change.

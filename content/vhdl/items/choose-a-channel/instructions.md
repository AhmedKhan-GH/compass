Greenhouse staff need to check the moisture in two planting beds, but their small display has room for only one reading at a time. They also need a way to test the display during a service visit without disturbing either sensor. You will build and compare three selection circuits, progressing from a simple A/B switch to a coded selector with a separate service control.

| Signal | Meaning |
| --- | --- |
| `channel_a`, `channel_b` | Four-bit readings from beds A and B. |
| `select_b` | One-bit selection control for the first version. |
| `channel` | Two-bit selection code for the second version. |
| `override_active` | One-bit input: `1` requests the service display. |
| `override_data` | Four-bit service pattern. |
| `selected`, `decoded`, `priority_selected` | Four-bit outputs of the three versions, respectively. |

The three outputs are available together so you can compare their behavior.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Choose A or B with one control bit

The greenhouse staff want to check either planting bed without moving a sensor. Start with a simple A/B switch that chooses the reading on the display while both sensors continue to operate.

The four-bit output `selected` follows `channel_a` when `select_b=0`, and `channel_b` when `select_b=1`. Changes to the unselected channel must have no effect.

**Reason it through:** Which input belongs to each control value? What experiment would catch the two paths being reversed?

**Check your reasoning:** Use A=0011 and B=1010. Change the selected input, then the unselected one, and explain why only one change reaches the output.

## 2. Choose A or B with a two-bit code

The next display uses a coded dial with room for more sensors. Only two beds are connected today. Build a selector that recognizes their codes and leaves the spare positions blank.

The four-bit output `decoded` follows `channel_a` for `channel=00`, `channel_b` for `01`, and zero for `10` or `11`. It is independent of `select_b`.

**Reason it through:** Two code bits represent four possibilities. Have you assigned a behavior to all four?

**Check your reasoning:** Set both data channels nonzero and try codes 10 and 11. Both must produce zero.

## 3. Add a switch that selects override_data

During servicing, the technician wants to display a test pattern without changing the readings in either bed. Add a service switch that can take over the display even when the dial is on a spare position.

Normally, `priority_selected` follows `decoded`. When `override_active=1`, it must follow `override_data` for every `channel` code, including unsupported ones.

**Reason it through:** A spare dial position normally blanks the display. Should that prevent the technician from showing a service pattern?

**Check your reasoning:** Choose an unsupported channel code and a nonzero service pattern. Turn `override_active` on, then off. The output should show the service pattern, then zero.

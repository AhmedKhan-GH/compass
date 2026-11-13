A market vendor needs to read a crate's weight after lifting it off the scale, so the display must be able to keep a captured reading while the incoming measurement changes. The vendor also needs to freeze that reading against further loads and clear it for the next customer. Your job is to give these controls a consistent order of priority when more than one is requested together.

clk, reset, load, and freeze are one bit; data and value are eight bits. Reset is synchronous and active high; all changes happen after rising edges.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Load or hold a reading

The vendor needs to capture a weight and keep reading it after the crate is lifted. Start with the freeze control off and make the display change only when a load or reset is requested.

First handle freeze=0. Reset clears value; otherwise an edge with load=1 captures data, and load=0 preserves the previous value.

**Reason it through:** If `data` changes after the crate is removed and `load` stays low, what should the display keep showing?

**Check your reasoning:** Load 5A hexadecimal, lower load, and change data to 03. value must remain 5A across further edges.

## 2. Resolve conflicting controls

The hold button must now protect a displayed weight from a new load request. Add the freeze behavior while still allowing the vendor to clear the display for the next customer.

Extend the behavior to freeze. Reset always clears, including during freeze or load. Otherwise freeze=1 prevents a load; with freeze=0 the first task’s behavior remains.

**Reason it through:** Which control wins when reset, freeze, and load are all high? What wins when only freeze and load are high?

**Check your reasoning:** Load 33, freeze while requesting 77, then reset while still frozen. The output sequence should be 33, 33, 00.

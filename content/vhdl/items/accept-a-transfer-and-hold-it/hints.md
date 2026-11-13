## 1. Accept and preserve one word

Keep a full/empty flag separately from the stored byte. Update data only for an accepted transfer.

## 2. Remove or replace a pending word

Readiness depends on whether space is available now or the old word will leave on this edge. Update the stored state from transfers that actually occur.

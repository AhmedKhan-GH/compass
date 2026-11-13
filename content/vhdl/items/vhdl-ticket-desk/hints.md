## 1. Issue tickets safely

The counters belong in the protected body, where every procedure has serialized access.

## 2. Serve only waiting customers

Guard the update with `if waiting_count > 0`; each impure query returns its private counter.

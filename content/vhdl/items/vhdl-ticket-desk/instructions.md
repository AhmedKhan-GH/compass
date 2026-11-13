At a busy museum ticket desk, two clerks can hand out numbers while a server calls the next visitor. Those activities run in separate testbench processes, but the public totals must always describe one consistent queue. Complete the protected body in `ticket_pkg`; the declaration already fixes the public methods, and every supplied process uses the same `ticket_desk_t` object.

## 1. Issue tickets safely

Implement `reset` and `issue`; each issue adds exactly one to the private issued and waiting counts.

Before the desk opens, `reset` must return all three private counters to zero. Each clerk then calls `issue` independently. Treat one call as one ticket: increase the lifetime issued total and the current waiting count together, without changing the served total.

**Reason it through:** Why may a shared variable have a protected type when an ordinary shared integer is unsafe?

## 2. Serve only waiting customers

Implement `serve` so it increments served and decrements waiting only when someone waits. Return state through the three impure functions.

The server may call `serve` while the queue is empty, and that call must leave all counters unchanged. When someone is waiting, move exactly one person from waiting to served. Implement each query as a read of its corresponding private counter so the wrapper can verify the invariant `issued = served + waiting`.

**Reason it through:** Which invariant connects issued, served, and waiting?

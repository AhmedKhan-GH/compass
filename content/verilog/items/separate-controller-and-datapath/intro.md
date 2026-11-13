The **datapath** stores and changes numeric values. The **controller** decides when to perform those changes. For a repeated operation, distinguish accepting a request from doing its work on later edges.

A useful design sketch names the stored quantities, the actions that update them, and the conditions that select those actions. With nonblocking assignments, the controller uses values from before the edge to decide which updates to schedule.

A completion pulse is an event lasting one cycle, whereas a result may stay available after completion. You also need rules for a zero-length request and a new request that arrives while the circuit is busy.

You will use both parts to control an arcade token dispenser.

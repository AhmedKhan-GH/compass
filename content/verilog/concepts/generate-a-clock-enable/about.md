A circuit can do some work less often while keeping all its registers on one clock. Count the clock edges and use an enable signal to allow an update on every Nth edge.

A registered pulse is visible after the edge that generated it. Another register reading that pulse on the same edge sees its old value. If two outputs must update together, use a condition that both can read before that edge, or one may update a cycle late.

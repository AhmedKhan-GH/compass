The departure board updates less often than its clock ticks. An **enable pulse** can mark the selected ticks while every register still uses the same clock. A small counter keeps track of which tick comes next.

A registered pulse becomes visible after the edge that creates it. If another register reads that pulse on the same edge, it reads the old value. This can put a maintenance counter one update behind.

When two outputs must change on the same edge, work out the condition that should cause both changes from the values available before that edge.

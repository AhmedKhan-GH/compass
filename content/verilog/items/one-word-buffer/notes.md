# IV-070: Paused display

Combines ready/valid storage with cancellation. Flush immediately suppresses readiness and validity; its rising clock edge clears occupancy. Offered data at that edge is not accepted. Reset is synchronous and has priority. Data is unspecified whenever output validity is low.

Tests cover capture, hold, removal, old-data observation before same-edge replacement, flush during a stall or replacement, ignored input during flush, recovery, and reset while occupied. Compiling mistakes prevent full replacement or ignore flush. No specific state-register layout is supplied in the starter.

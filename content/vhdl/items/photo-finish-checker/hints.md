## 1. Inspect the frame after the camera has updated

Waiting for the edge resumes the checker in the same simulation time as the camera process. `wait for 1 ns` leaves the update delta cycles behind while staying before the falling edge. Use `is_x(captured_bib)` before ordinary vector equality so an unknown captured word never counts as a match.

## 2. Present the next runner between shutter edges

The driver owns `bib`. Wait for `falling_edge(clk)`, then assign the new value to the signal. Do not add a time delay afterward; the caller uses the procedure return to know when presentation began.

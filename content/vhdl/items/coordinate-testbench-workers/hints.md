## 1. Run independent traffic workers

The labeled processes already run concurrently. Keep `send` inside the producer and each worker's final `wait`.

## 2. Coordinate checking and termination

Use `for i in expected'range loop`. The consumer owns `errors`, the verdict, `test_done`, and normal `finish`; the watchdog reports only when its bounded loop ends unfinished.

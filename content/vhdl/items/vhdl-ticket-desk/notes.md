# Protected shared state

Introduce protected declarations and bodies after concurrency and packages. Coordinate operations through methods while keeping mutable state private.

## Verification

Issue from concurrent clerks, serve an empty desk, then serve waiting customers. Verify issued = served + waiting; dropping served counts must fail.

The starter compiles with unfinished behavior. Each numbered task maps to independent named checks; the reference must pass every check. Waveforms show the supplied observation wrapper.

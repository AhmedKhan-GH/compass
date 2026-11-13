# Records and aggregates

Group related weather fields in a typed record, then define an explicit wire encoding. Preserve signed temperature meaning across pack/unpack.

## Verification

Check positive and negative temperatures, humidity fields, validity, a record round-trip, and a separately encoded input word. The swapped-field mutant must compile and fail behaviorally.

The starter compiles with unfinished behavior. Each numbered task maps to independent named checks; the reference must pass every check. Waveforms show the supplied observation wrapper.

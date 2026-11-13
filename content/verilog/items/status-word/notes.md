# Status word

Original Nebula concept exercise, IV-005. Requires continuous assignments, scalar connections, constants and introductory Boolean logic; teaches the `words` concept. The supplied ports avoid an interface-writing barrier. The learner first widens one internal wire, then packs inputs, extracts a bit and a field, and compares the field with a sized constant.

The five tasks are ordered edits within one coherent circuit. Tests are grouped by externally visible output so that intermediate progress is visible. The starter compiles, including its deliberately narrow internal wire, and fails behavior tests. Width mismatch warnings are part of that unfinished starter; the reference is width-correct.

Every combination of ready, fault and the two-bit mode is checked for every output. Specific wrong solutions swap the two flag fields, select a shifted mode slice, and recognize only the upper mode bit. These compile and must fail. All four modes are legal; the two flags are independent.

Behavioral tests cannot require a specific internal declaration or prove that outputs use the packed wire. This is explicit in the learner instructions. Accept equivalent correct implementations rather than adding source-string checks. A later source/schematic coaching layer can discuss the intended connections.

Learner code needs only Verilog-2001 wires, continuous assignments, slices, concatenation, sized binary constants and equality. No implicit arithmetic, procedural assignments, loops, parameters, unknown-value semantics or physical display knowledge is required. Packing and slicing are wiring; an equality comparison can become gates. No promise is made that an optimized diagram preserves every alias.

## Independently executable tasks

Task 1 now asks learners to carry the constant 4'b1010 through the widened internal wire. Its directed public-output test uses ready=1, fault=0 and mode=2, so it also passes for the final packed circuit. This turns the declaration/literal step into observable behavior without inspecting source strings or simulator-private wires. Tasks 2–5 map to the existing pack, bit selection, slice and equality checks. Every declared test belongs to one task; the reference passes all tasks together. Each stage retains earlier passing behavior while later placeholders remain unfinished.

# Workshop controls

IV-003 introduces `boolean-logic` after `connections`: one-bit inversion, AND,
OR, explicit expression grouping, truth tables, and concurrent continuous
assignments. It also explains the multiline port wrapper and comment syntax so
the starter contains no unexplained language construct.

The lesson is one circuit completed in three coached steps, rather than an
unexplained multi-operator puzzle. First invert a blocker into availability;
then permit one request; finally extend that request to either of two buttons.
Each step names a relevant test. The output dependency may be repeated as
`~blocked` or shared through `available`; both implementations are valid.

Inputs are abstract binary controls. Debouncing, active-low physical switches,
unknown-value semantics, procedural blocks, vectors, and clocks are deliberately
not required. The introduction says there is no clock or stored state, and the
truth table plus changing-input checks establish a continuing relationship.

The tests cover every binary input combination, verify that buttons cannot
affect availability, and revisit transitions. They report all input values and
the expected/observed bit. The three incorrect implementations compile and
represent independent misconceptions: a button bypasses the blocker because of
grouping, AND is used where OR is required, and blocking polarity is reversed.
The constant starter compiles but fails the first and request tests.

## Independently executable tasks

The three numbered instruction sections and `custom.nebula.tasks` map inversion to the availability test, AND to the first-button test with button_b held low, and the OR extension to the remaining checks. Earlier task tests remain valid for the completed circuit. New syntax is explained inside each task, rather than front-loading every operator in the introduction.

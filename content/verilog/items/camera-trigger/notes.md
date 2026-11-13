# Camera trigger

IV-004 practices `boolean-logic` after Workshop controls. It asks the learner to
translate a short prose specification into one expression using familiar
continuous assignment, AND, and inversion. This first independent application
introduces no new syntax, electronics knowledge, or interpretation of pulse
timing. The instructions explicitly define capture as a level, not an event.

Three input requirements compose into one decision. Examples establish the
successful input combination and the effect of inhibition; learners derive the
remaining combinations from the prose instead of copying a full truth table.
Hints refresh inversion and conjunction without providing the completed code.

Tests cover all eight binary combinations and successive input changes. They
include the absence of a request, a disabled controller, and inhibition of an
otherwise valid request, with input/expected/observed messages. The three
compiling wrong implementations omit the enable condition, reverse inhibit
polarity, or accept request OR enable. The compiling constant starter fails the
valid-request test. This checks semantic mistakes, not code style.

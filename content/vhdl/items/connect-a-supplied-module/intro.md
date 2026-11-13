A direct entity instantiation names `entity work.level_compare` and connects ports with a named `port map`. The component's result can then feed local enable logic. Elaboration creates the configured hardware before simulation begins. Named associations make each connection reviewable, while generic-controlled ranges ensure that every instance has ports of the width selected for that instance.

Direct entity instantiation connects a known design unit with a named port map:

```vhdl
limit_check: entity work.threshold_checker
    port map (
        reading => tank_level,
        limit => high_mark,
        reached => raw_alarm
    );
```

The label before the colon identifies this instance. Named associations show the child port on the left and the local parent signal on the right, so declaration order does not control wiring.

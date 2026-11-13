A protected type gives concurrent testbench processes one shared object without exposing its internal variables. Its declaration is the public interface; the protected body holds the state and implements each operation:

```vhdl
type ticket_desk_t is protected
    procedure reset;
    procedure issue;
    impure function waiting return natural;
end protected;
shared variable desk : ticket_desk_t;
```

Inside the protected body, ordinary variables such as `issued_count` remain private. Procedures update that state with variable assignment `:=`; clients invoke them as `desk.issue`. Query functions are `impure` because their answers depend on mutable state rather than only on arguments.

Calls on one protected object are mutually exclusive. Concurrent clerk and server processes can therefore update related counters without observing a half-finished operation. VHDL permits a shared variable of protected type for this purpose; clients reach its state only through the declared methods.

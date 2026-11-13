An unconstrained array type fixes its index type and element type while leaving the actual bounds to each object. The box `<>` means that an object or parameter supplies those bounds later:

```vhdl
type shelf_t is array (integer range <>) of integer;
function total(values : shelf_t) return integer;
```

One object can then be declared as `shelf_t(3 to 5)` and another as `shelf_t(7 downto 4)`. Both have legal integer indices, but their first labels and traversal directions differ.

Inside a function, `values'left` and `values'right` return the ends exactly as declared, while `values'length` returns the number of elements. A loop over `values'range` visits every legal index in the object's direction. These attributes keep the subprogram independent of a zero origin and prevent indexing outside the object.

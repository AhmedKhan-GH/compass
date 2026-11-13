An exhibition uses light sculptures of different sizes, including a small three-light piece and a larger eight-light piece. The designer wants to choose between two live patterns on each sculpture and use a blackout control to darken it during setup, regardless of that choice. Your job is to make the same configurable control entity work for both sizes while keeping those controls predictable.

## Required behavior

Keep entity configurable_selector with generic WIDTH (default 8). Inputs a and b and output data each have WIDTH bits; selection and blank are one bit. When blank is 1, every output bit is zero. Otherwise selection=0 chooses a and selection=1 chooses b.

The supplied wrapper checks WIDTH=3 and WIDTH=8. For the narrow instance, a=010, b=101, selection=1, blank=0 gives 101; setting blank to 1 gives 000.

## Before you code

Which declarations and constants could accidentally depend on the default width? Which control wins when blank and selection are both high?

## Check your reasoning

Use different nonzero words in the two configurations and exercise every control combination. Then change an unselected input.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.

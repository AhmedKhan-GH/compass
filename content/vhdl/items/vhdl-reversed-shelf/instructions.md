A parts room inherited two shelves whose bin numbers are already painted on the wood. The newer shelf runs upward from label 3, while the older shelf begins at 7 and runs downward. The inventory display must report those physical end labels and total every bin without renumbering either shelf. Complete the functions in `shelf_tools`; the supplied wrapper calls the same package with both layouts.

## 1. Report each shelf's declared bounds

Implement `first_label`, `last_label`, and `slot_count` using array attributes on the unconstrained parameter.

For the ascending shelf, “first” is its low-numbered end. For the descending shelf, “first” is the label written first in its declaration, even though that number is larger. Preserve that declaration order in the report.

**Reason it through:** Which attribute follows declaration order even when the numeric direction is descending?

## 2. Total every declared slot

Implement `stock_total` by iterating over the parameter's own `range` and adding each element once.

The two shelves contain different numbers of bins and neither begins at zero. The total must therefore follow the actual indices passed to the function rather than constructing new indices from the length.

**Reason it through:** Why would a loop from zero to `length - 1` fail for both supplied shelves?

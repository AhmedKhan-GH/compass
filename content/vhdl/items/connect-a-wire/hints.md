## 1. Add the visitor's switch

Add an `in std_logic` port in the entity. A semicolon separates it from the existing output port. Add no assignment to the input in the architecture.

## 2. Follow the visitor's switch

The introduction's door panel follows a changing signal. Use the input's name where First Light used a constant. Replace the existing output assignment instead of adding a second driver. The destination stays on the left; the source goes on the right.

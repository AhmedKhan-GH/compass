## 1. Time one exposure

Selecting one bit of `lamps` changes that lamp without replacing the other bits. A delay written with parentheses can use the task's duration argument. A blocking assignment at either end of the delay makes the task's return coincide with the lamp turning off.

## 2. Keep overlapping exposures independent

The task still needs `lamp_number` after the delay. Static calls share that argument's storage. An automatic task gives each call its own copy. The module's `lamps` register is still shared, so keep changing only the selected bit.

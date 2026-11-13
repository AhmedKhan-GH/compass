## 1. Separate live and stored information

Use the present input for the live output and a register for the remembered output.

## 2. Define when the memory changes

Check reset first, then acknowledgement, then alarm. Keep `immediate_warning` tied to the current alarm so acknowledging the stored warning cannot hide it.

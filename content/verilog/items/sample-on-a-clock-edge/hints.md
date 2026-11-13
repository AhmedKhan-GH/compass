## 1. Capture one sample

Update the register inside the supplied rising-edge procedure. Use nonblocking assignment so the update follows clocked register behavior.

## 2. Preserve the preceding sample

Both nonblocking assignments read their right-hand sides before the stored values update. The second register can therefore take the first register's old value.

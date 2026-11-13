## 1. Load or hold a reading

Update the register only when an action requires it. Leaving it unassigned on an idle clock edge keeps its old value.

## 2. Resolve conflicting controls

Check the rule that must win first. Freezing the display must not prevent reset from clearing it.

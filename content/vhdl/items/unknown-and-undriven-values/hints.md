## 1. Restore the missing connection

Give `connected` one driver carrying `source`. A constant would fix only one of the two possible source values.

## 2. Compare definite inputs

For the known inputs tested here, ordinary equality gives 1 when they match and 0 when they differ.

## 3. Resolve the competing driver

Find every assignment driving `conflict_free`. Remove the unwanted driver rather than adding a third assignment to try to override it.

## 1. Connect the comparison component

Read the child's port names before connecting it. Once the child drives `raw_high`, remove the placeholder assignment so there is only one intended driver.

## 2. Apply the cabinet permission

Use the child's output as a signal in the parent. Apply the enable check after the comparison so the raw result stays available.

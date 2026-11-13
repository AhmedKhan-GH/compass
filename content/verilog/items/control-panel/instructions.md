During a rehearsal, the backstage operator follows a cue using a console that shows status lights alongside crew alerts. Hiding irrelevant lights helps the operator concentrate, but that display choice must not hide a warning from the crew. You will combine the status-light controls with an alert selector, keeping the two functions independent while making sure the most urgent alert is the one shown.

## Required behavior

Inputs `status` and `mask` are eight bits. Each set `status` bit means a backstage condition is active; a set `mask` bit asks to display that position. One-bit inputs `critical` and `warning` are independent crew alerts. Eight-bit output `shown` displays a status bit only when its mask bit is `1`. Two-bit output `alert_code` reports `2` for critical, `1` for warning without critical, and `0` otherwise.

Alert changes must not affect `shown`, and mask changes must not affect `alert_code`. For `status=B3` and `mask=0F` hexadecimal, `shown` is `03`. Both alerts together report code `2`.

## Before you code

Separate the two decisions, then choose a test where both change at once. How could you spot a mask that accidentally blocks an alert?

## Check your reasoning

Hide every backstage light, then raise a critical alert: the alert must still appear. Next use an alternating mask while switching between critical, warning, and neither. Check that all outputs settle without depending on earlier settings.

Keep the supplied module interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.

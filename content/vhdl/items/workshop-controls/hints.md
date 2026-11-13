## 1. Turn on the ready light when blocked is 0

The light needs the opposite of the lock signal. NOT changes `0` to `1` and `1` to `0`.

## 2. Set start to 1 when button A is pressed and blocked is 0

The ready light already tells you whether the lock is off. Which gate requires both a pressed button and that ready signal?

## 3. Let either button set start to 1 when blocked is 0

Combine the two button requests, then apply the shared lock rule. Parentheses can keep the requests together.

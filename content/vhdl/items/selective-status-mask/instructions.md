A route setter is changing the illuminated holds on a climbing wall but wants to keep part of the current route while trying a new section. The preview needs to make those protected positions visible and show how the proposed changes would fit around them. You will produce both views from the current pattern, the protected positions, and the proposed replacement, without storing a new route.

A set bit represents a lit route marker. This circuit previews the next arrangement; it does not store it.

## Required behavior

All ports are eight bits. `old_status` is the current route-light pattern, `selection` identifies positions the route setter wants to protect, and `updates` is the proposed replacement pattern.

- `shown` uses the `old_status` bit where `selection=1`, and `0` where `selection=0`.
- `merged` uses the `old_status` bit where `selection=1`, and the `updates` bit where `selection=0`.

Each bit position works independently. For `old_status=10100101`, `selection=11110000`, and `updates=00111100`, the results are `shown=10100000` and `merged=10101100`. Both outputs follow the current inputs.

## Before you code

Write the rule for one position first. Which input supplies that bit for each value of `selection`?

## Check your reasoning

Try a completely new route (`selection` all-zero), a fully protected route (`selection` all-one), and alternating protected positions. Explain which pattern supplies each visible light.

Keep the supplied entity interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.

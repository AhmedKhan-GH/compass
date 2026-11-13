A rooftop rainwater system collects water in two tanks, either of which may fill first. The caretaker wants one warning that draws attention to a high level, alongside separate indicators that show which tank needs checking. Both tanks use the same high-level setting, so your job is to reuse the supplied comparison component for their independent readings and bring the results together in the shared warning.

## Required behavior

level_a, level_b, and limit are unsigned eight-bit inputs. high_a and high_b report whether the corresponding tank level is at or above the shared limit. any_high is 1 when at least one tank is high.

Reuse level_compare for both tanks. All outputs are combinational. At limit=100, levels 99 and 100 produce high_a=0, high_b=1, and any_high=1.

## Before you code

Which connections can be shared and which must stay independent? Choose inputs that would expose both components accidentally being connected to tank A.

## Check your reasoning

Raise only B, then only A, then both. Equality with the threshold must count as high for either tank.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.

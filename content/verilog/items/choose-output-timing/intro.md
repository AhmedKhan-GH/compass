Output timing is part of a circuit’s behavior. A combinational output can respond to the present input between clock edges. In this lesson, the stored output changes only at its sampling edge and can remember an alarm after the input disappears.

The rule for simultaneous set and clear requests is a design choice. State that rule clearly: similar alarm circuits can have different priorities. This lesson gives acknowledgement priority, unlike the earlier machine-fault alarm.

You will give the bakery cooler's two indicators different timing and clearing rules.

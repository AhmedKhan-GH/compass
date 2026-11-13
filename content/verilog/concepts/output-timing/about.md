Output timing is part of a circuit’s behavior. A combinational output can respond to the present input between clock edges. In this lesson, the stored output changes only at its sampling edge and can remember a signal after that input disappears.

The rule for simultaneous set and clear requests is a design choice. Write down which request wins; two alarm circuits may need different rules. This lesson gives acknowledgement priority, unlike the earlier machine-fault alarm.

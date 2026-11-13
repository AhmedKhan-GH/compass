Writable memory combines an array of words with rules for when words may change and when reads become visible. A registered read waits for a clock edge, unlike the combinational table from the previous lesson.

A read and a write can use the same address on the same edge. Decide whether that read returns the old word or the new one, then describe that behavior in the logic. Declaring the array does not choose the rule for you.

An address may have enough bits to select locations that do not exist. Check whether the address is within the memory’s actual range.

# Palindrome panel

Original Nebula practice exercise, IV-007. Practices `words` and earlier `boolean-logic`. Requires `words` and `boolean-logic` to make both proposed solution approaches explicit. Uses one fixed eight-bit word; learners need no algorithmic loops, width parameters, string processing or number conversion.

The reference compares a four-bit slice against four concatenated mirrored bits. A valid alternative ANDs four pairwise equalities. The specification names all four pairs, illustrates leading zeroes, and distinguishes repeated halves from mirrored halves. The pair of prediction examples isolates the central pair without adding a new language construct.

Tests independently reverse an eight-character binary representation as an oracle. All 16 symmetric words are checked, all 240 nonsymmetric words are rejected, and a final test alternates symmetric and nonsymmetric inputs to exercise continuous behavior. Wrong solutions check only the outside pair, compare unchanged halves, or omit the central pair. These compile and fail; the zero-output starter compiles and fails the positive cases.

If showing a schematic, equality may become comparison gates or a decomposed gate network. Ask the learner to follow mirrored input pairs instead of promising an exact block count. These are original teaching materials, not copied from the ChipDev archive.

# IV-011: Status light bank

Teaches bitwise operators after word layout. Three staged tests independently cover inversion, per-position masking, and global toggling controlled only by mask bit 0. Each stage retains earlier outputs and leaves later outputs observably unfinished. The final stage equals the exemplar.

Each output is checked over all 256 status words and masks 0, 1, 0x55, 0xAA, and 0xFF. The mask-selection stage must not include a working toggle; the inversion stage must not include a working kept output.

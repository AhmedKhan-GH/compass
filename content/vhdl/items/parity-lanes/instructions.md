A vineyard controller receives moisture readings from several rows at once, each accompanied by a parity bit that helps check for transmission errors. When a check fails, the grower needs to know which row's reading is affected without losing confidence in unrelated rows. Your job is to connect the supplied parity checker to each reading and its matching check bit so every row gets its own result.

## Required behavior

Generic LANES defaults to 4. data contains LANES adjacent bytes, with lane 0 in bits 7:0, lane 1 in 15:8, and so on. received_parity and error each have one bit per lane.

Use one parity8 component per lane. error for a lane is 1 when that byte and its corresponding received parity bit fail even parity. Other lanes must be unaffected. The supplied parity8 ports are data (8 bits), parity (1 bit), and error (1 bit). Outputs are combinational.

## Before you code

For any lane number, what are the first and last bit positions of its byte? Which parity bit belongs to it?

## Check your reasoning

Change a reading from one vineyard row at a time, including the highest numbered row, and check that only its error bit changes. A correct population count across the whole bus would not satisfy independent checking.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.

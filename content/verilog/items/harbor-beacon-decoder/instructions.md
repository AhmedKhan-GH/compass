At a model ship exhibition, radio beacons select announcements about arrivals, departures, and the weather. While a simulated message is incomplete, a wildcard decoder can still recognize a pattern in it, making a possible announcement look ready to use. Build the checks that keep those two decisions separate, so the controller can identify a candidate while waiting for the complete message before accepting it.

`message` is a four-bit received word. Its upper bits choose an announcement family; the remaining bits identify the display unit. The public family codes are 1 for arrival, 2 for departure, and 3 for weather. Code 0 means no accepted family.

## 1. Identify a candidate announcement

The exhibition controller first needs to identify the kind of announcement suggested by a beacon. Apply the listed patterns to show that candidate, while leaving the decision to accept the whole message for later.

Make `candidate_family` follow these `casez` patterns in the listed order. If no pattern matches, use 0.

| Message pattern | Candidate family |
| --- | --- |
| `00??` | 1 — arrival |
| `01??` | 2 — departure |
| `1???` | 3 — weather |

The `?` positions ignore their bits, even when those positions contain `x` or `z`. An `x` in a position that requires 0 or 1 does not match. An input `z` acts as a wildcard under `casez`, even in a required position.

If several patterns match, use the first listed match. This result identifies a candidate; task 3 decides whether to accept the message.

**Reason it through:** Compare `00x1`, `0x01`, and `z001`. Which uncertainty falls in an ignored position? Which candidate appears because `casez` treats an input `z` as a wildcard?

**Check your reasoning:** Expect candidate 1 for `00x1`, candidate 0 for `0x01`, and candidate 1 for `z001`. Replacing the required `x` with a wildcard must not silently turn the second word into an arrival.

## 2. Recognize a complete simulated word

A candidate announcement can be recognized even when part of its message is missing in simulation. Add a separate check that tells the exhibition controller whether every message bit is known.

`word_known` must be 1 only when all four message bits are 0 or 1. It must be 0 if any bit is `x` or `z`, including a bit ignored by the candidate patterns. The diagnostic itself must always be 0 or 1.

**Reason it through:** Why does knowing the announcement family not establish that the entire message was received? What answer should `00x1` get even though its family is already identifiable?

**Check your reasoning:** Move a single `x`, then a single `z`, through all four positions. Every such word must be marked incomplete. All sixteen ordinary binary words must be marked complete.

## 3. Publish only a complete announcement

The controller now has both a candidate announcement and a complete-word check. Combine them so an incomplete simulated message stays silent, while a complete message publishes the family identified by the decoder.

`accepted_family` must equal `candidate_family` when `word_known` is 1, and must be 0 otherwise. An incomplete word must never publish an announcement, even when wildcard matching found a candidate.

**Reason it through:** Trace `z001` through both earlier outputs. Why is the candidate alone insufficient for the simulator's acceptance decision?

**Check your reasoning:** Follow an incomplete arrival, a complete arrival, an incomplete weather request, and a complete weather request in Waveforms. A valid message must work immediately after an incomplete one. This diagnostic models missing simulation information; real receiver validity requires a separate physical protocol.

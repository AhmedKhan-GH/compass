# RTL Design with VHDL

This independent course contains **88 exercises: 49 concept lessons and 39 practice
problems**. It begins with no HDL knowledge. It shares the Verilog course's 84
hardware scenarios while teaching native VHDL syntax and semantics, then adds four
VHDL-specific lessons. A learner can start here without taking Verilog.

The implementation targets VHDL-2008 with GHDL. It covers the core language needed
to describe, compose, simulate, and test small digital designs: entities and
architectures; concurrent assignments; processes; explicit types and `numeric_std`;
generics and generation; arrays, records, and packages; functions and procedures;
clocked state, memory, state machines, ready/valid transfers, and a synchronous FIFO;
TextIO, delta cycles, timed waits, resolved logic, and protected shared state.

Concept lessons introduce syntax with small examples, then use numbered tasks in
a practical setting. Practice problems combine prior ideas. All lessons are
available immediately; prerequisite metadata describes learning order without
locking access. Each task has its own mapped checks and hints.

Design-practice starters leave the algorithm to the learner. Repair exercises
instead supply faulty code that reproduces the reported symptom. Native
testbench lessons keep the supplied checking harness intact while leaving the
learner's stimulus, observations, or helper procedures unfinished.

## Milestones

| Milestone | Outcome |
| --- | --- |
| First signals | Explain a constant, a wire, and a gate using both source and a schematic. |
| Combinational design | Build complete decisions and reason about numeric width and signedness. |
| Reusable blocks | Connect entities and vary hardware with generics and generation. |
| Clocked design | Trace state changes, reset, enable, latency, and memory access on waveforms. |
| Composed behavior | Build controllers, arithmetic datapaths, handshakes, and a bounded queue. |
| Independent checks | Write VHDL testbenches that accept correct designs and reject realistic faults. |
| Language fluency | Organize a project with packages and reason about arrays, records, scheduling, and shared simulation state. |

This is a language foundation. Board bring-up, CDC/reset-domain analysis, timing
closure, vendor IP, large verification environments, UVM, and fabrication remain
separate applied courses. Generating a schematic is not physical implementation
or sign-off. The language roadmap describes those next
paths without adding them to this course's completion requirements.

## Lesson sequence

Learning lessons introduce concepts; practice lessons combine them. The ordered
catalog in `config.json` is the executable source of truth.

### First signals and decisions

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 1 | First Light | Learning | Give a museum exhibit its first always-on power indicator. |
| 2 | Exhibit Switch | Learning | Let a visitor control a lightbox directly from its switch. |
| 3 | Workshop Controls | Learning | Bring two conveyor buttons into service behind one shared lock. |
| 4 | Bird Feeder Camera | Practice | Let a wildlife camera honor picture requests only when its controls permit. |
| 5 | Service Visit | Learning | Give a vending-machine technician a compact, readable status connection. |
| 6 | Replacement Lights | Practice | Adapt an exhibit's old controller to a new lamp-panel connector. |
| 7 | Balanced Lights | Practice | Tell a theatre desk whether an eight-lamp arch has a symmetric pattern. |
| 8 | Greenhouse Readings | Learning | Choose a planting bed's reading and make room for a service display. |
| 9 | Rehearsal Lights | Practice | Send a brightness setting to one strip of footlights while the others stay dark. |
| 10 | Aquarium Alerts | Practice | Show the aquarium keeper the most urgent active message. |

### Combinational expressions and complete decisions

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 11 | Bicycle Light Studio | Learning | Preview inverted, masked, and toggled patterns for a row of bicycle LEDs. |
| 12 | Route Setter | Practice | Preview new climbing-wall lights while protecting part of the existing route. |
| 13 | Parcel Lockers | Learning | Summarize eight locker compartments for collection, capacity, and diagnostics. |
| 14 | Weather Station Link | Practice | Help an indoor display recognize a damaged sensor message using parity. |
| 15 | Drying Cabinet | Learning | Choose a drying fan's operating state and speed for every control combination. |
| 16 | Camera Modes | Learning | Translate a camera dial into mode lamps and an operating permission. |
| 17 | Bakery Number Display | Practice | Turn decimal codes into a clear seven-segment collection-counter digit. |
| 18 | The Fan That Stays On | Practice | Reproduce and repair a drying fan output that survives after its request ends. |
| 19 | Backstage Console | Practice | Combine filtered backstage lights with an independent priority alert. |

### Numeric meaning and width

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 20 | Parts Bin Totals | Learning | Match a parts counter's limited arithmetic display and compare the original quantities. |
| 21 | Waterline Watch | Practice | Accept aquarium levels within chosen bounds and report either kind of excursion. |
| 22 | Room for the Total | Learning | Upgrade the parts counter to preserve a total its old display could not hold. |
| 23 | Scoreboard Limit | Practice | Keep an arcade score at its display maximum and flag a larger total. |
| 24 | Mountain Thermometer | Learning | Compare temperatures and widen their representation without losing the sign. |
| 25 | Freezer Trials | Practice | Check signed temperature limits during cooling and defrost test runs. |
| 26 | Motion Display Scales | Learning | Scale movement readings while accounting for lost bits and negative rounding. |
| 27 | A Warmer Display? | Practice | Repair the adapter that turns the hut's below-zero temperatures into positive readings. |

### Hierarchy and reusable hardware

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 28 | Cabinet Upgrade | Learning | Reuse a tested level comparator and add an independent alarm-enable control. |
| 29 | Rooftop Tanks | Practice | Monitor two rainwater tanks with independent comparisons and a shared alert. |
| 30 | Display Kits | Learning | Build one configurable live-pattern and lamp-test circuit for two kit sizes. |
| 31 | Sculpture Controls | Practice | Select and black out patterns on both small and large light sculptures. |
| 32 | Workshop Workbenches | Learning | Construct independent extraction permissions for a configurable set of benches. |
| 33 | Vineyard Readings | Practice | Check each row's sensor byte independently with repeated parity components. |

### Simulation values and first native tests

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 34 | After the Move | Learning | Trace missing and competing connections in a reassembled museum exhibit. |
| 35 | Selector Checkout | Learning | Test replacement greenhouse selectors and distinguish reversed or stuck paths. |
| 36 | Indicator Inspection | Practice | Choose asymmetric tests that expose a bicycle harness's incorrect connections. |

### Clocked state and timing

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 37 | Training Monitor | Learning | Keep the latest captured reading and the one before it for a side-by-side display. |
| 38 | Light Trails | Practice | Make an exhibit's second lamp row echo its pattern one sample behind. |
| 39 | Blackout timing | Learning | A theatre lighting desk stores two dimmer levels. |
| 40 | Market scale hold | Learning | A market vendor wants to lift a crate off the scale and still read its weight. |
| 41 | Pinsetter jam light | Practice | A bowling pinsetter can report a brief jam and recover before the attendant looks over. |
| 42 | Register inspection bench | Learning | A repair shop is checking replacement sample_register components before fitting them to its boards. |
| 43 | Speaker delay check | Practice | A model public-address system sends one speaker the previous captured audio sample so two paths line up. |
| 44 | Irrigation rounds | Learning | A garden controller has six installed watering zones and a maintenance display with eight possible positions. |
| 45 | Turnstile crossing meter | Practice | A turnstile breaks a light beam while a visitor passes through. |
| 46 | Departure board refresh | Learning | A model station departure board is scheduled to refresh once every four clock ticks. |
| 47 | Darkroom exposure | Practice | A darkroom enlarger exposes a print for the duration chosen when the photographer presses start. |
| 48 | Cinema marquee | Learning | A cinema marquee has a row of eight lamps. |
| 49 | Barn gauge link | Practice | A farmhouse sends a gauge reading to a display in the barn over a serial data line with a shared clock. |
| 50 | Scoreboard button | Practice | A gym scoreboard should add one point when its button is pressed, even if the referee keeps holding it. |

### Loops, subprograms, and memories

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 51 | Greenhouse moisture map | Learning | A greenhouse bench has eight moisture probes, with a 1 meaning that a pot is wet. |
| 52 | Cabin lamp budget | Practice | An off-grid cabin has twelve equal-load lamps and a configurable budget for how many may be lit together. |
| 53 | Laundromat status board | Learning | A laundromat displays how many machines are running in each of three eight-machine banks. |
| 54 | Plotter jog limits | Practice | A small plotter accepts manual position offsets for three axes, but each permitted offset lies between -40 and 60 steps. |
| 55 | Organ preset cards | Learning | An electronic organ stores eight preset stop patterns as individual bytes. |
| 56 | Coffee roast profiles | Learning | A coffee roaster stores five profile bytes, but its selector has eight positions. |
| 57 | Rain gauge history | Practice | A field station keeps a short history of its five most recent accepted rainfall readings. |
| 58 | Pocket trail logger | Practice | A compact trail monitor records one-bit door events into three slots. |

### Reusable native tests and state machines

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 59 | Repair bench routine | Learning | A repair shop repeats the same register checkout for every refurbished board. |
| 60 | Returned weather station | Learning | A weather-station board has returned to the repair bench with a short capture file. |
| 61 | A missed bench fault | Practice | A repair bench approved a batch of register boards, yet a returned unit misbehaves when loading pauses. |
| 62 | Garden railway signal | Learning | A garden railway signal moves through STOP, GO, and a brief CAUTION before it is ready for another request. |
| 63 | Packing-line merge | Practice | Two packing lines feed one labelling station, so only one line may be released at a time. |
| 64 | Bakery cooler warning | Learning | A bakery cooler has a live door-alarm indicator and a second indicator that remembers a sampled alarm after the door closes. |
| 65 | Rocket telemetry marker | Practice | A model rocket's telemetry receiver looks for marker 101 in its incoming bit stream. |
| 66 | Window turntable | Practice | A shop-window turntable should cycle through three display positions, but it reaches the third and stays there. |

### Datapaths, handshakes, and queues

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 67 | Arcade token hopper | Learning | An arcade change machine dispenses a requested number of tokens one working edge at a time. |
| 68 | Farm-stand total | Practice | A farm-stand scale multiplies a whole-number quantity by its unsigned price-per-unit code. |
| 69 | Scanner to printer | Learning | A barcode scanner can produce a byte while a label printer is still busy. |
| 70 | Price-sign recall | Practice | A shop's electronic price sign can hold one pending update while its display driver is busy. |
| 71 | Photo-booth spool | Learning | A photo booth can have five prints waiting in its spool. |
| 72 | Wind-tunnel samples | Practice | A wind-tunnel sensor sends bursts of readings to a display that pauses between updates. |
| 73 | Queue inspection bench | Learning | The repair bench now needs to inspect a queue while sending and receiving happen independently. |
| 74 | Wrap and stall | Practice | A queue passed the bench's three-byte checkout, but a longer field capture shows readings arriving out of order. |
| 75 | Ghost frame | Practice | A lecture-hall selector should blank its eight-bit display word when disabled, yet the previous image remains visible in the model. |
| 76 | Belt-scale readout | Practice | A model grain conveyor doubles each accepted sample into its display units. |

### Deeper language behavior and project structure

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 77 | Museum audio guide | Learning | Repair a museum handset that recognizes the wrong exhibits and loses its volume settings. |
| 78 | Alpine weather station | Learning | Keep below-zero weather readings correct as radio packets become calibrated display values. |
| 79 | Observatory shutter | Learning | Explain a telescope shutter simulation whose startup controls have not yet settled. |
| 80 | Harbor beacon decoder | Learning | Stop incomplete harbor messages from masquerading as valid beacon commands in simulation. |
| 81 | Photo finish | Learning | Repair a finish-line camera checker that mistakes the previous runner for the current one. |
| 82 | Darkroom timers | Learning | Keep three photographic enlargers on independent timers when their exposures overlap. |
| 83 | Observatory startup | Learning | Start an observatory camera without missing readiness or waiting beyond its deadline. |
| 84 | Trail counter kit | Learning | Build a portable arrival counter and milestone lamp for short surveys at trail entrances. |

### VHDL-specific data and simulation models

| # | Exercise | Kind | Aim |
| --- | --- | --- | --- |
| 85 | The Reversed Shelf | Learning | Measure shelves whose index labels can run in either direction. |
| 86 | Weather Report Envelope | Learning | Pack and unpack a typed weather report without losing its named fields. |
| 87 | Door Chime Timing | Learning | Keep a door chime from reacting to a brief contact bounce while preserving real events. |
| 88 | The Ticket Desk | Learning | Coordinate concurrent ticket clerks through one protected shared desk. |

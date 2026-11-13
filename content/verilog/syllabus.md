# Core Verilog curriculum

Status: implemented and editorially revised, 8 September 2026. **84 exercises:
45 concept lessons and 39 practice problems** in `tracks/verilog`. The separate
capstone remains planned. Counts describe the selected inventory, not a quota.

This is the core course within [ROADMAP.md](ROADMAP.md). It selects material from
[LESSON_MODULES.md](LESSON_MODULES.md), follows the teaching model in
[PRACTICE_ROADMAP.md](PRACTICE_ROADMAP.md), and uses the visual-learning and tool
plan in [VERILOG_ROADMAP.md](VERILOG_ROADMAP.md).

## 1. What this track is for

Progress from the first output assignment to practical Verilog block fluency:
describe combinational and clocked hardware, choose widths deliberately, reuse
modules, write native directed tests, and diagnose failures using saved waveforms
and inferred circuits. A small synchronous FIFO is part of the core.

Use a supported **Verilog-2005** RTL and simulation subset. Explain `wire` and
`reg`, continuous and procedural assignment, explicit state constants, functions,
tasks and internal word arrays. Keep SystemVerilog features in the subsequent RTL
bridge. The language baseline is a content requirement to verify in the runner
and circuit tooling, not a claim that all standard features currently work.

SystemVerilog, CDC engineering, standardized buses, advanced verification/formal,
UVM, FPGA board setup, physical implementation and processor/accelerator
architecture follow in later courses. The ChipDev collection is separate practice.

## 2. Simple stories and incremental tasks

**Every concept and practice exercise opens with a connected narrative paragraph.**
Establish a familiar device or engineering situation, explain why its behavior
matters, and lead naturally into the learner's job. The sentences should develop
one situation, with enough context to picture the work. A list of short statements
does not become a story just by removing its line breaks. The scenarios in section 4
reflect the published openings for all 84 lessons. The [narrative audit](NARRATIVE_AUDIT.md) records the latest review;
[CURRICULUM_AUDIT.md](CURRICULUM_AUDIT.md) preserves the earlier teaching and formatting checks.
The original identities and order are retained; revised content receives new revisions.

A panel, lamp, sensor, recorder, display or workbench problem is enough. Keep the
story literal and brief. A debugging exercise can simply describe a broken device.
Do not add characters, elaborate fiction or unexplained domain knowledge.

**Every numbered task also starts with one short context paragraph.** Continue the
exercise's scene: explain what is happening now, why the next change matters, and
what the learner needs to make possible. Connect the situation to its consequence
and the next useful change. Keep exact requirements in a paragraph or list below it.
Do not repeat the exercise opening or pad tasks to a fixed word count.

Use plain, contemporary English in instructions, concept notes, reasoning prompts,
and hints. Write “keep the reading” rather than “retain the historical measurement.”
Explain technical terms when they first appear. Sentences should connect naturally;
the story needs a clear situation and purpose, not decorative description.

After the scenario, define each relevant port and its values, then give precise
rules. The story supplies context; it must not be the only place a requirement
is stated. For example:

> A barcode scanner can read the next parcel while its label printer is still
> finishing the previous one. The new code needs somewhere to wait, so you are
> building a holder that keeps each accepted code available until the printer
> can use it.

Then introduce the actual ports and explain the acceptance condition, clock edge
and holding behavior in the relevant tasks. Prefer "set `start` to `1` when
`button_a=1` and `blocked=0`; otherwise set it to `0`" to vague phrases such as
"allow starting when available." Introduce terms such as parity or a mux before
asking learners to implement them.

**C** means an explained concept exercise with ordered, individually checked tasks.
The introduction explains new syntax using a different example. Each task states
a hardware behavior, asks the learner to reason about it, and suggests an
observable check. Optional hints provide implementation support. **P** means independent implementation,
debugging or testing using previously explained ideas. Preserve practice problems'
independent reasoning rather than turning them into a supplied solution recipe.

Readability requirements apply to instructions, starter comments, hints and test
descriptions. The first two exercises remain separate and retain their identities.
The curriculum order is study guidance; all published exercises remain accessible.

The catalog uses short scenario titles from `custom.nebula.display_names` in the
track configuration. Technical entry names, slugs and UUIDs stay stable, so these
cosmetic labels do not invalidate saved work. Every core exercise has a colored
SVG illustration tied to its scenario.

## 3. Catalog at a glance

| Exercises | Group | Concept | Practice |
| --- | --- | ---: | ---: |
| 001–010 | First signals, words and selection | 5 | 5 |
| 011–019 | Word operations and complete decisions | 4 | 5 |
| 020–027 | Arithmetic and representation | 4 | 4 |
| 028–036 | Hierarchy, configuration and first testbenches | 5 | 4 |
| 037–050 | Clocked state and behavior over time | 7 | 7 |
| 051–061 | Loops, functions, memories and reusable tests | 6 | 5 |
| 062–068 | State machines and controller/datapath design | 3 | 4 |
| 069–076 | Buffers and integration | 3 | 5 |
| 077–084 | Language fluency and source projects | 8 | 0 |
| **Total** | | **45** | **39** |

## 4. The final exercise set

### 001–010: First signals, words and selection

| ID | Type | Exercise | Basic opening scenario | Learning outcome |
| --- | --- | --- | --- | --- |
| IV-001 | C | First Light | Before a museum exhibit opens to visitors, the staff need a way to tell whether its control board is switched on. The exhibit may sit idle between visitors, so silence and stillness do not tell them enough. Your first job is to build a steady power indicator: the first working piece of the exhibit, giving staff a clear sign that the board is on even when nothing else is happening. | Drive a constant output in an explained module. |
| IV-002 | C | Exhibit Switch | With the exhibit's power indicator working, the museum staff are adding a lightbox that visitors can control themselves. A switch beside it should let someone turn the light on to look at the display and off again when they are done. You will build the connection that makes the lightbox respond to the visitor's current choice, moving from an output that stays fixed to one that can change. | Continuously connect an input and observe output changes. |
| IV-003 | C | Workshop Controls | In a print workshop, an operator moves between the two ends of a conveyor while handling materials. A button at each end lets them request movement without walking back to the other end, while a shared lock switch blocks those requests during setup. You will build the controls in stages, starting with a light that shows whether operation is available and then adding the two buttons. | Combine inversion, AND and OR for related control outputs. |
| IV-004 | P | Bird Feeder Camera | A bird feeder camera should take a picture when its motion detector makes a request, but the owner also needs to be able to turn it off. Even while it is on, the storage controller may be busy and unable to accept a picture. You will build the decision that passes a request to the camera only when those other controls allow it. | Translate request, enable and inhibit requirements into logic. |
| IV-005 | C | Service Visit | A service technician visiting a vending machine needs to check whether it is ready, whether a fault is present, and which mode it is using. The machine sends all of this information through one small diagnostic connection, so each part must arrive in the right place. You will start by checking that connection with a fixed pattern, then use it to carry and read the machine's live status. | Pack a word, recover its fields and compare a field with a code. |
| IV-006 | P | Replacement Lights | A museum is replacing a worn exhibit-light panel, but the new panel's connector puts the lamps in a different order. Connecting it directly would make the old controller light the wrong positions, changing the patterns visitors see. You will design the adapter wiring that connects each controller signal to its intended lamp, so the replacement panel can keep showing the familiar display. | Rearrange bits and fields for a specified wiring layout. |
| IV-007 | P | Balanced Lights | A theatre lighting designer is preparing scenes that use an eight-lamp arch above the stage. For some scenes, the lights need to form a balanced pattern, with each lit or dark position matching the one opposite it. You will give the lighting desk a way to check that symmetry as the pattern changes, so the designer can tell whether an adjustment has disturbed the balance. | Recognize mirrored bit patterns, including leading zeroes. |
| IV-008 | C | Greenhouse Readings | Greenhouse staff need to check the moisture in two planting beds, but their small display has room for only one reading at a time. They also need a way to test the display during a service visit without disturbing either sensor. You will build and compare three selection circuits, progressing from a simple A/B switch to a coded selector with a separate service control. | Select data with conditional expressions and an explicit override. |
| IV-009 | P | Rehearsal Lights | During a rehearsal, the lighting operator checks three strips of footlights using a single brightness control. As the operator moves from one strip to the next, the previous strip needs to go dark so its light does not interfere with the next check. You will route the brightness setting to the selected strip and make the master off switch clear all three. | Route a word and define every inactive output. |
| IV-010 | P | Aquarium Alerts | An aquarium keeper relies on a small monitor that can show only one alert at a time. A stopped circulation pump needs attention before a low water level, and both matter more than a routine filter reminder, so showing whichever message happens to arrive last would be unhelpful. You will build the selector that identifies the most urgent current alert and tells the display when there is nothing to report. | Resolve simultaneous alerts and the no-alert case. |

### 011–019: Word operations and complete decisions

| ID | Type | Exercise | Basic opening scenario | Learning outcome |
| --- | --- | --- | --- | --- |
| IV-011 | C | Bicycle Light Studio | A bicycle light designer is trying out patterns for a row of eight LEDs and wants to compare variations without editing the original each time. Seeing light and dark positions exchanged, or hiding part of the row, makes those comparisons easier. You will build three preview views, including one with a single control that switches the whole row between the original pattern and its opposite. | Apply vector bitwise operators, XOR and repeated masks. |
| IV-012 | P | Route Setter | A route setter is changing the illuminated holds on a climbing wall but wants to keep part of the current route while trying a new section. The preview needs to make those protected positions visible and show how the proposed changes would fit around them. You will produce both views from the current pattern, the protected positions, and the proposed replacement, without storing a new route. | Preserve selected bits while clearing or updating other fields. |
| IV-013 | C | Parcel Lockers | An eight-compartment parcel locker reports the state of each compartment separately, but its front panel also needs answers that can be read at a glance. It should show whether any parcels are waiting and whether the locker is full. You will turn the individual occupancy bits into those simple indicators, then add the summaries needed by its service connection and older front panel. | Distinguish per-bit results, logical conditions and any/all/parity reductions. |
| IV-014 | P | Weather Station Link | A weather station sends readings along a cable to a display indoors, where a changed bit could make the reported temperature look very different from the sensor's reading. The receiver needs a small check that can flag some of these damaged messages. You will provide a parity bit and check received readings against it, while exploring which changes can still pass unnoticed. | Generate and check a parity bit against a specified word format. |
| IV-015 | C | Drying Cabinet | A pottery workshop uses a drying cabinet whose fan can run at an ordinary or boosted speed. The operator needs the fan to stop when a drying request ends, and the cabinet's blocking control must still take effect when boost is selected. You will build a controller that makes those choices from the current controls, so neither the fan command nor its speed is left over from an earlier setting. | Use always @*, reg and blocking if/else assignments without unintended storage. |
| IV-016 | C | Camera Modes | A camera control box has a mode dial and lamps that show whether it is in standby, still-image, time-lapse, or video mode. The dial can also send codes the box does not support, which must not leave an old mode showing as though it were still selected. You will connect the mode indicators and the permission to operate, giving every dial code a clear result. | Translate input codes using case branches and a complete default. |
| IV-017 | P | Bakery Number Display | A bakery's collection counter uses a small seven-segment display to show a decimal digit. Each number needs a different pattern of lit segments, and a code outside the decimal range should leave the display blank rather than show customers a misleading number. You will use the segment wiring diagram to translate the incoming code into the correct visible digit and indicate whether that code is valid. | Produce supplied seven-segment patterns from digit codes. |
| IV-018 | P | The Fan That Stays On | The pottery workshop has reported a fault in a supplied fan controller: after a run request ends, the fan or the blocked-request indicator sometimes stays on. That leaves the operator seeing an old command instead of what the controls currently ask for. You will reproduce the complaint with the faulty starter, then repair the logic so both outputs respond correctly when a request ends. | Find missing combinational assignments and remove unintended state. |
| IV-019 | P | Backstage Console | During a rehearsal, the backstage operator follows a cue using a console that shows status lights alongside crew alerts. Hiding irrelevant lights helps the operator concentrate, but that display choice must not hide a warning from the crew. You will combine the status-light controls with an alert selector, keeping the two functions independent while making sure the most urgent alert is the one shown. | Combine masks, selection and priority into a complete combinational block. |

### 020–027: Arithmetic and representation

| ID | Type | Exercise | Basic opening scenario | Learning outcome |
| --- | --- | --- | --- | --- |
| IV-020 | C | Parts Bin Totals | An operator checking two parts bins uses a service display to compare their quantities and calculate a total and difference. The existing display accepts only eight bits for each result, so numbers that do not fit wrap around and can look surprising. You will first match that existing behavior and add separate comparison flags; a later upgrade will give the full total enough room. | Add, subtract and compare values with explicit wraparound behavior. |
| IV-021 | P | Waterline Watch | An aquarium keeper wants a warning when the water level moves outside an acceptable range, whether it is falling during a leak or rising as the tank is filled. The keeper chooses the lowest and highest acceptable readings, including the limits themselves. You will build the indicator and alarm that compare the current sensor reading with those settings, including when the keeper changes a limit. | Detect whether a sample lies inside specified bounds. |
| IV-022 | C | Room for the Total | The parts-counter operator has run into the old display's limit: 250 parts in one bin and 10 in the other appear as a total of just 4. A replacement display can show the full answer, but the older connection still needs to work. You will provide both readings and a flag that tells the technician when the old readout has lost part of the total. | Control extension, expression widths, carry and truncation. |
| IV-023 | P | Scoreboard Limit | An arcade game combines the points from two challenges on a scoreboard whose numeric field stops at 255. A player who earns more than that should see the maximum score with an overflow badge, rather than watch the number wrap around to a smaller score. You will build that display rule while keeping an exact score of 255 distinct from one that exceeds it. | Clamp an unsigned sum using preserved overflow information. |
| IV-024 | C | Mountain Thermometer | A mountain hut's thermometer has to make sense of freezing nights as well as warm afternoons. The staff need to compare its reading with an adjustable warning limit and show the same temperature on a wider display, even when the number is negative. You will connect those functions so adding more display bits or comparing across zero does not change what the sensor's reading means. | Use two's-complement declarations, sign extension and signed comparisons. |
| IV-025 | P | Freezer Trials | A technician tests a freezer through both cooling and defrost trials, so an acceptable temperature in one trial may be wrong for the next. Some allowed ranges stay below zero, while others cross it. You will build a check that uses the limits supplied for the current trial, giving the technician a clear indication of whether the reading is acceptable or should raise an alarm. | Compare positive and negative samples with signed limits. |
| IV-026 | C | Motion Display Scales | A motion-sensor demonstration shows readings at two different scales: one view doubles an unsigned movement reading to make small changes easier to see, while another halves a signed offset from the center position. Both displays have limited space and show only whole numbers. You will build the two conversions, accounting for the information lost when a value is too large or falls between whole numbers. | Distinguish logical and arithmetic shifts and explain discarded bits. |
| IV-027 | P | A Warmer Display? | The mountain hut has fitted a wider temperature display, and it looks fine until the weather turns cold: a sensor reading of -2 appears as 254. The extra display space should not change the temperature, so the fault lies in the supplied adapter's conversion. You will trace how the reading changes and repair the adapter so it preserves both positive and negative values. | Diagnose a width or signedness bug from boundary cases. |

### 028–036: Hierarchy, configuration and first testbenches

| ID | Type | Exercise | Basic opening scenario | Learning outcome |
| --- | --- | --- | --- | --- |
| IV-028 | C | Cabinet Upgrade | When a water-storage tank reaches its configured level limit, the control cabinet raises an alarm. A technician needs a way to silence that alarm while a separate service indicator continues to show whether the tank is high. You are adapting the cabinet around its existing, tested comparison component, so the new alarm control must leave that useful reading available. | Instantiate a tested component with named ports and inspect its hierarchy. |
| IV-029 | P | Rooftop Tanks | A rooftop rainwater system collects water in two tanks, either of which may fill first. The caretaker wants one warning that draws attention to a high level, alongside separate indicators that show which tank needs checking. Both tanks use the same high-level setting, so your job is to reuse the supplied comparison component for their independent readings and bring the results together in the shared warning. | Reuse comparators and combine their results into a decision. |
| IV-030 | C | Display Kits | A maker sells display kits with either three lights or eight, and each model has a test pattern chosen when it is built. Pressing the test button should show that pattern in place of the live input, with a separate indicator reporting whether any displayed light is on. You are building one configurable circuit that gives both sizes of kit these controls. | Use parameters, local parameters and named overrides with a legal configuration contract. |
| IV-031 | P | Sculpture Controls | An exhibition uses light sculptures of different sizes, including a small three-light piece and a larger eight-light piece. The designer wants to choose between two live patterns on each sculpture and use a blackout control to darken it during setup, regardless of that choice. Your job is to make the same configurable control module work for both sizes while keeping those controls predictable. | Implement a selector across independently tested widths. |
| IV-032 | C | Workshop Workbenches | A print workshop uses extraction equipment to draw dust away from its workbenches, with a request and a blocking switch at each bench. Because workshops have different numbers of benches, the control board needs to provide the same independent permission for however many are installed. You are building that repeated control structure together with a shared light that shows whether any bench has permission to run extraction. | Use elaboration-time loops and conditions to construct repeated instances. |
| IV-033 | P | Vineyard Readings | A vineyard controller receives moisture readings from several rows at once, each accompanied by a parity bit that helps check for transmission errors. When a check fails, the grower needs to know which row's reading is affected without losing confidence in unrelated rows. Your job is to connect the supplied parity checker to each reading and its matching check bit so every row gets its own result. | Build a configurable bank of independent parity components. |
| IV-034 | C | After the Move | After a museum exhibit is moved, its reconnected wiring model produces uncertain lamp signals in the simulator. Before relying on the model, the installer needs you to repair a missing connection and a second connection with competing drivers, then add a comparison light for two definite test signals. Following these signals will help you distinguish a lamp driven low from a connection that has no reliable value. | Interpret X/Z, equality behavior and basic driver conflicts. |
| IV-035 | C | Selector Checkout | A greenhouse uses a selector to choose which of two sensor readings reaches its controller, and replacement versions need checking before installation. A part can appear to work when both readings happen to agree, even if its switch is reversed or stuck on one channel. You are writing a testbench that makes those differences observable and gives a repeatable verdict on each supplied version. | Drive timed inputs and report expected/actual mismatches in native Verilog. |
| IV-036 | P | Indicator Inspection | A bicycle indicator kit uses separate left and right controls, but some replacement wiring harnesses send those commands to the wrong lamps. Lighting both lamps together can make a faulty harness look healthy, so the workshop needs a checkout that establishes what each control actually does. Your job is to write the testbench that accepts a correctly wired kit and exposes the supplied wiring mistakes. | Write directed checks that distinguish correct wiring from supplied faults. |

### 037–050: Clocked state and behavior over time

| ID | Type | Exercise | Basic opening scenario | Learning outcome |
| --- | --- | --- | --- | --- |
| IV-037 | C | Training Monitor | An athlete's training monitor places the latest captured sensor reading beside the preceding one so the two can be compared. Although the sensor keeps changing, the pair needs to remain steady between display updates and move forward together when the clock ticks. You are building the monitor's memory so a new reading can take its place without losing the older reading needed for comparison. | Use nonblocking assignments and reason about old and updated values. |
| IV-038 | P | Light Trails | Visitors to an interactive exhibit can change a pattern of eight lamps while a second row echoes an earlier version, making a short visual trail. That echo needs to stay one captured sample behind the newest reading instead of following every change at the input. Your job is to build the delayed row so the trail advances with the clock and remains visible between updates. | Preserve successive samples through two registers. |
| IV-039 | C | Blackout timing | A theatre lighting desk stores dimmer levels for two channels whose clear controls serve different purposes. A routine cue should clear one channel with the next scheduled update, while the blackout control must clear the other without waiting for that update. You are modelling these two ways to reset a stored level so the desk responds at the time intended by each control. | Compare synchronous and asynchronous reset behavior against explicit timing. |
| IV-040 | C | Market scale hold | A market vendor needs to read a crate's weight after lifting it off the scale, so the display must be able to keep a captured reading while the incoming measurement changes. The vendor also needs to freeze that reading against further loads and clear it for the next customer. Your job is to give these controls a consistent order of priority when more than one is requested together. | Add enables and define reset/load/hold priorities. |
| IV-041 | P | Pinsetter jam light | A bowling alley's pinsetter, the machine that puts pins back in place, can report a brief jam and recover before the attendant notices. Its maintenance light therefore needs to remember a sampled fault until the attendant acknowledges it, while still drawing attention to a fault that remains present. You are building this remembered warning so acknowledging an old problem cannot hide a current one. | Retain an event until acknowledgement with specified control priorities. |
| IV-042 | C | Register inspection bench | A repair shop is checking replacement registers that capture a reading on a clock edge and hold it for the rest of the board to use. A replacement might eventually show the right byte yet update at the wrong time, making a check of the final value misleading. Your job is to write the inspection testbench that checks both the reading and when it becomes available. | Generate a clock, drive and sample safely, and bound simulation time. |
| IV-043 | P | Speaker delay check | A model public-address system delays one speaker's audio samples so they line up with another path. Its recorder should deliver the previous captured sample, but two replacement versions upset that timing by delivering samples too early or too late. You are writing the acceptance testbench that distinguishes both mistakes from the intended delay, using the supplied recorder as the component under test. | Use a trace to distinguish incorrect RTL sequencing from incorrect test sampling. |
| IV-044 | C | Irrigation rounds | A garden controller rotates through six watering zones, while its maintenance display has eight positions that a technician needs to test. The two sequences can share a clock and pause control, but they need to return to their starting points at different counts. Your job is to build both repeating sequences so each visits its intended positions and keeps its place whenever the controller is paused. | Describe natural and explicitly bounded counter wraparound. |
| IV-045 | P | Turnstile crossing meter | A visitor interrupts a turnstile's light beam while passing through, giving the operator a way to measure how long each crossing occupies the entrance. Using a beam signal already aligned to the clock, you will count the active samples and keep the last completed measurement visible. The small display must report a prolonged crossing as 15 or more, so it cannot wrap around and make a long event look brief. | Measure clock-aligned event duration with defined overflow behavior. |
| IV-046 | C | Departure board refresh | A model station's departure board refreshes once every four clock ticks, and a technician uses a maintenance count to check that the refresh sequence keeps advancing. The count is useful only if it agrees with the refresh pulse about which update has just occurred. You are building the timing circuit that issues each scheduled pulse and records it on the same edge. | Produce periodic update pulses while retaining a single clock domain. |
| IV-047 | P | Darkroom exposure | In a photographic darkroom, an enlarger shines light through a negative onto light-sensitive paper to make a print. The time its lamp stays on affects the result, so an exposure needs to keep the duration the photographer chose at the start, even if the dial moves or the start button is pressed again. Your job is to control that exposure, including leaving the lamp off when the chosen duration is zero. | Capture a duration and honor a specified start/restart and completion contract. |
| IV-048 | C | Cinema marquee | A cinema sign has a row of eight lamps that the operator can fill with a complete pattern or scroll as new lamp values arrive. The row needs to keep its current picture between these changes, and a request for a fresh pattern should take priority over scrolling it at the same moment. You are building the stored lamp row and the controls that let the operator use it both ways. | Shift stored bits and prioritize parallel loading and holding. |
| IV-049 | P | Barn gauge link | A farmhouse sends a gauge reading to a display in the barn over a single data line with a shared clock. Since the reading travels one bit at a time, a new measurement arriving halfway through must not mix with the one already being sent. Your job is to build a sender that preserves each accepted byte and delivers all eight of its bits in the required order. | Emit a loaded word in a specified bit order and stop correctly. |
| IV-050 | P | Scoreboard button | A referee using a gym scoreboard should be able to hold the scoring button without awarding points repeatedly. The scoring logic needs a single notification when a press begins, followed by a release before another press can count. Working with a button signal that has already been made stable and aligned to the clock, you will build the circuit that distinguishes a new press from one still being held. | Compare sampled history to produce a pulse with defined latency. |

### 051–061: Loops, functions, memories and reusable tests

| ID | Type | Exercise | Basic opening scenario | Learning outcome |
| --- | --- | --- | --- | --- |
| IV-051 | C | Greenhouse moisture map | A greenhouse gardener wants to see which of eight pots need water and how many are already wet. Each probe reports a 1 for a wet pot, so its reading needs to contribute differently to the dry-pot map and the wet-pot total. You are building both views of the current readings so the gardener can locate dry pots without confusing a previous set of measurements with the present one. | Use procedural for loops with defined bounds and initialization. |
| IV-052 | P | Cabin lamp budget | An off-grid cabin uses twelve lamps that each draw the same amount of power, making the number lit a useful way to track its lighting budget. The occupants can choose how many lamps they allow at once and want a warning when they go over that number, whichever rooms are lit. Your job is to count the active lamps and raise the warning only when the chosen budget is exceeded. | Combine a correctly sized population count with an exclusive upper-bound decision. |
| IV-053 | C | Laundromat status board | A laundromat groups its washing machines into three banks of eight, with a display showing how many machines are running in each group. Although every display needs the same counting rule, the attendant must still be able to tell the groups apart. You are writing a reusable calculation for their separate readings so the counting logic can be maintained in one place without mixing their results. | Define Verilog functions, argument/result widths and constant width helpers. |
| IV-054 | P | Plotter jog limits | A small plotter accepts manual position adjustments along three axes, with each requested offset indicating a distance in a positive or negative direction. The permitted offsets run from -40 to 60 steps, so a request outside that range needs to be limited to its nearest boundary while an allowed adjustment stays unchanged. Your job is to apply this same rule independently to all three axes. | Apply a reusable signed clamping calculation to independent inputs. |
| IV-055 | C | Organ preset cards | An electronic organ lets the player recall presets: saved combinations of stops, the controls that select its sounds. Each preset has a byte describing its stop pattern, while a replacement controller stores a separate set of calibration bytes packed together in one long word. You are building the lookup logic so selecting a preset number retrieves the corresponding byte from both formats, despite their different storage arrangements. | Distinguish a packed vector from a word array and inspect indexed lookup data. |
| IV-056 | C | Coffee roast profiles | A coffee roaster recalls saved settings called profiles so an operator can return to a chosen setup. In this small controller model, each of five profiles occupies one byte, although the selector has eight positions. You are building storage that lets the operator save and read those settings, confirms a new value when it is read during a save, and handles the unused positions without disturbing real profiles. | Specify writes, read latency and read/write collision behavior. |
| IV-057 | P | Rain gauge history | A field station has room to keep five rainfall readings for an operator reviewing recent conditions. The operator asks for readings by age, with zero meaning the newest, so older entries must remain in the right order as new ones arrive and replace the oldest. Your job is to maintain that short history and its age-based lookup even after the same storage slots have been used several times. | Wrap storage addresses while retaining and retrieving samples in order. |
| IV-058 | P | Pocket trail logger | A compact trail monitor records whether a gate is open, using just one bit per reading and three storage slots. Its recorder was adapted from a larger version and appears to work for the first few samples, but it eventually tries to write beyond the available storage. You are investigating that failure so the small recorder can keep accepting readings without losing its place in the log. | Fix documented width-one and non-power-of-two memory configurations. |
| IV-059 | C | Repair bench routine | When refurbished boards reach the repair shop, a technician repeats the same register checks with several different bytes. The hand-copied versions have drifted apart, making it harder to tell whether a failure comes from the board or the timing of the test. Turn that checkout into a reusable routine whose calls apply the same timing and contribute to one clear result. | Factor timed stimulus and checks into reusable native Verilog tasks. |
| IV-060 | C | Returned weather station | A weather-station board has come back to the repair shop with a short log of the checks used to inspect it. Each recorded input has an expected result, giving the technician a way to repeat the same checks on a replacement board. Put that record to work in a testbench that reads every pair, applies it, and reports any disagreement. | Load memory-backed stimulus and expected data and report the first failing case. |
| IV-061 | P | A missed bench fault | One of the register boards approved by the repair shop has been returned because it loses its value when loading pauses. The original checkout confirmed that new bytes could be loaded, but never established what happened between loads or when reset arrived at the same time. Extend that existing checker so the shop can distinguish a working board from one with those faults. | Accept a correct stateful block while detecting supplied realistic faulty versions. |

### 062–068: State machines and controller/datapath design

| ID | Type | Exercise | Basic opening scenario | Learning outcome |
| --- | --- | --- | --- | --- |
| IV-062 | C | Garden railway signal | At a garden railway, the operator requests a GO signal for the next train and later indicates that the section is clear, but the signal must remember its place in the sequence while those controls change. Give it a controller that follows the STOP, GO, and CAUTION sequence, shows one indication at a time, and returns to STOP when reset. | Use explicit state constants, transition defaults and Moore outputs. |
| IV-063 | P | Packing-line merge | Two packing lines feed one labelling station, so a new request cannot simply displace the line already using it. Each line needs to keep its turn until it releases the station, with an idle interval before the next turn begins. Your controller will remember which line has permission and handle competing requests without ever granting both at once. | Meet a state-transition contract with mutually exclusive outputs. |
| IV-064 | C | Bakery cooler warning | During a busy shift at the bakery, someone can close the cooler door before another staff member notices its alarm. A live indicator tells them what is happening now, but a second indicator needs to remember an alarm that was sampled earlier. Give the staff both views, with a way to acknowledge the remembered warning while the live condition remains visible. | Compare Moore and Mealy output behavior on a familiar small controller. |
| IV-065 | P | Rocket telemetry marker | The ground receiver for a model rocket watches the incoming bits for the marker 101. Closely spaced markers can share a bit, so recognizing one must not make the next disappear from the receiver's record. Write a detector that keeps enough history to report every sampled occurrence, including those overlapping cases, and starts a fresh history after reset. | Preserve useful input history when sequence matches overlap. |
| IV-066 | P | Window turntable | During a shop-window display test, the turntable reaches its third position and then stops advancing through the sequence. The first two moves looked correct, so a short check failed to reveal the problem. Trace the supplied controller through a complete rotation, repair the transition that keeps it stuck, and confirm that another rotation works too. | Find and correct a controller error exposed by a particular input history. |
| IV-067 | C | Arcade token hopper | A customer presses the arcade change machine's button to request a token payout, then presses again while it is still counting. The machine needs to finish the amount it accepted without restarting or changing the payout halfway through. Organize its controller and stored counts so it can carry out that job, report completion, and handle a request that needs no tokens. | Coordinate working registers and repeated operations with start/busy/done behavior. |
| IV-068 | P | Farm-stand total | At a farm stand, the scale combines a whole-number quantity with a price-per-unit code to calculate the total. Because its small arithmetic unit reuses one adder over several clock edges, your implementation needs to keep the accepted values until the full result is ready, even if the inputs already show the next item. | Choose working registers and control for an explained shift-and-add algorithm. |

### 069–076: Buffers and integration

| ID | Type | Exercise | Basic opening scenario | Learning outcome |
| --- | --- | --- | --- | --- |
| IV-069 | C | Scanner to printer | A barcode scanner can finish reading a code while the label printer is still busy, leaving an accepted code waiting for somewhere to go. Put a one-word holder between them so that code stays available until the printer takes it, with room to accept the scanner's next code on the same edge that the old one leaves. | Explain ready/valid acceptance and the requirement to preserve stalled data. |
| IV-070 | P | Price-sign recall | A shop manager sends a price update to an electronic sign, then notices that the price is wrong while the display is still busy. The pending update must be cancelled before it reaches the display, without accidentally keeping another value offered during that cancellation. Add a flush control to the one-word buffer, while preserving its normal transfer behavior for the next update. | Combine stalled storage and simultaneous replacement with flush suppression and recovery. |
| IV-071 | C | Photo-booth spool | A photo booth can take new print requests while its printer is still working through earlier ones. There are five waiting places to manage, and reusing a place must not confuse an empty queue with a full one. Start with the bookkeeping: track how many requests have been accepted and which place will be written or read next, before adding the print data itself. | Maintain occupancy and wrapping pointers with explicit full/empty and simultaneous-operation policies. |
| IV-072 | P | Wind-tunnel samples | In a wind-tunnel test, sensor readings arrive in bursts while the display pauses between updates. A reading accepted during a pause must remain available in its original order when the display catches up, even after the queue reuses its storage addresses. Bring the storage and queue controls together in a design that works with several capacities, including just one waiting place. | Combine memory, queue state and transfer rules into an ordered single-clock buffer. |
| IV-073 | C | Queue inspection bench | The repair shop wants to see what a queue does when data keeps arriving while its receiver waits. You will give the testbench separate sending and receiving workers, delaying the reader so a small burst has time to build up. Coordinate them so every returned byte is checked and the test can still finish with a result if something gets stuck. | Coordinate concurrent drivers, observation and a watchdog without races. |
| IV-074 | P | Wrap and stall | The repair shop has a short queue checkout, but it does not yet show what happens when a longer stream reuses the same storage addresses. Sending and receiving may overlap throughout that run, so the checker needs to follow every accepted byte through the queue. Extend it to cover that repeated use and confirm that reset discards a reading still waiting to be read. | Check ordering, stalls, wraparound and reset using independent expected data. |
| IV-075 | P | Ghost frame | At the end of a lecture, the display selector is disabled, but its simulation keeps showing the word that was selected last. That remembered value points to a difference between the intended circuit and the hardware described by the source. Follow the failure through the waveform and generated circuit, then repair the selector so disabling it clears the output without adding a clock. | Explain and fix unintended synthesized hardware while preserving required behavior. |
| IV-076 | P | Belt-scale readout | A grain-conveyor display looks correct for small sensor readings, but larger values disagree with its specified wrapping readout. Pauses between samples make the fault harder to inspect because the display keeps its last value while a separate flag says whether a new reading was accepted. Repair the calculation without disturbing that timing, so the displayed value and flag still describe the same sample. | Locate an interface, width or latency mismatch between tested supporting blocks. |

### 077–084: Language fluency and source projects

| ID | Type | Exercise | Basic opening scenario | Learning outcome |
| --- | --- | --- | --- | --- |
| IV-077 | C | Museum audio guide | Before a museum hands out its new audio guides, tests reveal that the handsets lose exhibit numbers and limit the volume even though the supplied receiver finds the right information. Trace the wiring around that receiver and repair its connections, including the unreliable play request, so each handset can deliver the exhibit information and respond to its visitor's listen button. | Trace implicit nets, declare widths and assign one intended driver; use default_nettype deliberately. |
| IV-078 | C | Alpine weather station | A mountain visitor center uses readings from a remote weather station to tell staff how cold it is outside. Each radio packet squeezes the temperature into eight bits alongside other information, so copying those bits into a larger display is not enough to preserve their meaning. Build the conversion stages that keep below-zero readings, calibration corrections, and display units consistent. | Combine signed deltas and unsigned readings with explicit conversion, widening and overflow bounds. |
| IV-079 | C | Observatory shutter | While reviewing a telescope shutter's startup simulation, the observatory team finds that some controls have not yet reached known values. A definite-looking output can hide that uncertainty, so they need to see how each kind of Verilog decision handles it. Create a simulation model that separates a confirmed request, the parts of an opening that can be determined, and an exact comparison of recorded settings. | Observe actual X/Z values; distinguish if, conditional merging and case-equality diagnostics. |
| IV-080 | C | Harbor beacon decoder | At a model ship exhibition, radio beacons select announcements about arrivals, departures, and the weather. While a simulated message is incomplete, a wildcard decoder can still recognize a pattern in it, making a possible announcement look ready to use. Build the checks that keep those two decisions separate, so the controller can identify a candidate while waiting for the complete message before accepting it. | Use prioritized casez decoding and expose the unknowns that casex would hide. |
| IV-081 | C | Photo finish | The finish-line camera's testbench reports the previous runner's bib number even though the camera register is capturing each new number correctly. The error comes from when the checker looks, and changing the next input at the wrong time can create a second timing problem. Repair both routines so observations follow completed captures and the driver presents each runner without racing the camera's sampling edge. | Distinguish active and nonblocking updates; drive and observe on deliberate simulation phases. |
| IV-082 | C | Darkroom timers | In a photography lab, three enlargers shine images from film onto photographic paper, each for a chosen exposure time. Because photographers can start prints at different moments, the timer testbench must model several exposures running at once. Complete its shared exposure task so each call keeps its own timing and lamp, allowing a new print to start without disrupting one already in progress. | Make overlapping timed task invocations keep independent automatic storage. |
| IV-083 | C | Observatory startup | Before a night's observations, the observatory's startup routine needs to know when its camera is ready. Sometimes that happens before the routine checks; on other runs the camera takes longer or never becomes ready at all. Write simulation helpers that handle both present and future readiness, with a separate bounded check that can report when startup has missed its deadline. | Distinguish a level condition from a future edge; implement bounded polling with explicit time units. |
| IV-084 | C | Trail counter kit | Park staff carry a small arrival counter during trail surveys, using a lamp to notice when the displayed total reaches a chosen milestone. Different surveys need different counter widths and targets, but the workshop wants to maintain one design. Organize the kit into a shared header and connected modules so it can be configured for each survey without maintaining a separate version for each one. | Assemble and configure modules across editable files; use guarded headers without confusing macros with parameters. |

## 5. Coverage and teaching boundaries

Use Chu's Verilog text for the progression through combinational circuits,
sequential circuits, FSMs, controller/datapath design and practical simulation.
Write original explanations and problems. The edition-specific references are
in [LANGUAGE_ROADMAP.md](LANGUAGE_ROADMAP.md#how-the-chu-books-should-be-used).
Exercism supplies the distinction between [concept exercises](https://exercism.org/docs/building/tracks/concept-exercises)
and [practice exercises](https://exercism.org/docs/building/tracks/practice-exercises).

Keep separate lessons where the mental model changes: word layout versus word
operations; parameters versus generated instances; clocked behavior versus safe
test sampling; lookup organization versus synchronous storage. Practice should
apply these ideas before a larger integration problem requires them.

Explain the shift-and-add algorithm in exercise 68 with worked numbers and an
execution trace. Its practice goal is expressing understood steps as hardware.
Memory read/write policies, arithmetic bounds, reset priorities and accepted
transfers must be explicit in the technical specification, not inferred from a story.

Preserve existing slugs and UUIDs when revising or extending published packages. IV numbers describe the course order; stable package UUIDs identify
exercises across revisions.
Any later revision to a published lesson follows the normal revision-aware
publication workflow. The broad coverage inventory remains reference material.

## 6. Capstone and cumulative feedback

**Buffered timer-and-event monitor — one separately counted project.**

> A workshop logger records when short events occur, but its display cannot read
> every event immediately. Timestamp each event, queue the records and let the
> display retrieve them through a simple parallel interface.

Integrate configurable counters, event timestamps, a small synchronous FIFO and
parallel control/readout ports. Deliver a short specification, modular RTL, a
native Verilog regression, an explanation of a corrected waveform failure and
a review of the inferred storage, arithmetic and control. No standardized bus,
board or new verification framework is required. Project checkpoints are not
additional exercise packages.

Each exercise supplies tested supporting blocks and a known starting point.
The capstone offers a tested component library and permits compatible learner
replacements. Earlier unfinished code must not become a hidden dependency.

Waveform reading begins with signal relationships and develops through clock
edges, state transitions, memory latency and accepted transfers. Circuit and
hierarchy inspection should explain the learner's design. Authored expected
diagrams must be distinguished from the actual submitted circuit or trace.

Tests should accept equivalent correct implementations. Check required hierarchy
or generated structure with suitable structural evidence. Verify parameterized
solutions in their supported configurations. Learner-written checkers must accept
a correct DUT and detect selected faulty variants; a printed success message is
not sufficient evidence.

## 7. Delivery and completion boundary

Author coherent groups incrementally. Verify explanations, intermediate task
solutions, the reference solution, representative mistakes and the useful visual
feedback before publishing. Review lesson density with learners; a justified split
or merge may change the catalog count.

| Course stage | Implemented capability |
| --- | --- |
| Existing pilot | External concept/practice packages, grouped task feedback, iterations and circuit exploration |
| 028–033 | Supporting source-file roles, hierarchy inspection and configuration/structural checks |
| 034–036 | Four-state diagnostics and native learner-written testbench grading against correct and faulty DUTs |
| By 037 | Saved VCD traces with signal filtering, a time cursor and change navigation; automatic failure-to-edge navigation remains planned |
| 055–061 | Tested memory behavior, input-vector file roles and checker grading against faulty variants |
| 069–074 | Readable transfer traces and a supported concurrent native testbench profile |
| 077–084 | Explicit driver and four-state diagnostics, native timing helpers, editable source projects and guarded headers |
| Separate capstone (planned) | Larger project checkpoints and integration review |

The course spans M1 and selected M2 foundations and provides native-testbench
prerequisites for M3. Completion means practical small-block fluency, not completion
of every engineering specialization or proof of professional mastery.

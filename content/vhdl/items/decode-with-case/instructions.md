A camera control box has a mode dial and lamps that show whether it is in standby, still-image, time-lapse, or video mode. The dial can also send codes the box does not support, which must not leave an old mode showing as though it were still selected. You will connect the mode indicators and the permission to operate, giving every dial code a clear result.

The input `mode` is three bits. Output `lamps[3:0]` has one bit per supported mode, with `1` lighting that lamp. One-bit output `enabled` permits operation. Codes `0`, `1`, `2`, and `3` mean standby, still image, time-lapse, and video, respectively.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Decode the mode lamps

The user needs to see which camera setting the dial has selected. Connect the four mode lamps, and clear them for unsupported codes so a spare dial position cannot leave an old setting on display.

Modes `0`, `1`, `2`, and `3` light positions `0`, `1`, `2`, and `3` of `lamps`, respectively. Modes `4`–`7` leave every lamp off. Use a `case` statement for this lesson.

**Reason it through:** Three input bits can encode more modes than the panel supports. What should happen for each unused code?

**Check your reasoning:** Mode 2 must show 0100. Move from 2 to 6 and confirm the previous lamp turns off.

## 2. Disable unsupported modes

A lit mode lamp shows the selected setting, but it does not always mean the camera can operate. Add a separate permission signal that keeps standby and unsupported settings from enabling an operation.

Set `enabled=1` for modes `1`–`3`, and `enabled=0` for mode `0` and all unsupported codes. The lamp for standby mode `0` must remain lit even though `enabled=0`.

**Reason it through:** Why should the camera show a standby lamp while refusing to start an operation?

**Check your reasoning:** Compare modes `0` and `4`. Both are disabled, but only standby should light a lamp.

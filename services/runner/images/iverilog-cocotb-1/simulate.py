import json
import re
import sys
from pathlib import Path
import shutil
from cocotb_tools.runner import Icarus


class VcdIcarus(Icarus):
    # cocotb 2.0 selects FST for waves=True and suppresses dumps otherwise.
    # Retain its pinned compile/test setup but enable our explicit VCD probe.
    def _test_command(self):
        commands = super()._test_command()
        for command in commands:
            if command[-1] != '-none':
                raise RuntimeError('Unexpected cocotb waveform option.')
            command[-1] = '-vcd'
        return commands

source, work = (Path(arg).resolve() for arg in sys.argv[1:3])
config = json.loads((source / ".meta/config.json").read_text())
top = config["custom"]["compass"]["top_module"]
test_module = Path(config["files"]["test"][0]).stem
selected_names = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
test_filter = None
if selected_names is not None:
    if not isinstance(selected_names, list) or not selected_names:
        raise ValueError("A selected task must contain test names.")
    # cocotb applies regex.search to fully qualified module.function names.
    test_filter = "^(?:" + "|".join(re.escape(test_module + "." + name) for name in selected_names) + ")$"
runner = VcdIcarus()
probe = work / 'compass_wave.v'
probe.write_text('module compass_wave; initial begin $dumpfile("' + str(work / 'waveform.vcd') + '"); '
                 + f'$dumpvars(0, {top}); end endmodule\n')
support = config['files'].get('editor', [])
shutil.copyfile(source / config['files']['test'][0], work / config['files']['test'][0])
for filename in support:
    if not filename.endswith('.v'):
        shutil.copyfile(source / filename, work / filename)
runner.build(
    sources=[source / config["files"]["solution"][0], *[source / f for f in support if f.endswith('.v')], probe],
    hdl_toplevel=top,
    build_args=['-g2005', '-s', 'compass_wave'],
    includes=[source],
    build_dir=work / "build",
    timescale=("1ns", "1ps"),
    always=True,
)
runner.test(
    hdl_toplevel=top,
    test_module=test_module,
    test_filter=test_filter,
    test_dir=work,
    build_dir=work / "build",
    results_xml=str(work / "results.xml"),
    extra_env={"PYTHONPATH": str(source)},
)

import json
import re
import shutil
import sys
from pathlib import Path

from cocotb_tools.runner import Ghdl


source, work = (Path(arg).resolve() for arg in sys.argv[1:3])
config = json.loads((source / ".meta/config.json").read_text())
nebula = config["custom"]["compass"]
top = nebula["top_module"]
test_module = Path(config["files"]["test"][0]).stem
selected_names = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
test_filter = None
if selected_names is not None:
    if not isinstance(selected_names, list) or not selected_names:
        raise ValueError("A selected task must contain test names.")
    test_filter = "^(?:" + "|".join(
        re.escape(test_module + "." + name) for name in selected_names
    ) + ")$"

ordered = nebula.get("source_order")
if ordered is None:
    ordered = [config["files"]["solution"][0], *config["files"].get("editor", [])]
sources = [source / name for name in ordered if name.lower().endswith((".vhd", ".vhdl"))]
if not sources:
    raise ValueError("No VHDL sources were declared for analysis.")

runner = Ghdl()
runner.build(
    sources=sources,
    hdl_toplevel=top,
    build_args=["--std=08"],
    build_dir=work / "build",
    always=True,
)
shutil.copyfile(source / config["files"]["test"][0], work / "build" / Path(config["files"]["test"][0]).name)
for filename in config["files"].get("editor", []):
    if not filename.lower().endswith((".vhd", ".vhdl")):
        target = work / "build" / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / filename, target)
runner.test(
    hdl_toplevel=top,
    test_module=test_module,
    test_filter=test_filter,
    # Debian's pinned GHDL GCC backend emits the elaborated executable in the
    # build directory and expects ghdl -r to be launched from that directory.
    test_dir=work / "build",
    build_dir=work / "build",
    results_xml=str(work / "results.xml"),
    test_args=["--std=08"],
    plusargs=["--vcd=" + str(work / "waveform.vcd")],
    extra_env={"PYTHONPATH": str(source)},
)

"""Trusted author API for grading learner-written VHDL-2008 testbenches."""
import json
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

SOURCE = Path("/solution")
OUTPUT = Path("/output")
HDL_SUFFIXES = (".vhd", ".vhdl")


@dataclass
class Simulation:
    stdout: str
    returncode: int
    timed_out: bool


def simulate(dut="dut_correct.vhd", generics=None, top=None, stop_time=None, support=None):
    """Compile the submitted testbench with one selected supplied VHDL DUT."""
    config = json.loads((SOURCE / ".meta/config.json").read_text())
    nebula = config["custom"]["compass"]
    allowed = config["files"].get("editor", [])
    if dut not in allowed or not dut.lower().endswith(HDL_SUFFIXES):
        raise ValueError("Select a VHDL DUT declared in files.editor.")
    top = top or nebula["top_module"]
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", top):
        raise ValueError("Invalid testbench top entity.")
    generics = generics or {}
    support = support or []
    if (not isinstance(support, list) or any(name not in allowed or name == dut
                                             or not name.lower().endswith(HDL_SUFFIXES)
                                             for name in support)):
        raise ValueError("support must list declared VHDL support files other than the selected DUT.")
    if not isinstance(generics, dict) or any(
        not isinstance(name, str)
        or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", name)
        or not isinstance(value, (str, int, float, bool))
        for name, value in generics.items()
    ):
        raise ValueError("VHDL generics must be a mapping of identifiers to scalar values.")
    if stop_time is not None and not re.fullmatch(r"[1-9][0-9]*(?:fs|ps|ns|us|ms|sec)", stop_time):
        raise ValueError("stop_time must be a positive GHDL time such as '1us'.")

    order = nebula.get("source_order") or [
        config["files"]["solution"][0], *allowed
    ]
    solution = config["files"]["solution"][0]
    if solution not in order or dut not in order or any(name not in order for name in support):
        raise ValueError("source_order must include the learner testbench and selected DUT.")
    # Analyze explicitly selected dependencies in declared order, then the DUT,
    # then the learner testbench that directly instantiates it.
    selected = [name for name in order if name in support]
    selected += [dut, solution]

    with tempfile.TemporaryDirectory(prefix="nebula-native-") as directory:
        work = Path(directory)
        for filename in allowed:
            if not filename.lower().endswith(HDL_SUFFIXES):
                target = work / filename
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(SOURCE / filename, target)
        for filename in selected:
            compiled = subprocess.run(
                ["ghdl", "-a", "--std=08", "--workdir=" + str(work), str(SOURCE / filename)],
                capture_output=True, text=True, timeout=3, cwd=work,
            )
            if compiled.returncode:
                raise RuntimeError("VHDL analysis failed:\n" + compiled.stderr[-4000:])
        elaborated = subprocess.run(
            ["ghdl", "-e", "--std=08", "--workdir=" + str(work), top],
            capture_output=True, text=True, timeout=3, cwd=work,
        )
        if elaborated.returncode:
            raise RuntimeError("VHDL elaboration failed:\n" + elaborated.stderr[-4000:])

        command = ["ghdl", "-r", "--std=08", "--workdir=" + str(work), top,
                   "--vcd=" + str(work / "waveform.vcd")]
        for name, value in generics.items():
            command.append(f"-g{name}={str(value).lower() if isinstance(value, bool) else value}")
        if stop_time:
            command.append("--stop-time=" + stop_time)
        log_path = work / "simulation.log"
        timed_out = False
        with log_path.open("w") as log:
            try:
                process = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT,
                                         timeout=1, cwd=work)
                returncode = process.returncode
            except subprocess.TimeoutExpired:
                timed_out = True
                returncode = -1
        with log_path.open("rb") as log:
            log.seek(max(0, log_path.stat().st_size - 16000))
            stdout = log.read(16000).decode(errors="replace")
        trace = work / "waveform.vcd"
        if not (OUTPUT / "waveform.vcd").exists() and trace.exists():
            with trace.open("rb") as handle:
                (OUTPUT / "waveform.vcd").write_bytes(handle.read(512 * 1024))
        with (OUTPUT / "simulation.log").open("a") as log:
            log.write(f"\n--- {dut} ---\n" + stdout[-2000:])
        return Simulation(stdout, returncode, timed_out)

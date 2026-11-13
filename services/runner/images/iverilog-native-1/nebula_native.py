"""Trusted author API for grading learner-written Verilog-2005 testbenches."""
import json
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

SOURCE = Path('/solution')
OUTPUT = Path('/output')


@dataclass
class Simulation:
    stdout: str
    returncode: int
    timed_out: bool


def simulate(dut='dut_correct.v', defines=None, top=None):
    """Compile the submitted checker with ONE selected supplied circuit.

    Compilation errors raise RuntimeError. A timeout never counts as a detected
    hardware fault. Author assertions must check a deliberate checker verdict.
    The first captured trace is saved, normally the correct-DUT run.
    """
    config = json.loads((SOURCE / '.meta/config.json').read_text())
    allowed = config['files'].get('editor', [])
    if dut not in allowed or not dut.endswith('.v'):
        raise ValueError('Select a Verilog DUT declared in files.editor.')
    top = top or config['custom']['compass']['top_module']
    if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', top):
        raise ValueError('Invalid testbench top module.')
    defines = defines or []
    if any(not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*(=[A-Za-z0-9_]+)?', d) for d in defines):
        raise ValueError('Invalid Verilog define.')
    with tempfile.TemporaryDirectory(prefix='nebula-native-') as directory:
        work = Path(directory)
        for name in allowed:
            if not name.endswith('.v'):
                shutil.copyfile(SOURCE / name, work / name)
        probe = work / 'nebula_wave.v'
        probe.write_text('module nebula_wave; initial begin $dumpfile("waveform.vcd"); '
                         f'$dumpvars(0, {top}); end endmodule\n')
        command = ['iverilog', '-g2005', '-s', top, '-s', 'nebula_wave', '-o', str(work / 'sim')]
        command += ['-D' + d for d in defines]
        command += [str(SOURCE / config['files']['solution'][0]), str(SOURCE / dut), str(probe)]
        compiled = subprocess.run(command, capture_output=True, text=True, timeout=3, cwd=work)
        if compiled.returncode:
            raise RuntimeError('Verilog compilation failed:\n' + compiled.stderr[-4000:])
        log_path = work / 'simulation.log'
        timed_out = False
        with log_path.open('w') as log:
            try:
                process = subprocess.run(['vvp', str(work / 'sim')], stdout=log,
                                         stderr=subprocess.STDOUT, timeout=1, cwd=work)
                returncode = process.returncode
            except subprocess.TimeoutExpired:
                timed_out = True
                returncode = -1
        with log_path.open('rb') as log:
            log.seek(max(0, log_path.stat().st_size - 16000))
            stdout = log.read(16000).decode(errors='replace')
        trace = work / 'waveform.vcd'
        if not (OUTPUT / 'waveform.vcd').exists() and trace.exists():
            with trace.open('rb') as handle:
                (OUTPUT / 'waveform.vcd').write_bytes(handle.read(512 * 1024))
        with (OUTPUT / 'simulation.log').open('a') as log:
            log.write(f'\n--- {dut} ---\n' + stdout[-2000:])
        return Simulation(stdout, returncode, timed_out)

"""Exercism v2/v3 adapter. Author tests execute only inside the container."""
import ast
import json
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path


def error(message, version=2):
    return {"version": version, "status": "error", "message": message}


def definitions(source):
    found = []
    for node in ast.parse(source).body:
        if not isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)):
            continue
        for decorator in node.decorator_list:
            if (isinstance(decorator, ast.Call)
                    and isinstance(decorator.func, ast.Attribute)
                    and isinstance(decorator.func.value, ast.Name)
                    and decorator.func.value.id == "cocotb"
                    and decorator.func.attr == "test"):
                if not isinstance(node, ast.AsyncFunctionDef):
                    raise ValueError("Every @cocotb.test() must decorate an async function.")
                if decorator.args or decorator.keywords:
                    raise ValueError("Use plain @cocotb.test() without skip, parameters, or expected failures.")
                found.append((node.name, ast.get_docstring(node) or node.name.replace("_", " "),
                              ast.get_source_segment(source, node)))
    if not found:
        raise ValueError("No tests found. Define at least one async function with @cocotb.test().")
    if len({name for name, _, _ in found}) != len(found):
        raise ValueError("Test function names must be unique.")
    return found


def task_selection(tests, nebula, request):
    """Validate every declaration before choosing any subset for simulation."""
    names = {name for name, _, _ in tests}
    task_ids = {}
    if "tasks" in nebula:
        tasks = nebula["tasks"]
        if not isinstance(tasks, list) or not tasks:
            raise ValueError("Task mappings must be a nonempty list.")
        for index, task in enumerate(tasks, 1):
            if (not isinstance(task, dict) or type(task.get("id")) is not int
                    or task["id"] != index):
                raise ValueError("Task IDs must be contiguous integers starting at 1, in order.")
            mapped = task.get("tests")
            if not isinstance(mapped, list) or not mapped:
                raise ValueError(f"Task {index} must map at least one test function.")
            for name in mapped:
                if not isinstance(name, str) or name not in names:
                    raise ValueError(f"Task {index} refers to an unknown test function: {name!r}.")
                if name in task_ids:
                    raise ValueError(f"Test function {name} is mapped more than once.")
                task_ids[name] = index
        missing = names - set(task_ids)
        if missing:
            raise ValueError("Every declared test must be mapped to a task. Unmapped: " + ", ".join(sorted(missing)))
    elif "task_id" in request:
        if request.get("kind") != "concept":
            raise ValueError("This exercise has no declared tasks.")
        task_ids = {name: 1 for name in names}

    if "task_id" not in request:
        return tests, task_ids
    selected = request["task_id"]
    if type(selected) is not int or selected < 1 or selected not in task_ids.values():
        raise ValueError("Select a positive task ID declared by this exercise.")
    return [test for test in tests if task_ids[test[0]] == selected], task_ids


def diagnostics(log):
    """cocotb 2.0's JUnit failures omit messages; read its ordered test log."""
    messages = {}
    current = None
    for line in log.splitlines():
        started = re.search(r"cocotb\.regression\s+running\s+\w+\.(\w+)\s", line)
        if started:
            current = started.group(1)
        detail = re.match(r"\s*([\w.]*(?:Error|Exception)):\s*(.*)$", line)
        if current and detail:
            messages[current] = (detail.group(1), detail.group(2))
    return messages


def simulate(source, output, config, tests, selected_tests, task_ids, version, selected):
    with tempfile.TemporaryDirectory(prefix="nebula-") as temp:
        work = Path(temp)
        log_path = work / "simulation.log"
        # The subprocess receives only names already checked against the complete
        # author AST. It builds an anchored, escaped cocotb test filter.
        names = [name for name, _, _ in selected_tests] if selected else None
        with log_path.open("w") as log:
            try:
                process = subprocess.run(
                    [sys.executable, "/opt/test-runner/simulate.py", str(source), str(work), json.dumps(names)],
                    stdout=log, stderr=subprocess.STDOUT, timeout=10, check=False,
                )
            except subprocess.TimeoutExpired:
                return error("Simulation exceeded its 10-second time limit. Check for an infinite loop.", version)
        full_log = log_path.read_text(errors="replace")
        messages = diagnostics(full_log)
        waveform = work / 'waveform.vcd'
        if waveform.exists():
            with waveform.open('rb') as trace:
                (output / 'waveform.vcd').write_bytes(trace.read(512 * 1024))
        log = full_log[-16000:]
        (output / "simulation.log").write_text(log)
        report = work / "results.xml"
        if not report.exists():
            return error("Compilation or simulation could not complete.\n" + log, version)
        cases = ET.parse(report).findall(".//testcase")
        by_name = {case.get("name"): case for case in cases}
        module_name = Path(config["files"]["test"][0]).stem
        declared_names = {name for name, _, _ in tests}
        selected_names = {name for name, _, _ in selected_tests}
        # cocotb includes filtered-out tests as skipped JUnit rows. They must be
        # exactly the declared, unselected tests; selected tests may never skip.
        if (len(cases) != len(tests) or set(by_name) != declared_names
                or any(case.get("classname") != module_name for case in cases)
                or {case.get("name") for case in cases if case.find("skipped") is None} != selected_names):
            return error("The simulator did not execute exactly the selected declared tests.\n" + log, version)
        results = []
        for name, title, code in selected_tests:
            case = by_name[name]
            failure = case.find("failure")
            exception = case.find("error")
            result = {"name": title, "status": "pass", "test_code": code}
            if version == 3:
                result["task_id"] = task_ids[name]
            if failure is not None or exception is not None:
                detail = failure if failure is not None else exception
                logged_kind, logged_message = messages.get(name, ("", ""))
                kind = detail.get("error_type", detail.get("type", logged_kind))
                status = "error" if exception is not None or (kind and kind != "AssertionError") else "fail"
                message = detail.get("message") or detail.text or logged_message or "Test failed. Inspect the simulation log."
                result.update(status=status, message=message[-4000:])
            results.append(result)
        if all(item["status"] == "error" for item in results):
            return error("All tests errored.\n" + log, version)
        status = "pass" if all(item["status"] == "pass" for item in results) else "fail"
        if process.returncode != 0 and status == "pass":
            return error("The simulator exited unexpectedly.\n" + log, version)
        return {"version": version, "status": status, "tests": results}


def run(source, output):
    config = json.loads((source / ".meta/config.json").read_text())
    request_file = source / ".meta/request.json"
    request = json.loads(request_file.read_text()) if request_file.exists() else {}
    nebula = config["custom"]["compass"]
    version = 3 if "tasks" in nebula or "task_id" in request else 2
    try:
        if nebula['runner'] == 'ghdl-native-v1':
            try:
                process = subprocess.run([sys.executable, '/opt/test-runner/native.py', str(source), str(output)],
                                         capture_output=True, text=True, timeout=12)
            except subprocess.TimeoutExpired:
                return error('Native testbench grading exceeded its time limit.', version)
            if process.returncode or not (output / 'results.json').exists():
                return error('Native testbench grading could not complete.\n' + process.stderr[-4000:], version)
            return json.loads((output / 'results.json').read_text())
        tests = definitions((source / config["files"]["test"][0]).read_text())
        selected_tests, task_ids = task_selection(tests, nebula, request)
        return simulate(source, output, config, tests, selected_tests, task_ids, version, "task_id" in request)
    except Exception as exc:
        return error(f"Runner could not execute this exercise: {exc}", version)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: run.sh <exercise-slug> <input-directory> <output-directory>", file=sys.stderr)
        sys.exit(1)
    _, slug, input_dir, output_dir = sys.argv
    output = Path(output_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)
    try:
        result = run(Path(input_dir).resolve(), output)
    except Exception as exc:
        result = error(f"Runner could not execute this exercise: {exc}")
    (output / "results.json").write_text(json.dumps(result, indent=2))

"""Run trusted Python assertions against independently compiled native checkers."""
import ast
import importlib.util
import json
import sys
import traceback
from pathlib import Path
from runner import task_selection, error


def run(source, output):
    config = json.loads((source / '.meta/config.json').read_text())
    request_file = source / '.meta/request.json'
    request = json.loads(request_file.read_text()) if request_file.exists() else {}
    nebula = config['custom']['compass']
    version = 3 if 'tasks' in nebula or 'task_id' in request else 2
    text = (source / config['files']['test'][0]).read_text()
    nodes = [n for n in ast.parse(text).body if isinstance(n, ast.FunctionDef) and n.name.startswith('test_')]
    if not nodes or len({n.name for n in nodes}) != len(nodes):
        return error('Declare unique synchronous test_ functions in the native grader.', version)
    if any(n.decorator_list or n.args.args or n.args.kwonlyargs or n.args.vararg or n.args.kwarg for n in nodes):
        return error('Native grader test functions take no arguments or decorators.', version)
    tests = [(n.name, ast.get_docstring(n) or n.name.replace('_', ' '), ast.get_source_segment(text, n)) for n in nodes]
    selected, task_ids = task_selection(tests, nebula, request)
    spec = importlib.util.spec_from_file_location('exercise_grader', source / config['files']['test'][0])
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    results = []
    for name, title, code in selected:
        result = {'name': title, 'test_code': code, 'status': 'pass'}
        if version == 3:
            result['task_id'] = task_ids[name]
        try:
            getattr(module, name)()
        except AssertionError as exc:
            result.update(status='fail', message=str(exc) or 'The checker did not meet this requirement.')
        except Exception as exc:
            result.update(status='error', message=str(exc)[-4000:])
        results.append(result)
    if all(r['status'] == 'error' for r in results):
        return error('\n'.join(r['message'] for r in results)[-12000:], version)
    return {'version': version, 'status': 'pass' if all(r['status'] == 'pass' for r in results) else 'fail', 'tests': results}


if __name__ == '__main__':
    source, output = (Path(p) for p in sys.argv[1:3])
    try:
        result = run(source, output)
    except Exception:
        config = json.loads((source / '.meta/config.json').read_text())
        request_file = source / '.meta/request.json'
        request = json.loads(request_file.read_text()) if request_file.exists() else {}
        version = 3 if 'tasks' in config['custom']['compass'] or 'task_id' in request else 2
        result = error(traceback.format_exc()[-4000:], version)
    (output / 'results.json').write_text(json.dumps(result, indent=2))

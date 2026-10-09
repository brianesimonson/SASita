"""Demo bridge: Python calls Node; calculations still use the Sassy JS engine."""
import json
from pathlib import Path
import shutil
import subprocess
import sys

def run_sassy(project=None):
    node = shutil.which('node')
    if not node:
        raise RuntimeError('Install Node.js 24+ to run this package.')
    command = [node, str(Path(__file__).resolve().with_name('run.mjs'))]
    if project is not None:
        command += ['--project', str(Path(project).resolve())]
    completed = subprocess.run(command, capture_output=True, text=True, encoding='utf-8', timeout=30)
    if completed.returncode:
        raise RuntimeError(completed.stderr.strip() or 'Sassy runner failed')
    return json.loads(completed.stdout)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Run the packaged SAS source with Sassy through Node.js')
    parser.add_argument('--project', help='Project folder for relative CSV and LIBNAME paths')
    arguments = parser.parse_args()
    try:
        print(json.dumps(run_sassy(arguments.project), indent=2, ensure_ascii=False))
    except (RuntimeError, subprocess.TimeoutExpired) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

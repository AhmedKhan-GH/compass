#!/bin/sh
set -eu
exec python /opt/test-runner/runner.py "$@"

FROM python:3.12.12-slim-bookworm@sha256:593bd06efe90efa80dc4eee3948be7c0fde4134606dd40d8dd8dbcade98e669c
# GHDL 2.0.0 with the GCC back end. Debian rebuilt it for amd64 as +b2; arm64 keeps the original build.
RUN GHDL=2.0.0+dfsg-6.2; if [ "$(dpkg --print-architecture)" = amd64 ]; then GHDL=2.0.0+dfsg-6.2+b2; fi \
    && apt-get update && apt-get install -y --no-install-recommends ghdl=$GHDL ghdl-gcc=$GHDL g++ \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir cocotb==2.0.0 find_libpython==0.4.1
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /opt/test-runner
COPY bin ./bin
COPY runner.py simulate.py native.py nebula_native.py ./
RUN chmod +x bin/run.sh
USER 65534:65534
ENTRYPOINT ["/opt/test-runner/bin/run.sh"]

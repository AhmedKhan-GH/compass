FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d
# GHDL 2.0.0 with the GCC back end. Debian rebuilt it for amd64 as +b2; arm64 keeps the original build.
RUN GHDL=2.0.0+dfsg-6.2; if [ "$(dpkg --print-architecture)" = amd64 ]; then GHDL=2.0.0+dfsg-6.2+b2; fi \
    && apt-get update && apt-get install -y --no-install-recommends yosys=0.23-6 ghdl=$GHDL ghdl-gcc=$GHDL \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/circuit-runner
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY build.cjs ./
USER 65534:65534
ENTRYPOINT ["node", "/opt/circuit-runner/build.cjs"]

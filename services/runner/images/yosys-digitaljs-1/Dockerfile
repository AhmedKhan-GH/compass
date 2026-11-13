FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d
RUN apt-get update && apt-get install -y --no-install-recommends yosys=0.23-6 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/circuit-runner
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY build.cjs ./
USER 65534:65534
ENTRYPOINT ["node", "/opt/circuit-runner/build.cjs"]

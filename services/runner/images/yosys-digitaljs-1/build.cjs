const { execFileSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const { yosys2digitaljs } = require('yosys2digitaljs/core');

let diagnostics = '';
try {
  const { topModule, filename, supportingFiles = [] } = JSON.parse(readFileSync('/solution/.meta/config.json', 'utf8'));
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(topModule) || !/^[a-zA-Z_][a-zA-Z0-9_]*\.v$/.test(filename)) {
    throw new Error('Invalid circuit interface.');
  }
  if (!Array.isArray(supportingFiles) || supportingFiles.some(name => !/^[a-zA-Z_][a-zA-Z0-9_]*\.(v|vh|hex|txt)$/.test(name))) throw new Error('Invalid supporting file.');
  const verilog = [filename, ...supportingFiles.filter(name => name.endsWith('.v'))].map(name => '/solution/' + name);
  diagnostics = execFileSync('yosys', ['-Q', '-T', '-p', [
    `read_verilog -I/solution ${verilog.join(' ')}`,
    `hierarchy -check -top ${topModule}`,
    'proc', 'opt_clean', 'memory -nomap', 'wreduce', 'opt_clean', 'check',
    'write_json /tmp/design.json',
  ].join('; ')], { encoding: 'utf8', cwd: '/solution', timeout: 12000, maxBuffer: 256 * 1024 });
  const netlist = JSON.parse(readFileSync('/tmp/design.json', 'utf8'));
  const ports = Object.entries(netlist.modules[topModule].ports).map(([name, port]) => {
    if (!['input', 'output'].includes(port.direction) || port.bits.length > 32) {
      throw new Error('The circuit explorer supports input/output ports up to 32 bits; bidirectional ports need a different simulation profile.');
    }
    return { name, direction: port.direction, bits: port.bits.length };
  });
  const circuit = yosys2digitaljs(netlist, { propagation: 1 });
  let count = 0;
  let connections = 0;
  for (const module of [circuit, ...Object.values(circuit.subcircuits)]) {
    count += Object.keys(module.devices).length;
    connections += module.connectors.length;
    for (const device of Object.values(module.devices)) {
      if (device.type === 'Input' || device.type === 'Output') device.label = device.net;
    }
  }
  if (count > 500 || connections > 2000) throw new Error('This design is too large for the introductory circuit explorer (500 components / 2000 connections).');
  const warnings = diagnostics.split('\n').filter(line => /^Warning:/.test(line)).join('\n');
  const result = JSON.stringify({ version: 1, circuit, ports, warnings });
  if (Buffer.byteLength(result) > 2 * 1024 * 1024) throw new Error('The generated circuit exceeds the 2 MiB limit.');
  writeFileSync('/output/result.json', result);
} catch (error) {
  const detail = error.stderr?.toString() || error.message || 'Could not generate this circuit.';
  writeFileSync('/output/result.json', JSON.stringify({ error: detail.slice(-8000), diagnostics: (error.stdout?.toString() || diagnostics).slice(-8000) }));
}

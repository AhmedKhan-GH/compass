const { execFileSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const { yosys2digitaljs } = require('yosys2digitaljs/core');

let diagnostics = '';
try {
  const { topModule: declaredTop, filename, supportingFiles = [], language = 'verilog', sourceOrder } = JSON.parse(readFileSync('/solution/.meta/config.json', 'utf8'));
  const topModule = language === 'vhdl' ? declaredTop.toLowerCase() : declaredTop;
  if (!['verilog', 'vhdl'].includes(language) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(topModule) || !/^[a-zA-Z_][a-zA-Z0-9_]*\.(v|vhd|vhdl)$/.test(filename)) {
    throw new Error('Invalid circuit interface.');
  }
  if (!Array.isArray(supportingFiles) || supportingFiles.some(name => !/^[a-zA-Z_][a-zA-Z0-9_]*\.(v|vh|vhd|vhdl|hex|txt)$/.test(name))) throw new Error('Invalid supporting file.');
  const sources = [filename, ...supportingFiles.filter(name => /\.vhdl?$/.test(name))];
  let verilog = [filename, ...supportingFiles.filter(name => name.endsWith('.v'))].map(name => '/solution/' + name);
  if (language === 'vhdl') {
    const order = sourceOrder || [...supportingFiles.filter(name => /\.vhdl?$/.test(name)), filename];
    if (!Array.isArray(order) || order.length !== sources.length || new Set(order).size !== order.length || order.some(name => !sources.includes(name))) throw new Error('Invalid VHDL source order.');
    const synthesized = execFileSync('ghdl', ['synth', '--std=08', '--out=verilog', '--no-formal', ...order.map(name => '/solution/' + name), '-e', topModule], { encoding: 'utf8', cwd: '/tmp', timeout: 10000, maxBuffer: 1024 * 1024 });
    writeFileSync('/tmp/vhdl-design.v', synthesized);
    verilog = ['/tmp/vhdl-design.v'];
  }
  diagnostics = execFileSync('yosys', ['-Q', '-T', '-p', [
    `read_verilog -I/solution ${verilog.join(' ')}`,
    `hierarchy -check -top ${topModule}`,
    'proc', 'opt_clean', 'memory -nomap', 'wreduce', 'opt_clean', 'check',
    'write_json /tmp/design.json',
  ].join('; ')], { encoding: 'utf8', cwd: '/solution', timeout: 12000, maxBuffer: 256 * 1024 });
  const netlist = JSON.parse(readFileSync('/tmp/design.json', 'utf8'));
  if (language === 'vhdl') {
    // The generated Verilog locations are not positions in the learner's VHDL.
    // Omit those locations rather than highlighting an unrelated source line.
    for (const module of Object.values(netlist.modules)) {
      for (const node of [module, ...Object.values(module.cells || {}), ...Object.values(module.netnames || {})]) {
        if (node.attributes) delete node.attributes.src;
      }
    }
  }
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

#!/usr/bin/env node
const fs = require('fs');
const graphPath = process.argv[2];
const outputPath = process.argv[3];
try {
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const issues = [], warnings = [];
  if (!Array.isArray(graph.nodes)) { issues.push('graph.nodes is missing or not an array'); graph.nodes = []; }
  if (!Array.isArray(graph.edges)) { issues.push('graph.edges is missing or not an array'); graph.edges = []; }
  const nodeIds = new Set();
  const seen = new Map();
  graph.nodes.forEach((n, i) => {
    if (!n.id) { issues.push('Node missing id at ' + i); return; }
    if (!n.type) issues.push('Node missing type at ' + n.id);
    if (!n.name) issues.push('Node missing name at ' + n.id);
    if (!n.summary) issues.push('Node missing summary at ' + n.id);
    if (seen.has(n.id)) issues.push('Duplicate node ID: ' + n.id);
    else seen.set(n.id, i);
    nodeIds.add(n.id);
  });
  graph.edges.forEach((e, i) => {
    if (!nodeIds.has(e.source)) issues.push('Edge source not found: ' + e.source);
    if (!nodeIds.has(e.target)) issues.push('Edge target not found: ' + e.target);
  });
  const fileNodes = graph.nodes.filter(n => ['file', 'config', 'document', 'service', 'pipeline', 'table', 'schema', 'resource', 'endpoint'].includes(n.type)).map(n => n.id);
  const assigned = new Map();
  graph.layers.forEach(layer => {
    (layer.nodeIds || []).forEach(id => {
      if (!nodeIds.has(id)) issues.push('Layer ' + layer.id + ' refs missing node: ' + id);
      assigned.set(id, layer.id);
    });
  });
  fileNodes.forEach(id => {
    if (!assigned.has(id)) warnings.push('File node not in any layer: ' + id);
  });
  const stats = {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    totalLayers: graph.layers.length,
    tourSteps: graph.tour.length
  };
  fs.writeFileSync(outputPath, JSON.stringify({ issues, warnings, stats }, null, 2));
} catch (err) {
  process.stderr.write(err.message + '\n');
  process.exit(1);
}

import { LIMITS, VERSION, parseBoundedJSON, evaluate, validateRun, compareCampaigns, guardStructured } from './core.mjs';
import { pathToFileURL } from 'node:url';

const TOOLS = [
  { name: 'apx_evaluate', description: 'Evaluate a bounded APx receipt against a frozen manifest. No remote calls or code execution.', inputSchema: { type: 'object', properties: { manifest: { type: 'object' }, run: { type: 'object' } }, required: ['manifest', 'run'], additionalProperties: false } },
  { name: 'apx_validate', description: 'Validate a complete APx manifest and run.', inputSchema: { type: 'object', properties: { manifest: { type: 'object' }, run: { type: 'object' } }, required: ['manifest', 'run'], additionalProperties: false } },
  { name: 'apx_promote', description: 'Recommend or reject promotion using paired full campaigns. Never authorizes deployment.', inputSchema: { type: 'object', properties: { manifest: { type: 'object' }, comparison: { type: 'object' }, options: { type: 'object' } }, required: ['manifest', 'comparison'], additionalProperties: false } }
];
export function handleRpc(message) {
  const requestedId = message?.id;
  const id = typeof requestedId === 'string' || (typeof requestedId === 'number' && Number.isFinite(requestedId)) ? requestedId : null;
  try {
    guardStructured(message);
    if (requestedId !== undefined && requestedId !== null && id === null) throw new Error('Invalid JSON-RPC ID');
    if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string' || Array.isArray(message)) throw new Error('Invalid JSON-RPC request');
    if (message.id === undefined) return null;
    let result;
    if (message.method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'apx-benchmark', version: VERSION } };
    else if (message.method === 'ping') result = {};
    else if (message.method === 'tools/list') result = { tools: TOOLS };
    else if (message.method === 'tools/call') {
      const { name, arguments: args } = message.params ?? {};
      if (!TOOLS.some(tool => tool.name === name)) return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Unknown tool' } };
      try {
        if (!args || typeof args !== 'object') throw new Error('Tool arguments required');
        const data = name === 'apx_evaluate' ? evaluate(args.manifest, args.run) : name === 'apx_validate' ? validateRun(args.manifest, args.run) : compareCampaigns(args.manifest, args.comparison, args.options);
        result = { content: [{ type: 'text', text: JSON.stringify(data) }], isError: false };
      } catch (error) { result = { content: [{ type: 'text', text: error.message }], isError: true }; }
    } else return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } };
    return { jsonrpc: '2.0', id, result };
  } catch (error) { return { jsonrpc: '2.0', id, error: { code: -32600, message: error.message } }; }
}

/** Newline-delimited stdio MCP subset. Bounded per message and per process. */
export async function serve(input = process.stdin, output = process.stdout) {
  let buffer = Buffer.alloc(0), messages = 0;
  for await (const chunk of input) {
    buffer = Buffer.concat([buffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
    let index;
    while ((index = buffer.indexOf(10)) !== -1) {
      const line = buffer.subarray(0, index); buffer = buffer.subarray(index + 1);
      if (!line.length) continue;
      if (line.length > LIMITS.bytes || ++messages > 1000) throw new Error('MCP message size or session count limit exceeded');
      let response;
      try { response = handleRpc(parseBoundedJSON(line.toString('utf8'))); }
      catch (error) { response = { jsonrpc: '2.0', id: null, error: { code: -32700, message: error.message } }; }
      if (response) output.write(`${JSON.stringify(response)}\n`);
    }
    if (buffer.length > LIMITS.bytes) throw new Error('MCP message exceeds 1 MiB');
  }
  if (buffer.length) throw new Error('MCP final message must end in newline');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) serve().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });

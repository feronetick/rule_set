import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import build from '../src/index.js';
import { Rule } from '../src/rules/rules.js';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('entry point reads private config file without exporting it to CI environment', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rules-test-'));
    try {
        await writeFile(join(dir, 'config.json'), JSON.stringify({ 'proxy-rules': [
            { type: 'rule', rule: { domain: ['exact.example'] } }] }));
        const env = { ...process.env };
        delete env.CONFIG;
        execFileSync(process.execPath, [fileURLToPath(new URL('../process-rules.js', import.meta.url))],
                     { cwd: dir, env, stdio: 'pipe' });
        const output = JSON.parse(await readFile(join(dir, 'proxy-rules.singbox.json'), 'utf8'));
        assert.deepEqual(output.rules[0].domain, ['exact.example']);
    } finally { await rm(dir, { recursive: true, force: true }); }
});

test('refuse unknown source types instead of publishing partial categories', async () => {
    await assert.rejects(build({ 'proxy-rules': [{ type: 'typo' }] }));
});

test('refuse unsupported rule fields before they are silently discarded', () => {
    for (const rule of [{ domain: ['a.example'], invert: true },
                        { type: 'logical', mode: 'and', rules: [] }, { port: [443] }]) {
        assert.throws(() => new Rule(rule));
    }
});

test('source download failure aborts publication', async () => {
    const server = http.createServer((req, res) => { res.writeHead(503); res.end(); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        await assert.rejects(build({ 'proxy-rules': [{ type: 'url',
            url: `http://127.0.0.1:${server.address().port}/missing`,
            file: { type: 'csv', path: 'never-created.csv', fields: { ip_cidr: 0 } } }] }));
    } finally { server.close(); }
});

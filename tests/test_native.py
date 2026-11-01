"""Requires the official sing-box executable on PATH (also run in publication CI)."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from split_rules import split_rules

SB = os.environ.get('SING_BOX', 'sing-box')


class NativeTests(unittest.TestCase):
    def test_compile_decompile_and_positive_negative_matching(self):
        fixture = {'version': 1, 'rules': [
            {'domain': ['exact.example'], 'domain_suffix': ['suffix.example'],
             'domain_keyword': ['needle'], 'domain_regex': [r'^re\d+\.example$']},
            {'ip_cidr': ['192.0.2.1/25', '192.0.2.128/25', '2001:db8::/127']}]}
        with tempfile.TemporaryDirectory() as tmp:
            for kind, data in zip(('domains', 'ips'), split_rules(fixture)):
                source, binary, decoded = [Path(tmp) / (kind + ext) for ext in ('.json', '.srs', '.decoded.json')]
                source.write_text(json.dumps(data))
                subprocess.run([SB, 'rule-set', 'compile', str(source), '-o', str(binary)], check=True)
                subprocess.run([SB, 'rule-set', 'decompile', str(binary), '-o', str(decoded)], check=True)
                actual = json.loads(decoded.read_text())
                keys = {k for rule in actual['rules'] for k in rule}
                self.assertEqual(keys, {'ip_cidr'} if kind == 'ips' else
                                 {'domain', 'domain_suffix', 'domain_keyword', 'domain_regex'})
                positive = ['192.0.2.255', '2001:db8::1'] if kind == 'ips' else [
                    'exact.example', 'suffix.example', 'sub.suffix.example', 're42.example', 'a-needle.example']
                negative = ['192.0.3.0', '2001:db8::2', 'exact.example'] if kind == 'ips' else [
                    'sub.exact.example', 'notsuffix.example', 'reXX.example', '192.0.2.1']
                for value in positive + negative:
                    result = subprocess.run([SB, '--disable-color', 'rule-set', 'match', '-f', 'binary', str(binary), value],
                                            capture_output=True, text=True, check=True)
                    self.assertEqual('match rules.' in result.stdout + result.stderr, value in positive, (kind, value, result.stdout, result.stderr))

    def test_publication_compiles_all_artifacts_and_records_hashes(self):
        import hashlib
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            fixture = {'version': 1, 'rules': [{'domain': ['a.example']}, {'ip_cidr': ['192.0.2.0/25', '192.0.2.128/25']}]}
            (root / 'proxy-rules.singbox.json').write_text(json.dumps(fixture))
            for name, data in zip(('proxy-domains', 'proxy-ips'), split_rules(fixture)):
                (root / f'{name}.singbox.json').write_text(json.dumps(data))
            script = Path(__file__).resolve().parents[1] / 'scripts/compile_srs.py'
            self.assertTrue(script.exists(), 'verified publication compiler missing')
            subprocess.run([sys.executable, str(script)], cwd=tmp, check=True)
            manifest = json.loads((root / 'manifest.json').read_text())
            self.assertEqual(len(manifest['artifacts']), 3)
            for name, entry in manifest['artifacts'].items():
                self.assertEqual(entry['sha256'], hashlib.sha256((root / name).read_bytes()).hexdigest())
            before = (root / 'manifest.json').read_bytes()
            subprocess.run([sys.executable, str(script)], cwd=tmp, check=True)
            self.assertEqual(before, (root / 'manifest.json').read_bytes())

    def test_official_compiler_rejects_invalid_regex(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'bad.json'
            source.write_text(json.dumps({'version': 1, 'rules': [{'domain_regex': ['(?=unsupported)']}]}))
            result = subprocess.run([SB, 'rule-set', 'compile', str(source), '-o', str(Path(tmp) / 'bad.srs')],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0)  # compile alone does not validate RE2
            result = subprocess.run([SB, 'rule-set', 'match', '-f', 'binary', str(Path(tmp) / 'bad.srs'), 'test.example'],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)

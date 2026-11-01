#!/usr/bin/env python3
"""Compile, round-trip and verify all SRS; publish only aggregate provenance."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
from split_rules import DOMAIN_FIELDS, collapse, split_rules

SB = os.environ.get('SING_BOX', 'sing-box')


def run(*args):
    return subprocess.run([SB, *args], check=True, capture_output=True, text=True)


def values(data, field):
    result = set()
    for rule in data.get('rules', []):
        entries = rule.get(field, [])
        result.update([entries] if isinstance(entries, str) else entries)
    return sorted(result)


def domain_signature(data):
    suffixes = set(values(data, 'domain_suffix'))
    def covered(name, exclude_self=False):
        labels = name.split('.')
        return any('.'.join(labels[i:]) in suffixes
                   for i in range(1 if exclude_self else 0, len(labels)))
    return {
        'domain': sorted(v for v in values(data, 'domain') if not covered(v)),
        'domain_suffix': sorted(v for v in suffixes if not covered(v, True)),
        'domain_keyword': values(data, 'domain_keyword'),
        'domain_regex': values(data, 'domain_regex'),
    }


def main():
    original = json.loads(Path('proxy-rules.singbox.json').read_text())
    for name, expected in zip(('proxy-domains', 'proxy-ips'), split_rules(original)):
        if json.loads(Path(f'{name}.singbox.json').read_text()) != expected:
            raise ValueError(f'{name} differs from configured proxy category')
    manifest = {'schema_version': 1, 'builder_commit': os.environ.get('GITHUB_SHA'),
                'compiler': run('version').stdout.splitlines()[0], 'artifacts': {}}
    with tempfile.TemporaryDirectory() as tmp:
        for source in sorted(Path('.').glob('*.singbox.json')):
            name = source.name.removesuffix('.singbox.json')
            data = json.loads(source.read_text())
            binary = Path(f'{name}.srs')
            run('rule-set', 'compile', str(source), '-o', str(binary))
            decoded = Path(tmp) / f'{name}.json'
            run('rule-set', 'decompile', str(binary), '-o', str(decoded))
            actual = json.loads(decoded.read_text())
            # Loading the matcher catches RE2 errors that compile alone accepts.
            run('rule-set', 'match', '-f', 'binary', str(binary), 'validation.invalid')
            if collapse(values(data, 'ip_cidr')) != collapse(values(actual, 'ip_cidr')):
                raise ValueError(f'{name}: IP coverage changed during round trip')
            if domain_signature(data) != domain_signature(actual):
                raise ValueError(f'{name}: domain semantics changed during round trip')
            if name in ('proxy-domains', 'proxy-ips'):
                allowed = set(DOMAIN_FIELDS) if name == 'proxy-domains' else {'ip_cidr'}
                if any(set(rule) - allowed for rule in actual['rules']):
                    raise ValueError(f'{name}: unexpected match fields')
            again = Path(tmp) / f'{name}.srs'
            run('rule-set', 'compile', str(source), '-o', str(again))
            if again.read_bytes() != binary.read_bytes():
                raise ValueError(f'{name}: non-deterministic compilation')
            payload = binary.read_bytes()
            manifest['artifacts'][binary.name] = {
                'format': 'sing-box-srs', 'source_version': data['version'],
                'category': 'proxy-rules' if name in ('proxy-domains', 'proxy-ips') else name,
                'view': {'proxy-domains': 'domains-only', 'proxy-ips': 'ips-only'}.get(name, 'combined'),
                'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest(),
                'counts': {field: len(values(actual, field)) for field in (*DOMAIN_FIELDS, 'ip_cidr')},
            }
    for binary in sorted(Path('.').glob('*-rules.dat')):
        payload = binary.read_bytes()
        manifest['artifacts'][binary.name] = {
            'format': 'v2ray-geosite' if binary.name == 'site-rules.dat' else 'v2ray-geoip',
            'tags': sorted(p.name.removesuffix('.geosite.txt' if binary.name == 'site-rules.dat' else '.geoip.txt')
                           for p in Path('.').glob('*.geosite.txt' if binary.name == 'site-rules.dat' else '*.geoip.txt')
                           if p.stat().st_size),
            'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest(),
        }
    Path('manifest.json').write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n')
    print(json.dumps(manifest, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()

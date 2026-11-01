#!/usr/bin/env python3
"""Derive optional proxy views from the existing, single configuration build."""
import ipaddress
import json
from pathlib import Path

DOMAIN_FIELDS = ('domain', 'domain_suffix', 'domain_keyword', 'domain_regex')


def collapse(values):
    networks = [ipaddress.ip_network(value, strict=False) for value in values]
    return [str(network) for version in (4, 6)
            for network in ipaddress.collapse_addresses(
                network for network in networks if network.version == version)]


def split_rules(source):
    domains = {field: set() for field in DOMAIN_FIELDS}
    ips = []
    for rule in source['rules']:
        if set(rule) - set(DOMAIN_FIELDS) - {'ip_cidr'}:
            raise ValueError('Cannot split logical, inverted or unsupported rule fields')
        if any(not isinstance(values, list) or
               any(not isinstance(value, str) for value in values)
               for values in rule.values()):
            raise ValueError('Expected arrays of strings')
        if rule.get('ip_cidr') and any(rule.get(field) for field in DOMAIN_FIELDS):
            raise ValueError('Cannot split a domain/IP conjunction without changing policy')
        for field in DOMAIN_FIELDS:
            domains[field].update(rule.get(field, []))
        ips.extend(rule.get('ip_cidr', []))
    domain_rule = {key: sorted(values) for key, values in domains.items() if values}
    ip_rule = {'ip_cidr': collapse(ips)} if ips else {}
    return ({'version': source['version'], 'rules': [domain_rule] if domain_rule else []},
            {'version': source['version'], 'rules': [ip_rule] if ip_rule else []})


def main():
    source = json.loads(Path('proxy-rules.singbox.json').read_text())
    for name, rules in zip(('proxy-domains', 'proxy-ips'), split_rules(source)):
        Path(f'{name}.singbox.json').write_text(json.dumps(rules, indent=2) + '\n')


if __name__ == '__main__':
    main()

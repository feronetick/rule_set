#!/usr/bin/env python3
"""Lossless typed extraction of a named Xray DAT category (no DNS expansion)."""
import argparse
import ipaddress
import json
from pathlib import Path


def fields(data):
    pos = 0
    def varint():
        nonlocal pos
        value = shift = 0
        while pos < len(data) and shift < 70:
            b = data[pos]
            pos += 1
            value |= (b & 127) << shift
            if b < 128:
                return value
            shift += 7
        raise ValueError('invalid protobuf varint')
    while pos < len(data):
        key = varint()
        number, wire = key >> 3, key & 7
        if wire == 0:
            value = varint()
        elif wire == 2:
            size = varint()
            value = data[pos:pos+size]
            if len(value) != size:
                raise ValueError('truncated protobuf')
            pos += size
        else:
            raise ValueError('unsupported protobuf wire type')
        yield number, value


def convert(data, category, kind):
    entries = []
    for number, payload in fields(data):
        if number != 1:
            raise ValueError('unknown DAT field')
        entry = list(fields(payload))
        if next(v.decode().lower() for k,v in entry if k == 1) == category.lower():
            entries.append(entry)
    if len(entries) != 1:
        raise ValueError('category missing or duplicated')
    rule = {}
    for number, payload in entries[0]:
        if number == 1:
            continue
        if kind == 'geoip' and number == 3:
            if payload:
                raise ValueError('inverse geoip cannot be flattened')
            continue
        if number != 2:
            raise ValueError('unknown category field')
        record = dict(fields(payload))
        if kind == 'geosite':
            typ = record.get(1, 0)
            field = {0:'domain_keyword',1:'domain_regex',2:'domain_suffix',3:'domain'}.get(typ)
            if field is None:
                raise ValueError('unknown domain kind')
            # Attribute metadata does not alter unqualified category membership.
            value = record[2].decode()
        elif kind == 'geoip':
            field = 'ip_cidr'
            value = str(ipaddress.ip_network((ipaddress.ip_address(record[1]),record.get(2,0)), strict=True))
        else:
            raise ValueError('unknown DAT kind')
        rule.setdefault(field, []).append(value)
    if not rule:
        raise ValueError('empty required category')
    return {'version':3,'rules':[{k:sorted(set(v)) for k,v in rule.items()}]}


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('kind',choices=['geosite','geoip'])
    p.add_argument('category')
    p.add_argument('source',type=Path)
    p.add_argument('output',type=Path)
    a=p.parse_args()
    a.output.write_text(json.dumps(convert(a.source.read_bytes(),a.category,a.kind),indent=2)+'\n')

# Routing rule-set publication

The private `feronetick/rules_set_config` configuration remains the only source
of category membership and source URLs. This repository fetches it using the
existing Actions secrets. Do not copy that configuration into this public repo.

## Stable artifacts

Published on `main`, daily at 00:00 UTC or via **Build / workflow_dispatch**.
Base URL: `https://raw.githubusercontent.com/feronetick/rule_set/refs/heads/main/`

| File | Format / meaning |
| --- | --- |
| `proxy-domains.srs` | sing-box binary, domain-only view of `proxy-rules`: exact `domain`, `domain_suffix`, `domain_keyword`, `domain_regex` retain their respective semantics. For server-side hostname matching. |
| `proxy-ips.srs` | sing-box binary, IP-only view of `proxy-rules`: IPv4/IPv6 CIDRs, normalized, deduplicated and exactly collapsed. For compact client-side IP matching. No domains, regex, DNS resolution or IP expansion from domains. |
| `proxy-rules.srs` | Existing combined proxy artifact, retained for current consumers. |
| `block-rules.srs` | Existing blocking category, not merged into proxy. |
| `ru-only-rules.srs` | Existing independently configured routing category. |
| `age-restricted-rules.srs` | Existing independently configured category; may be empty. |
| `site-rules.dat` | Existing V2Ray/Xray geosite format; category names remain tags, including `proxy-rules`. |
| `ip-rules.dat` | Existing V2Ray/Xray geoip format; category names remain tags, including `proxy-rules`. |
| `manifest.json` | Compiler version, builder commit, per-file SHA-256, bytes, format, category/view and decoded SRS field counts; DAT tags. No configuration contents or source credentials. |

SRS files do not embed routing actions or consumer tags: choose a tag and the
appropriate action in the consuming configuration. Splitting a proxy category
is not a policy change. A source's name (including “blocklist”) does not decide
its action: its existing configured category does. No additional ads category
is invented. Existing combined files and DAT tags/URLs remain available until
consumers explicitly migrate; this builder does not update any live consumer.

IP normalization clears host bits under the supplied prefix and merges only
fully covered adjacent/overlapping networks; it does not approximate larger
networks. Domain strings are deduplicated within their existing field, not
converted between exact/suffix/regex/keyword types. New split JSON is sorted;
the official compiler produces deterministic SRS bytes for identical inputs.
Remote source updates can naturally change subsequent builds. DAT tooling still
uses the existing upstream builders and is not claimed byte-reproducible across
tool/upstream revisions.

## Build and verification

Requirements: Node 22, Python 3.10+, official sing-box **1.11.5** (same pinned
version as the previous publication workflow), and Go for the existing DAT jobs.

```sh
npm ci
# config.json is fetched privately by Actions; CONFIG remains supported locally.
node process-rules.js
npm test
python3 scripts/split_rules.py
# Build the existing DAT files using .github/workflows/build.yml, then:
python3 scripts/compile_srs.py
```

`SING_BOX=/path/to/sing-box` overrides the executable for Python scripts/tests.
Tests exercise the official compile/decompile/match commands, exact vs suffix
and regex/keyword semantics, IPv4/IPv6 boundaries, failure on unknown source or
rule types, unavailable sources, unsafe mixed domain/IP rules and invalid CIDRs.
The compiler alone does **not** validate RE2 regex: the publication verifier also
loads every binary into the official matcher. Real build verification checks the
split source equals the configured proxy category, compares domain coverage and
exact IP unions after decompilation, and compiles twice to check determinism.
Unsupported logical/inverted rules or domain/IP conjunctions fail the split
rather than silently broadening policy. Failed sources abort the build instead
of publishing incomplete lists.

Publication uses the existing auto-commit route, only after tests, DAT build and
SRS verification succeed. `manifest.json` hashes cover the final artifacts from
that run. Fetch a commit-pinned URL instead of `main` when auditing a particular
publication. The private configuration is deliberately not included in artifacts.

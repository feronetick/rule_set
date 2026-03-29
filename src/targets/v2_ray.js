import { promises as fs } from 'fs';
import Target from "./base.js";

export class V2RayGeositeTarget extends Target {
    constructor(path) {
        super(path);
        this.path = path;
    }

    _isValidForV2Ray(domain) {
        if (domain.includes('_')) return false;
        if (!/^[a-zA-Z0-9.\-*]+$/.test(domain)) return false;
        return true;
    }


    async save(ruleSet) {
        const lines = [];
        let skipped = 0;

        for (const rule of ruleSet) {
            for (const d of rule.domain_suffix ?? []) {
                if (this._isValidForV2Ray(d)) lines.push(d);
                else skipped++;
            }
            for (const d of rule.domain ?? []) {
                if (this._isValidForV2Ray(d)) lines.push(`full:${d}`);
                else skipped++;
            }
            for (const d of rule.domain_keyword ?? []) {
                lines.push(`keyword:${d}`);
            }
            for (const d of rule.domain_regex ?? []) {
                lines.push(`regexp:${d}`);
            }
        }

        await fs.writeFile(this.path, lines.join('\n'), 'utf-8');
        console.log(`[V2RayGeositeTarget] Written ${lines.length} rules → ${this.path} (skipped ${skipped} invalid)`);
    }
}

export class V2RayGeoipTarget extends Target {
    constructor(path) {
        super(path);
        this.path = path;
    }

    _ensurePrefix(cidr) {
        if (cidr.includes('/')) return cidr;
        const isIPv6 = cidr.includes(':');
        return isIPv6 ? `${cidr}/128` : `${cidr}/32`;
    }

    async save(ruleSet) {
        const lines = [];

        for (const rule of ruleSet) {
            for (const cidr of rule.ip_cidr ?? []) {
                lines.push(this._ensurePrefix(cidr));
            }
        }

        if (lines.length === 0) {
            console.log(`[V2RayGeoipTarget] No IP rules, skipping ${this.path}`);
            return;
        }

        await fs.writeFile(this.path, lines.join('\n'), 'utf-8');
        console.log(`[V2RayGeoipTarget] Written ${lines.length} CIDRs → ${this.path}`);
    }
}

import { promises as fs } from 'fs';
import Target from "./base.js";

export class V2RayGeositeTarget extends Target {
    constructor(path) {
        super(path);
        this.path = path;
    }

    async save(ruleSet) {
        const lines = [];

        for (const rule of ruleSet) {
            for (const d of rule.domain_suffix ?? []) {
                lines.push(d);
            }
            for (const d of rule.domain ?? []) {
                lines.push(`full:${d}`);
            }
            for (const d of rule.domain_keyword ?? []) {
                lines.push(`keyword:${d}`);
            }
            for (const d of rule.domain_regex ?? []) {
                lines.push(`regexp:${d}`);
            }
        }

        await fs.writeFile(this.path, lines.join('\n'), 'utf-8');
        console.log(`[V2RayGeositeTarget] Written ${lines.length} rules → ${this.path}`);
    }
}

export class V2RayGeoipTarget extends Target {
    constructor(path) {
        super(path);
        this.path = path;
    }

    async save(ruleSet) {
        const lines = [];

        for (const rule of ruleSet) {
            for (const cidr of rule.ip_cidr ?? []) {
                lines.push(cidr);
            }
        }

        await fs.writeFile(this.path, lines.join('\n'), 'utf-8');
        console.log(`[V2RayGeoipTarget] Written ${lines.length} CIDRs → ${this.path}`);
    }
}

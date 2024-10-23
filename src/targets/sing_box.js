import { promises as fs } from 'fs';
import Target from "./base.js";
import { SingBoxRuleSet } from '../rules/rules.js';

export default class SingBoxTarget extends Target {
    constructor(path) {
        super(path);
        this.path = path;
    }

    async save(ruleSet) {
        const parsed = {};

        for (const rule of ruleSet) {
            for (const [field, value] of Object.entries(rule)) {
                if (value) {
                    parsed[field] = (parsed[field] || 0) + 1;
                }
            }
        }

        console.log(`Saving ${this.path}`, ruleSet);

        const content = JSON.stringify(new SingBoxRuleSet(ruleSet), null, 2);
        await fs.writeFile(this.path, content);
    }
}
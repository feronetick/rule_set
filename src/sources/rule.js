import Source from './base.js';
import { RuleSet } from '../rules/rules.js';

export default class RuleSource extends Source {
    constructor(rule) {
        super();
        this.rule = rule;
    }

    async execute() {
        return new RuleSet(this.rule);
    }
}
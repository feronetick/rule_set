import FileSource from './file.js';
import { RuleSet } from '../rules/rules.js';

export default class SingBoxSource extends FileSource {
    constructor(path) {
        super(path);
    }

    async execute() {
        const content = await this.readFile();
        const ruleSet = new RuleSet(...(JSON.parse(content).rules || []));
        ruleSet.printCount();
        return ruleSet;
    }
}
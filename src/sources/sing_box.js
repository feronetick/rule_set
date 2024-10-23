import FileSource from './file.js';
import { RuleSet } from '../rules/rules.js';

export default class SingBoxSource extends FileSource {
    constructor(path) {
        super(path);
    }

    async execute() {
        const content = await this.readFile();
        const jsonContent = JSON.parse(content);
        const rules = jsonContent.rules || [];

        const parsed = {};

        for (const rule of rules) {
            for (const [field, value] of Object.entries(rule)) {
                if (value) {
                    parsed[field] = (parsed[field] || 0) + 1;
                }
            }
        }

        console.log(`sing-box file ${this.path} parsed`, parsed);

        return new RuleSet(...rules);
    }
}
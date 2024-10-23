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
        return new RuleSet(...rules);
    }
}

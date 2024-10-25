import FileSource from './file.js';
import { Rule, RuleSet } from '../rules/rules.js';

export default class CsvSource extends FileSource {
    constructor(path, { delimiter = ',', removeHeader = false, commentPrefixes = ['#'], debug = false, fields }) {
        super(path);
        this.delimiter = delimiter;
        this.removeHeader = removeHeader;
        this.commentPrefixes = commentPrefixes;
        this.debug = debug;
        this.fields = fields;
    }

    async execute() {
        const content = await this.readFile();
        const lines = content.split('\n');
        const rule = new Rule();
        let startIndex = 0;

        if (this.removeHeader) {
            startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            if (this.commentPrefixes.some(prefix => line.startsWith(prefix))) {
                continue;
            }
            const columns = line.split(this.delimiter).map(col => col.trim());
            for (const [field, index] of Object.entries(this.fields)) {
                const value = columns[index];
                if (value) {
                    rule.addValue(field, value);
                }
            }
        }

        rule.printCount();
        return new RuleSet(rule);
    }
}
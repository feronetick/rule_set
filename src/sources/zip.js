import { basename, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';

import FileSource from './file.js';
import { RuleSet } from '../rules/rules.js';

const execAsync = promisify(exec);

export default class ZipSource extends FileSource {
    constructor(path, files) {
        super(path);
        this.files = files;
    }

    async execute() {
        const tempDir = `/tmp/${basename(this.path, '.zip')}`;
        await fs.mkdir(tempDir, { recursive: true });
        await execAsync(`unzip -o "${this.path}" -d "${tempDir}"`);

        const files = await fs.readdir(tempDir);
        let baseDir = tempDir;

        if (files.length === 1) {
            const possibleDir = join(tempDir, files[0]);
            const stat = await fs.stat(possibleDir);
            if (stat.isDirectory()) {
                baseDir = possibleDir;
            }
        }

        const allRules = [];

        for (const source of this.files) {
            source.path = join(baseDir, source.path);
            const ruleSet = await source.execute();
            allRules.push(...ruleSet);
        }

        return new RuleSet(...allRules);
    }
}
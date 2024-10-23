import { promises as fs } from 'fs';

import Source from './base.js';

export default class FileSource extends Source {
    constructor(path) {
        super();
        this.path = path;
    }

    async readFile() {
        try {
            console.log(`Reading file: ${this.path}`);
            return await fs.readFile(this.path, 'utf8');
        } catch (err) {
            throw new Error(`Could not read file ${this.path}: ${err}`);
        }
    }
}

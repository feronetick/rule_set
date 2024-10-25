import axios from 'axios';
import fs from 'fs';
import { basename } from 'path';

import Source from './base.js';

export default class UrlSource extends Source {
    constructor(url, file) {
        super();
        this.url = url;
        this.file = file;
    }

    async execute() {
        console.log('Download', this.url, '=>', this.file.path);

        const response = await axios.get(this.url, { responseType: 'stream' });
        const writer = fs.createWriteStream(this.file.path);
        response.data.pipe(writer);

        try {
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (err) {
            throw Error(`Download error: ${err}`);
        }

        return await this.file.execute();
    }
}
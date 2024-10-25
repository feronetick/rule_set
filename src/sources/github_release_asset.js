import axios from 'axios';

import Source from './base.js';
import UrlSource from './url.js';
import { Rule, RuleSet } from '../rules/rules.js';

export default class GitHubReleaseAssetSource extends Source {
    constructor(owner, repo, assets) {
        super();
        this.owner = owner;
        this.repo = repo;
        this.assets = assets;
    }

    async execute() {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/releases/latest`;
        const response = await axios.get(url);
        const release = response.data;

        const allRules = [];

        for (const assetConfig of this.assets) {
            const { regex, file } = assetConfig;
            const regexObj = new RegExp(regex);
            const asset = release.assets.find(a => regexObj.test(a.name));
            if (!asset) {
                console.warn(`No asset matching regex ${regex} found`);
                continue;
            }
            file.path = this.replacePlaceholders(regex, asset.name, file.path);
            const assetUrl = asset.browser_download_url;
            const urlSource = new UrlSource(assetUrl, file);
            const rules = await urlSource.execute();
            allRules.push(...rules);
        }

        return new RuleSet(...allRules);
    }

    replacePlaceholders(pattern, text, fileName) {
        const matches = text.match(new RegExp(pattern));
        if (!matches) return fileName;

        let result = fileName;
        for (let i = 1; i < matches.length; i++) {
            result = result.replace(`$${i}`, matches[i]);
        }
        return result;
    }
}
import { version } from 'os';

const fs = require('fs').promises;
const axios = require('axios');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

export default class Builder {
    constructor(config) {
        this._config = config;
    }

    _resetFields() {
        this._fields = {
            domain: [],
            domain_suffix: [],
            domain_keyword: [],
            domain_regex: [],
            ip_cidr: [],
        };
    }

    _mergeJsonRulesFileToFields(jsonRules) {
        return this._mergeJsonRulesArrayToFields(jsonRules.rules);
    }

    _mergeJsonRulesArrayToFields(jsonArray) {
        jsonArray.map(this._mergeJsonRuleObjectToFields);
    }

    _mergeJsonRuleObjectToFields(jsonRuleObject) {
        Object.keys(this._fields).map(key => this._mergeValuesToField(jsonRuleObject[key], key));
    }

    _mergeValuesToField(fieldValues, fieldName) {
        if (fieldValues && Array.isArray(fieldValues)) {
            fieldValues.map(value => this._pushValueToField(value, fieldName));
        }
    }

    _pushValueToField(fieldValue, fieldName) {
        if (fieldName == 'ip_cidr' && !this._isValidIpCidr(fieldValue)) {
            return;
        }
        if (!this._fields[fieldName].includes(fieldValue)) {
            this._fields[fieldName].push(fieldValue)
        }
    }

    async build() {
        this._resetFields();

        for (const [name, sources] of Object.entries(this._config)) {
            console.log(`Processing ${name}...`);

            for (const source of sources) {
                if (source.type == 'github-release-zip') {
                    const zipUrl = await this._fetchLatestGithubReleaseZipUrl(source.repo);
                    const zipContents = await this._readZipFilesContents(zipUrl, source.files);
                    for (let i = 0; i < zipContents.length; ++i) {
                        this._parseFileContent(zipContents[i], source.files[i])
                    }
                }

                if (source.type == 'text' || source.type == 'json' || source.type == 'csv') {
                    const filesContents = await this._readAllFilesContentsByUrls(source.urls);
                    for (const fileContent of filesContents) {
                        this._parseFileContent(fileContent, source);
                    }
                }
            }

            const fileContent = JSON.stringify(this._combineRules(), null, 2) + '\n';
            await fs.writeFile(name + '.json', fileContent, 'utf8');
        }
    }

    async _fetchLatestGithubReleaseZipUrl(repo) {
        const response = await axios.get(`https://api.github.com/repos/${repo}/releases/latest`);
        return response.data.assets.find(asset => asset.name.endsWith('.zip')).browser_download_url;
    }

    _readAllFilesContentsByUrls(urls) {
        return Promise.all(urls.map(this._readFileContentByUrl));
    }

    async _readFileContentByUrl(url) {
        try {
            console.log(`Downloading ${url}`);
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error(`Error downloading "${url}":`, error.message);
            return null;
        }
    }

    async _readZipFilesContents(url, files) {
        const zipPath = '/tmp/download.zip';

        console.log(`Downloading ${url}`);
        await exec(`curl -L "${url}" -o ${zipPath}`);

        return Promise.all(
            files.map(async file => {
                const { stdout } = await exec(`unzip -j "${zipPath}" "*/${file.name}" -d /tmp/`);
                const fileContent = await fs.readFile(`/tmp/${file.name}`, 'utf8');
                if (file.type == 'json') {
                    return JSON.parse(fileContent);
                }
                return fileContent;
            })
        );
    }

    _parseCSV(content, { delimiter = ',', fields, headers = false }) {
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line =>
                line &&
                !line.startsWith('#') &&
                !line.startsWith('//')
            );

        if (headers) {
            lines.shift();
        }

        const rows = lines
            .map(line => line.split(delimiter)
                .map(value => value.trim())
                .map(value => value.startsWith('#') ? '' : value)
                .filter(value => value))
            .filter(row => row.length > 0);

        rows.forEach(row => {
            for (const [csvColumn, fieldName] of Object.entries(fields)) {
                const columnIndex = parseInt(csvColumn);
                if (!isNaN(columnIndex) && row[columnIndex]) {
                    this._pushValueToField(row[columnIndex], fieldName)
                }
            }
        });
    }

    _parseFileContent(content, source) {
        switch (source.type) {
            case 'json':
                return this._mergeJsonRuleObjectToFields(content);
            case 'csv':
                return this._parseCSV(content, {
                    delimiter: source.delimiter,
                    fields: source.fields,
                    headers: source.headers
                });

            default:
                return this._parseCSV(content, { fields: { 0: 'domain_suffix' } });
        }
    }

    _isValidIpCidr(cidr) {
        if (!cidr) return false;
        if (cidr === '0.0.0.0' || cidr.startsWith('0.0.0.0/')) return false;
        const ipCidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        return ipCidrRegex.test(cidr);
    }



    _combineRules() {
        return {
            version: 1,
            rules: [
                this._fields
            ],
        };
    }

}
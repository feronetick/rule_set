import CsvSource from './sources/csv.js';
import SingBoxSource from './sources/sing_box.js';
import RuleSource from './sources/rule.js';
import ZipSource from './sources/zip.js';
import UrlSource from './sources/url.js';
import GitHubReleaseAssetSource from './sources/github_release_asset.js';
import SingBoxRuleSetTarget from './targets/sing_box.js';
import { RuleSet } from './rules/rules.js';

async function parseConfiguration(config) {
    const sourceCollections = {};

    for (const [targetName, sourcesConfig] of Object.entries(config)) {
        const sourceInstances = [];

        for (const sourceConfig of sourcesConfig) {
            const sourceInstance = await createSourceFromConfig(sourceConfig);
            if (sourceInstance) {
                sourceInstances.push(sourceInstance);
            }
        }

        sourceCollections[targetName] = sourceInstances;
    }

    return sourceCollections;
}

async function createSourceFromConfig(config) {
    switch (config.type) {
        case 'url':
            {
                return new UrlSource(config.url, createFileSource(config.file));
            }
        case 'github-release-asset':
            {
                const assets = config.assets.map(assetConfig => {
                    return {
                        regex: assetConfig.regex,
                        file: createFileSource(assetConfig.file)
                    };
                });
                return new GitHubReleaseAssetSource(config.owner, config.repo, assets);
            }
        case 'rule':
            {
                return new RuleSource(config.rule);
            }
        default:
            {
                console.warn(`Unknown source type: ${config.type}`);
                return null;
            }
    }
}

function createFileSource(fileConfig) {
    switch (fileConfig.type) {
        case 'csv':
            return new CsvSource(fileConfig.path || '', {
                delimiter: fileConfig.delimiter,
                removeHeader: fileConfig.remove_header,
                commentPrefixes: fileConfig.comment_prefixes,
                fields: fileConfig.fields,
                debug: fileConfig.debug || false,
            });

        case 'sing-box':
        case 'singbox':
            return new SingBoxSource(fileConfig.path || '');
        case 'zip':
            {
                const nestedSources = fileConfig.files.map(createNestedFileSource);
                return new ZipSource(fileConfig.path || '', nestedSources);
            }
        default:
            console.warn(`Unknown file type: ${fileConfig.type}`);
            return null;
    }
}

function createNestedFileSource(fileConfig) {
    return createFileSource(fileConfig);
}

export default async function (config) {
    const sourceCollections = await parseConfiguration(config);

    for (const [targetName, sources] of Object.entries(sourceCollections)) {
        let combinedRules = [];

        for (const source of sources) {
            try {
                const ruleSet = await source.execute();
                combinedRules.push(...ruleSet);
            } catch (err) {
                console.error(`Error processing ${JSON.stringify(source)}: ${err.message} ${err.stack}`);
            }
        }

        // Save the combined rule set to the appropriate target
        const outputFilePath = `${targetName}.json`;
        const target = new SingBoxRuleSetTarget(outputFilePath);

        try {
            await target.save(new RuleSet(...combinedRules));
            console.log(`Saved ${targetName} to ${outputFilePath}`);
        } catch (err) {
            console.error(`Failed to save ${targetName}: ${err.message}`);
        }
    }
}


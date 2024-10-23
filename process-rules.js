const fs = require('fs').promises;
const axios = require('axios');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const CONFIG = JSON.parse(process.env.CONFIG);

async function fetchLatestGithubReleaseZipUrl(repo) {
  const response = await axios.get(`https://api.github.com/repos/${repo}/releases/latest`);
  return response.data.assets.find(asset => asset.name.endsWith('.zip')).browser_download_url;
}

function readAllFilesContentsByUrls(urls) {
  return Promise.all(urls.map(readFileContentByUrl));
}

async function readFileContentByUrl(url) {
  try {
    console.log(`Downloading ${url}`);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error downloading "${url}":`, error.message);
    return null;
  }
}

async function readZipFilesContents(url, files) {
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

function parseCSV(content, { delimiter = ',', fields, headers = false }) {
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

  const rows = lines.map(line =>
    line.split(delimiter)
      .map(value => value.trim())
      .map(value => value.startsWith('#') ? '' : value)
      .filter(value => value)
  ).filter(row => row.length > 0);

  const rules = rows.map(row => {
    const mappedValues = {};
    for (const [csvColumn, fieldName] of Object.entries(fields)) {
      const columnIndex = parseInt(csvColumn);
      if (!isNaN(columnIndex) && row[columnIndex]) {
        mappedValues[fieldName] = mappedValues[fieldName] || [];
        mappedValues[fieldName].push(row[columnIndex]);
      }
    }
    return mappedValues;
  })
    .filter(obj => Object.keys(obj).length > 0)
    .map((rule) => {
      return {
        version: 1,
        rules: [rule],
      };
    });

  return combineRules(rules);
}

function parseFileContent(content, source) {
  switch (source.type) {
    case 'json':
      return content;
    case 'csv':
      return parseCSV(content, {
        delimiter: source.delimiter,
        fields: source.fields,
        headers: source.headers
      });

    default:
      return parseCSV(content, { fields: { 0: 'domain_suffix' } });
  }
}

function isValidIpCidr(cidr) {
  if (!cidr) return false;
  if (cidr === '0.0.0.0' || cidr.startsWith('0.0.0.0/')) return false;
  const ipCidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  return ipCidrRegex.test(cidr);
}

function filterRule(rule) {
  if (rule.ip_cidr) {
    rule.ip_cidr = rule.ip_cidr.filter(isValidIpCidr);
    if (rule.ip_cidr.length === 0) {
      delete rule.ip_cidr;
    }
  }

  return Object.keys(rule).some(key =>
    Array.isArray(rule[key]) && rule[key].length > 0
  );
}

function combineRules(rules) {
  return {
    version: 1,
    rules: rules
      .reduce((acc, rule) => {
        if (!rule || !rule.rules) return acc;
        const filteredRules = rule.rules.filter(filterRule);
        return [...acc, ...filteredRules];
      }, [])
  };
}

async function processRules() {
  for (const [name, sources] of Object.entries(CONFIG)) {
    const rules = [];
    console.log(`Processing ${name}...`);

    for (const source of sources) {
      if (source.type == 'github-release-zip') {
        const zipUrl = await fetchLatestGithubReleaseZipUrl(source.repo);
        const zipContents = await readZipFilesContents(zipUrl, source.files);
        for (let i = 0; i < zipContents.length; ++i) {
          rules.push(parseFileContent(zipContents[i], source.files[i]))
        }
      }

      console.log(source.type);
      if (source.type == 'text' || source.type == 'json' || source.type == 'csv') {
        const filesContents = await readAllFilesContentsByUrls(source.urls);
        for (const fileContent of filesContents) {
          rules.push(parseFileContent(fileContent, source));
        }
      }
    }

    const fileContent = JSON.stringify(combineRules(rules), null, 2) + '\n';
    await fs.writeFile(name + '.json', fileContent, 'utf8');
  }
}

processRules().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

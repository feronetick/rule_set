import build from './src/index.js';

// const config = JSON.parse(process.env.CONFIG);

const config = {
  "block-rules": [
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geosite/category-ads-all.json",
      "file": {
        "type": "sing-box",
        "path": "category-ads-all.json"
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/hoshsadiq/adblock-nocoin-list/refs/heads/master/hosts.txt",
      "file": {
        "type": "csv",
        "path": "cryptominers.csv",
        "delimiter": " ",
        "fields": { "ip_cidr": 0, "domain_suffix": 1 }
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/curbengh/phishing-filter/refs/heads/gh-pages/phishing-filter-dnscrypt-blocked-ips.txt",
      "file": {
        "type": "csv",
        "path": "phishing-ips.csv",
        "fields": { "ip_cidr": 0 }
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/curbengh/urlhaus-filter/refs/heads/gh-pages/urlhaus-filter-dnscrypt-blocked-ips-online.txt",
      "file": {
        "type": "csv",
        "path": "malware-ips.csv",
        "fields": { "ip_cidr": 0 }
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/curbengh/phishing-filter/refs/heads/gh-pages/phishing-filter-dnscrypt-blocked-names.txt",
      "file": {
        "type": "csv",
        "path": "phishing-domains.csv",
        "fields": { "domain_suffix": 0 }
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/curbengh/urlhaus-filter/refs/heads/gh-pages/urlhaus-filter-dnscrypt-blocked-names-online.txt",
      "file": {
        "type": "csv",
        "path": "malware-domains.csv",
        "fields": { "domain_suffix": 0 }
      }
    }
  ],
  "direct-rules": [
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geosite/category-ru.json",
      "file": {
        "type": "sing-box",
        "path": "geosite-ru.json"
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geosite/yandex.json",
      "file": {
        "type": "sing-box",
        "path": "yandex.json"
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geoip/ru.json",
      "file": {
        "type": "sing-box",
        "path": "geoip-ru.json"
      }
    },
    {
      "type": "rule",
      "rule": {
        "domain_suffix": [
          "yandex-team.ru",
          "yandex-team.net"
        ]
      }
    }
  ],
  "proxy-ext-rules": [
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geosite/youtube.json",
      "file": {
        "type": "sing-box",
        "path": "youtube.json"
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geosite/openai.json",
      "file": {
        "type": "sing-box",
        "path": "openai.json"
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geosite/firebase.json",
      "file": {
        "type": "sing-box",
        "path": "firebase.json"
      }
    }
  ],
  "proxy-rules": [
    {
      "type": "github-release-asset",
      "owner": "ValdikSS",
      "repo": "GoodbyeDPI",
      "assets": [{
        "regex": "goodbyedpi-(.*?)\\.zip",
        "file": {
          "type": "zip",
          "path": "goodbyedpi-$1.zip",
          "files": [{
            "type": "csv",
            "fields": { "domain_suffix": 0 },
            "path": "russia-blacklist.txt"
          }]
        }
      }]
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/dartraiden/no-russia-hosts/refs/heads/master/hosts.txt",
      "file": {
        "type": "csv",
        "path": "russia-blocked.csv",
        "debug": true,
        "fields": { "domain_suffix": 0 }
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/GhostRooter0953/discord-voice-ips/master/main_domains/discord-main-domains-list",
      "file": {
        "type": "csv",
        "path": "discord-domains.csv",
        "fields": { "domain_suffix": 0 }
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/GhostRooter0953/discord-voice-ips/refs/heads/master/voice_domains/discord-voice-ip-list",
      "file": {
        "type": "csv",
        "path": "discord-ips.csv",
        "fields": { "ip_cidr": 0 }
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geosite/category-porn.json",
      "file": {
        "type": "sing-box",
        "path": "porn-domains.json"
      }
    },
    {
      "type": "url",
      "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geosite/category-anticensorship.json",
      "file": {
        "type": "sing-box",
        "path": "anticensorship-domains.json"
      }
    },
    {
      "type": "rule",
      "rule": {
        "domain_suffix": [
          "googleusercontent.com",
          "vpngen.org",
          "meduza.io",
          "ficbook.net",
          "api.githubcopilot.com",
          "rutracker.org",
          "ipleak.net",
          "ficbook.net",
          "gemini.google.com",
          "aistudio.google.com",
          "ai.google.dev",
          "firebaseappdistribution.googleapis.com"
        ],
        "domain_regex": [
          ".*ai\\.google\\.(com|dev)$",
          ".*\\.clients[\\d]+\\.google\\.com"
        ]
      }
    }
  ]
};

build(config).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

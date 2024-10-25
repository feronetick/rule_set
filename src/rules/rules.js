export class Rule {
    constructor({ domain = [], domain_suffix = [], domain_keyword = [], domain_regex = [], ip_cidr = [] } = {}) {
        this.domain = [];
        this.domain_suffix = [];
        this.domain_keyword = [];
        this.domain_regex = [];
        this.ip_cidr = [];

        const normalizedDomain = Array.isArray(domain) ? domain : [domain];
        const normalizedDomainSuffix = Array.isArray(domain_suffix) ? domain_suffix : [domain_suffix];
        const normalizedDomainKeyword = Array.isArray(domain_keyword) ? domain_keyword : [domain_keyword];
        const normalizedDomainRegex = Array.isArray(domain_regex) ? domain_regex : [domain_regex];
        const normalizedIpCidr = Array.isArray(ip_cidr) ? ip_cidr : [ip_cidr];

        normalizedDomain.forEach(value => this.addDomain(value));
        normalizedDomainSuffix.forEach(value => this.addDomainSuffix(value));
        normalizedDomainKeyword.forEach(value => this.addDomainKeyword(value));
        normalizedDomainRegex.forEach(value => this.addDomainRegex(value));
        normalizedIpCidr.forEach(value => this.addIpCidr(value));
    }

    printCount() {
        console.log({
            'domain': this.domain.length,
            'domain_suffix': this.domain_suffix.length,
            'domain_keyword': this.domain_keyword.length,
            'domain_regex': this.domain_regex.length,
            'ip_cidr': this.ip_cidr.length
        });
    }

    addDomain(value) {
        if (this._isValidDomain(value)) {
            this.domain.push(value);
        }
    }

    addDomainSuffix(value) {
        if (this._isValidDomain(value)) {
            this.domain_suffix.push(value);
        }
    }

    addDomainKeyword(value) {
        if (this._isValidKeyword(value)) {
            this.domain_keyword.push(value);
        }
    }

    addDomainRegex(value) {
        if (this._isValidRegex(value)) {
            this.domain_regex.push(value);
        }
    }

    addIpCidr(value) {
        if (this._isValidIpCidr(value)) {
            this.ip_cidr.push(value);
        }
    }

    _isValidDomain(domain) {
        return domain &&
            typeof domain === 'string' &&
            domain.trim() !== '' &&
            !domain.startsWith('0.0.0.0') &&
            !domain.startsWith('127.0.0.1') &&
            !domain.startsWith('::') &&
            !domain.startsWith('::1');
    }

    _isValidKeyword(keyword) {
        return keyword &&
            typeof keyword === 'string' &&
            keyword.trim() !== '';
    }

    _isValidRegex(regex) {
        if (!regex || typeof regex !== 'string' || regex.trim() === '') {
            return false;
        }
        try {
            new RegExp(regex);
            return true;
        } catch {
            return false;
        }
    }

    _isValidIpCidr(ipCidr) {
        if (!ipCidr || typeof ipCidr !== 'string' || ipCidr.trim() === '') {
            return false;
        }

        // Проверка на нулевые IP
        if (ipCidr === '0.0.0.0' ||
            ipCidr.startsWith('0.0.0.0/') ||
            ipCidr === '::' ||
            ipCidr.startsWith('::/')) {
            return false;
        }

        // Базовая проверка формата IPv4 CIDR
        const ipv4CidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        // Базовая проверка формата IPv6 CIDR
        const ipv6CidrRegex = /^([0-9a-fA-F:]+)(\/\d{1,3})?$/;

        return ipv4CidrRegex.test(ipCidr) || ipv6CidrRegex.test(ipCidr);
    }

    addValue(field, value) {
        switch (field) {
            case 'domain':
                return this.addDomain(value);
            case 'domain_suffix':
                return this.addDomainSuffix(value)
            case 'domain_keyword':
                return this.addDomainKeyword(value)
            case 'domain_regex':
                return this.addDomainRegex(value)
            case 'ip_cidr':
                return this.addIpCidr(value)
        }
    }

    isEmpty() {
        return this.domain.length === 0 &&
            this.domain_suffix.length === 0 &&
            this.domain_keyword.length === 0 &&
            this.domain_regex.length === 0 &&
            this.ip_cidr.length === 0;
    }
}

export class RuleSet extends Array {
    constructor(...rules) {
        const validRules = rules
            .map(rule => new Rule(rule))
            .filter(rule => !rule.isEmpty());

        super(...validRules);
    }

    printCount() {
        const total = {
            domain: 0,
            domain_suffix: 0,
            domain_keyword: 0,
            domain_regex: 0,
            ip_cidr: 0
        };

        this.forEach(rule => {
            total.domain += rule.domain.length;
            total.domain_suffix += rule.domain_suffix.length;
            total.domain_keyword += rule.domain_keyword.length;
            total.domain_regex += rule.domain_regex.length;
            total.ip_cidr += rule.ip_cidr.length;
        });
    }
}

export class SingBoxRuleSet {
    constructor(rules = []) {
        this.version = 1;
        this.rules = new RuleSet(...rules);
    }

    printCount() {
        const total = {
            domain: 0,
            domain_suffix: 0,
            domain_keyword: 0,
            domain_regex: 0,
            ip_cidr: 0
        };

        this.rules.forEach(rule => {
            total.domain += rule.domain.length;
            total.domain_suffix += rule.domain_suffix.length;
            total.domain_keyword += rule.domain_keyword.length;
            total.domain_regex += rule.domain_regex.length;
            total.ip_cidr += rule.ip_cidr.length;
        });
    }
}
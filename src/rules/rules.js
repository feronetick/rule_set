export class Rule {
    constructor({ domain = [], domain_suffix = [], domain_keyword = [], domain_regex = [], ip_cidr = [] } = {}) {
        this.domain = [];
        this.domain_suffix = [];
        this.domain_keyword = [];
        this.domain_regex = [];
        this.ip_cidr = [];

        domain.forEach(value => this.addDomain(value));
        domain_suffix.forEach(value => this.addDomainSuffix(value));
        domain_keyword.forEach(value => this.addDomainKeyword(value));
        domain_regex.forEach(value => this.addDomainRegex(value));
        ip_cidr.forEach(value => this.addIpCidr(value));
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
}

export class SingBoxRuleSet {
    constructor(rules = []) {
        this.version = 1;
        this.rules = new RuleSet(...rules);
    }
}
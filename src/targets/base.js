export default class Target {
    constructor() {

    }

    async save(ruleSet) {
        throw new Error('execute method must be implemented by subclass');
    }
}
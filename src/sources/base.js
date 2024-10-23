export default class Source {
  async execute() {
    throw new Error('execute method must be implemented by subclass');
  }
}

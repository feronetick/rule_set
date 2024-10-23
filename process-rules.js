const Builder = require('./src/builder.js');

const builder = new Builder(JSON.parse(process.env.CONFIG));

builder.processRules().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

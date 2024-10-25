import build from './src/index.js';

const config = JSON.parse(process.env.CONFIG);

build(config).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

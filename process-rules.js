import build from './src/index.js';
import { readFileSync } from 'node:fs';

const config = JSON.parse(process.env.CONFIG ?? readFileSync('config.json', 'utf8'));

build(config).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

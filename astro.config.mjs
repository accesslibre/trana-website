import { defineConfig } from 'astro/config';

const robotsHeader = { 'X-Robots-Tag': 'noindex, nofollow, noarchive' };

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'http://localhost:4188',
  trailingSlash: 'always',
  server: { host: '127.0.0.1', port: 4188 },
  vite: {
    server: { headers: robotsHeader },
    preview: { headers: robotsHeader },
  },
});

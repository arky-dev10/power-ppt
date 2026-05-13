import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  vite: {
    plugins: [
      {
        name: 'watch-projects',
        configureServer(server) {
          // Watch all presentation.json files and context.md across projects
          server.watcher.add('./projects/**/presentation.json');
          server.watcher.add('./projects');
          server.watcher.on('change', (filePath) => {
            if (filePath.endsWith('presentation.json') || filePath.endsWith('context.md')) {
              server.ws.send({ type: 'full-reload' });
            }
          });
          // Also reload when a new project folder is added
          server.watcher.on('addDir', (filePath) => {
            if (filePath.includes('/projects/')) {
              server.ws.send({ type: 'full-reload' });
            }
          });
        }
      }
    ]
  }
});

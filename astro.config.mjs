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
          server.watcher.add('./vetting/**/profile.json');
          server.watcher.add('./vetting/**/report.json');
          server.watcher.add('./vetting');
          server.watcher.add('./diagnostics/**/territorial.json');
          server.watcher.add('./diagnostics');
          server.watcher.on('change', (filePath) => {
            if (
              filePath.endsWith('presentation.json') ||
              filePath.endsWith('context.md') ||
              filePath.endsWith('profile.json') ||
              filePath.endsWith('report.json') ||
              filePath.endsWith('territorial.json')
            ) {
              server.ws.send({ type: 'full-reload' });
            }
          });
          server.watcher.on('addDir', (filePath) => {
            if (filePath.includes('/projects/') || filePath.includes('/vetting/') || filePath.includes('/diagnostics/')) {
              server.ws.send({ type: 'full-reload' });
            }
          });
        }
      }
    ]
  }
});

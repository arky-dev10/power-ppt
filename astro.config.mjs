import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  vite: {
    plugins: [
      {
        name: 'watch-presentation-json',
        configureServer(server) {
          server.watcher.add('./presentation.json');
          server.watcher.on('change', (path) => {
            if (path.endsWith('presentation.json')) {
              server.ws.send({ type: 'full-reload' });
            }
          });
        }
      }
    ]
  }
});

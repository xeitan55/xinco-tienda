import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: '/src/main.js',
      output: {
        entryFileNames: 'assets/bundle-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  plugins: [
    {
      name: 'generate-index-html',
      closeBundle() {
        const distDir = path.join(__dirname, 'dist');
        const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

        const assetsDir = path.join(distDir, 'assets');
        if (!fs.existsSync(assetsDir)) {
          console.error('Assets directory not found');
          return;
        }
        const files = fs.readdirSync(assetsDir);
        const jsFile = files.find(f => f.startsWith('bundle-') && f.endsWith('.js'));
        const cssFile = files.find(f => f.endsWith('.css'));

        if (!jsFile) {
          console.error('Bundle JS file not found in', files);
          return;
        }

        let newHtml = html.replace(
          /<script type="module" src="\/src\/main\.js"><\/script>/,
          `<script type="module" src="/assets/${jsFile}"></script>`
        );

        if (cssFile) {
          newHtml = newHtml.replace(
            '</head>',
            `  <link rel="stylesheet" crossorigin href="/assets/${cssFile}">\n</head>`
          );
        }

        newHtml = newHtml.replace('</body>', '</body>\n</html>');

        fs.writeFileSync(path.join(distDir, 'index.html'), newHtml);
        console.log(`dist/index.html generated — JS: ${jsFile}${cssFile ? `, CSS: ${cssFile}` : ''}`);
      }
    }
  ],
  server: {
    port: 3000
  }
});

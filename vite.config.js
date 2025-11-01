import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from '@remix-run/dev';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig((config) => {
  return {
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split massive syntax bundles - ADDED OPTIMIZATION
            if (id.includes('codemirror') || id.includes('@codemirror')) {
              return 'vendor-codemirror';
            }
            if (id.includes('shiki') || id.includes('@shikijs')) {
              return 'vendor-syntax';
            }
            if (id.includes('xterm') || id.includes('@xterm')) {
              return 'vendor-terminal';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            
            // Your existing chunking logic
            if (id.includes('node_modules')) {
              if (id.includes('@remix-run') || id.includes('react-router')) {
                return 'vendor-remix';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-radix';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              if (id.includes('@iconify')) {
                return 'vendor-icons';
              }
              
              // Default vendor chunk for other packages
              return 'vendor';
            }
          }
        }
      },
      // Increased chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
    plugins: [
      nodePolyfills({
        include: ['path', 'buffer'],
      }),
      config.mode !== 'test' && remixCloudflareDevProxy(),
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
        },
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config.mode === 'production' && optimizeCssModules({ apply: 'build' }),
    ],
  };
});

function chrome129IssuePlugin() {
  return {
    name: 'chrome129IssuePlugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers['user-agent']?.match(/Chrom(e|ium)\/([0-9]+)\./);

        if (raw) {
          const version = parseInt(raw[2], 10);

          if (version === 129) {
            res.setHeader('content-type', 'text/html');
            res.end(
              '<body><h1>Please use Chrome Canary for testing.</h1><p>Chrome 129 has an issue with JavaScript modules & Vite local development, see <a href="https://github.com/stackblitz/bolt.new/issues/86#issuecomment-2395519258">for more information.</a></p><p><b>Note:</b> This only impacts <u>local development</u>. `pnpm run build` and `pnpm run start` will work fine in this browser.</p></body>',
            );

            return;
          }
        }

        next();
      });
    },
  };
}

import esbuild from 'esbuild';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 5173;

// Build context for esbuild
const ctx = await esbuild.context({
    entryPoints: [join(__dirname, '../src/main.jsx')],
    bundle: true,
    outfile: join(__dirname, '../dist/bundle.js'),
    loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.css': 'css',
    },
    define: {
        'process.env.NODE_ENV': '"development"',
    },
    sourcemap: true,
    logLevel: 'info',
});

// Watch for changes
await ctx.watch();

// Create dev server
const server = createServer((req, res) => {
    const url = req.url === '/' ? '/index.html' : req.url;

    try {
        if (url.endsWith('.js')) {
            const content = readFileSync(join(__dirname, '../dist/bundle.js'), 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(content);
        } else if (url.endsWith('.css')) {
            const content = readFileSync(join(__dirname, '../dist/bundle.css'), 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(content);
        } else {
            const content = readFileSync(join(__dirname, '../index.html'), 'utf-8')
                .replace('/src/main.jsx', '/bundle.js');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        }
    } catch (err) {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`\n  ➜  Local:   http://localhost:${PORT}/\n`);
});

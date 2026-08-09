const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const gameRoot = path.join(__dirname, 'game-www');

/**
 * Serve the built Phaser game at /game/* from the Expo Metro tunnel.
 * Lets Expo Go load the WebView without a second public Vite tunnel.
 */
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      try {
        const urlPath = decodeURIComponent((req.url || '').split('?')[0]);
        if (!urlPath.startsWith('/game')) {
          return middleware(req, res, next);
        }

        let rel = urlPath.replace(/^\/game\/?/, '');
        if (!rel || rel.endsWith('/')) rel += 'index.html';
        const filePath = path.normalize(path.join(gameRoot, rel));
        if (!filePath.startsWith(gameRoot)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const types = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.json': 'application/json',
          '.map': 'application/json',
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.ogg': 'audio/ogg',
        };
        res.writeHead(200, {
          'Content-Type': types[ext] || 'application/octet-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        console.warn('[metro game static]', err);
        return middleware(req, res, next);
      }
    };
  },
};

module.exports = config;

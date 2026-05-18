import express from 'express';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import apiApp from './api/index.js'; // Note .js extension is required when resolving in node with type module or tsx

dotenv.config();

const app = express();
const PORT = 3000;

// Mount the API router
app.use(apiApp);

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    // Serve index.html for all non-API routes (SPA fallback)
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      
      // Skip API routes
      if (url.startsWith('/api')) {
        return next();
      }
      
      try {
        // Read index.html
        let template = fs.readFileSync(
          path.resolve(process.cwd(), 'index.html'),
          'utf-8'
        );
        
        // Apply Vite HTML transforms
        template = await vite.transformIndexHtml(url, template);
        
        // Send the transformed HTML
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

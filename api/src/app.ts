import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { HonoEnv } from './types';
import { authRoutes } from './routes/auth.routes';
import { familyRoutes } from './routes/family.routes';
import { expenseRoutes } from './routes/expense.routes';
import { errorHandler } from './middleware/error';

// SPA HTML template - served for all non-API, non-asset routes
const spaHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/expenses-manager/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Expenses Manager</title>
    <script type="module" crossorigin src="/expenses-manager/assets/index-BAomm_K5.js"></script>
    <link rel="stylesheet" crossorigin href="/expenses-manager/assets/index-BgUI0pZj.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

export function createApp() {
  const app = new Hono<HonoEnv>();

  // Global middleware
  app.use('*', logger());
  app.use(
    '*',
    cors({
      origin: ['http://localhost:5173', 'https://chrisyaranga.dev'],
      credentials: true,
    })
  );

  // Error handling
  app.onError(errorHandler);

  // Health check
  app.get('/expenses-manager/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.route('/expenses-manager/api/auth', authRoutes);
  app.route('/expenses-manager/api/families', familyRoutes);
  app.route('/expenses-manager/api/expenses', expenseRoutes);

  // 404 handler for API routes
  app.all('/expenses-manager/api/*', (c) => {
    return c.json({ success: false, error: 'Not found' }, 404);
  });

  // For non-API routes under /expenses-manager, serve the SPA HTML
  // This handles client-side routing for React Router
  app.all('/expenses-manager/*', (c) => {
    return c.html(spaHtml);
  });

  // Fallback for any other routes
  app.notFound((c) => {
    return c.json({ success: false, error: 'Not found' }, 404);
  });

  return app;
}

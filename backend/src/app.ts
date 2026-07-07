import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import path from 'node:path';
import { registerAuthRoutes } from './routes/auth.js';
import { registerBandRoutes } from './routes/bands.js';
import { registerPracticeRoutes } from './routes/practices.js';
import { registerSongRoutes } from './routes/songs.js';
import { registerCommunityRoutes } from './routes/community.js';
import { registerNotificationRoutes } from './routes/notifications.js';
import { getFrontendUrl, isDevOriginAllowed } from './config/cors.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: (origin, cb) => {
      // Same-origin or server-to-server (no Origin header)
      if (!origin) {
        cb(null, true);
        return;
      }
      const configured = getFrontendUrl();
      if (origin === configured || isDevOriginAllowed(origin)) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
  });
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  app.get('/health', async () => ({ ok: true }));

  await registerAuthRoutes(app);
  await registerBandRoutes(app);
  await registerPracticeRoutes(app);
  await registerSongRoutes(app);
  await registerCommunityRoutes(app);
  await registerNotificationRoutes(app);

  app.register(import('@fastify/static'), {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  return app;
}

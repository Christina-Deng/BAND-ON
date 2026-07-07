import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import * as notificationService from '../services/notificationService.js';

function toHttpStatus(error: unknown): number {
  const err = error as Error & { statusCode?: number };
  return err.statusCode ?? 500;
}

export async function registerNotificationRoutes(app: FastifyInstance) {
  app.get('/notifications', { preHandler: authenticate }, async (request, reply) => {
    const query = request.query as { limit?: string };
    const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;

    try {
      const notifications = await notificationService.listNotifications(
        request.userId!,
        Number.isFinite(limit) ? limit : undefined,
      );
      return { notifications };
    } catch (error) {
      return reply.status(toHttpStatus(error)).send({
        error: { code: 'LIST_NOTIFICATIONS_FAILED', message: (error as Error).message },
      });
    }
  });

  app.get('/notifications/unread-count', { preHandler: authenticate }, async (request) => {
    const count = await notificationService.getUnreadCount(request.userId!);
    return { count };
  });

  app.patch('/notifications/:id/read', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await notificationService.markAsRead(request.userId!, id);
      return { ok: true };
    } catch (error) {
      return reply.status(toHttpStatus(error)).send({
        error: { code: 'MARK_READ_FAILED', message: (error as Error).message },
      });
    }
  });

  app.post('/notifications/mark-all-read', { preHandler: authenticate }, async (request) => {
    await notificationService.markAllAsRead(request.userId!);
    return { ok: true };
  });
}

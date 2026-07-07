import type { CommunityPostType } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import * as communityService from '../services/communityService.js';

function toHttpStatus(error: unknown): number {
  const err = error as Error & { statusCode?: number };
  return err.statusCode ?? 500;
}

export async function registerCommunityRoutes(app: FastifyInstance) {
  app.get('/community/posts', { preHandler: authenticate }, async (request, reply) => {
    const query = request.query as { type?: CommunityPostType; limit?: string };
    const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;

    try {
      const posts = await communityService.listPosts({
        type: query.type,
        limit: Number.isFinite(limit) ? limit : undefined,
      });
      return { posts };
    } catch (error) {
      return reply.status(toHttpStatus(error)).send({
        error: { code: 'LIST_POSTS_FAILED', message: (error as Error).message },
      });
    }
  });

  app.post('/community/posts', { preHandler: authenticate }, async (request, reply) => {
    const body = request.body as {
      type?: CommunityPostType;
      title?: string;
      body?: string;
      eventAt?: string | null;
      location?: string | null;
      budgetNote?: string | null;
    };

    if (!body.type || !body.title || !body.body) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请填写类型、标题和正文' },
      });
    }

    try {
      const post = await communityService.createPost({
        authorId: request.userId!,
        type: body.type,
        title: body.title,
        body: body.body,
        eventAt: body.eventAt ? new Date(body.eventAt) : null,
        location: body.location,
        budgetNote: body.budgetNote,
      });
      return reply.status(201).send({ post });
    } catch (error) {
      return reply.status(toHttpStatus(error)).send({
        error: { code: 'CREATE_POST_FAILED', message: (error as Error).message },
      });
    }
  });

  app.get('/community/posts/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const post = await communityService.getPost(id, request.userId!);
      return { post };
    } catch (error) {
      return reply.status(toHttpStatus(error)).send({
        error: { code: 'GET_POST_FAILED', message: (error as Error).message },
      });
    }
  });

  app.delete('/community/posts/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await communityService.deletePost(id, request.userId!);
      return reply.status(204).send();
    } catch (error) {
      return reply.status(toHttpStatus(error)).send({
        error: { code: 'DELETE_POST_FAILED', message: (error as Error).message },
      });
    }
  });

  app.post('/community/posts/:id/responses', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { message?: string | null };

    try {
      const response = await communityService.addResponse({
        postId: id,
        userId: request.userId!,
        message: body.message,
      });
      return reply.status(201).send({ response });
    } catch (error) {
      return reply.status(toHttpStatus(error)).send({
        error: { code: 'RESPOND_FAILED', message: (error as Error).message },
      });
    }
  });

  app.delete('/community/posts/:id/responses/me', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await communityService.removeMyResponse(id, request.userId!);
      return reply.status(204).send();
    } catch (error) {
      return reply.status(toHttpStatus(error)).send({
        error: { code: 'CANCEL_RESPONSE_FAILED', message: (error as Error).message },
      });
    }
  });
}

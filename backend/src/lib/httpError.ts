import { Prisma } from '@prisma/client';

/** Map service errors to HTTP-friendly messages (hide Prisma internals). */
export function toHttpError(error: unknown): Error & { statusCode?: number } {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return Object.assign(
      new Error('数据库未连接，请先启动 PostgreSQL（在项目根目录运行 docker compose up -d）'),
      { statusCode: 503 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return Object.assign(new Error('该邮箱已被注册'), { statusCode: 409 });
    }
  }

  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    return error as Error & { statusCode?: number };
  }

  return Object.assign(new Error('服务器内部错误'), { statusCode: 500 });
}

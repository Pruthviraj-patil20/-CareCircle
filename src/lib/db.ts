import { PrismaClient } from '@prisma/client'

function getDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  try {
    const urlObj = new URL(rawUrl);
    const isPooler = rawUrl.includes('-pooler') || rawUrl.includes('pgbouncer=true');

    // Set 30s pool timeout to gracefully accommodate Neon serverless cold starts / compute wake-up
    if (!urlObj.searchParams.has('pool_timeout')) {
      urlObj.searchParams.set('pool_timeout', '30');
    }

    // Set 30s connect timeout for TLS handshake and network latency
    if (!urlObj.searchParams.has('connect_timeout')) {
      urlObj.searchParams.set('connect_timeout', '30');
    }

    // Explicitly configure pgbouncer transaction mode for pooler hosts
    if (isPooler && !urlObj.searchParams.has('pgbouncer')) {
      urlObj.searchParams.set('pgbouncer', 'true');
    }

    // Bound local connection pool to 10 to avoid saturating PgBouncer under high concurrency
    if (!urlObj.searchParams.has('connection_limit')) {
      urlObj.searchParams.set('connection_limit', '10');
    }

    return urlObj.toString();
  } catch {
    return rawUrl;
  }
}

const prismaClientSingleton = () => {
  const url = getDatabaseUrl();
  const baseClient = new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args);
          } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            // Handle P2024: Timed out fetching a new connection from the connection pool
            if (
              err?.code === 'P2024' ||
              (typeof err?.message === 'string' && err.message.includes('connection pool'))
            ) {
              // Wait 1.2s to allow Neon serverless compute to finish waking up, then retry once
              await new Promise((resolve) => setTimeout(resolve, 1200));
              return await query(args);
            }
            throw error;
          }
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

declare global {
  var prismaGlobal: undefined | PrismaClientSingleton;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;


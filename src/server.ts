import 'dotenv/config';
import app from './app';
import { prisma } from './shared/prisma';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main() {
  try {
    await prisma.$connect();
    console.log('[DB] PostgreSQL connected');
  } catch (err) {
    console.warn('[DB] Failed to connect - running in demo mode:', err);
    // Demo mode: continue without DB for testing UI
  }

  app.listen(PORT, () => {
    console.log(`[Server] Listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

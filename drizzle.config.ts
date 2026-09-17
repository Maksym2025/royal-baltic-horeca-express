import { defineConfig } from 'drizzle-kit';
export default defineConfig({out:'./neon-migrations',schema:'./db/schema.ts',dialect:'postgresql',dbCredentials:{url:process.env.DATABASE_URL_UNPOOLED||''}});

import { betterAuth,APIError } from 'better-auth';
import {Pool} from 'pg';
const guardPool=new Pool({connectionString:process.env.CHANNEL_DATABASE_URL,max:2});
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { database } from '@/lib/server/db';
import * as schema from '@/db/schema';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(database(), {
    provider: 'pg',
    schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  advanced:{cookiePrefix:"rb-customer",useSecureCookies:process.env.VERCEL_ENV==="production"},
  databaseHooks:{user:{create:{before:async(data)=>{if(process.env.UNIFIED_COMMERCE==="1"){const r=await guardPool.query("select platform_staff_email_reserved($1) reserved",[data.email]);if(r.rows[0].reserved)throw new APIError("FORBIDDEN",{message:"Staff accounts require an administrator invitation."});}return{data};}}}},
  rateLimit:{enabled:true,window:60,max:30},
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
});


import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';
export function database(){if(!process.env.DATABASE_URL)throw new ApiError(503,'Neon ist noch nicht verbunden. Die Vorschau verwendet ausschließlich Demodaten.');return drizzle(neon(process.env.DATABASE_URL),{schema});}
export class ApiError extends Error{constructor(public status:number,message:string){super(message)}}
export function apiError(e:unknown){if(e instanceof ApiError)return Response.json({error:e.message},{status:e.status,headers:{'Cache-Control':'no-store'}});console.error('API operation failed');return Response.json({error:'Die Anfrage konnte nicht verarbeitet werden.'},{status:500,headers:{'Cache-Control':'no-store'}})}

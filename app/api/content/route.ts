import {publicContent} from '@/lib/server/content';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await publicContent(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'CONTENT_UNAVAILABLE'},{status:503});}}

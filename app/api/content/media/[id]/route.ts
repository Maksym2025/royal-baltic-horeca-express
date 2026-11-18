import {contentImage} from '@/lib/server/content';
export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{const r=await contentImage((await params).id);if(!r)return new Response(null,{status:404});return new Response(new Uint8Array(r.data),{headers:{'Content-Type':r.content_type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch{return new Response(null,{status:404});}}

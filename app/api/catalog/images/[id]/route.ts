import {unifiedEnabled,unifiedPublicImage} from '@/lib/server/unified';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!unifiedEnabled()||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return new Response(null,{status:404});
 try{const image=await unifiedPublicImage(id);if(!image)return new Response(null,{status:404});return new Response(new Uint8Array(image.data),{headers:{'Content-Type':image.content_type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch{return new Response(null,{status:503});}
}

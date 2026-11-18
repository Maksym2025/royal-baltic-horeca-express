import {Pool} from 'pg';
const pool=new Pool({connectionString:process.env.CHANNEL_DATABASE_URL,max:2,connectionTimeoutMillis:5000});
export type ContentItem={id:string;kind:'block'|'recipe';slug:string;translations:Record<string,{title:string;body:string;summary?:string;ingredients?:string;cta?:string}>;settings:{productIds?:string[];href?:string;minutes?:number;servings?:number;comments?:boolean;author?:string;order?:number};image_id:string|null;updated_at:string};
export async function publicContent():Promise<ContentItem[]>{return(await pool.query('select horeca_content_public() result')).rows[0].result;}
export async function publicComments(slug:string){return(await pool.query('select horeca_comments_public($1) result',[slug])).rows[0].result;}
export async function submitComment(subject:string,slug:string,body:string){return(await pool.query('select horeca_comment_submit($1,$2,$3) id',[subject,slug,body])).rows[0];}
export async function contentImage(id:string){return(await pool.query('select * from horeca_content_public_image($1)',[id])).rows[0];}

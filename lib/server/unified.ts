import {Pool} from 'pg';
import {ApiError} from './db';
const pool=new Pool({connectionString:process.env.CHANNEL_DATABASE_URL,max:3,connectionTimeoutMillis:5000});
export const unifiedEnabled=()=>process.env.UNIFIED_COMMERCE==='1';
export async function unifiedCall<T>(subject:string,action:string,input:unknown={},key?:string):Promise<T>{try{const r=await pool.query('select platform_channel($1,$2,$3,$4) result',[subject,action,input,key??null]);return r.rows[0].result;}catch(e){const m=e instanceof Error?e.message:'';throw new ApiError(/APPROVAL|REGISTRATION/.test(m)?403:/INSUFFICIENT|TAX_|IDEMPOTENCY/.test(m)?409:400,/^[A-Z_]+$/.test(m)?m:'COMMERCE_OPERATION_FAILED');}}
export async function unifiedCompany(subject:string){return(await pool.query('select platform_company($1) result',[subject])).rows[0].result;}
export async function unifiedRegister(subject:string,input:unknown){try{return(await pool.query('select platform_register($1,$2) result',[subject,input])).rows[0].result;}catch(e){const m=e instanceof Error?e.message:'';throw new ApiError(/REVIEW|ALREADY/.test(m)?409:400,/^[A-Z_]+$/.test(m)?m:'COMPANY_REGISTRATION_FAILED');}}

export async function unifiedSlots(subject:string):Promise<any[]>{return(await pool.query("select platform_delivery_slots($1) result",[subject])).rows[0].result;}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {intentSchema,mergeAnnouncements} from '../lib/product-intent.ts';
test('desired quantities include cancellation and reject fractional, excessive and foreign-company input',()=>{
 const productId='a801b313-f911-4444-8000-000000000001';
 for(const quantity of [0,1,1000])assert.equal(intentSchema.safeParse({action:'reserve',productId,quantity}).success,true);
 for(const quantity of [-1,1.5,1001,'2',null])assert.equal(intentSchema.safeParse({action:'reserve',productId,quantity}).success,false);
 for(const extra of [{companyId:'foreign'},{priceNetto:1},{status:'converted'}])assert.equal(intentSchema.safeParse({action:'reserve',productId,quantity:2,...extra}).success,false);
 assert.equal(intentSchema.safeParse({action:'interest',productId,interested:true,count:20}).success,false);
});
test('announcement overrides are deduplicated and unrelated available products retain price and stock',()=>{
 const current={id:'stock',stock:7,priceNetto:1980},existing={id:'planned',stock:0,priceNetto:0},upcoming={id:'new',launchMode:'preorder',stock:0,priceNetto:2490},planned={id:'planned',launchMode:'planned',stock:0,priceNetto:1890};
 const result=mergeAnnouncements([current,existing],[upcoming,planned]);assert.equal(result.length,3);assert.equal(result[0],current);assert.equal(result[1],planned);assert.equal(result[2],upcoming);assert.equal(current.stock,7);
});

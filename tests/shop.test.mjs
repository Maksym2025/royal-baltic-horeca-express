import assert from "node:assert/strict";
import { test } from "node:test";
import { productStorage, productDescription, withProductStorage } from "../lib/product-storage.ts";
import { parseCart, readShopCart } from "../lib/shop-cart.ts";

test("explicit product storage survives edits without leaking into product copy",()=>{
 const saved=withProductStorage("Skin-on fillet", "chilled");
 assert.equal(productStorage({description:saved}),"chilled");
 assert.equal(productDescription(saved),"Skin-on fillet");
 const updated=withProductStorage(saved,"frozen");
 assert.equal(productStorage({description:updated}),"frozen");
 assert.equal((updated.match(/cold-chain:/g)||[]).length,1);
 assert.equal(productStorage({description:withProductStorage("Frozen label to be reviewed","unspecified")}),"unspecified");
});
test("legacy storage descriptions are classified conservatively",()=>{
 assert.equal(productStorage({description:"Surgelé · −18 °C"}),"frozen");
 assert.equal(productStorage({title:"Охлаждённое филе"}),"chilled");
 assert.equal(productStorage({title:"Fillet"}),"unspecified");
 assert.equal(productStorage({description:"Fresh or frozen"}),"unspecified");
});
test("cart quantities are whole sales packs and malformed input is ignored",()=>{
 assert.deepEqual(parseCart('{"a":2,"b":1.5,"c":-2,"d":1001,"e":"3","f":0}'),{a:2});
 assert.deepEqual(parseCart('[1,2]'),{});assert.deepEqual(parseCart('broken'),{});
});
test("guest basket transfers to the signed-in account exactly once",()=>{
 const data=new Map([["rb-cart-guest",'{"salmon":2}'],["rb-cart-client",'{"salmon":1,"prawns":3}']]);
 globalThis.sessionStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 assert.deepEqual(readShopCart("client"),{salmon:3,prawns:3});
 assert.equal(data.has("rb-cart-guest"),false);
 assert.deepEqual(readShopCart("client"),{salmon:3,prawns:3});
 delete globalThis.sessionStorage;
});

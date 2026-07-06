export function buildPixelScript(opts: {
  pixelKey: string;
  categoryId: number;
  statsUrl: string;
}): string {
  return `(function(){
"use strict";
var PIXEL_KEY="${opts.pixelKey}";
var CATEGORY_ID=${opts.categoryId};
var REPORT_URL="${opts.statsUrl}";

var STATS_KEY="_axon_stats_"+PIXEL_KEY;
var FLUSH_TS_KEY="_axon_flush_at_"+PIXEL_KEY;
var FLUSH_INTERVAL=300000;

function getStats(){try{var r=localStorage.getItem(STATS_KEY);if(r)return JSON.parse(r)}catch(e){}return{pv:0,atc:0,bc:0,pc:0,gmv:0,cur:""}}
function saveStats(s){try{localStorage.setItem(STATS_KEY,JSON.stringify(s))}catch(e){}}
function clearStats(){try{localStorage.removeItem(STATS_KEY)}catch(e){}}
function bumpStat(f,a){var s=getStats();s[f]=(s[f]||0)+(a||1);saveStats(s)}
function getFlushAt(){try{var v=localStorage.getItem(FLUSH_TS_KEY);return v?parseInt(v,10):0}catch(e){return 0}}
function setFlushAt(t){try{localStorage.setItem(FLUSH_TS_KEY,String(t))}catch(e){}}

function flushStats(){if(!REPORT_URL)return;var s=getStats();if(!s.pv&&!s.atc&&!s.bc&&!s.pc)return;try{navigator.sendBeacon(REPORT_URL,JSON.stringify({h:location.hostname,key:PIXEL_KEY,pv:s.pv||0,atc:s.atc||0,bc:s.bc||0,pc:s.pc||0,gmv:s.gmv||0,cur:s.cur||""}))}catch(e){}clearStats();setFlushAt(Date.now()+FLUSH_INTERVAL)}
function tryFlush(){var f=getFlushAt();if(f===0){setFlushAt(Date.now()+FLUSH_INTERVAL);return}if(Date.now()>=f)flushStats()}
tryFlush();
setInterval(function(){if(Date.now()>=getFlushAt())flushStats()},60000);
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden"&&Date.now()>=getFlushAt())flushStats()});
window.addEventListener("pagehide",function(){if(Date.now()>=getFlushAt())flushStats()});

var recentEvents={};
function isDuplicate(n,k){var now=Date.now(),id=n+"_"+k;if(recentEvents[id]&&(now-recentEvents[id])<3000)return true;recentEvents[id]=now;return false}

!function(e,r){var t=["https://s.axon.ai/pixel.js","https://c.albss.com/p/l/loader.iife.js"];if(!e.axon){var a=e.axon=function(){a.performOperation?a.performOperation.apply(a,arguments):a.operationQueue.push(arguments)};a.operationQueue=[];a.ts=Date.now();a.eventKey=PIXEL_KEY;for(var n=r.getElementsByTagName("script")[0],o=0;o<t.length;o++){var i=r.createElement("script");i.async=!0;i.src=t[o];n.parentNode.insertBefore(i,n)}}}(window,document);
axon("init");

try{var cookies=document.cookie.split(";");for(var i=0;i<cookies.length;i++){var c=cookies[i].trim();if(c.indexOf("_axwrt=")===0){var val=c.substring(7);var domain="."+window.location.hostname.replace(/^www\\./,"");document.cookie="axwrt="+val+";domain="+domain+";path=/;max-age=31536000;SameSite=Lax";break}}}catch(e){}

axon("track","page_view");
bumpStat("pv");

function getCurrency(){if(window.Shopline&&window.Shopline.currency)return window.Shopline.currency;var el=document.querySelector('meta[property="product:price:currency"]');return(el&&el.content)||"USD"}
function normalizePrice(v){if(v===null||v===undefined)return 0;if(typeof v!=="number")v=parseFloat(v)||0;return Math.round(v*100)/100}
function getImageUrl(){var el=document.querySelector('meta[property="og:image"]');if(el&&el.content)return el.content;try{var jlds=document.querySelectorAll('script[type="application/ld+json"]');for(var i=0;i<jlds.length;i++){var d=JSON.parse(jlds[i].textContent);if(d["@type"]==="Product"&&d.image)return Array.isArray(d.image)?d.image[0]:d.image}}catch(e){}return""}

function getProductFromPage(){var product=null;try{var sku="";try{sku=new URL(window.location.href).searchParams.get("sku")||""}catch(e2){}var jlds=document.querySelectorAll('script[type="application/ld+json"]');for(var i=0;i<jlds.length;i++){var d=JSON.parse(jlds[i].textContent);if(d["@type"]==="Product"){product={name:d.name||"",image:Array.isArray(d.image)?d.image[0]:(d.image||""),price:0,sku:d.sku||"",currency:""};if(d.offers){var offers=Array.isArray(d.offers)?d.offers:[d.offers];var sel=offers[0];if(sku){for(var j=0;j<offers.length;j++){if(offers[j].url&&offers[j].url.indexOf(sku)!==-1){sel=offers[j];break}}}product.price=parseFloat(sel.price)||0;product.currency=sel.priceCurrency||"";product.sku=sel.sku||product.sku}break}}}catch(e){}return product}

function mapItem(item){return{item_id:String(item.spu_id||item.sku_id||item.SKU||""),item_name:item.product_name||item.title||item.name||"",item_variant_id:String(item.sku_id||item.SKU||""),price:normalizePrice(item.price||item.final_price||item.original_price),quantity:item.quantity||1,item_category_id:CATEGORY_ID,image_url:item.image_url||item.image||item.img||getImageUrl()}}

var addToCartFired=false;
function handleCartInterception(url,body){if(addToCartFired)return;if(!url)return;var isCart=url.indexOf("/cart/add")!==-1||url.indexOf("/cart/items")!==-1||url.indexOf("/carts/ajax-cart/add")!==-1||url.indexOf("/carts/cart/batch/add")!==-1||url.indexOf("/leproxy/api/carts/cart")!==-1||url.indexOf("addSingle.js")!==-1;if(!isCart)return;var items=[];var currency=getCurrency();if(body){try{var parsed=typeof body==="string"?JSON.parse(body):body;if(parsed.items&&Array.isArray(parsed.items)){items=parsed.items.map(function(item){return{item_id:String(item.spu_id||item.sku_id||item.product_id||""),item_name:item.product_name||item.title||"",item_variant_id:String(item.sku_id||item.variant_id||""),price:normalizePrice(item.price),quantity:item.quantity||1,item_category_id:CATEGORY_ID,image_url:getImageUrl()}})}else if(parsed.sku_id||parsed.spu_id||parsed.product_id){items=[{item_id:String(parsed.spu_id||parsed.sku_id||parsed.product_id||""),item_name:parsed.product_name||parsed.title||"",item_variant_id:String(parsed.sku_id||parsed.variant_id||""),price:normalizePrice(parsed.price),quantity:parsed.quantity||1,item_category_id:CATEGORY_ID,image_url:getImageUrl()}]}}catch(e){}}if(items.length===0||!items[0].item_name){var pp=getProductFromPage();if(pp){if(items.length===0){var sku="";try{sku=new URL(window.location.href).searchParams.get("sku")||""}catch(e){}items=[{item_id:sku||pp.sku||"",item_name:pp.name,item_variant_id:sku||pp.sku||"",price:normalizePrice(pp.price),quantity:1,item_category_id:CATEGORY_ID,image_url:pp.image}]}else{items[0].item_name=items[0].item_name||pp.name;items[0].image_url=items[0].image_url||pp.image;if(!items[0].price)items[0].price=normalizePrice(pp.price)}if(pp.currency)currency=pp.currency}}if(items.length===0)return;var dk=items[0].item_id+"_"+items[0].quantity;if(isDuplicate("add_to_cart",dk))return;addToCartFired=true;setTimeout(function(){addToCartFired=false},3000);axon("track","add_to_cart",{currency:currency,items:items});bumpStat("atc")}

var origFetch=window.fetch;window.fetch=function(){var url=arguments[0];var opts=arguments[1]||{};if(typeof url==="string"&&opts.method&&opts.method.toUpperCase()==="POST"){try{handleCartInterception(url,opts.body)}catch(e){}}else if(url&&typeof url==="object"&&url.url){try{handleCartInterception(url.url,opts.body)}catch(e){}}return origFetch.apply(this,arguments)};
var origXHROpen=XMLHttpRequest.prototype.open;var origXHRSend=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(m,u){this._axonMethod=m;this._axonUrl=u;return origXHROpen.apply(this,arguments)};XMLHttpRequest.prototype.send=function(b){if(this._axonMethod&&this._axonMethod.toUpperCase()==="POST"&&this._axonUrl){try{handleCartInterception(this._axonUrl,b)}catch(e){}}return origXHRSend.apply(this,arguments)};

try{var po=new PerformanceObserver(function(list){if(addToCartFired)return;var entries=list.getEntries();for(var i=0;i<entries.length;i++){var name=entries[i].name;if(entries[i].initiatorType==="fetch"||entries[i].initiatorType==="xmlhttprequest"){var isC=name.indexOf("/cart/add")!==-1||name.indexOf("/carts/ajax-cart")!==-1||name.indexOf("addSingle.js")!==-1;if(isC){handleCartInterception(name,null);break}}}});po.observe({type:"resource",buffered:false})}catch(e){}

document.addEventListener("click",function(e){if(!e.isTrusted)return;if(addToCartFired)return;var form=e.target.closest('form[action*="/cart"]');if(!form)return;if(form.action.indexOf("/cart/count")!==-1)return;var ps="",sk="",qty=1;var inputs=form.querySelectorAll("input[type=hidden]");for(var i=0;i<inputs.length;i++){if(inputs[i].name==="productSeq")ps=inputs[i].value;if(inputs[i].name==="id")sk=inputs[i].value;if(inputs[i].name==="quantity")qty=parseInt(inputs[i].value)||1}if(!ps&&!sk)return;var dk=(ps||sk)+"_"+qty;if(isDuplicate("add_to_cart",dk))return;addToCartFired=true;setTimeout(function(){addToCartFired=false},3000);var pp=getProductFromPage();var items=[{item_id:ps||sk,item_name:pp?pp.name:"",item_variant_id:sk||"",price:normalizePrice(pp?pp.price:0),quantity:qty,item_category_id:CATEGORY_ID,image_url:pp?pp.image:getImageUrl()}];axon("track","add_to_cart",{currency:(pp&&pp.currency)||getCurrency(),items:items});bumpStat("atc")},true);

var maxWait=15000,waited=0;
(function waitForAnalytics(){if(window.Shopline&&window.Shopline.Analytics&&window.Shopline.Analytics.subscribeV2){initTracking()}else if(waited<maxWait){waited+=100;setTimeout(waitForAnalytics,100)}})();

function initTracking(){var currency=getCurrency();
Shopline.Analytics.subscribeV2("ViewItem",function(data){var d=data.custom_data;if(!d||!d.items||!d.items.length)return;axon("track","view_item",{currency:d.currency||currency,items:[mapItem(d.items[0])]})});
Shopline.Analytics.subscribeV2("AddToCart",function(data){var d=data.custom_data;if(!d||!d.items||!d.items.length)return;var dk=String(d.items[0].spu_id||d.items[0].sku_id)+"_"+(d.items[0].quantity||1);if(isDuplicate("add_to_cart",dk))return;addToCartFired=true;setTimeout(function(){addToCartFired=false},3000);axon("track","add_to_cart",{currency:d.currency||currency,items:d.items.map(mapItem)});bumpStat("atc")});
Shopline.Analytics.subscribeV2("InitiateCheckout",function(data){var d=data.custom_data;if(!d||!d.items||!d.items.length)return;var tv=0;var items=d.items.map(function(item){var m=mapItem(item);tv+=m.price*m.quantity;return m});axon("track","begin_checkout",{currency:d.currency||currency,items:items,value:normalizePrice(d.value)||tv});bumpStat("bc")});

var purchaseFired=false;
async function sha256(str){if(!str)return"";try{var buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(str.trim().toLowerCase()));return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,"0")}).join("")}catch(e){return""}}
function firePurchase(pd){if(purchaseFired)return;var items=pd.items;var tid=pd.transaction_id;if(!items||!items.length)return;var dk="_axon_sent_"+tid;try{if(localStorage.getItem(dk))return}catch(e){}purchaseFired=true;var ud=pd.user_data||null;var trackData={currency:pd.currency||currency,items:items,value:pd.value,transaction_id:tid,shipping:pd.shipping||0,tax:pd.tax||0};if(ud)trackData.user_data=ud;axon("track","purchase",trackData);bumpStat("pc");var s=getStats();s.gmv=Math.round(((s.gmv||0)+(pd.value||0))*100)/100;s.cur=pd.currency||currency;saveStats(s);try{localStorage.setItem(dk,"1")}catch(e){}}

Shopline.Analytics.subscribeV2("Purchase",function(data){var d=data.custom_data;if(!d||!d.items||!d.items.length)return;var tv=0;var items=d.items.map(function(item){var m=mapItem(item);tv+=m.price*m.quantity;return m});var email=d.email||d.customer_email||(d.customer&&d.customer.email)||"";var phone=d.phone||d.customer_phone||(d.customer&&d.customer.phone)||"";if(email||phone){(async function(){var ud={};if(email)ud.email=await sha256(email);if(phone)ud.phone=await sha256(phone);firePurchase({items:items,value:normalizePrice(d.value)||tv,transaction_id:String(d.order_id||d.order_number||"order_"+Date.now()),currency:d.currency||currency,shipping:normalizePrice(d.shipping||0),tax:normalizePrice(d.tax||0),user_data:ud})})()}else{firePurchase({items:items,value:normalizePrice(d.value)||tv,transaction_id:String(d.order_id||d.order_number||"order_"+Date.now()),currency:d.currency||currency,shipping:normalizePrice(d.shipping||0),tax:normalizePrice(d.tax||0)})}});

setTimeout(function(){if(purchaseFired)return;try{var pc=window.Shopline&&window.Shopline.event&&window.Shopline.event._caches&&window.Shopline.event._caches['DataReport::Purchase'];if(pc&&pc[0]&&pc[0][0]&&pc[0][0].data){var pd=pc[0][0].data;var items=[];if(pd.contents&&pd.contents.length){items=pd.contents.map(function(c){return{item_id:String(c.content_spu_id||c.content_id||""),item_name:c.content_name||"",item_variant_id:String(c.content_sku_id||""),price:normalizePrice(c.price),quantity:c.quantity||1,item_category_id:CATEGORY_ID,image_url:c.image_url||c.image||""}})}var value=normalizePrice(pd.totalPrice||pd.value||0);var email=pd.email||pd.customer_email||(pd.customer&&pd.customer.email)||"";if(email){(async function(){var ud={email:await sha256(email)};firePurchase({items:items,value:value,transaction_id:String(pd.order_id||pd.order_number||"order_"+Date.now()),currency:pd.currency||currency,shipping:0,tax:0,user_data:ud})})()}else{firePurchase({items:items,value:value,transaction_id:String(pd.order_id||pd.order_number||"order_"+Date.now()),currency:pd.currency||currency,shipping:0,tax:0})}}}catch(e){}},1500)}
})();`;
}

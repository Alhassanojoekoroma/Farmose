/** Motion and page templates ported from the supplied Farmose HTML. */
export function startFarmose(options = {}) {
  const globalListeners = [];
  const documentListeners = [];
  const addEventListener = (type, listener, opts) => {
    window.addEventListener(type, listener, opts);
    globalListeners.push([type, listener, opts]);
  };
  const removeEventListener = (type, listener, opts) => window.removeEventListener(type, listener, opts);
  const onDocument = (type, listener, opts) => {
    document.addEventListener(type, listener, opts);
    documentListeners.push([type, listener, opts]);
  };
  const offDocument = (type, listener, opts) => document.removeEventListener(type, listener, opts);

/* ============ EDIT HERE: business settings, prices and stock ============ */
const CONFIG={
  whatsapp:'23279529291',   // WhatsApp number, country code first, no + or spaces
  currency:'NLe',           // shown before prices
  analytics:false           // set to true only if you add analytics; this turns the cookie banner on
};
const whatsappDigits=String(options.theme?.whatsappNumber||'').replace(/\D/g,'');
if(whatsappDigits.length>=8&&whatsappDigits.length<=15)CONFIG.whatsapp=whatsappDigits;
/* stock: 'in' | 'low' | 'out'.  prices: number, or null to show "Ask for price". Keys are the sizes. */
const PRICING={
  'honey':{stock:'in',prices:{'400 g':null}},
  'groundnut-paste':{stock:'in',prices:{'950 g':null,'2 kg':null}},
  'cayenne-pepper':{stock:'in',prices:{'350 g':null}},
  'keinda':{stock:'in',prices:{'370 g':null}},
  'palm-oil':{stock:'in',prices:{'5 L':null}},
  'benny':{stock:'in',prices:{'450 g':null}},
  'tola':{stock:'in',prices:{'350 g':null}}
};
PRICING['groundnut-paste-2kg']={stock:'in',prices:PRICING['groundnut-paste'].prices};
/* ======================================================================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let lang='en'; try{lang=localStorage.getItem('farmose:lang')||'en'}catch(e){}
if(lang!=='kr')lang='en';

/* ---------------- data ---------------- */
const P=[
 {slug:'honey',img:'honey',hf:1,c:'#f0b400',cat:'honey',sizes:['400 g'],
  name:{en:'Raw Honey'},kind:{en:'Honey'},
  d:{en:'Pure raw honey from Sierra Leone, poured straight into a squeeze bottle with a tamper-proof cap. Rich, dark and floral, it is left as nature made it.'},
  tip:{en:'Stir into tea, spoon over warm bread or porridge, or use it to glaze roasted vegetables and meat.'},
  store:{en:'Keep at room temperature, tightly closed. Crystallising is natural; warm the bottle gently to soften it.'},
  fact:{en:'Raw honey. Product of Sierra Leone.'},pack:{en:'Squeeze bottle'}},
 {slug:'groundnut-paste',img:'groundnut-950',hf:1,c:'#d98a2b',cat:'paste',sizes:['950 g','2 kg'],
  name:{en:'Groundnut Paste'},kind:{en:'Pastes'},
  d:{en:'One ingredient: ground groundnuts. A smooth, deeply roasted paste that is the base of Sierra Leonean sauces and just as good on a slice of bread.'},
  tip:{en:'Use in spreads, dips and smoothies, or as a base for sauces and stews.'},
  store:{en:'Store in a cool, dry place to maintain freshness. Stir if the oil rises.'},
  fact:{en:'One ingredient. Ground groundnuts.'},pack:{en:'Jar'}},
 {slug:'cayenne-pepper',img:'pepper',hf:.95,c:'#d63a2f',cat:'spice',sizes:['350 g'],
  name:{en:'Cayenne Pepper'},kind:{en:'Spices'},
  d:{en:'Sun-red cayenne, ground and packed in a clear jar so you can see the colour. Bright heat that lifts soups, grills and rice.'},
  tip:{en:'Start with a pinch in stews, marinades and sauces, then build the heat to taste.'},
  store:{en:'Keep in a cool, dry place with the lid tightly closed.'},
  fact:{en:'Ground cayenne pepper.'},pack:{en:'Jar'}},
 {slug:'keinda',img:'keinda',hf:1,c:'#7f9aa3',cat:'spice',sizes:['370 g'],
  name:{en:'Keinda'},kind:{en:'Fermented seasoning'},
  d:{en:'Fermented locust beans, ground into a deep, savoury seasoning. A small spoonful gives soups and stews their unmistakable depth.'},
  tip:{en:'Stir into soups, stews and rice dishes towards the end of cooking.'},
  store:{en:'Keep in a cool, dry place with the lid tightly closed.'},
  fact:{en:'Fermented locust beans.'},pack:{en:'Jar'}},
 {slug:'palm-oil',img:'palm-oil',hf:.78,c:'#c8251c',cat:'oil',sizes:['5 L'],
  name:{en:'Palm Oil'},kind:{en:'Oils'},
  d:{en:'100% pure and natural palm oil in a 5 litre carry pouch. No additives, no preservatives, rich in vitamin E and a source of vitamin A, with zero trans fat.'},
  tip:{en:'The classic base for palm oil stews, jollof and soups, or to fry plantain.'},
  store:{en:'Keep away from heat and direct sun. Reseal the cap after each use.'},
  fact:{en:'No additives. No preservatives. Zero trans fat.'},pack:{en:'5 L pouch'}},
 {slug:'benny',img:'benny',hf:1,c:'#2f9d4f',cat:'spice',sizes:['450 g'],
  name:{en:'Benny'},kind:{en:'Seeds'},
  d:{en:'Ground sesame seeds, known in Sierra Leone as benny. Nutty and fragrant, they thicken and enrich sauces and sweets.'},
  tip:{en:'Sprinkle on rice and vegetables, or stir into sauces and traditional sweets.'},
  store:{en:'Keep in a cool, dry place with the lid tightly closed.'},
  fact:{en:'Ground sesame seeds.'},pack:{en:'Jar'}},
 {slug:'tola',img:'tola',hf:.9,c:'#7a3f26',cat:'spice',sizes:['350 g'],
  name:{en:'Tola'},kind:{en:'Ground spice'},
  d:{en:'Ground tola, a traditional Sierra Leonean ingredient milled fine and sealed under a blue cap. Earthy, warm and made for the home kitchen.'},
  tip:{en:'Add to soups and stews and cook gently so the flavour opens up.'},
  store:{en:'Keep in a cool, dry place with the lid tightly closed.'},
  fact:{en:'Ground tola.'},pack:{en:'Jar'}},
 {slug:'groundnut-paste-2kg',img:'groundnut-2kg',hf:1.04,c:'#b9792f',cat:'paste',sizes:['950 g','2 kg'],
  name:{en:'Groundnut Paste'},kind:{en:'Pastes'},
  d:{en:'The family and kitchen size: two kilos of smooth groundnut paste. Ground groundnuts only, ready for spreads, dips, smoothies and sauces.'},
  tip:{en:'In spreads, dips, smoothies or as a base for sauces.'},
  store:{en:'Store in a cool, dry place to maintain freshness.'},
  fact:{en:'Two kilos. One ingredient.'},pack:{en:'2 kg tub'}}
];

const KR={
 'honey':{name:'Raw Hani',kind:'Hani',d:'Pyua raw hani fro Salone, na skwiz botul we get sef kap. I tik, i dak, i get fula smel. Wi lef am aw nechure mek am.',tip:'Mix am na ti, put am pan wam bred o porij, o yuz am fo glaz rost veg en mit.',store:'Kip am na rum temprecha, kip di kap tayt. If i kristalayz, na nechural; wam di botul saful fo saf am.',fact:'Raw hani. Prodak fo Salone.',pack:'Skwiz botul'},
 'groundnut-paste':{name:'Grondnot Pes',kind:'Pes dem',d:'Wan tin nomo: grayn grondnot. Smut, rost pes we na di base fo Salone sos dem, en i swit pan bred tu.',tip:'Yuz am fo spred, dip, smuti, o as base fo sos en stu.',store:'Kip am na kol, dray ples fo mek i kip fresh. Mix am if di oil rayz.',fact:'Wan tin nomo. Grayn grondnot.',pack:'Jar'},
 'cayenne-pepper':{name:'Keyen Pepe',kind:'Spays',d:'Red keyen pepe, grayn en pak na klia jar so yu go si di kula. Na pepe we de wam soup, gril en res.',tip:'Bigin wit smol smol na stu, marinad en sos, den ad mor tel i fit yu tes.',store:'Kip am na kol, dray ples, wit di lid tayt.',fact:'Grayn keyen pepe.',pack:'Jar'},
 'keinda':{name:'Keinda',kind:'Fermet sizonin',d:'Fermet lokos bin dem, grayn fo mek sizonin we de mek soup en stu tes gud. Wan smol spun nomo go du.',tip:'Mix am na soup, stu en res nia di en fo kuk.',store:'Kip am na kol, dray ples, wit di lid tayt.',fact:'Fermet lokos bin dem.',pack:'Jar'},
 'palm-oil':{name:'Pam Oil',kind:'Oil dem',d:'100% pyua en nechural pam oil na 5 lita bag we get handul. No adativ, no prizevativ, get plenti vitamin E en vitamin A, zero trans fat.',tip:'Di klasik base fo pam oil stu, jollof en soup, o fo fray plantin.',store:'Kip am pan hiat en son. Shot di kap afta ol yuz.',fact:'No adativ. No prizevativ. Zero trans fat.',pack:'5 L bag'},
 'benny':{name:'Beni',kind:'Sid',d:'Grayn sesame sid, we wi kol beni na Salone. I get nat tes en gud smel, i de tik en mek sos en swit tin gud.',tip:'Sprinkul am pan res en veg, o mix am na sos en tradishonal swit.',store:'Kip am na kol, dray ples, wit di lid tayt.',fact:'Grayn sesame sid.',pack:'Jar'},
 'tola':{name:'Tola',kind:'Grayn spays',d:'Grayn tola, tradishonal Salone tin fo kuk, mil fayn en seal wit blu kap. I get ert tes, i wam, en i mek fo os kitchin.',tip:'Ad am na soup en stu en kuk am slo so di tes go opin.',store:'Kip am na kol, dray ples, wit di lid tayt.',fact:'Grayn tola.',pack:'Jar'},
 'groundnut-paste-2kg':{name:'Grondnot Pes',kind:'Pes dem',d:'Di big saiz: tu kilo smut grondnot pes. Na grayn grondnot nomo, ready fo spred, dip, smuti en sos.',tip:'Na spred, dip, smuti o as base fo sos.',store:'Kip am na kol, dray ples fo mek i kip fresh.',fact:'Tu kilo. Wan tin nomo.',pack:'2 kg tub'}
};
P.forEach(p=>{const k=KR[p.slug];if(k)for(const f in k)p[f].kr=k[f]});
// Catalog fields remain server-managed. Escape them before the original
// template strings insert them into the DOM.
const safeText=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeAsset=value=>{
 const url=String(value??'').trim();
 return (/^\/(?!\/)/.test(url)||/^https:\/\//i.test(url))?safeText(url):'';
};
const safeColor=value=>/^#[0-9a-f]{6}$/i.test(String(value))?String(value):'#14402b';
const hiddenDesignSlugs=new Set(Array.isArray(options.hiddenDesignSlugs)?options.hiddenDesignSlugs:[]);
for(const product of Array.isArray(options.products)?options.products:[]){
 if(!product||product.siteVisible!==true||typeof product.slug!=='string')continue;
 const slug=product.slug.startsWith('pantry-')?product.slug.slice(7):product.slug;
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))continue;
 const current=P.find(p=>p.slug===slug);
 const name=safeText(product.name),description=safeText(product.description);
 const features=Array.isArray(product.features)?product.features:[];
 const unit=safeText(product.unit||'');
 const source=safeAsset(product.image||product.imageUrl);
 const field=(record,key,value)=>{
  if(!record[key])record[key]={en:value};
  else if(record[key].en!==value){record[key].en=value;record[key].kr=value}
 };
 const p=current||{slug,img:source||'honey',hf:1,c:safeColor(product.color),cat:'other',sizes:[unit||'1 pack'],name:{en:name},kind:{en:''},d:{en:''},tip:{en:''},store:{en:''},fact:{en:''},pack:{en:''}};
 field(p,'name',name);field(p,'kind',safeText(product.tag));field(p,'d',description);
 field(p,'tip',safeText(features[0]));field(p,'store',safeText(features[1]));
 field(p,'fact',safeText(features[2]));field(p,'pack',safeText(product.details));
 if(source)p.img=source;
 p.c=safeColor(product.color);
 if(current){p.managedUnit=unit;if(!slug.startsWith('groundnut-paste'))p.sizes=[unit]}
 if(!current){
  p.cat=/spice|seed/i.test(product.tag)?'spice':/paste/i.test(product.tag)?'paste':/oil/i.test(product.tag)?'oil':/honey/i.test(product.tag)?'honey':'other';
  P.push(p);
 }
 const price=Number(product.price);
 const status=product.active===false?'out':Number(product.stockQuantity)>0&&Number(product.stockQuantity)<5?'low':'in';
 const pricing=PRICING[slug]||{stock:'in',prices:{}};
 pricing.stock=status;
 pricing.prices[unit]=Number.isFinite(price)&&price>0?price:null;
 PRICING[slug]=pricing;
}
const bySlug=s=>P.find(p=>p.slug===s);
const paste=P.find(p=>p.slug==='groundnut-paste'),paste2kg=P.find(p=>p.slug==='groundnut-paste-2kg');
paste.def=paste.managedUnit||'950 g';paste2kg.def=paste2kg.managedUnit||'2 kg';
paste.sizes=paste2kg.sizes=[paste.def,paste2kg.def];
const listed=P.filter(p=>!hiddenDesignSlugs.has(p.slug));
const listedBySlug=s=>listed.find(p=>p.slug===s);
const stockOf=slug=>(PRICING[slug]||{}).stock||'in';
const priceOf=(slug,size)=>{const pr=(PRICING[slug]||{}).prices||{};return typeof pr[size]==='number'?pr[size]:null};
const money=n=>CONFIG.currency+' '+n.toLocaleString('en-US');
const HERO=['groundnut-paste','cayenne-pepper','honey','keinda','palm-oil','benny','tola','groundnut-paste-2kg'].map(listedBySlug).filter(Boolean);
const tl=o=>o[lang]||o.en;

const I={en:{home:'Home',pantry:'Pantry',production:'Production',experience:'Experience',about:'About',contacts:'Contacts',shop:'Shop',menu:'Menu',close:'Close',
 discover:'Discover the product',drag:'Drag',dragOpen:'Drag or click',scroll:'Scroll to discover',privacy:'Privacy & Cookies',
 privTxt:'This is a demo build of the Farmose site. It sets no cookies and collects no data. Replace this text with your real privacy and cookie policy.',
 arc:'From our farm, to your table. ',arcSize:190,
 tips:'Serving ideas',avail:'Available sizes',store:'Storage',others:'Other products',madein:'Made in<br>Sierra Leone',
 all:'All',cSpice:'Spices & Seeds',cPaste:'Pastes',cOil:'Oils',cHoney:'Honey',pantryT:'Pantry',
 prodEy:'Production',prodT:'The bounty of our land',prodP:'Our days are made of groundnuts, sesame, peppers, palm fruit and honey. We grow, grind, press and pack in Sierra Leone with the same care, from the first harvest to the last jar. This is Farmose.',
 s1:'Spices & Seeds',s1p:'Cayenne pepper, tola, benny and keinda: the seasonings that give Sierra Leonean cooking its depth. Each one is dried, ground or fermented in small batches and packed in a clear jar so you can see exactly what is inside.',
 s2:'Oils, Honey & Pastes',s2p:'Pure palm oil, raw honey and smooth groundnut paste. Single-ingredient products with nothing added, packed in formats for the home kitchen and for the restaurant.',
 th:['Product','Format','Pack'],browse:'Use the left and right arrow keys, or drag, to browse.',
 expT:'Experience Farmose',expP:'Come closer to the people and places behind every jar. These are sample experiences: replace them with your real offers.',
 e1:'Visit the farm',e1p:'Walk the land where our crops grow and meet the people who harvest them.',e2:'Taste the pantry',e2p:'A guided tasting of honey, pastes, spices and oils, with serving ideas for each.',e3:'Cook with us',e3p:'A hands-on session making a traditional Sierra Leonean meal from our ingredients.',enq:'Get in touch',
 abT:'About Farmose',abP:'Farmose grows, mills and packs Sierra Leonean staples: groundnut paste, raw honey, palm oil and the spices that every kitchen needs. Everything we sell is made in Sierra Leone.',
 conT:'Do you have a question or would you like to find out more? Call us, we would be delighted to tell you about Farmose.',phone:'Phone',offices:'Address',follow:'Email',rights:'Farmose',emailL:'Email',
 orderWA:'Order on WhatsApp',addEnq:'Add to enquiry',added:'Added',enquiry:'Enquiry',inStock:'In stock',low:'Low stock',out:'Out of stock',askPrice:'Ask for price',askAvail:'Ask about availability',
 qty:'Quantity',total:'Total',sendWA:'Send on WhatsApp',clearAll:'Clear all',yourName:'Your name',area:'Delivery area',emptyBk:'Your enquiry is empty. Add products from the pantry and send them to us in one WhatsApp message.',browseP:'Browse the pantry',remove:'Remove',chat:'Chat on WhatsApp',
 greet:'Hello Farmose, I would like to order:',askMsg:'Hello Farmose, is this product available:',nameL:'Name',areaL:'Delivery area',totalL:'Total',
 ckTxt:'We use analytics cookies to understand how the site is used. You can accept or reject them.',ckA:'Accept',ckR:'Reject'},
kr:{home:'Hom',pantry:'Pantri',production:'Wetin wi mek',experience:'Experiens',about:'Pan wi',contacts:'Kontakt wi',shop:'Shop',menu:'Menyu',close:'Shot',
 discover:'Si di prodak',drag:'Drag',dragOpen:'Drag o klik',scroll:'Skrol fo si',privacy:'Prayvasi & Kuki',
 privTxt:'Dis na demo versin fo di Farmose sayt. I no kip kuki en i no kolekt data. Chenj dis tekst wit yu rial prayvasi polisi.',
 arc:'Fro wi fam kam na yu tebul. ',arcSize:150,
 tips:'Aw fo yuz am',avail:'Saiz dem we de',store:'Aw fo kip am',others:'Oda prodak dem',madein:'Mek na<br>Salone',
 all:'Ol',cSpice:'Spays en Sid',cPaste:'Pes',cOil:'Oil',cHoney:'Hani',pantryT:'Pantri',
 prodEy:'Wetin wi mek',prodT:'Di gud tin dem na wi land',prodP:'Wi de gro, grayn, pres en pak ol tin na Salone wit di sem kia, fro di fos arvest te to di las jar. Grondnot, beni, pepe, pam en hani na wi dayli wok. Dis na Farmose.',
 s1:'Spays en Sid',s1p:'Keyen pepe, tola, beni en keinda: di sizonin dem we de gi Salone kuk i dip tes. Wi de dray, grayn o fermet dem na smol batch en pak dem na klia jar so yu go si wetin de insay.',
 s2:'Oil, Hani en Pes',s2p:'Pyua pam oil, raw hani en smut grondnot pes. Prodak dem we get wan tin nomo, no ad notin, na format fo os kitchin en fo restoran.',
 th:['Prodak','Format','Pak'],browse:'Yuz di lef en rayt aro kis, o drag, fo si mor.',
 expT:'Experiens Farmose',expP:'Kam nia di pipul dem en di ples dem biyn ebri jar. Dis na sampul experiens dem; chenj dem wit yu rial ofa dem.',
 e1:'Visit di fam',e1p:'Waka na di land usay wi krop dem de gro en miet di pipul dem we de pik dem.',e2:'Tes di pantri',e2p:'Wan gayd tes fo hani, pes, spays en oil, wit tin dem fo kuk wit ol.',e3:'Kuk wit wi',e3p:'Wan hand-on sesin fo kuk tradishonal Salone mil wit wi ingridient dem.',enq:'Kontakt wi',
 abT:'Pan Farmose',abP:'Farmose de gro, mil en pak Salone fud dem: grondnot pes, raw hani, pam oil en di spays dem we ebri kitchin nid. Ebriting we wi sel, na Salone mek am.',
 conT:'Yu get kweshon o yu want fo no mor? Kol wi, wi go gladi fo tel yu bot Farmose.',phone:'Fon',offices:'Adres',follow:'Imel',rights:'Farmose',
 orderWA:'Order na WhatsApp',addEnq:'Ad na enkwayri',added:'I don ad',enquiry:'Enkwayri',inStock:'I de na stok',low:'Lilbit lef',out:'I nor de na stok',askPrice:'Aks fo prays',askAvail:'Aks if i de',
 qty:'Hamos',total:'Total',sendWA:'Sen na WhatsApp',clearAll:'Klia ol',yourName:'Yu nem',area:'Usay fo dilivri',emptyBk:'Yu enkwayri empti. Ad prodak dem fo di pantri en sen dem to wi na wan WhatsApp mesej.',browseP:'Si di pantri',remove:'Pul am',chat:'Tok to wi na WhatsApp',
 greet:'Hello Farmose, a want order dis:',askMsg:'Hello Farmose, dis prodak de:',nameL:'Nem',areaL:'Usay fo dilivri',totalL:'Total',
 ckTxt:'Wi de yuz analitiks kuki fo no aw pipul de yuz di sayt. Yu fit akcept o rijekt.',ckA:'Akcept',ckR:'Rijekt'}};
for(const [setting,key] of Object.entries({
 experienceArc:'arc',experienceProductionTitle:'prodT',experienceProductionBody:'prodP',
 experienceExperienceTitle:'expT',experienceExperienceBody:'expP',
 experienceAboutTitle:'abT',experienceAboutBody:'abP',
 experienceContactHeading:'conT',experiencePrivacyText:'privTxt'
})){
 const value=options.theme?.[setting];
 if(typeof value==='string'&&value&&value!==I.en[key])I.en[key]=I.kr[key]=key==='privTxt'?value:safeText(value);
}
const t=k=>(I[lang][k]!==undefined?I[lang][k]:I.en[k]);
const contactEmail=/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(String(options.theme?.experienceEmail||''))
 ? safeText(options.theme.experienceEmail) : 'info@greenagventuresl.com';
const storeAddress=()=>{
 const address=String(options.theme?.storeAddress||'');
 if(!address||address==='1 Foday Drive, Main Regent Road, Hill Station, Freetown')
  return '1 Foday Drive, Main Regent Road<br>Hill Station, Freetown<br>Sierra Leone';
 return safeText(address).replace(/\s*,\s*/g,', ');
};

/* ---------------- helpers ---------------- */
const img=n=>n.startsWith('/')||n.startsWith('https://')?n:`/farmose/img/${n}.webp`;

let shapeN=0;
const hexPath=(cx,cy,r)=>{let d='';for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6;d+=(i?'L':'M')+(cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1)}return d+'Z'};
const DETAIL='rgba(255,255,255,.32)';
function shapeInner(slug,id){
 if(slug.startsWith('groundnut')){
  const pod='M0 -40C12 -40 18 -32 16 -21C15 -14 10 -11 10 -6C10 0 15 3 16 11C18 24 10 40 0 40C-10 40 -18 24 -16 11C-15 3 -10 0 -10 -6C-10 -11 -15 -14 -16 -21C-18 -32 -12 -40 0 -40Z';
  const one=(x,y,r,sc)=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(${sc})"><path d="${pod}"/><path d="${pod}" fill="url(#pt${id})"/><path d="M0 -34C7 -33 12 -28 12 -21M0 34C-7 33 -12 28 -12 20" stroke="${DETAIL}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
  return `<defs><pattern id="pt${id}" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".9" fill="${DETAIL}" stroke="none"/></pattern></defs>`+one(50,52,-35,1.3)+one(14,18,25,.8)+one(88,84,30,.8)+one(90,16,-20,.6)+one(12,88,-30,.6)}
 if(slug==='cayenne-pepper'){
  const ch=(x,y,r,sc)=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(${sc})"><path d="M-6 -36C10 -42 28 -32 28 -12C28 14 12 38 -12 56C-20 62 -28 54 -22 46C-8 28 -4 10 -8 -6C-10 -14 -12 -30 -6 -36Z"/><path d="M12 -26C20 -18 20 -4 15 10" stroke="${DETAIL}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-7 -36C-6 -46 2 -54 14 -56C12 -50 10 -46 8 -42C14 -44 20 -42 22 -38C14 -38 6 -38 -7 -36Z" fill="#1f9d55" stroke="none"/></g>`;
  return ch(44,50,-18,1.15)+ch(80,30,40,.62)+ch(18,76,-62,.55)}
 if(slug==='honey'){
  const r=17,dx=r*Math.sqrt(3)*1.05;let o='';const pts=[[0,0]];for(let i=0;i<6;i++){const a=Math.PI/3*i;pts.push([dx*Math.cos(a+Math.PI/2),dx*Math.sin(a+Math.PI/2)])}
  pts.forEach((q,i)=>{o+=`<path d="${hexPath(50+q[0],50+q[1],r)}" ${i===0?`fill="${DETAIL}"`:''}/>`});return o}
 if(slug==='keinda'){
  const bean=(x,y,r)=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.72}" fill="${DETAIL}"/>`;
  return `<path d="M12 84C20 40 52 18 90 20" stroke-width="30" fill="none" stroke-linecap="round" style="stroke:var(--c)"/>
   <path d="M26 96C40 66 62 50 92 48" stroke-width="22" fill="none" stroke-linecap="round" style="stroke:var(--c)" opacity=".8"/>
   ${bean(24,62,6)}${bean(34,46,6)}${bean(50,34,6)}${bean(68,28,6)}${bean(82,26,5)}`}
 if(slug==='palm-oil'){
  let o='<path d="M50 4C42 14 40 22 44 30M50 4C58 14 60 22 56 30M50 4C30 8 20 18 18 30M50 4C70 8 80 18 82 30" stroke-width="5" fill="none" stroke-linecap="round" style="stroke:var(--c)"/>';
  const fr=[[50,38],[30,44],[70,44],[40,64],[60,64],[22,66],[78,66],[50,84],[32,86],[68,86]];
  fr.forEach(q=>{o+=`<ellipse cx="${q[0]}" cy="${q[1]}" rx="15" ry="14" stroke="#f8f1e4" stroke-width="1.6"/><ellipse cx="${q[0]-4}" cy="${q[1]-5}" rx="4" ry="2.6" fill="${DETAIL}"/>`});return o}
 if(slug==='benny'){
  let o='';const sd=[[24,22,20],[52,14,-18],[78,26,38],[16,50,-40],[42,42,10],[68,52,-24],[88,56,52],[26,76,28],[52,72,-12],[76,84,40],[40,94,-30],[12,90,15]];
  sd.forEach(q=>{o+=`<path transform="translate(${q[0]} ${q[1]}) rotate(${q[2]}) scale(1.35)" d="M0 -10C7 -5 7 6 0 10C-7 6 -7 -5 0 -10Z"/><path transform="translate(${q[0]} ${q[1]}) rotate(${q[2]}) scale(1.35)" d="M0 -6V6" stroke="${DETAIL}" stroke-width="1" fill="none"/>`});return o}
 /* tola */
  const leaf=a=>`<g transform="translate(50 96) rotate(${a})"><path d="M0 0C20 -22 22 -62 0 -94C-22 -62 -20 -22 0 0Z"/><path d="M0 -4V-84" stroke="${DETAIL}" stroke-width="2" fill="none"/></g>`;
  return leaf(-38)+leaf(38)+leaf(0)}
function shapeSVG(p,cls,fill){const id=++shapeN;const st=fill?`fill:${fill};stroke:${fill}`:'fill:var(--c);stroke:var(--c)';
 return `<svg class="${cls||'blob'}" viewBox="0 0 100 100" aria-hidden="true" style="--c:${p.c};${st}">${shapeInner(p.slug,id)}</svg>`}
let seedN=0;
function blobSVG(){const s=++seedN*1.7;const pts=[];for(let i=0;i<90;i++){const a=i/90*Math.PI*2;const r=39+7.5*Math.sin(a*9+s)+2.2*Math.sin(a*4+s*2);pts.push((50+r*Math.cos(a)).toFixed(1)+','+(50+r*Math.sin(a)).toFixed(1))}
 return `<svg class="blob" viewBox="0 0 100 100" aria-hidden="true"><path d="M${pts.join('L')}Z"/></svg>`}
function cardHTML(p){return `<a class="card" draggable="false" href="#${p.slug}" data-go="${p.slug}" data-cursor="discover" style="--c:${p.c}">${stockOf(p.slug)!=='in'?`<span class="badge stock ${stockOf(p.slug)}">${t(stockOf(p.slug)==='out'?'out':'low')}</span>`:''}${shapeSVG(p)}<img src="${img(p.img)}" alt="${tl(p.name)} ${p.sizes[0]}" draggable="false"><span class="nm">${tl(p.name)}</span></a>`}
function lines(txt){return txt.split('|').map(l=>`<span class="line"><span>${l}</span></span>`).join('')}

/* ---------------- footer ---------------- */
function footer(){return `<footer class="foot" id="contacts">
 <h2 class="big">${t('conT')}</h2>
 <div class="c"><h5>${t('menu')}</h5><a href="#home" data-go="home">${t('home')}</a><a href="#pantry" data-go="pantry">${t('pantry')}</a><a href="#production" data-go="production">${t('production')}</a><a href="#experience" data-go="experience">${t('experience')}</a><a href="#about" data-go="about">${t('about')}</a></div>
 <div class="c"><h5>${t('offices')}</h5>${storeAddress()}</div>
 <div class="c"><h5>${t('phone')}</h5><a href="tel:+${CONFIG.whatsapp}">${safeText(options.theme?.whatsappNumber||'+232 79 529291')}</a><a href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">${t('chat')}</a></div>
 <div class="c"><h5>${t('follow')}</h5><a href="mailto:${contactEmail}">${contactEmail}</a></div>
 <div class="legal"><span>&copy;2026 | Farmose</span><button id="privBtn" style="text-decoration:underline;text-underline-offset:4px">${t('privacy')}</button></div></footer>`}

/* ---------------- views ---------------- */
let carousel=null,marquee=null,gallery=[],parallax=null,cleanup=[];
function stopAll(){cleanup.forEach(f=>f());cleanup=[]}

function viewHome(){
 const arcText=t('arc').toUpperCase().repeat(1);
 const v=document.createElement('div');v.className='home';
 v.innerHTML=`<svg class="bg" viewBox="0 0 1920 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <path fill="#14402b" stroke="#14402b" stroke-width="30" stroke-linejoin="round" d="M250 1120 L258 940 Q268 890 305 835 L440 650 Q470 610 530 588 L890 452 Q960 425 1030 450 L1330 566 Q1392 590 1430 628 L1590 820 Q1660 905 1672 1000 L1672 1120 Z"/>
  <g class="arc" id="arc"><path id="arcP" d="M240 1330 A720 720 0 1 1 1680 1330 A720 720 0 1 1 240 1330" fill="none"/>
   <text font-size="${t('arcSize')}" textLength="4524" lengthAdjust="spacing"><textPath href="#arcP">${arcText}</textPath></text></g></svg>
  <div class="jars" id="jars"></div>
  <div class="scroll-hint">${t('scroll')}</div>
  <button class="priv" id="privBtn">${t('privacy')}</button>
  <div class="dots" id="dots">${HERO.map(()=>'<span></span>').join('')}</div>`;
 const jars=$('#jars',v);
 HERO.forEach((p,i)=>{const a=document.createElement('a');a.className='jar';a.draggable=false;a.href='#'+p.slug;a.dataset.go=p.slug;a.dataset.cursor='discover';a.dataset.i=i;
  a.style.setProperty('--jh',`calc(var(--H) * ${p.hf})`);a.innerHTML=`<img src="${img(p.img)}" alt="${tl(p.name)}" draggable="false">`;jars.appendChild(a)});
 return v}

function initHome(){
 const root=$('.home');if(!root)return;
 const jars=$$('.jar',root),dots=$$('#dots span',root),arc=$('#arc',root),N=jars.length;
 if(!N)return;
 let pos=0,target=0,hover=false,drag=null,lastAuto=performance.now(),raf,moved=0,wheelT;
 const H=()=>Math.min(innerHeight*.56,innerWidth*.7,640);
 function size(){root.style.setProperty('--H',H()+'px')}size();addEventListener('resize',size);
 const wrap=d=>{d=((d+N/2)%N+N)%N-N/2;return d};
 const cache=jars.map(()=>({t:'',f:'',z:'',v:''}));
 function layout(T){
  const vw=innerWidth,sp=Math.min(vw*.285,420)*(vw<700?1.05:1),h=H();
  jars.forEach((j,i)=>{const d=wrap(i-pos),ad=Math.abs(d),c=cache[i];
   if(ad>2.6){if(c.v!=='hidden'){j.style.visibility='hidden';c.v='hidden'}return}
   if(c.v!=='visible'){j.style.visibility='visible';c.v='visible'}
   const hv=HV[i];const s=(ad<=1?1-.34*ad:.66-.2*(ad-1))*(1+.075*hv);
   const x=Math.sign(d)*(ad<=1?ad*sp:sp+(ad-1)*sp*.8);
   const y=(d>0?ad*h*.07:-ad*h*.12)+ad*ad*.9+(ad<=1?ad*h*.02:0)-hv*(h*.03+Math.sin(T*2.2)*h*.009);
   const tr=`translate3d(-50%,-50%,0) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(d*13+hv*(-2.5+Math.sin(T*1.7)*1.8)).toFixed(2)}deg) scale(${s.toFixed(3)})`;
   if(tr!==c.t){j.style.transform=tr;c.t=tr}
   const bl=(Math.round(Math.min(ad,1)*1.5*(1-hv)*4)/4);const f=bl?`blur(${bl}px)`:'none';
   if(f!==c.f){j.style.filter=f;c.f=f}
   const z=String(hv>.05?30:20-Math.round(ad*4));j.style.setProperty('--hv',hv.toFixed(3));if(z!==c.z){j.style.zIndex=z;c.z=z}
   const o=ad>2?Math.max(0,1-(ad-2)/.6):1;j.style.opacity=o});
  arc.setAttribute('transform',`rotate(${(-pos*14).toFixed(2)} 960 1330)`);
  const cu=((Math.round(pos)%N)+N)%N;if(cu!==curDot){dots.forEach((d,i)=>d.classList.toggle('on',i===cu));curDot=cu}}
 let curDot=-1,lastT=performance.now(),hi=-1;const HV=jars.map(()=>0);
 jars.forEach((j,i)=>{j.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hi=i});j.addEventListener('pointerleave',()=>{if(hi===i)hi=-1})});
 function frame(now){
  const dt=Math.min(.05,(now-lastT)/1000);lastT=now;
  if(!hover&&!drag&&now-lastAuto>3600){target=Math.round(target)+1;lastAuto=now}
  if(pos!==target){pos+=(target-pos)*(1-Math.exp(-dt*6.5));if(Math.abs(target-pos)<.0004)pos=target}
  for(let i=0;i<N;i++){HV[i]+=((hi===i&&!drag?1:0)-HV[i])*(1-Math.exp(-dt*9));if(Math.abs(HV[i])<.002)HV[i]=0}
  layout(now/1000);raf=requestAnimationFrame(frame)}
 raf=requestAnimationFrame(frame);
 const go=d=>{target=Math.round(target)+d;lastAuto=performance.now()};
 root.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover=true});root.addEventListener('pointerleave',()=>{hover=false});
 root.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX,t:target};moved=0;lastAuto=performance.now()});
 const pm=e=>{if(!drag)return;const dx=e.clientX-drag.x;moved=Math.max(moved,Math.abs(dx));target=drag.t-dx/Math.min(innerWidth*.285,420)/1.0;lastAuto=performance.now()};
 const pu=()=>{if(!drag)return;drag=null;target=Math.round(target);lastAuto=performance.now()};
 addEventListener('pointermove',pm);addEventListener('pointerup',pu);addEventListener('pointercancel',pu);
 root.addEventListener('click',e=>{if(moved>6){e.preventDefault();e.stopPropagation();moved=0}},true);
 const wheel=e=>{if(!$('.home'))return;e.preventDefault();target+=(Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX)/450;lastAuto=performance.now();clearTimeout(wheelT);wheelT=setTimeout(()=>{target=Math.round(target)},140)};
 root.addEventListener('wheel',wheel,{passive:false});
 const key=e=>{if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1)};addEventListener('keydown',key);
 cleanup.push(()=>{cancelAnimationFrame(raf);removeEventListener('resize',size);removeEventListener('pointermove',pm);removeEventListener('pointerup',pu);removeEventListener('pointercancel',pu);removeEventListener('keydown',key)});
}

function panelsFor(p){const im=img(p.img);
 return `<div class="panel" style="background:var(--deep)">${shapeSVG(p,"big")}<img src="${im}" alt="${tl(p.name)}" draggable="false"></div>
 <div class="panel zoom" style="background:${p.c}"><img src="${im}" alt="" draggable="false"></div>
 <div class="panel fact" style="background:var(--peach)"><p>${tl(p.fact)}</p><img src="${im}" alt="" draggable="false"></div>
 <div class="panel" style="background:${p.c}"><img src="${im}" alt="" draggable="false" style="height:74%;transform:rotate(-8deg)"></div>`}

function viewProduct(p){
 const others=listed.filter(o=>o!==p&&o.slug!=='groundnut-paste-2kg'||(o!==p&&p.slug==='groundnut-paste-2kg'&&o.slug!=='groundnut-paste-2kg'));
 const row=others.concat(others).map(cardHTML).join('').replace(/data-cursor="discover"/g,'data-cursor="dragOpen"');
 const v=document.createElement('div');v.className='page';
 v.innerHTML=`<section class="p-hero"><h1 class="disp p-title">${lines(tl(p.name).replace(' ','|'))}</h1>
  <div class="p-meta fade"><span>${tl(p.kind)}</span><span>${t('madein')}</span></div>
  <img class="p-jar" id="pjar" src="${img(p.img)}" alt="${tl(p.name)}" style="height:min(${66*p.hf}vh,${620*p.hf}px)"></section>
  <section class="p-desc"><p class="body">${tl(p.d)}</p><div class="diamond"></div>
  <div class="order" id="order"><div class="o-top"><span class="o-price" id="oPrice"></span><span class="stock" id="oStock"></span></div>
   <div class="o-row"><div class="chips sel" id="oSizes">${p.sizes.map(z=>`<button data-z="${z}">${z}</button>`).join('')}</div><div class="qty"><button id="qm" aria-label="-">&minus;</button><span id="qv">1</span><button id="qp" aria-label="+">+</button></div></div>
   <div class="o-btns"><a class="btn pri" id="oWA" target="_blank" rel="noopener">${t('orderWA')}</a><button class="btn" id="oAdd">${t('addEnq')}</button></div></div>
  <div style="height:clamp(40px,6vw,80px)"></div>
  <div class="trio"><div><h4>${t('tips')}</h4>${tl(p.tip)}</div><div><h4>${t('avail')}</h4><div class="chips">${p.sizes.map(s=>`<span>${s}</span>`).join('')}</div></div><div><h4>${t('store')}</h4>${tl(p.store)}</div></div></section>
  <section class="gal" data-cursor="drag"><div class="gal-track">${panelsFor(p)}</div></section>
  <section class="others"><h2 class="disp">${lines(t('others').replace(' ','|'))}</h2><div class="m-wrap"><div class="m-track" id="mt">${row}</div></div></section>${footer()}`;
 return v}

function viewPantry(){
 const cats=[['all','all'],['spice','cSpice'],['paste','cPaste'],['oil','cOil'],['honey','cHoney']];
 const v=document.createElement('div');v.className='page';
 v.innerHTML=`<section class="pan-hero"><h1 class="disp">${lines(t('pantryT'))}</h1><div class="filters fade" id="flt">${cats.map((c,i)=>`<button data-c="${c[0]}" class="${i?'':'on'}">${t(c[1])}</button>`).join('')}</div></section>
 <div class="grid" id="grid">${listed.map(cardHTML).join('')}</div>${footer()}`;
 return v}
function initPantry(){const f=$('#flt');if(!f)return;f.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',f).forEach(x=>x.classList.toggle('on',x===b));const c=b.dataset.c;$$('#grid .card').forEach((el,i)=>{const p=bySlug(el.dataset.go);el.style.display=(c==='all'||p.cat===c)?'':'none'})})}

function tableRows(list){return `<div class="r h"><span>${t('th')[0]}</span><span>${t('th')[1]}</span><span>${t('th')[2]}</span></div>`+list.map(p=>`<div class="r"><span>${tl(p.name)}</span><span>${p.sizes.join(' / ')}</span><span>${tl(p.pack)}</span></div>`).join('')}
function viewProduction(){
 const A=['cayenne-pepper','tola','benny','keinda'].map(bySlug), B=['palm-oil','honey','groundnut-paste','groundnut-paste-2kg'].map(bySlug);
 const v=document.createElement('div');v.className='page';
 v.innerHTML=`<section class="prod-hero"><span class="eyebrow">${t('prodEy')}</span><h1 class="disp">${lines(t('prodT').replace(' of|',' of|').replace('The bounty|','The bounty|'))}</h1><p class="fade">${t('prodP')}</p>
  <div class="ph">${['groundnut-paste','honey','palm-oil','cayenne-pepper','benny'].map(s=>`<img src="${img(bySlug(s).img)}" alt="">`).join('')}</div></section>
  <section class="psec" id="sec1"><h2 class="disp">${t('s1')}</h2><p class="txt">${t('s1p')}</p><div class="tbl">${tableRows(A)}</div><span class="hint">${t('browse')}</span>
   <div class="gal" data-cursor="drag"><div class="gal-track">${A.map(p=>`<div class="panel" style="background:${p.c}"><img src="${img(p.img)}" alt="${tl(p.name)}" draggable="false"></div>`).join('')}</div></div></section>
  <section class="psec" id="sec2"><h2 class="disp">${t('s2')}</h2><p class="txt">${t('s2p')}</p><div class="tbl">${tableRows(B)}</div><span class="hint">${t('browse')}</span>
   <div class="gal" data-cursor="drag"><div class="gal-track">${B.map(p=>`<div class="panel" style="background:${p.c}"><img src="${img(p.img)}" alt="${tl(p.name)}" draggable="false"></div>`).join('')}</div></div></section>
  <div style="height:clamp(70px,10vw,160px)"></div>${footer()}
  <div class="tabs"><button data-s="sec1" class="on">${t('s1')}</button><button data-s="sec2">${t('s2')}</button></div>`;
 return v}
function initProduction(){const tabs=$$('.tabs button');tabs.forEach(b=>b.addEventListener('click',()=>{const el=document.getElementById(b.dataset.s);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}));
 const onS=()=>{const y=$('#sec2');if(!y)return;const on=y.getBoundingClientRect().top<innerHeight*.5?1:0;tabs.forEach((b,i)=>b.classList.toggle('on',i===on))};addEventListener('scroll',onS,{passive:true});cleanup.push(()=>removeEventListener('scroll',onS))}

function viewExperience(){
 const ex=[['e1','honey','#f0b400'],['e2','groundnut-paste','#d98a2b'],['e3','palm-oil','#c8251c']];
 const v=document.createElement('div');v.className='page';
 v.innerHTML=`<section class="exp-hero"><h1 class="disp">${lines(t('expT').replace(' ','|'))}</h1><p class="body fade">${t('expP')}</p></section>
 <div class="exp-list">${ex.map(e=>`<div class="exp"><div class="vis" style="background:${e[2]}">${shapeSVG(bySlug(e[1]),'bigx','rgba(248,241,228,.28)')}<img src="${img(bySlug(e[1]).img)}" alt=""></div><div class="tx"><h3>${t(e[0])}</h3><p>${t(e[0]+'p')}</p><a class="btn" href="#contacts" data-go="contacts">${t('enq')}</a></div></div>`).join('')}</div>${footer()}`;
 return v}
function viewAbout(){const v=document.createElement('div');v.className='page';
 v.innerHTML=`<section class="exp-hero"><h1 class="disp">${lines(t('abT').replace(' ','|'))}</h1><p class="body fade">${t('abP')}</p><div class="diamond"></div></section>
 <div class="grid" style="grid-template-columns:repeat(4,1fr)">${listed.filter(p=>p.slug!=='groundnut-paste-2kg').slice(0,4).map(cardHTML).join('')}</div>${footer()}`;return v}
function viewContacts(){const v=document.createElement('div');v.className='page';
 v.innerHTML=`<div style="height:clamp(110px,14vh,170px)"></div>${footer()}`;v.querySelector('.foot').style.minHeight='calc(var(--app-h) - clamp(110px,14vh,170px))';return v}

/* ---------------- gallery drag + marquee + parallax ---------------- */
function initGalleries(){
 $$('.gal').forEach(g=>{const tr=$('.gal-track',g);let x=0,min=0,start=null,vel=0,lastX=0,raf;
  const lim=()=>{min=Math.min(0,g.clientWidth-tr.scrollWidth-0)};lim();addEventListener('resize',lim);
  const set=v=>{x=Math.max(min,Math.min(0,v));tr.style.transform=`translate3d(${x}px,0,0)`};
  g.addEventListener('pointerdown',e=>{start={px:e.clientX,x};lastX=e.clientX;vel=0;cancelAnimationFrame(raf);g.classList.add('drag')});
  const mv=e=>{if(!start)return;vel=e.clientX-lastX;lastX=e.clientX;set(start.x+e.clientX-start.px)};
  const up=()=>{if(!start)return;start=null;g.classList.remove('drag');const step=()=>{vel*=.95;set(x+vel);if(Math.abs(vel)>.3)raf=requestAnimationFrame(step)};step()};
  addEventListener('pointermove',mv);addEventListener('pointerup',up);
  g.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){e.preventDefault();set(x-e.deltaX)}},{passive:false});
  const key=e=>{const r=g.getBoundingClientRect();if(r.top<innerHeight*.8&&r.bottom>innerHeight*.2){const w=tr.firstElementChild.getBoundingClientRect().width;if(e.key==='ArrowRight')set(x-w);if(e.key==='ArrowLeft')set(x+w)}};addEventListener('keydown',key);
  cleanup.push(()=>{removeEventListener('resize',lim);removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('keydown',key);cancelAnimationFrame(raf)})});
 const mt=$('#mt');if(mt){const wr=mt.parentElement;let x=0,v=-36,dragging=false,hov=false,lx=0,sx=0,lt2=0,moved=0,raf,half=mt.scrollWidth/2;
  const rz=()=>{half=mt.scrollWidth/2};addEventListener('resize',rz);
  const norm=()=>{if(half>0){while(x<=-half)x+=half;while(x>0)x-=half}};
  wr.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hov=true});wr.addEventListener('pointerleave',()=>{hov=false});
  wr.addEventListener('pointerdown',e=>{if(e.button>0)return;dragging=true;moved=0;lx=sx=e.clientX;lt2=performance.now();v=0;wr.classList.add('drag')});
  const mv=e=>{if(!dragging)return;const now=performance.now(),dx=e.clientX-lx;x+=dx;norm();moved=Math.max(moved,Math.abs(e.clientX-sx));const d=Math.max(1,now-lt2)/1000;v=v*.55+(dx/d)*.45;lx=e.clientX;lt2=now};
  const up=()=>{if(!dragging)return;dragging=false;wr.classList.remove('drag');if(performance.now()-lt2>90)v=0;v=Math.max(-2600,Math.min(2600,v))};
  addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);
  wr.addEventListener('click',e=>{if(moved>6){e.preventDefault();e.stopPropagation();moved=0}},true);
  wr.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){e.preventDefault();x-=e.deltaX;norm()}},{passive:false});
  let lt=performance.now();
  const f=now=>{const dt=Math.min(.05,(now-lt)/1000);lt=now;
   if(!dragging){const tg=hov?0:-36;v+=(tg-v)*(1-Math.exp(-dt*(Math.abs(v)>220?2.4:3.2)));x+=v*dt;norm()}
   mt.style.transform=`translate3d(${x.toFixed(2)}px,0,0)`;raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f);
  cleanup.push(()=>{cancelAnimationFrame(raf);removeEventListener('resize',rz);removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up)})}
 const pj=$('#pjar');if(pj){let tk=false;const onS=()=>{if(tk)return;tk=true;requestAnimationFrame(()=>{tk=false;pj.style.transform=`translate3d(-50%,${(-scrollY*.28).toFixed(1)}px,0)`})};addEventListener('scroll',onS,{passive:true});cleanup.push(()=>removeEventListener('scroll',onS))}
}

/* ---------------- router ---------------- */
let route='home',busy=false;
function build(r){
 if(r==='home')return viewHome();
 if(r==='pantry')return viewPantry();
 if(r==='production')return viewProduction();
 if(r==='experience')return viewExperience();
 if(r==='about')return viewAbout();
 if(r==='contacts')return viewContacts();
 const p=listedBySlug(r);return p?viewProduct(p):viewHome()}
function mount(r){
 stopAll();route=listedBySlug(r)||['home','pantry','production','experience','about','contacts'].includes(r)?r:'home';
 const view=$('#view');view.innerHTML='';view.appendChild(build(route));
 document.body.classList.toggle('lock',route==='home');
 scrollTo(0,0);document.body.classList.remove('hdr-light');
 if(route==='home')initHome();
 if(route==='pantry')initPantry();
 if(route==='production')initProduction();
 initGalleries();
 if(listedBySlug(route))initOrder(listedBySlug(route));
 $$('#privBtn').forEach(b=>b.onclick=()=>$('#modal').classList.add('on'));
 $$('#menu a').forEach(a=>a.classList.toggle('cur',a.dataset.go===(listedBySlug(route)?'pantry':route)));
}
function navigate(r,instant){
 if(busy)return;
 if(r==='contacts'&&route!=='home'&&route!=='contacts'){closeMenu();const f=$('#contacts');if(f){f.scrollIntoView({behavior:'smooth'});return}}
 if(r===route&&!document.body.classList.contains('menu-open'))return;
 try{history.replaceState(null,'','#'+r)}catch(e){}
 if(instant){mount(r);return}
 busy=true;pulseLogo();const c=$('#cover');c.className='cover in';
 setTimeout(()=>{closeMenu(true);mount(r);
  const imgs=$$('#view img').slice(0,6).map(i=>i.decode?i.decode().catch(()=>{}):0);
  Promise.race([Promise.all(imgs),new Promise(z=>setTimeout(z,700))]).then(()=>requestAnimationFrame(()=>{c.className='cover out';setTimeout(()=>{c.className='cover';busy=false;pulseLogo()},990)}))},930)}
function pulseLogo(){const l=$('.logo');if(!l)return;l.classList.remove('pulse');void l.offsetWidth;l.classList.add('pulse');setTimeout(()=>l.classList.remove('pulse'),1000)}
onDocument('click',e=>{const a=e.target.closest('[data-go]');if(!a)return;e.preventDefault();navigate(a.dataset.go)});
addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h&&h!==route&&!busy)navigate(h)});


/* ---------------- enquiry basket + WhatsApp ---------------- */
let basket=[];try{basket=JSON.parse(localStorage.getItem('farmose:basket')||'[]').filter(i=>listedBySlug(i.slug))}catch(e){basket=[]}
const saveB=()=>{try{localStorage.setItem('farmose:basket',JSON.stringify(basket))}catch(e){}};
const waURL=text=>`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
function lineFor(i){const p=bySlug(i.slug),pr=priceOf(i.slug,i.size);return `- ${tl(p.name)} (${i.size}) x${i.qty}`+(pr!==null?` = ${money(pr*i.qty)}`:'')}
function basketTotal(){let tot=0;for(const i of basket){const pr=priceOf(i.slug,i.size);if(pr===null)return null;tot+=pr*i.qty}return tot}
function basketMsg(name,area){const tot=basketTotal();let m=t('greet')+'\n'+basket.map(lineFor).join('\n');if(tot!==null)m+=`\n${t('totalL')}: ${money(tot)}`;if(name)m+=`\n${t('nameL')}: ${name}`;if(area)m+=`\n${t('areaL')}: ${area}`;return m}
function addToBasket(slug,size,qty){const f=basket.find(i=>i.slug===slug&&i.size===size);if(f)f.qty=Math.min(99,f.qty+qty);else basket.push({slug,size,qty});saveB();renderBasket()}
function renderBasket(){
 const n=basket.reduce((a,i)=>a+i.qty,0);$('#bkN').textContent=n;$('#bkPill').classList.toggle('on',n>0);
 const L=$('#bkList'),F=$('#bkF');
 if(!basket.length){L.innerHTML=`<div class="bk-empty">${t('emptyBk')}</div>`;F.innerHTML=`<a class="btn pri" href="#pantry" data-go="pantry">${t('browseP')}</a>`;return}
 L.innerHTML=basket.map((i,k)=>{const p=bySlug(i.slug),pr=priceOf(i.slug,i.size);return `<div class="bk-it"><img src="${img(p.img)}" alt=""><div><div class="n">${tl(p.name)}</div><div class="m">${i.size} &middot; ${pr!==null?money(pr):t('askPrice')}</div><button class="rm" data-rm="${k}">${t('remove')}</button></div><div class="qty"><button data-q="${k}" data-d="-1" aria-label="-">&minus;</button><span>${i.qty}</span><button data-q="${k}" data-d="1" aria-label="+">+</button></div></div>`}).join('');
 const tot=basketTotal();
 const oldN=$('#bkName')?$('#bkName').value:'',oldA=$('#bkArea')?$('#bkArea').value:'';
 F.innerHTML=`${tot!==null?`<div class="bk-tot"><span>${t('total')}</span><span>${money(tot)}</span></div>`:''}<input id="bkName" placeholder="${t('yourName')}" autocomplete="name"><input id="bkArea" placeholder="${t('area')}"><a class="btn pri" id="bkSend" target="_blank" rel="noopener">${t('sendWA')}</a><button class="bk-clear" id="bkClr">${t('clearAll')}</button>`;
 $('#bkName').value=oldN;$('#bkArea').value=oldA;
 const upd=()=>{$('#bkSend').href=waURL(basketMsg($('#bkName').value.trim(),$('#bkArea').value.trim()))};upd();$('#bkName').oninput=upd;$('#bkArea').oninput=upd}
function openBasket(){closeMenu();renderBasket();$('#bk').classList.add('on');$('#bkOv').classList.add('on');$('#bk').setAttribute('aria-hidden','false')}
function closeBasket(){$('#bk').classList.remove('on');$('#bkOv').classList.remove('on');$('#bk').setAttribute('aria-hidden','true')}
$('#bkPill').addEventListener('click',openBasket);$('#bkX').addEventListener('click',closeBasket);$('#bkOv').addEventListener('click',closeBasket);
$('#bkList').addEventListener('click',e=>{const r=e.target.closest('[data-rm]'),q=e.target.closest('[data-q]');
 if(r){basket.splice(+r.dataset.rm,1)}else if(q){const it=basket[+q.dataset.q];it.qty+=+q.dataset.d;if(it.qty<1)basket.splice(+q.dataset.q,1);if(it&&it.qty>99)it.qty=99}else return;saveB();renderBasket()});
$('#bkF').addEventListener('click',e=>{if(e.target.id==='bkClr'){basket=[];saveB();renderBasket()}if(e.target.closest('[data-go]'))closeBasket()});
onDocument('click',e=>{const a=e.target.closest('[data-action="basket"]');if(a){e.preventDefault();openBasket()}});
addEventListener('keydown',e=>{if(e.key==='Escape')closeBasket()});

function initOrder(p){
 const o=$('#order');if(!o)return;let size=p.def||p.sizes[0],qty=1;const st=stockOf(p.slug);
 const chips=$$('#oSizes button');const wa=$('#oWA'),add=$('#oAdd');
 const upd=()=>{chips.forEach(c=>c.classList.toggle('on',c.dataset.z===size));$('#qv').textContent=qty;
  const pr=priceOf(p.slug,size);$('#oPrice').textContent=pr!==null?money(pr*qty):t('askPrice');
  const sEl=$('#oStock');sEl.className='stock '+st;sEl.textContent=t(st==='in'?'inStock':st);
  if(st==='out'){wa.textContent=t('askAvail');wa.href=waURL(`${t('askMsg')}\n- ${tl(p.name)} (${size})`);add.setAttribute('aria-disabled','true')}
  else{wa.textContent=t('orderWA');wa.href=waURL(basketMsg0());add.removeAttribute('aria-disabled')}};
 const basketMsg0=()=>{const it={slug:p.slug,size,qty};const pr=priceOf(p.slug,size);let m=t('greet')+'\n'+lineFor(it);if(pr!==null)m+=`\n${t('totalL')}: ${money(pr*qty)}`;return m};
 chips.forEach(c=>c.addEventListener('click',()=>{size=c.dataset.z;upd()}));
 $('#qm').onclick=()=>{qty=Math.max(1,qty-1);upd()};$('#qp').onclick=()=>{qty=Math.min(99,qty+1);upd()};
 add.onclick=()=>{if(st==='out')return;addToBasket(p.slug,size,qty);add.textContent=t('added')+' \u2713';setTimeout(()=>{add.textContent=t('addEnq')},1400)};
 upd()}

/* cookie banner: only shown when CONFIG.analytics is true */
(function(){if(!CONFIG.analytics)return;let ch=null;try{ch=localStorage.getItem('farmose:cookies')}catch(e){}if(ch)return;
 const b=$('#ck');$('#ckT').textContent=t('ckTxt');$('#ckA').textContent=t('ckA');$('#ckR').textContent=t('ckR');b.classList.add('on');
 const set=v=>{try{localStorage.setItem('farmose:cookies',v)}catch(e){}b.classList.remove('on');if(v==='yes'&&typeof window.farmoseAnalytics==='function')window.farmoseAnalytics()};
 $('#ckA').onclick=()=>set('yes');$('#ckR').onclick=()=>set('no')})();

/* ---------------- menu / lang / cursor / modal ---------------- */
function openMenu(){document.body.classList.add('menu-open');$('#menuBtn').setAttribute('aria-expanded','true');$('#menuLbl').textContent=t('close')}
function closeMenu(){document.body.classList.remove('menu-open');$('#menuBtn').setAttribute('aria-expanded','false');$('#menuLbl').textContent=t('menu')}
$('#menuBtn').addEventListener('click',()=>document.body.classList.contains('menu-open')?closeMenu():openMenu());
addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();$('#modal').classList.remove('on')}});
$('#modalClose').onclick=()=>$('#modal').classList.remove('on');
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')e.target.classList.remove('on')});
function applyLang(){
 $$('[data-i]').forEach(el=>{el.textContent=t(el.dataset.i)});$('#privTxt').textContent=t('privTxt');
 $$('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===lang));
 document.documentElement.lang=lang==='kr'?'kri':'en';$('#menuLbl').textContent=document.body.classList.contains('menu-open')?t('close'):t('menu')}
$$('.lang button').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;try{localStorage.setItem('farmose:lang',lang)}catch(e){}applyLang();renderBasket();const y=scrollY;mount(route);scrollTo(0,y)}));

const cur=$('#cursor'),ct=$('#curTxt');let cx=-100,cy=-100,tx=-100,ty=-100,on=false;
addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;const el=e.target.closest&&e.target.closest('[data-cursor]');
 if(el){ct.textContent=t(el.dataset.cursor);on=true}else on=false;cur.classList.toggle('show',on)});
let cursorRaf;
if(matchMedia('(hover:hover) and (pointer:fine)').matches)(function loop(){cx+=(tx-cx)*.22;cy+=(ty-cy)*.22;cur.style.transform=`translate3d(${(cx+16).toFixed(1)}px,${(cy+16).toFixed(1)}px,0)`;cursorRaf=requestAnimationFrame(loop)})();

function setH(){document.documentElement.style.setProperty('--app-h',innerHeight+'px')}setH();addEventListener('resize',setH);

const onHdr=()=>{const f=$('.foot');const light=!!f&&f.getBoundingClientRect().top<60;document.body.classList.toggle('hdr-light',light)};
let hk=false;addEventListener('scroll',()=>{if(hk)return;hk=true;requestAnimationFrame(()=>{hk=false;onHdr()})},{passive:true});
/* boot */
applyLang();renderBasket();
const start=(location.hash||'').slice(1)||options.initialRoute;
mount(start&&(listedBySlug(start)||['pantry','production','experience','about','contacts'].includes(start))?start:'home');
HERO.concat(P).forEach(p=>{const i=new Image();i.src=img(p.img)});
/* intro: logo animates on the green cover, then it lifts */
(function intro(){busy=true;const c=$('#cover');const wait=ms=>new Promise(z=>setTimeout(z,ms));
 const imgs=$$('#view img').slice(0,8).map(i=>i.decode?i.decode().catch(()=>{}):0);
 const fonts=document.fonts&&document.fonts.ready?document.fonts.ready:0;
 Promise.all([Promise.race([Promise.all([...imgs,fonts]),wait(2200)]),wait(1800)]).then(()=>requestAnimationFrame(()=>{c.className='cover out';setTimeout(()=>{c.className='cover';busy=false;pulseLogo()},990)}))})();

  return () => {
    stopAll();
    if(cursorRaf)cancelAnimationFrame(cursorRaf);
    globalListeners.forEach(([type, listener, opts]) => window.removeEventListener(type, listener, opts));
    documentListeners.forEach(([type, listener, opts]) => document.removeEventListener(type, listener, opts));
    document.body.classList.remove('lock', 'menu-open', 'hdr-light');
  };
}

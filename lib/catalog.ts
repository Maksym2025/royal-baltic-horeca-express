export const categories = ['Alle Produkte','Lachs & Forelle','Garnelen','Weißfisch','Kaviar','Fritierküche'];
export const products = [
{id:'10442',title:'Atlantischer Lachs',subtitle:'Superior · Filet mit Haut · entgrätet',category:'Lachs & Forelle',origin:'Norwegen',pack:'Karton à 5 kg',kg:5,price:9450,vat:7,stock:42,image:0,tag:'FRISCH',detail:'Salmo salar · Aquakultur · 0 bis +2 °C'},
{id:'20881',title:'Black Tiger Garnelen',subtitle:'16/20 · Easy Peel · roh',category:'Garnelen',origin:'Vietnam',pack:'Karton à 10 kg',kg:10,price:18500,vat:7,stock:28,image:1,tag:'TIEFKÜHL',detail:'Penaeus monodon · Aquakultur · −18 °C'},
{id:'30129',title:'Zanderfilet mit Haut',subtitle:'300–500 g · praktisch grätenfrei',category:'Weißfisch',origin:'Binnenfischerei',pack:'Karton à 5 kg',kg:5,price:11200,vat:7,stock:4,image:2,tag:'TIEFKÜHL',detail:'Sander lucioperca · Wildfang · −18 °C'},
{id:'44090',title:'Keta-Lachskaviar',subtitle:'Malossol · feine Körnung',category:'Kaviar',origin:'Nordpazifik',pack:'Dose à 500 g',kg:.5,price:7900,vat:7,stock:12,image:3,tag:'FEINKOST',detail:'Oncorhynchus keta · gekühlt · 0 bis +4 °C'},
{id:'10456',title:'Lachsportionen',subtitle:'150–170 g · einzeln tiefgefroren',category:'Lachs & Forelle',origin:'Norwegen',pack:'Karton à 5 kg',kg:5,price:9950,vat:7,stock:18,image:0,tag:'TIEFKÜHL',detail:'Salmo salar · Aquakultur · −18 °C'},
{id:'20912',title:'Garnelen für die Fritteuse',subtitle:'Knusperpanade · küchenfertig',category:'Fritierküche',origin:'Vietnam',pack:'Karton à 5 kg',kg:5,price:6750,vat:7,stock:8,image:1,tag:'TIEFKÜHL',detail:'Serviervorschlag · −18 °C · enthält Gluten und Krebstiere'},
];
export type Product = typeof products[number];
export type Cart = Record<string,number>;
export type Order = {id:string;date:string;delivery:string;slot:string;payment:string;status:string;items:Cart;net:number;tax:number;total:number};
export const profiles=[{id:'lecker',name:'Restaurant Lecker',company:'Lecker Gastronomie GmbH',email:'einkauf@lecker.example',phone:'+49 000 000000',address:'Musterstraße 12, 77654 Offenburg',vat:'DE000000000',terms:'INVOICE_7_DAYS',contact:'Anna · HoReCa Service'},{id:'fisch',name:'Fisch & Co',company:'Fisch & Co Gastronomie GmbH',email:'einkauf@fisch-co.example',phone:'+49 000 000000',address:'Beispielweg 8, 79098 Freiburg',vat:'DE000000000',terms:'CARD_IMMEDIATE',contact:'Anna · HoReCa Service'}];
export const money=(v:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(v/100);
export function totals(cart:Cart){let net=0,tax=0;for(const p of products){const line=p.price*(cart[p.id]||0);net+=line;tax+=Math.round(line*p.vat/100)}return {net,tax,total:net+tax}}
export function deliveryDays(){const result:string[]=[];const d=new Date();while(result.length<8){d.setDate(d.getDate()+1);if([2,4,5].includes(d.getDay()))result.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)}return result}
export function pastOrders():Order[]{return [{id:'RB-2026-0842',date:'2026-09-15',delivery:'2026-09-17',slot:'08:00–12:00',payment:'Rechnung · 7 Tage',status:'Unterwegs',items:{'10442':2,'20881':1},...totals({'10442':2,'20881':1})},{id:'RB-2026-0816',date:'2026-09-10',delivery:'2026-09-11',slot:'08:00–12:00',payment:'Rechnung · 7 Tage',status:'Geliefert',items:{'30129':1,'44090':2},...totals({'30129':1,'44090':2})}]}

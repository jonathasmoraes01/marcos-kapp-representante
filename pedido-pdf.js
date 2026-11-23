/* PDF de pedido comercial. Os dados são guardados no pedido no momento da venda. */
async function gerarPedidoPDF(order){
  if (!globalThis.PDFLib) throw new Error('O gerador de PDF não foi carregado.');
  const {PDFDocument,StandardFonts,rgb}=PDFLib;
  const doc=await PDFDocument.create();
  const regular=await doc.embedFont(StandardFonts.Courier),bold=await doc.embedFont(StandardFonts.CourierBold);
  const W=595.28,H=841.89,L=48,R=547, C={dark:rgb(.19,.20,.17),muted:rgb(.42,.43,.39),line:rgb(.70,.70,.65),paper:rgb(.945,.945,.915),white:rgb(1,1,1),green:rgb(.19,.31,.23)};
  const c=order.client||{},s=order.seller||{}, items=Array.isArray(order.items)?order.items:[];
  const money=x=>Number(x||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\u00a0/g,' ');
  const safe=(v,font=regular)=>[...String(v??'').replace(/[\r\t]+/g,' ')].map(ch=>{try{font.encodeText(ch);return ch}catch{return '?'}}).join('');
  const toDate=val=>{if(!val)return null;const match=String(val).match(/^(\d{4})-(\d\d)-(\d\d)$/);return match?new Date(+match[1],+match[2]-1,+match[3]):new Date(val)};
  const formatDate=(val,withHour=false)=>{const d=toDate(val);return d&&!isNaN(d)?d.toLocaleDateString('pt-BR')+(withHour?' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''):'Não informado'};
  const dt=toDate(order.createdAt),numberDays=(order.term||'').toLowerCase().includes('vista')?[0]:String(order.term||'').match(/\d+/g)?.map(Number)||[];
  const due=dt&&numberDays.length?numberDays.map(n=>{const d=new Date(dt);d.setDate(d.getDate()+n);return formatDate(d)}).join(' / '):'';
  const imageCache=new Map();
  async function image(data){if(!data)return null;if(!imageCache.has(data)){try{let bytes;if(/^data:image\/jpeg;base64,/i.test(data)){const binary=atob(data.split(',')[1]);bytes=Uint8Array.from(binary,x=>x.charCodeAt(0))}else if(/^assets\/produtos\/\d{13}\.jpg$/.test(data)){const response=await fetch(data);if(!response.ok)throw Error('Imagem indisponível');bytes=new Uint8Array(await response.arrayBuffer())}else return null;imageCache.set(data,await doc.embedJpg(bytes))}catch{imageCache.set(data,null)}}return imageCache.get(data)}
  const logo=await image(s.logo||globalThis.DELIC_LOGO);
  const texts=[];let page,y,pageNo=0;
  function draw(t,x,y0,size=10,font=regular,color=C.dark){page.drawText(safe(t,font),{x,y:y0,size,font,color})}
  function textWidth(t,size,font=regular){return font.widthOfTextAtSize(safe(t,font),size)}
  function wrap(text,width,size=10,font=regular){const input=safe(text||'Não informado',font).split(/\s+/),lines=[];let line='';for(let word of input){if(!word)continue;while(textWidth(word,size,font)>width&&word.length>1){let cut=word.length-1;while(cut>1&&textWidth(word.slice(0,cut),size,font)>width)cut--;if(line){lines.push(line);line=''}lines.push(word.slice(0,cut));word=word.slice(cut)}const candidate=line?line+' '+word:word;if(textWidth(candidate,size,font)>width&&line){lines.push(line);line=word}else line=candidate}if(line)lines.push(line);return lines.length?lines:['Não informado']}
  function header(){page=doc.addPage([W,H]);pageNo++;page.drawRectangle({x:28,y:34,width:W-56,height:H-135,color:C.paper});if(logo){const scale=Math.min(96/logo.width,54/logo.height);page.drawImage(logo,{x:L,y:H-73,width:logo.width*scale,height:logo.height*scale})}else draw('DELIC',L,H-53,18,bold);draw(s.company||'Delic Alimentos',L+115,H-40,15,bold);draw('PEDIDO DE VENDA',L+115,H-58,9,regular,C.muted);y=H-116;if(pageNo>1){draw('CONTINUAÇÃO DO PEDIDO',L,y,9,bold,C.muted);y-=22}}
  function ensure(height){if(y-height<66)header()}
  function divider(){ensure(12);page.drawLine({start:{x:L,y:y+2},end:{x:R,y:y+2},thickness:.6,color:C.line,dashArray:[2,3]});y-=12}
  function section(title){ensure(30);draw(title.toUpperCase(),L,y,9,bold,C.green);y-=18}
  function row(label,value,optional=false){if(optional&&(value===undefined||value===null||String(value).trim()===''))return;const lines=wrap(value||'Não informado',353,9.4,bold);ensure(lines.length*11+4);draw(label.toUpperCase(),L,y,8,regular,C.muted);for(const line of lines){draw(line,L+135,y,9.4,bold);y-=11}y-=2}
  function rightRow(label,value,big=false){ensure(19);const size=big?13:9.7;draw(label,L,y,size,big?bold:regular,big?C.dark:C.muted);draw(value,R-textWidth(value,size,bold),y,size,bold);y-=big?21:16}
  header();
  section('Empresa representada');
  if(s.companyLegal)row('Razão social',s.companyLegal);if(s.companyDocument)row('CNPJ',s.companyDocument);if(s.companyRegistration)row('Inscrição estadual',s.companyRegistration);if(s.companyAddress)row('Endereço',s.companyAddress);if(s.companyPhone)row('Telefone',s.companyPhone);if(s.companyEmail)row('E-mail',s.companyEmail);
  row('Representante',[s.seller||'Marcos Kapp',s.sellerCode?'Cód. '+s.sellerCode:''].filter(Boolean).join(' · '));row('Contato',s.phone,true);divider();
  section('Cliente');row('Razão social',c.legal);row('Nome fantasia',c.fantasy,true);row('CNPJ / CPF',c.document,true);row('Inscrição estadual',c.registration,true);row('Contato',[c.contact,c.phone].filter(Boolean).join(' · '),true);row('E-mail',c.email,true);
  const line1=[c.street,c.number,c.complement].filter(Boolean).join(', '),line2=[c.district,[c.city,c.region].filter(Boolean).join(' / '),c.zip?'CEP '+c.zip:''].filter(Boolean).join(' · ');row('Endereço',[line1,line2].filter(Boolean).join(' — '),true);
  if(c.photo){const img=await image(c.photo);if(img){ensure(90);draw('FACHADA',L,y,8,regular,C.muted);const sc=Math.min(120/img.width,68/img.height);page.drawImage(img,{x:L+135,y:y-68,width:img.width*sc,height:img.height*sc});y-=77}}
  divider();section('Dados do pedido');row('Data',formatDate(order.createdAt,true));row('Prazo de pagamento',order.term||'Não informado');row('Vencimento(s)',due,true);row('Tipo de pagamento',order.paymentType,true);row('Condição comercial',order.commercialCondition,true);divider();
  section(`${items.length} ${items.length===1?'item':'itens'} do pedido`);
  for(const item of items){const itemImage=await image(item.photo||(!item.photoDisabled?(globalThis.CATALOGO_DELIC||[]).find(p=>p.barcode&&p.barcode===item.barcode)?.photo:'')),offset=itemImage?76:0;const lines=wrap(item.name||'Produto',300-offset,10,bold),detail=[item.reference?'Cód. '+item.reference:'',item.barcode?'EAN '+item.barcode:'',item.unit?'Un. '+item.unit:''].filter(Boolean).join('  ·  '),detailLines=detail?wrap(detail,300-offset,8,regular):[];const height=Math.max(itemImage?54:0,lines.length*14+detailLines.length*11+9)+3;ensure(height+12);
    if(itemImage){const sc=Math.min(62/itemImage.width,52/itemImage.height);page.drawImage(itemImage,{x:L,y:y-49,width:itemImage.width*sc,height:itemImage.height*sc})}
    let iy=y;for(const ln of lines){draw(ln,L+offset,iy,10,bold);iy-=14}for(const ln of detailLines){draw(ln,L+offset,iy,8,regular,C.muted);iy-=11}const qty=Number(item.qty)||0,price=Number(item.price)||0,discount=Number(item.discount)||0;const calc=`${qty} × ${money(price)}${discount?'  ·  desc. '+discount+'%':''}`;draw(calc,L+offset,iy-2,8.5,regular,C.muted);const result=money(qty*price*(1-discount/100));draw(result,R-textWidth(result,10,bold),y,10,bold);y-=height;divider()}
  const subtotal=items.reduce((sum,i)=>sum+(Number(i.qty)||0)*(Number(i.price)||0)*(1-(Number(i.discount)||0)/100),0),fee=Number(order.fee)||0,discount=Number(order.orderDiscount)||0;
  ensure(112);section('Resumo');if(order.taxEnabled){rightRow('IMPOSTO INFORMADO ('+Number(order.taxRate||0).toLocaleString('pt-BR')+'%)',money(order.taxAmount));}rightRow('TOTAL DO PEDIDO',money(order.total??(subtotal-discount+fee+(order.taxEnabled?Number(order.taxAmount)||0:0))),true);if(discount||fee){ensure(18);draw('Total inclui ajustes comerciais do pedido.',L,y,8,regular,C.muted);y-=14}
  if(order.notes){divider();section('Observações');for(const line of wrap(order.notes,R-L,9,regular)){ensure(14);draw(line,L,y,9,regular);y-=14}}
  for(const [i,p] of doc.getPages().entries()){p.drawText('Documento de pedido de venda — não é nota fiscal.',{x:L,y:20,size:7,font:regular,color:C.muted});const label=`Página ${i+1} de ${doc.getPageCount()}`;p.drawText(label,{x:R-bold.widthOfTextAtSize(label,7),y:20,size:7,font:bold,color:C.muted})}
  doc.setTitle('Pedido de venda - Delic Alimentos');doc.setAuthor('Marcos Kapp Representante');return new Blob([await doc.save()],{type:'application/pdf'});
}

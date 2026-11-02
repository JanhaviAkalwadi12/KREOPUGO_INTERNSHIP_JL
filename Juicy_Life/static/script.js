
var JuicyLife={pages:{}};

/* ---------- LANDING PAGE ---------- */
JuicyLife.pages.landing=function(){
  // Hero slider: auto-slides through all 3 slides, dots also work manually
  (function(){
    var slides=document.querySelectorAll('.hero .slide');
    var dots=document.querySelectorAll('.hero .dots .dot');
    var cur=0, timer=null;
    function show(i){
      cur=(i+slides.length)%slides.length;
      slides.forEach(function(s,n){ s.classList.toggle('active',n===cur); });
      dots.forEach(function(d,n){ d.classList.toggle('active',n===cur); });
    }
    function start(){ stop(); timer=setInterval(function(){ show(cur+1); },4000); }
    function stop(){ if(timer){ clearInterval(timer); timer=null; } }
    window.go=function(i){ show(i); start(); };
    start();
  })();

  window.go=go;
};

/* ---------- LOGIN PAGE ---------- */
JuicyLife.pages.login=function(){
  // Login is verified by the server (app.py) which sets the session.
  // localStorage flag kept for compatibility with older page scripts.
  document.getElementById("loginForm").addEventListener("submit", function(){
    localStorage.setItem("isLoggedIn","true");
  });

};

/* ---------- DASHBOARD PAGE ---------- */
JuicyLife.pages.dashboard=function(){
  function getGrouped(){
    let map={};
    let flat=JSON.parse(localStorage.getItem('juicy_final_flat')||'[]');
    flat.forEach(p=>{
      let k=(p.fruit||p.name||'').toString().toUpperCase().trim();
      if(!k) return;
      if(!map[k]) map[k]={qty:0,totalCost:0,expiry:p.expiry||p.edate||''};
      map[k].qty+=Number(p.totalQty||p.qty||0);
      map[k].totalCost+=Number(p.perPieceCost||p.price||0)*Number(p.totalQty||p.qty||0);
      if(p.expiry) map[k].expiry=p.expiry;
    });
    return map;
  }
  function getSP(){ let out={}; try{ let sp=JSON.parse(localStorage.getItem('juicy_selling_price')||'{}'); for(let k in sp){ out[k.toUpperCase().replace(' JUICE','').trim()]=Number(sp[k].sellingPrice||sp[k].price||sp[k]||20);} }catch(e){} return out;}
  function load(){
    let grouped=getGrouped();
    let spMap=getSP();
    let totalProducts=Object.keys(grouped).length;
    let totalQty=Object.values(grouped).reduce((a,b)=>a+b.qty,0);
    document.getElementById('totalProducts').innerText=totalProducts;
    document.getElementById('totalQty').innerText=totalQty;
    document.getElementById('lowStock').innerText=Object.values(grouped).filter(g=>g.qty<10).length;
    document.getElementById('purchaseToday').innerText=JSON.parse(localStorage.getItem('juicy_final_flat')||'[]').filter(p=>{ try{return new Date(p.date||p.purchaseDate||Date.now()).toDateString()===new Date().toDateString()}catch{return false}}).length;

    let bills=JSON.parse(localStorage.getItem('bills')||'[]');
    let sales=JSON.parse(localStorage.getItem('juicySales')||'[]');
    let data=bills.length?bills:sales;
    let todayStr=new Date().toLocaleDateString();
    let todayBills=data.filter(b=>{ let d=b.dateOnly||b.date||''; return d===todayStr || (b.dateISO && new Date(b.dateISO).toLocaleDateString()===todayStr) });
    let todaySales=todayBills.reduce((a,b)=>a+Number(b.total||b.amount||0),0);
    let todayProfit=todayBills.reduce((a,b)=>a+Number(b.profit||0),0);
    let allSales=data.reduce((a,b)=>a+Number(b.total||b.amount||0),0);
    let dailyProfitTotal=data.reduce((a,b)=>a+Number(b.profit||0),0);
    let wastageLoss=0; try{ wastageLoss=(JSON.parse(localStorage.getItem('juicy_wastage_lotwise')||'[]')).reduce((a,w)=>a+Number(w.loss||0),0); }catch(e){}
    let allProfit=dailyProfitTotal-wastageLoss;   /* all daily profits minus loss from wasted / expired fruits */

    document.getElementById('todaySales').innerText='₹'+todaySales;
    document.getElementById('todayProfit').innerText='₹'+todayProfit.toFixed(0);
    document.getElementById('allSales').innerText='₹'+allSales;
    document.getElementById('allProfit').innerText='₹'+allProfit.toFixed(0);

    document.getElementById('salesTable').innerHTML=todayBills.slice(-8).reverse().map(b=>`<tr><td>${b.customer}</td><td>₹${b.total||b.amount}</td><td>₹${Number(b.totalCost||b.cost||0).toFixed(0)}</td><td class="profit-text">₹${Number(b.profit||0).toFixed(0)}</td><td>${b.time||''}</td></tr>`).join('')||'<tr><td colspan="5" style="color:#94a3b8;text-align:center">No sales today - Clear old bills once then make new bill</td></tr>';

    document.getElementById('stockOverview').innerHTML=Object.keys(grouped).map(k=>{
      let qty=grouped[k].qty;
      let cost=qty? (grouped[k].totalCost/qty):10;
      let sp=spMap[k]||20;
      let profit=sp-cost;
      return `<tr><td><b>${k}</b></td><td>${qty}</td><td>₹${cost.toFixed(1)}</td><td>₹${sp}</td><td class="profit-text">₹${profit.toFixed(1)}</td></tr>`;
    }).join('')||'<tr><td colspan="5">No stock</td></tr>';

    document.getElementById('expiryTable').innerHTML=Object.keys(grouped).map(k=>{
      let exp=grouped[k].expiry||'2026-09-24';
      let diff=Math.ceil((new Date(exp)-new Date())/86400000);
      let color=diff<3?'#ef4444':diff<7?'#eab308':'#16a34a';
      return `<tr><td><b>${k}</b></td><td>${exp}</td><td style="color:${color};font-weight:700">${diff} days</td></tr>`;
    }).join('');
  }
  load();setInterval(load,2000);

};

/* ---------- STOCK PAGE ---------- */
JuicyLife.pages.stock=function(){
  function safe(n,d=0){let x=Number(n);return isNaN(x)?d:x;}

  function getAllLots(){
   let lots=[];
   try{let a=JSON.parse(localStorage.getItem('juicy_final_flat')||'[]');
    a.forEach(p=>{if((p.fruit||p.name)&&safe(p.totalQty||p.qty)>0){lots.push({id:String(p.id||Date.now()+Math.random()), fruit:(p.fruit||p.name).toString().toUpperCase(), totalQty:safe(p.totalQty||p.qty), perPieceCost:safe(p.perPieceCost||p.costPerPc||safe(p.price)/safe(p.totalQty||1)), expiry:p.expiry||"-", vendor:p.vendor||"Vendor A", formatShort:p.formatShort||(p.pType==='lot'?'LOT':'PIECE'), qtyPerLot:p.qtyPerLot||p.totalQty, numLots:p.numLots||1, date:p.date||'', initialQty:Math.max(safe(p.initialQty), safe(p.totalQty||p.qty))});}});}catch(e){}
   return lots;
  }
  function saveLots(all){
   localStorage.setItem('juicy_final_flat', JSON.stringify(all.map(l=>({id:l.id, fruit:l.fruit, totalQty:l.totalQty, price:l.totalQty*l.perPieceCost, perPieceCost:l.perPieceCost, expiry:l.expiry, vendor:l.vendor, formatShort:l.formatShort, qtyPerLot:l.qtyPerLot, numLots:l.numLots, date:l.date, initialQty:l.initialQty}))));
  }
  let purchases=getAllLots();
  let currentWastageFruit=null;

  function addStock(){
   let name=document.getElementById("sName").value.trim().toUpperCase();
   let price=parseFloat(document.getElementById("sPrice").value);
   let qty=parseInt(document.getElementById("sQty").value);
   if(!name||isNaN(price)||isNaN(qty)){alert("Fill all");return}
   let all=getAllLots();
   all.unshift({id:Date.now().toString(), fruit:name, totalQty:qty, perPieceCost:price, expiry:"-", vendor:"Manual", formatShort:"PIECE", qtyPerLot:qty, numLots:1, initialQty:qty});
   saveLots(all);
   document.getElementById("sName").value="";document.getElementById("sPrice").value="";document.getElementById("sQty").value="";
   init();
  }

  function init(){
   purchases=getAllLots();
   let grouped={}; purchases.forEach(p=>{if(!grouped[p.fruit]) grouped[p.fruit]={totalQty:0,costs:[]};
    grouped[p.fruit].totalQty+=safe(p.totalQty); grouped[p.fruit].costs.push(safe(p.perPieceCost));});
   let fruits=Object.keys(grouped).sort();
   let wFruitSel=document.getElementById('wFruit');
   let prev=wFruitSel.value||currentWastageFruit||fruits[0];
   wFruitSel.innerHTML=fruits.map(f=>`<option value="${f}" ${f===prev?'selected':''}>${f}</option>`).join('');
   if(!prev && fruits[0]) wFruitSel.value=fruits[0];
   currentWastageFruit=wFruitSel.value;
   updateLotDropdown();
   renderStockTableOnly();
   renderSP();
  }

  function renderStockTableOnly(){
   let allLots=getAllLots().filter(l=>safe(l.totalQty)>0);
   purchases=allLots;
   let grouped={};
    allLots.forEach(p=>{if(!grouped[p.fruit]) grouped[p.fruit]={totalQty:0,costs:[]};
     grouped[p.fruit].totalQty+=safe(p.totalQty);
     grouped[p.fruit].costs.push(safe(p.perPieceCost));});
   let totalQty=0, low=0; Object.values(grouped).forEach(g=>{totalQty+=g.totalQty;
    if(g.totalQty<10) low++;});
   document.getElementById("totalItems").innerText=Object.keys(grouped).length;
   document.getElementById("totalQty").innerText=totalQty;
   document.getElementById("lowStock").innerText=low;
   let search=document.getElementById("search").value.toUpperCase();
   let body=document.getElementById("stockBody"); body.innerHTML="";
   let fifo=allLots.slice().sort((a,b)=>{if(a.expiry==='-')return 1;
    if(b.expiry==='-')return -1; return new Date(a.expiry)-new Date(b.expiry);});
   fifo.forEach(it=>{
    if(search &&!it.fruit.includes(search)) return;
    let g=grouped[it.fruit];
    let cheapest=g?Math.min(...g.costs.filter(c=>c>0)):safe(it.perPieceCost);
    let status=it.totalQty<10?`<span class="low">Low</span>`:`<span style="color:#16a34a">In Stock</span>`;
    let badge=it.formatShort==='LOT'?`<span class="badge b-lot">LOT</span> ${it.qtyPerLot}x${it.numLots}`:`<span class="badge b-piece">PIECE</span>`;
    body.innerHTML+=`<tr><td><b>${it.fruit}</b></td><td>₹${safe(it.perPieceCost).toFixed(2)}</td><td><b>${safe(it.totalQty)}</b></td><td><b>${safe(it.initialQty)||safe(it.totalQty)}</b></td><td>₹${cheapest.toFixed(2)}</td><td>${badge}</td><td>${it.expiry}</td><td>${status}</td><td><button class="btn-red" onclick="deleteLot('${it.id}')">Delete</button></td></tr>`;
   });
   let wastage=JSON.parse(localStorage.getItem('juicy_wastage_lotwise')||'[]');
   let tl=0;
   document.getElementById('lossBody').innerHTML=wastage.map(w=>{tl+=safe(w.loss);return `<tr><td>${w.date}</td><td>${w.fruit}</td><td>${w.qty}</td><td>₹${safe(w.loss).toFixed(2)}</td></tr>`;}).join('')||'<tr><td colspan=4>No loss</td></tr>';
   document.getElementById('totalLoss').innerText=tl.toFixed(2);
  }

  function updateLotDropdown(){
   let fruit=document.getElementById('wFruit').value;
   currentWastageFruit=fruit;
   if(!fruit) return;
   let lots=purchases.filter(p=>p.fruit===fruit).sort((a,b)=>{if(a.expiry==='-')return 1;
   if(b.expiry==='-')return -1; return new Date(a.expiry)-new Date(b.expiry);});
   document.getElementById('wLot').innerHTML=lots.map(p=>`<option value="${p.id}">${p.fruit} | ${p.expiry} | ${safe(p.totalQty)} left | ₹${safe(p.perPieceCost).toFixed(2)} | ${p.vendor} | ${p.formatShort}</option>`).join('')||`<option value="">No lot for ${fruit}</option>`;
   showLotInfo();
  }

  function showLotInfo(){
   let lotId=document.getElementById('wLot').value;
   let lot=purchases.find(p=>String(p.id)===String(lotId));
   if(!lot){document.getElementById('lotInfo').innerHTML=`No lot for ${document.getElementById('wFruit').value}`;return;}
   let cheapest=Math.min(...purchases.filter(p=>p.fruit===lot.fruit).map(p=>safe(p.perPieceCost)).filter(c=>c>0))||safe(lot.perPieceCost);
   document.getElementById('lotInfo').innerHTML=`Selected: <b>${lot.fruit}</b> | Qty: <b>${safe(lot.totalQty)}</b> | Cheapest: <b>₹${cheapest.toFixed(2)}</b>`;
  }

  function addWastage(){
   let fruit=document.getElementById('wFruit').value;
   let lotId=document.getElementById('wLot').value;
   let qty=safe(document.getElementById('wQty').value,0);
   let reason=document.getElementById('wReason').value;
   if(qty<=0){alert('Enter wasted qty');return;}
   let all=getAllLots();
   let idx=all.findIndex(l=>String(l.id)===String(lotId));
   if(idx<0){alert('Select lot for '+fruit);return;}
   if(qty>safe(all[idx].totalQty)){alert('Only '+all[idx].totalQty+' left');return;}
   let cheapest=Math.min(...all.filter(p=>p.fruit===fruit).map(p=>safe(p.perPieceCost)).filter(c=>c>0))||safe(all[idx].perPieceCost);
   let loss=qty*cheapest;
   all[idx].totalQty=safe(all[idx].totalQty)-qty;
   if(all[idx].totalQty<=0) all.splice(idx,1);
   saveLots(all);
   let w=JSON.parse(localStorage.getItem('juicy_wastage_lotwise')||'[]');
   w.unshift({date:new Date().toISOString().split('T')[0],fruit,qty,loss,cheapest,reason});
   localStorage.setItem('juicy_wastage_lotwise',JSON.stringify(w));
   document.getElementById('wQty').value='';
   init();
  }

  function deleteLot(id){if(!confirm('Delete lot?'))return; 
  let all=getAllLots().filter(l=>String(l.id)!==String(id)); 
  saveLots(all); init();}

  function getSellingPrices(){return JSON.parse(localStorage.getItem('juicy_selling_price')||'{}');}

  function saveSellingPrice(){
    let f=document.getElementById('spFruit').value;
    let p=parseFloat(document.getElementById('spPrice').value);
    if(!f||isNaN(p)){alert('Enter selling price');return;}
    let sp=getSellingPrices(); sp[f]=p;
    localStorage.setItem('juicy_selling_price', JSON.stringify(sp));
    document.getElementById('spPrice').value='';
    renderSP();
  }

  function renderSP(){
    let all=getAllLots();
    let grouped={};
    all.forEach(p=>{if(!grouped[p.fruit]) grouped[p.fruit]={costs:[]}; grouped[p.fruit].costs.push(safe(p.perPieceCost));});
    let sp=getSellingPrices();
    let fruits=Object.keys(grouped).sort();
    document.getElementById('spFruit').innerHTML=fruits.map(f=>`<option value="${f}">${f} Juice</option>`).join('')||'<option>No fruit</option>';
    document.getElementById('spBody').innerHTML=fruits.map(f=>{
      let cheapest=Math.min(...grouped[f].costs.filter(c=>c>0))||0;
      let sell=sp[f]||'';
      let profit = sell? (sell - cheapest).toFixed(2) : '-';
      let juiceName = f.charAt(0) + f.slice(1).toLowerCase() + ' Juice';
      return `<tr>
        <td><b>${juiceName}</b></td>
        <td>₹${cheapest.toFixed(2)}</td>
        <td>${sell?`₹${sell}`:'<span style="color:#ef4444">Not set</span>'}</td>
        <td style="color:#16a34a;font-weight:800">${sell?`₹${profit}`:'-'}</td>
        <td><button class="btn-red" onclick="deleteSP('${f}')">Delete</button></td>
      </tr>`;
    }).join('')||'<tr><td colspan=5>Add supply first</td></tr>';
  }

  function deleteSP(f){let sp=getSellingPrices(); 
    delete sp[f]; localStorage.setItem('juicy_selling_price', JSON.stringify(sp)); 
    renderSP();}
  document.addEventListener("DOMContentLoaded", init);

  window.updateLotDropdown=updateLotDropdown;
  window.showLotInfo=showLotInfo;
  window.addWastage=addWastage;
  window.renderStockTableOnly=renderStockTableOnly;
  window.saveSellingPrice=saveSellingPrice;
  window.deleteLot=deleteLot;
  window.deleteSP=deleteSP;
  window.addStock=addStock;
};

/* ---------- VENDOR PAGE ---------- */
JuicyLife.pages.vendor=function(){
  /* ===== Juicy Life - Vendor page =====*/
  var LOTS_KEY='juicy_final_flat', LOG_KEY='juicy_vendor_log';

  function safe(n,d){ if(d===undefined) d=0; var x=Number(n); return (n===''||n===null||n===undefined||isNaN(x))?d:x; }
  function readList(k){ try{ var a=JSON.parse(localStorage.getItem(k)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function writeList(k,a){ localStorage.setItem(k,JSON.stringify(a)); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function localISO(d){ d=d||new Date(); var m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return d.getFullYear()+'-'+m+'-'+dd; }
  function daysLeft(exp){ if(!exp||exp==='-') return null; var e=new Date(exp+'T00:00:00'); if(isNaN(e)) return null; var t=new Date(); t.setHours(0,0,0,0); return Math.round((e-t)/86400000); }

  function toggleLot(){
   let t=document.getElementById('pType').value;
   let lotFields = document.getElementById('lotFields');
   let sq = document.getElementById('sq');
   let qtyPerLotInput = document.getElementById('qtyPerLot');
   let numLotsInput = document.getElementById('numLots');

   if(t==='lot'){
     lotFields.style.display='block';
     sq.style.display='none';
     sq.removeAttribute('required');
     qtyPerLotInput.setAttribute('required','required');
     numLotsInput.setAttribute('required','required');
     document.getElementById('qtyLabel').innerText='Supply Quantity (Auto)';
   } else {
     lotFields.style.display='none';
     sq.style.display='block';
     sq.setAttribute('required','required');
     qtyPerLotInput.removeAttribute('required');
     numLotsInput.removeAttribute('required');
     document.getElementById('qtyLabel').innerText='Supply Quantity (Qty)';
   }
   calc();
  }

  function calc(){
   let type=document.getElementById('pType').value;
   let perLot=safe(document.getElementById('qtyPerLot').value);
   let lots=safe(document.getElementById('numLots').value,1);
   let single=safe(document.getElementById('sq').value);
   let totalPrice=safe(document.getElementById('totalPrice').value);

   let total = 0;
   if(type==='lot'){
     total = perLot * lots;
     document.getElementById('sq').value = total>0 ? total : '';
   } else {
     total = single;
   }

   document.getElementById('totalCalc').innerText=total;
   document.getElementById('perPc').innerText= total>0? `₹${(totalPrice/total).toFixed(2)}` : '₹0';
   document.getElementById('formatPreview').innerText= type==='lot'? `LOT ${perLot||0} x ${lots} = ${total} pcs` : 'PIECE';
   return total;
  }

  function saveSupply(e){
   if(e) e.preventDefault();
   let vendor=document.getElementById('vn').value;
   let type=document.getElementById('pType').value;
   let item=document.getElementById('si').value;
   let perLot=safe(document.getElementById('qtyPerLot').value);
   let lots=safe(document.getElementById('numLots').value,1);
   let totalQty=calc();
   let totalPrice=safe(document.getElementById('totalPrice').value);
   let sd=document.getElementById('sd').value;
   let ed=document.getElementById('ed').value;
   let cn=document.getElementById('cn').value.trim();
   let ps=document.getElementById('ps').value;

   if(!vendor){ alert('Please select a vendor'); return false; }
   if(type==='lot'){
     if(perLot<=0 || lots<=0){ alert('Enter pieces per lot and number of lots'); return false; }
     if(perLot!==Math.floor(perLot) || lots!==Math.floor(lots)){ alert('Pieces per lot and number of lots must be whole numbers'); return false; }
   }
   if(!(totalQty>0)){ alert('Enter a supply quantity greater than 0'); return false; }
   if(totalQty!==Math.floor(totalQty)){ alert('Quantity must be a whole number of pieces'); return false; }
   if(!(totalPrice>0)){ alert('Enter the total price (greater than 0)'); return false; }
   if(!sd){ alert('Select the supply date'); return false; }
   if(!ed){ alert('Select the expiration date'); return false; }
   if(ed<sd){ alert('Expiration date cannot be before the supply date'); return false; }
   if(!cn){ alert('Enter the contact number'); return false; }

   let perPc = totalPrice/totalQty;
   let id = String(Date.now())+String(Math.floor(Math.random()*1000));
   let formatShort = type==='lot' ? 'LOT' : 'PIECE';
   let formatFull = type==='lot' ? `LOT ${perLot} x ${lots} = ${totalQty} pcs` : 'PIECE';

   /* 1) Stock lot - read by Stock, Billing, Dashboard, Report */
   let stock=readList(LOTS_KEY);
   stock.push({
     id:id, fruit:item.toUpperCase(), totalQty:totalQty, initialQty:totalQty, price:totalPrice, perPieceCost:perPc,
     expiry:ed, vendor:vendor, formatShort:formatShort, pType:type,
     qtyPerLot: type==='lot'?perLot:totalQty, numLots: type==='lot'?lots:1, date:sd
   });
   writeList(LOTS_KEY,stock);

   /* 2) Vendor supply log - shown in Active Supply table */
   let log=readList(LOG_KEY);
   log.push({
     id:id, vendor:vendor, item:item, pType:type, format:formatFull, qty:totalQty,
     price:totalPrice, perPc:perPc, supplyDate:sd, expiry:ed, contact:cn, payment:ps
   });
   writeList(LOG_KEY,log);

   document.getElementById('vf').reset();
   document.getElementById('numLots').value=1;
   document.getElementById('sd').value=localISO();
   toggleLot();
   render();
   showExpiryPopup();
   return false;
  }

  function deleteSupply(id){
   if(!confirm('Delete this supply entry? Remaining stock of this lot will also be removed from Stock.')) return;
   writeList(LOG_KEY, readList(LOG_KEY).filter(function(x){return String(x.id)!==String(id);}));
   writeList(LOTS_KEY, readList(LOTS_KEY).filter(function(x){return String(x.id)!==String(id);}));
   render();
  }

  function togglePay(id){
   let log=readList(LOG_KEY);
   log.forEach(function(x){ if(String(x.id)===String(id)) x.payment = (x.payment==='Paid') ? 'Not Paid' : 'Paid'; });
   writeList(LOG_KEY,log);
   render();
  }

  function render(){
   let log=readList(LOG_KEY);
   let names={}, qty=0, soon=0;
   log.forEach(function(x){
     names[x.vendor]=1; qty+=safe(x.qty);
     let d=daysLeft(x.expiry); if(d!==null && d<=7) soon++;
   });
   document.getElementById('v1').innerText=Object.keys(names).length;
   document.getElementById('v2').innerText=qty;
   document.getElementById('v3').innerText=soon;

   let rows=log.slice().reverse().map(function(x){
     let d=daysLeft(x.expiry);
     let cls = d===null?'' : d<0?'row-expire' : d<=3?'row-expire' : d<=7?'row-warn' : '';
     let pay = x.payment==='Paid' ? '<span class="badge paid">Paid</span>' : '<span class="badge unpaid">Not Paid</span>';
     let exp = d!==null && d<0 ? ' <span class="badge expire">Expired</span>' : '';
     let typeBadge = x.pType==='lot' ? '<span class="badge lot">LOT</span>' : '<span class="badge piece">PIECE</span>';
     return `<tr class="${cls}"><td>${esc(x.vendor)}</td><td><b>${esc(x.item)}</b></td><td>${typeBadge}</td><td>${esc(x.format)}</td><td>${esc(x.qty)}</td><td>₹${safe(x.price).toFixed(2)}</td><td>₹${safe(x.perPc).toFixed(2)}</td><td>${esc(x.expiry)}</td><td><span style="cursor:pointer" title="Click to change payment status" onclick="togglePay('${esc(x.id)}')">${pay}</span>${exp}</td><td><button type="button" class="btn-delete" onclick="deleteSupply('${esc(x.id)}')">Delete</button></td></tr>`;
   }).join('');
   document.getElementById('tb').innerHTML = rows || '<tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:20px">No supply entries yet</td></tr>';
  }

  function showExpiryPopup(){
   let pop=document.getElementById('expiryPopup');
   let msgs=[], worst=99;
   readList(LOG_KEY).forEach(function(x){
     let d=daysLeft(x.expiry); if(d===null || d>3) return;
     worst=Math.min(worst,d);
     msgs.push(esc(x.item)+' ('+esc(x.vendor)+') - '+(d<0?'expired':d===0?'expires today':'expires in '+d+' day'+(d===1?'':'s')));
   });
   if(!msgs.length){ pop.style.display='none'; return; }
   pop.innerHTML='<div class="popup-box'+(worst<0?'':' warn')+'"><b>⚠️ Expiry Alert</b><br>'+msgs.slice(0,4).join('<br>')+(msgs.length>4?'<br>+'+(msgs.length-4)+' more':'')+'</div>';
   pop.style.display='block';
   setTimeout(function(){ pop.style.display='none'; },6000);
  }

  document.addEventListener('DOMContentLoaded',function(){
   document.getElementById('sd').value=localISO();
   document.getElementById('vf').addEventListener('submit',saveSupply);
   toggleLot();
   render();
   showExpiryPopup();
  });

  window.toggleLot=toggleLot;
  window.calc=calc;
  window.togglePay=togglePay;
  window.deleteSupply=deleteSupply;
};

/* ---------- BILLING PAGE ---------- */
JuicyLife.pages.billing=function(){
  /* ===== Juicy Life - Billing page ==== */
  var LOTS_KEY='juicy_final_flat', SP_KEY='juicy_selling_price';
  var cart=[];

  function safe(n,d){ if(d===undefined) d=0; var x=Number(n); return (n===''||n===null||n===undefined||isNaN(x))?d:x; }
  function readJSON(k,def){ try{ var v=JSON.parse(localStorage.getItem(k)); return (v===null||v===undefined)?def:v; }catch(e){ return def; } }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function localISO(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function getLots(){ var a=readJSON(LOTS_KEY,[]); return Array.isArray(a)?a:[]; }
  function getSP(){ var o=readJSON(SP_KEY,{}); return (o&&typeof o==='object')?o:{}; }
  function sellPrice(sp,f){ var v=sp[f]; if(v&&typeof v==='object') v=v.sellingPrice||v.price; return safe(v); }
  function titleCase(f){ return f.charAt(0)+f.slice(1).toLowerCase(); }

  /* fruit -> {qty, cheapest cost} */
  function stockMap(){
    var m={};
    getLots().forEach(function(l){
      var f=String(l.fruit||l.name||'').toUpperCase().trim(); var q=safe(l.totalQty||l.qty);
      if(!f||q<=0) return;
      if(!m[f]) m[f]={qty:0,costs:[]};
      m[f].qty+=q;
      var c=safe(l.perPieceCost); if(c>0) m[f].costs.push(c);
    });
    Object.keys(m).forEach(function(f){ m[f].cheapest = m[f].costs.length? Math.min.apply(null,m[f].costs) : 0; });
    return m;
  }
  function inCart(f){ return cart.filter(function(c){return c.fruit===f;}).reduce(function(a,c){return a+c.qty;},0); }

  function loadJuices(){
    var sel=document.getElementById('juiceSelect'), prev=sel.value;
    var m=stockMap(), sp=getSP(), fruits=Object.keys(m).sort();
    if(!fruits.length){
      sel.innerHTML='<option value="">No stock - add supply in Vendor page</option>';
    } else {
      sel.innerHTML=fruits.map(function(f){
        var p=sellPrice(sp,f);
        return '<option value="'+esc(f)+'">'+esc(titleCase(f))+' Juice'+(p>0?' - ₹'+p:' (set price in Stock)')+'</option>';
      }).join('');
      if(prev && m[prev]) sel.value=prev;
    }
    showCost();
  }

  function showCost(){
    var f=document.getElementById('juiceSelect').value, el=document.getElementById('costInfo');
    var m=stockMap();
    if(!f||!m[f]){ el.innerText=''; return; }
    var p=sellPrice(getSP(),f), left=m[f].qty-inCart(f);
    el.innerText='Cost ₹'+m[f].cheapest.toFixed(2)+' | '+(p>0?'Selling ₹'+p+' | Profit ₹'+(p-m[f].cheapest).toFixed(2):'Selling price not set')+' | In stock: '+left;
  }

  function addToBill(){
    var f=document.getElementById('juiceSelect').value;
    var q=safe(document.getElementById('qty').value);
    var m=stockMap();
    if(!f||!m[f]){ alert('No stock available. Add supply in the Vendor page first.'); return; }
    if(!(q>0) || q!==Math.floor(q)){ alert('Enter a valid whole-number quantity'); return; }
    var p=sellPrice(getSP(),f);
    if(!(p>0)){ alert('Set the selling price for '+titleCase(f)+' Juice in the Stock page first.'); return; }
    var left=m[f].qty-inCart(f);
    if(q>left){ alert('Only '+left+' left in stock for '+titleCase(f)); return; }
    var cost=m[f].cheapest;
    var ex=cart.filter(function(c){return c.fruit===f;})[0];
    if(ex){ ex.qty+=q; ex.sp=p; ex.cost=cost; ex.profit=p-cost; ex.total=ex.qty*p; }
    else { cart.push({fruit:f, juiceName:titleCase(f)+' Juice', qty:q, sp:p, cost:cost, profit:p-cost, total:q*p}); }
    document.getElementById('qty').value=1;
    render(); showCost();
  }

  function removeItem(i){ cart.splice(i,1); render(); showCost(); }

  function render(){
    var total=cart.reduce(function(a,c){return a+c.total;},0);
    var profit=cart.reduce(function(a,c){return a+c.profit*c.qty;},0);
    document.getElementById('billTable').innerHTML = cart.map(function(c,i){
      return '<tr><td>'+esc(c.juiceName)+'</td><td>₹'+c.sp+'</td><td>'+c.qty+'</td><td>₹'+c.total+'</td><td><button type="button" onclick="removeItem('+i+')" style="background:#ef4444;color:white;border:none;border-radius:6px;padding:3px 8px;cursor:pointer">✕</button></td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:14px">No items added</td></tr>';
    document.getElementById('grandText').innerText='Grand: ₹'+total;
    document.getElementById('profitText').innerText = cart.length ? 'Profit hidden from customer' : 'Profit hidden from customer';

    var cust=document.getElementById('customerName').value.trim();
    var d=new Date();
    document.getElementById('invDate').innerText=d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
    document.getElementById('invCustomer').innerText='Customer: '+(cust||'-');
    document.getElementById('invNo').innerText=nextInvoiceNo(false);
    document.getElementById('invItems').innerHTML = cart.length ? cart.map(function(c){
      return '<tr><td>'+esc(c.juiceName)+'</td><td>'+c.sp+'</td><td>'+c.qty+'</td><td>'+c.total+'</td></tr>';
    }).join('') : '<tr><td colspan="4" style="text-align:center;padding:40px 0;color:#94a3b8">No items</td></tr>';
    document.getElementById('invTotal').innerText='TOTAL ₹ '+total+'₹';
  }

  function nextInvoiceNo(consume){
    var n=safe(localStorage.getItem('juicy_invoice_no'),250)+1;
    if(consume) localStorage.setItem('juicy_invoice_no',String(n));
    return String(n).padStart(7,'0');
  }

  /* FIFO: take sold quantity from the earliest-expiry lots first */
  function deductStock(){
    var lots=getLots();
    var order=lots.slice().sort(function(a,b){
      var ea=(a.expiry&&a.expiry!=='-')?new Date(a.expiry).getTime():Infinity;
      var eb=(b.expiry&&b.expiry!=='-')?new Date(b.expiry).getTime():Infinity;
      return ea-eb;
    });
    cart.forEach(function(c){
      var need=c.qty;
      order.forEach(function(l){
        if(need<=0) return;
        if(String(l.fruit||l.name||'').toUpperCase().trim()!==c.fruit) return;
        var av=safe(l.totalQty||l.qty);
        if(av<=0) return;
        var take=Math.min(av,need);
        l.totalQty=av-take; need-=take;
        l.price=l.totalQty*safe(l.perPieceCost);
      });
    });
    localStorage.setItem(LOTS_KEY, JSON.stringify(lots.filter(function(l){ return safe(l.totalQty||l.qty)>0; })));
  }

  function generateAndPrint(){
    if(!cart.length){alert('Add items');return;}
    var printWin=window.open('','_blank');
    /* re-check stock right before saving (stock may have changed in another tab) */
    var m=stockMap();
    for(var i=0;i<cart.length;i++){
      if(!m[cart[i].fruit] || cart[i].qty>m[cart[i].fruit].qty){ alert('Not enough stock for '+cart[i].juiceName+'. Please adjust the bill.'); if(printWin) printWin.close(); loadJuices(); return; }
    }
    let customer=document.getElementById('customerName').value||'Customer';
    let total=cart.reduce((a,b)=>a+b.total,0);
    let cost=cart.reduce((a,b)=>a+b.cost*b.qty,0);
    let profit=cart.reduce((a,b)=>a+b.profit*b.qty,0);
    let todayISO = localISO();

    let bill={
      customer, total, grandTotal: total, amount: total, sale: total,
      totalCost: cost, cost: cost, profit: profit,
      date: todayISO, billDate: todayISO, dateOnly: todayISO,
      dateISO: new Date().toISOString(), createdAt: todayISO,
      time: new Date().toLocaleTimeString(),
      items: cart.map(c=>({ fruit:c.fruit, name:c.juiceName, juiceName:c.juiceName, qty:c.qty, quantity:c.qty, price:c.sp, sellPrice:c.sp, sp:c.sp, cost:c.cost, perPieceCost:c.cost }))
    };

    let allKeys = ['juicy_bills','bills','billingData','salesData','juicySales'];
    let bills = JSON.parse(localStorage.getItem('juicy_bills')||'[]');
    bills.push(bill);
    allKeys.forEach(k=> localStorage.setItem(k, JSON.stringify(bills)));

    localStorage.setItem('lastSaleUpdate', Date.now());
    var invNo=nextInvoiceNo(true);
    document.getElementById('invNo').innerText=invNo;
    var d=new Date();
    var printData={ no:invNo, date:d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(), customer:document.getElementById('customerName').value.trim()||'-', total:total,
      items:cart.map(function(c){ return {name:c.juiceName, price:c.sp, qty:c.qty, total:c.total}; }) };
    deductStock();
    if(printWin && !printWin.closed){ writeBillWindow(printWin, printData); }
    else { window.print(); }   /* popup blocked -> print this page instead */
    cart=[]; document.getElementById('customerName').value='';
    render();
    loadJuices();
  }

  /* Opens the finished bill as a separate A4 page, ready for hard copy (Print / Save as PDF) */
  function writeBillWindow(w, p){
    var rows=p.items.map(function(i){ return '<tr><td>'+esc(i.name)+'</td><td>'+i.price+'</td><td>'+i.qty+'</td><td>'+i.total+'</td></tr>'; }).join('');
    var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bill '+esc(p.no)+' - Juicy Life</title><style>'+
    '@page{size:A4 portrait;margin:12mm}'+
    '*{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
    'body{background:#f1f5f9;padding:20px}'+
    '.bar{max-width:150mm;margin:0 auto 14px;display:flex;gap:10px;justify-content:center}'+
    '.bar button{background:#0f172a;color:#fff;border:none;border-radius:8px;padding:10px 22px;font-weight:700;cursor:pointer;font-size:14px}'+
    '.bar button.g{background:#15803d}'+
    '.outer{width:150mm;margin:0 auto;background:url("https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80") center/cover;border-radius:16px;padding:10px}'+
    '.inv{background:#fff;border-radius:8px;overflow:hidden;min-height:140mm}'+
    '.h{background:#d9812e;color:#fff;padding:16px;text-align:center;position:relative;height:112px}'+
    '.h h1{font-family:Georgia,serif;font-size:34px;line-height:.95;color:#1a0a00;font-weight:700;letter-spacing:.5px}'+
    '.sub{position:absolute;left:14px;bottom:8px;font-size:10px;line-height:1.25;text-align:left;font-weight:700}'+
    '.meta{position:absolute;right:14px;bottom:8px;font-size:10px;line-height:1.35;text-align:right;font-weight:600}'+
    '.b{padding:18px 16px}'+
    'table{width:100%;border-collapse:collapse}'+
    'th{font-size:12px;font-weight:900;color:#000;padding:9px 3px;text-align:left;border-bottom:1.5px solid #000}'+
    'td{font-size:13px;padding:9px 3px;color:#000;text-align:left;border-bottom:1px dashed #eee}'+
    'th:nth-child(n+2),td:nth-child(n+2){text-align:center}'+
    '.tot{margin-top:24px;font-size:15px;font-weight:900;color:#7f1d1d;text-align:right}'+
    '.th{margin-top:14px;font-size:14px;font-weight:900;color:#9b1c3a;text-align:center;font-style:italic;letter-spacing:.3px}'+
    '@media print{body{background:#fff;padding:0}.bar{display:none}.outer{box-shadow:none}}'+
    '</style></head><body>'+
    '<div class="bar"><button class="g" onclick="window.print()">🖨 Print / Save as PDF</button><button onclick="window.close()">Close</button></div>'+
    '<div class="outer"><div class="inv"><div class="h"><h1>Juicy<br>Life</h1>'+
    '<div class="sub">ASLI PHAL<br>ASLI TASTE<br>SQUEEZE THE DAY</div>'+
    '<div class="meta">NO '+esc(p.no)+'<br>DATE '+esc(p.date)+'<br>Customer: '+esc(p.customer)+'</div></div>'+
    '<div class="b"><table><thead><tr><th>DESCRIPTION</th><th>PRICE ₹</th><th>QUANTITY<br>GLASS</th><th>TOTAL R</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<div class="tot">TOTAL ₹ '+p.total+'₹</div><div class="th">THANKS FOR VISITING</div></div></div></div>'+
    '<script>setTimeout(function(){window.print();},600);<\/script></body></html>';
    w.document.open(); w.document.write(html); w.document.close(); w.focus();
  }

  document.addEventListener('DOMContentLoaded',function(){
    document.getElementById('juiceSelect').addEventListener('change',showCost);
    document.getElementById('customerName').addEventListener('input',render);
    loadJuices();
    render();
  });

  window.addToBill=addToBill;
  window.generateAndPrint=generateAndPrint;
  window.removeItem=removeItem;
};

/* ---------- REPORT PAGE ---------- */
JuicyLife.pages.report=function(){
  function safe(n,d=0)
  {let x=Number(n);
    return isNaN(x)?d:x;}

  function getWastage()
  { try{ return JSON.parse(localStorage.getItem('juicy_wastage_lotwise')||'[]'); }catch(e){ return []; } }

  function getBills(){
    let keys=['juicy_bills','bills','billingData','salesData','juicySales'];
    for(let k of keys){
      try{ let v=JSON.parse(localStorage.getItem(k)||'[]'); if(v && v.length) return v; }catch(e){}
    }
    return [];
  }

  function parseDate(dateStr){
    if(!dateStr) return null;
    if(dateStr.includes('/')){ let p=dateStr.split('/'); if(p.length===3) return new Date(p[2],p[1]-1,p[0]); }
    let d=new Date(dateStr); return isNaN(d)?null:d;
  }

  function isInDays(dateStr, days){
    if(days>=9999) return true;
    let d=parseDate(dateStr); if(!d) return false;
    let now=new Date(); 
    now.setHours(0,0,0,0); 
    d.setHours(0,0,0,0);
    let diff=Math.ceil((now-d)/86400000);
    return diff>=0 && diff<=days;
  }

  function renderAll()
  { renderWastage(); }

  function renderWastage(){
    let days=safe(document.getElementById('period').value,30);
    let reason=document.getElementById('wReason').value;
    document.getElementById('wTitle').innerText= reason==='ALL'?'': '('+reason+')';
    let all=getWastage().filter(w=>isInDays(w.date, days));
    let filtered = reason==='ALL'? all : all.filter(w=> (w.reason||'').toLowerCase().includes(reason.toLowerCase()));
    let group = (r)=> all.filter(w=> (w.reason||'').toLowerCase()===r.toLowerCase());
    let calc = (arr)=>({qty:arr.reduce((a,b)=>a+safe(b.qty),0), loss:arr.reduce((a,b)=>a+safe(b.loss),0)});
    let cr=calc(group('Rotten')), cd=calc(group('Damaged')), ce=calc(group('Expired')), ct=calc(all);
    document.getElementById('rRotten').innerText=`${cr.qty} pcs / ₹${cr.loss.toFixed(0)}`;
    document.getElementById('rDamage').innerText=`${cd.qty} pcs / ₹${cd.loss.toFixed(0)}`;
    document.getElementById('rExpiry').innerText=`${ce.qty} pcs / ₹${ce.loss.toFixed(0)}`;
    document.getElementById('totalWastageLoss').innerText=`₹${ct.loss.toFixed(0)}`;
    document.getElementById('wastageQty').innerText=`${ct.qty} pcs`;
    document.getElementById('wBody').innerHTML = filtered.length? filtered.map(w=>{
      let badge = w.reason==='Rotten'?'b-rotten':w.reason==='Damaged'?'b-damage':'b-expire';
      return `<tr><td>${w.date}</td><td><b>${w.fruit}</b></td><td>${w.qty}</td><td><span class="badge ${badge}">${w.reason}</span></td><td>₹${safe(w.loss).toFixed(2)}</td></tr>`;
    }).join('') : '<tr><td colspan=5>No wastage found</td></tr>';

    let bills=getBills().filter(b=>isInDays(b.date||b.billDate||b.createdAt||b.dateISO, days));
    let totalSale=0,totalCost=0;
    bills.forEach(b=>{
      let sale=safe(b.total||b.grandTotal||b.amount||b.sale);
      let cost=safe(b.totalCost||b.cost);
      if(b.items){
        if(!cost) cost=b.items.reduce((a,it)=>a+safe(it.cost||it.perPieceCost||it.buyPrice)*safe(it.qty||it.quantity),0);
        if(!sale) sale=b.items.reduce((a,it)=>a+safe(it.price||it.sellPrice||it.sp)*safe(it.qty||it.quantity),0);
      }
      totalSale+=sale; 
      totalCost+=cost;
    });

    let profit=totalSale-totalCost;
    document.getElementById('totalSales').innerText=`₹${totalSale.toFixed(0)}`;
    document.getElementById('salesCount').innerText=`${bills.length} bills`;
    document.getElementById('totalProfit').innerText=`₹${profit.toFixed(0)}`;
    document.getElementById('netProfit').innerText=`₹${(profit-ct.loss).toFixed(0)}`;
    document.getElementById('sumSales').innerText=`₹${totalSale.toFixed(0)}`;
    document.getElementById('sumCost').innerText=`₹${totalCost.toFixed(0)}`;
    document.getElementById('sumProfit').innerText=`₹${profit.toFixed(0)}`;
    document.getElementById('sBody').innerHTML = bills.length? bills.slice().reverse().slice(0,100).map(b=>{
      let d=b.date||b.billDate||'-'; 
      let sale=safe(b.total||b.grandTotal||b.amount||b.sale||0); 
      let cost=safe(b.totalCost||b.cost||0);
      if(b.items){ if(!cost) cost=b.items.reduce((a,it)=>a+safe(it.cost||0)*safe(it.qty||0),0); }
      let items = b.items? b.items.map(it=>it.juiceName||it.name||it.fruit).join(', ').substring(0,30) : (b.fruit||'Sale');
      return `<tr><td>${d}</td><td>${items}</td><td>₹${sale.toFixed(0)}</td><td>₹${cost.toFixed(0)}</td><td style="color:#16a34a"><b>₹${(sale-cost).toFixed(0)}</b></td></tr>`;
    }).join('') : '<tr><td colspan=5>No billing data yet - create bill in Billing page</td></tr>';
  }

  function clearAllData(){
    if(confirm("Make ALL data zero? Sales + Wastage will be 0")){
      ['juicy_bills','bills','billingData','salesData','juicySales','juicy_wastage_lotwise']
      .forEach(k=> 
      localStorage.setItem(k, JSON.stringify([])));
      renderAll(); 
      alert("All reset to 0");
    }
  }
  renderAll();

  window.renderAll=renderAll;
  window.renderWastage=renderWastage;
  window.clearAllData=clearAllData;
};

/* ---------- start the script of the current page ---------- */
(function(){
  var page=document.body.getAttribute("data-page");
  if(page && JuicyLife.pages[page]) JuicyLife.pages[page]();
})();

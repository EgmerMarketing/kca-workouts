(function(){
'use strict';
const K=window.KCA, $=s=>document.querySelector(s), app=$('#app');
const W={}; K.workouts.forEach(w=>W[w.code]=w);
const CAT={}; K.cats.forEach(c=>CAT[c.n]=c);
const ROUNDS=c=>c.startsWith('2.')||c.startsWith('4.')||c==='3.5';
const WARM_MOVES={'1':[['bodyweight-squat','Squats'],['standing-hinge','Hip hinges'],['reverse-lunge','Reverse lunges'],['wall-push-up','Rows / wall push-ups']],
 '2':[['bodyweight-squat','Squats'],['standing-hinge','Hip hinges'],['reverse-lunge','Reverse lunges'],['wall-push-up','Rows / wall push-ups']],
 '3':[['march-in-place','March'],['squat-to-chair','Squat to chair'],['standing-hinge','Hip hinges'],['wall-push-up','Wall push-ups']],
 '4':[['march-in-place','Easy march'],['supine-brace','Relaxed breaths']],
 '5':[['march-in-place','Easy walking']]};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const linkify=s=>esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,;)])/g,'<a class="link" href="$1" target="_blank" rel="noopener">$1</a>');
const img=m=>`media/img/${m}.jpg`, vid=m=>`media/vid/${m}.mp4`;
const cat=c=>c.split('.')[0], col=c=>`var(--c${cat(c)})`;
const store={get(){try{return JSON.parse(localStorage.getItem('kca.session')||'[]').filter(c=>W[c])}catch(e){return[]}},set(a){localStorage.setItem('kca.session',JSON.stringify(a))}};
let state={q:'',cat:'all'};
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),1600)}
function toggleSession(code){const s=store.get();const i=s.indexOf(code);if(i>=0){s.splice(i,1);toast(`Removed KCA ${code} from today`)}else{s.push(code);toast(`Added KCA ${code} to today's session`)}store.set(s);render()}
function parseCodes(q){return (q.match(/\b[1-6]\.[1-6]\b/g)||[]).filter((c,i,a)=>a.indexOf(c)===i)}
function onlyCodes(q){return q.trim()!=='' && q.replace(/\b[1-6]\.[1-6]\b/g,'').replace(/kca|[\s,+&/|;]|and/gi,'')===''}
function matches(w,q){q=q.toLowerCase().trim();if(!q)return true;const hay=[w.code,'kca '+w.code,w.name,w.focus,w.equip,w.adj,CAT[cat(w.code)].name,...w.ex.flatMap(e=>[e.name,e.note])].join(' ').toLowerCase();return q.split(/\s+/).every(t=>hay.includes(t))}
function totalTime(codes){return codes.map(c=>W[c].time).join(' + ')}
function play(){const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){v.play().catch(()=>{})}else v.pause()}),{threshold:.35});document.querySelectorAll('video[data-auto]').forEach(v=>io.observe(v))}
function media(m,n){return `<div class="media"><video data-auto muted loop playsinline preload="none" poster="${img(m)}" src="${vid(m)}" aria-label="Movement clip"></video>${n?`<span class="num">${n}</span>`:''}</div>`}
/* ---------- views ---------- */
function topbar(title,sub,back){return `<header class="top">${back?`<button class="iconbtn" data-act="back" aria-label="Back">←</button>`:''}<h1>${title}${sub?`<small>${sub}</small>`:''}</h1>${back?'':`<button class="iconbtn txt" data-go="#/guide">Guide</button>`}</header>`}
function wcard(w){const on=store.get().includes(w.code);return `<article class="card wcard" data-go="#/w/${w.code}"><img class="thumb" loading="lazy" src="${img(w.ex[0].m)}" alt=""><div class="body"><span class="code" style="background:${col(w.code)}">KCA ${w.code}</span><h3>${esc(w.name)}</h3><div class="meta">${esc(w.time)} · ${w.ex.length} exercises</div><div class="minis">${w.ex.map(e=>`<img loading="lazy" src="${img(e.m)}" alt="${esc(e.name)}" title="${esc(e.name)}">`).join('')}</div></div><button class="addbtn ${on?'on':''}" data-add="${w.code}" aria-label="${on?'Remove from':'Add to'} today's session">${on?'✓':'+'}</button></article>`}
function home(){
 const s=store.get(), q=state.q, codes=parseCodes(q);
 let list=K.workouts;
 if(q){ list = onlyCodes(q) ? codes.map(c=>W[c]) : list.filter(w=>matches(w,q)); }
 else if(state.cat!=='all') list=list.filter(w=>cat(w.code)===state.cat);
 let h=topbar('KCA Workout Library','36 workouts · Cycling strength & movement');
 h+=`<div class="searchwrap"><div class="search"><span aria-hidden="true">🔎</span><input id="q" type="search" inputmode="search" autocomplete="off" placeholder="Code (1.2 4.1) or keyword (squat, band…)" value="${esc(q)}">${q?'<button class="x" data-act="clear" aria-label="Clear">✕</button>':''}</div><div class="hint">Type several codes, like <b>1.2 4.1</b>, to build a combined session.</div></div>`;
 if(s.length) h+=`<section class="card today"><h3>Today's session <button class="btn ghost" style="min-height:32px;color:#cbd5e1;padding:0 4px" data-act="clearsession">Clear</button></h3><div class="meta" style="color:#cbd5e1">${esc(totalTime(s))}</div><div class="codes">${s.map(c=>`<span>KCA ${c}</span>`).join('')}</div><div class="row"><button class="btn pri" data-go="#/go/${s.join('+')}">▶ Start session</button><button class="btn sec2" data-go="#/session">View</button></div></section>`;
 h+=`<nav class="chips" aria-label="Categories"><button class="chip ${state.cat==='all'&&!q?'on':''}" data-cat="all">All</button>${K.cats.map(c=>`<button class="chip ${state.cat===c.n&&!q?'on':''}" data-cat="${c.n}">${c.n} · ${esc(c.name)}</button>`).join('')}</nav>`;
 if(q && codes.length>=2 && onlyCodes(q)) h+=`<section class="card combo"><h3>Combined session: ${codes.map(c=>'KCA '+c).join(' + ')}</h3><div class="meta">${esc(totalTime(codes))}</div><div class="row" style="margin-top:10px"><button class="btn pri" data-go="#/go/${codes.join('+')}">▶ Start combined</button><button class="btn sec2" data-go="#/s/${codes.join('+')}">View</button></div><button class="btn ghost" data-addall="${codes.join('+')}" style="width:100%;margin-top:4px">+ Add all to today's session</button></section>`;
 h+='<div class="sec">';
 if(!list.length) h+=`<div class="empty">No workouts match “${esc(q)}”.</div>`;
 let last='';
 list.forEach(w=>{const c=cat(w.code);if(c!==last&&!(q&&onlyCodes(q))){last=c;h+=`<div class="cathead"><span class="dot" style="background:${col(w.code)}">${c}</span><h2>${esc(CAT[c].name)}<small>KCA ${c}.1–${c}.6</small></h2></div>`}h+=wcard(w)});
 h+='</div>';
 app.innerHTML=h;
 const qi=$('#q');qi.addEventListener('input',e=>{state.q=e.target.value;const pos=e.target.selectionStart;render();const n=$('#q');n.focus();n.setSelectionRange(pos,pos)});
}
function warmBlock(w){const c=cat(w.code);const wm=K.catWarm[c];
 if(wm) return `<section class="card block warm"><h4>Warm-up · ${esc(wm[0])}</h4><p>${esc(wm[1])}</p></section>`;
 const intro=CAT[c].intro;
 return `<section class="card block warm"><h4>Before you start · ${esc(CAT[c].name)}</h4><p>${esc(intro)}</p></section>`}
function guideBlock(w){const c=cat(w.code);if(!K.catWarm[c])return '';return `<details class="card block"><summary><h4>${esc(CAT[c].name)} guidelines</h4></summary><p>${esc(CAT[c].intro)}</p></details>`}
function workoutBody(w,start){let h=`<section class="hero"><span class="code" style="background:${col(w.code)}">KCA ${w.code}</span><h2>${esc(w.name)}</h2><div class="pills"><span class="pill">⏱ ${esc(w.time)}</span><span class="pill">🏋 ${esc(w.equip)}</span>${ROUNDS(w.code)?'<span class="pill">↺ Rounds</span>':''}</div><p class="focus"><b>Focus:</b> ${esc(w.focus)}</p></section>`;
 h+=warmBlock(w)+guideBlock(w);
 h+=`<div class="exlist">${w.ex.map((e,i)=>`<article class="card ex">${media(e.m,i+1)}<div class="txt"><h3>${esc(e.name)}</h3><div class="rx">${esc(e.rx)}</div><p class="note">${esc(e.note)}</p></div></article>`).join('')}</div>`;
 if(w.adj) h+=`<section class="card block"><h4>Adjustment / finish</h4><p>${esc(w.adj)}</p></section>`;
 return h}
function detail(code){const w=W[code];if(!w)return home();const on=store.get().includes(code);
 app.innerHTML=topbar(`KCA ${w.code}`,esc(CAT[cat(code)].name),true)+`<div class="startbar"><button class="btn pri" data-go="#/go/${code}">▶ Start workout</button><button class="btn sec2" data-add="${code}">${on?'✓ In session':'+ Session'}</button></div>`+workoutBody(w);play()}
function multi(codes,title,isSession){codes=codes.filter(c=>W[c]);
 let h=topbar(title,esc(totalTime(codes)||'Empty'),true);
 if(!codes.length){app.innerHTML=h+`<div class="empty">Nothing here yet. Tap <b>+</b> on any workout to add it to today's session.</div>`;return}
 h+=`<div class="startbar"><button class="btn pri" data-go="#/go/${codes.join('+')}">▶ Start ${isSession?'session':'workout'}</button>${isSession?`<button class="btn sec2" data-act="clearsession">Clear</button>`:`<button class="btn sec2" data-addall="${codes.join('+')}">+ Session</button>`}</div>`;
 codes.forEach((c,i)=>{h+=`<div class="wsep"><h2>${i+1}. KCA ${c}</h2>${isSession?`<button class="btn ghost" data-add="${c}">Remove</button>`:''}</div>`+workoutBody(W[c])});
 app.innerHTML=h;play()}
function guide(id){
 if(id){const s=K.sections.find(x=>x.id===id);let h=topbar(esc(s?s.title:id==='quick'?'Quick reference key':'Category guidelines'),'',true)+'<div class="sec guide">';
  if(id==='quick'){h+=K.quickref.map(g=>`<section class="card block qr"><h3>${g.range} · ${esc(g.name)}</h3><table>${g.items.map(i=>`<tr><td><a href="#/w/${i[0]}">${i[0]}</a></td><td><a href="#/w/${i[0]}">${esc(i[1])}</a></td><td>${esc(i[2])}</td></tr>`).join('')}</table></section>`).join('')}
  else if(id==='cats'){h+=K.cats.map(c=>`<section class="card block"><h3><span class="code" style="background:var(--c${c.n})">${c.n}</span> ${esc(c.name)}</h3><p>${esc(c.intro)}</p></section>`).join('')}
  else if(s.sub){h+=s.sub.map(x=>`<section class="card block warm"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></section>`).join('')}
  else h+=`<section class="card block">${s.paras.map(p=>`<p>${linkify(p)}</p>`).join('')}</section>`;
  app.innerHTML=h+'</div>';return}
 let h=topbar('Guide','Everything from the KCA library document',true)+`<div class="sec guide"><section class="card block"><h3>${esc(K.title)}</h3><p class="meta">${esc(K.subtitle)}</p><p>${esc(K.intro)}</p></section><nav class="card toc"><a href="#/guide/quick">Quick reference key</a>${K.sections.map(s=>`<a href="#/guide/${s.id}">${esc(s.title)}</a>`).join('').replace('<a href="#/guide/progression">','<a href="#/guide/cats">Category guidelines (1–6)</a><a href="#/guide/progression">')}</nav></div>`;
 app.innerHTML=h}
/* ---------- guided mode ---------- */
let G=null;
function buildSteps(codes){const st=[];codes.forEach(c=>{const w=W[c];st.push({t:'warm',w});w.ex.forEach((e,i)=>st.push({t:'ex',w,e,i}));if(w.adj)st.push({t:'fin',w})});st.push({t:'done'});return st}
function startGo(codes){codes=codes.filter(c=>W[c]);if(!codes.length)return home();if(!G||G.key!==codes.join('+'))G={key:codes.join('+'),codes,steps:buildSteps(codes),i:0,round:{}};renderGo()}
function ruleText(w){const c=cat(w.code);return CAT[c].intro}
function renderGo(){const s=G.steps[G.i],n=G.steps.length;let body='',label='',sub='';
 const r=s.w?(G.round[s.w.code]||1):1;
 if(s.t==='warm'){const c=cat(s.w.code),wm=K.catWarm[c];label=`KCA ${s.w.code} · ${s.w.name}`;sub='Warm-up';
  const mv=WARM_MOVES[c];
  body=`<div class="warmhero"><div class="big">Warm-up</div><div class="sm">${esc(wm?wm[0]:'Before you start')}</div></div><div class="gostep"><div class="kicker">Before KCA ${s.w.code}</div><h2>${esc(wm?wm[0]:CAT[c].name+' preparation')}</h2><p class="note">${esc(wm?wm[1]:CAT[c].intro)}</p>${mv?`<div class="warmlist">${mv.map(m=>`<figure><img src="${img(m[0])}" alt=""><figcaption>${esc(m[1])}</figcaption></figure>`).join('')}</div>`:''}${wm?`<div class="rule"><b>${esc(CAT[c].name)} guidelines:</b> ${esc(CAT[c].intro)}</div>`:''}<div class="rule"><b>Today:</b> ${s.w.ex.length} exercises · ${esc(s.w.time)} · ${esc(s.w.equip)}</div></div>`}
 else if(s.t==='ex'){label=`KCA ${s.w.code} · ${s.w.name}`;sub=`Exercise ${s.i+1} of ${s.w.ex.length}`+(ROUNDS(s.w.code)?` · Round ${r}`:'');
  body=`<div class="media"><video autoplay muted loop playsinline poster="${img(s.e.m)}" src="${vid(s.e.m)}"></video><span class="num">${s.i+1}/${s.w.ex.length}</span></div><div class="gostep"><div class="kicker">Exercise ${s.i+1} of ${s.w.ex.length}${ROUNDS(s.w.code)?`<span class="round">Round ${r}</span>`:''}</div><h2>${esc(s.e.name)}</h2><div class="rx">${esc(s.e.rx)}</div><p class="note">${esc(s.e.note)}</p>${s.i+1<s.w.ex.length?`<div class="rule"><b>Up next:</b> ${esc(s.w.ex[s.i+1].name)} — ${esc(s.w.ex[s.i+1].rx)}</div>`:''}<details class="rule"><summary><b>${esc(CAT[cat(s.w.code)].name)} guidelines</b></summary><p>${esc(ruleText(s.w))}</p></details></div>`}
 else if(s.t==='fin'){const c=cat(s.w.code);label=`KCA ${s.w.code} · ${s.w.name}`;sub=c==='6'?'On-bike warm-up':'Finish';
  body=`<div class="warmhero fin"><div class="big">${c==='6'?'On-bike':'Finish'}</div><div class="sm">KCA ${s.w.code} · ${esc(s.w.name)}</div></div><div class="gostep"><div class="kicker">Adjustment / finish</div><h2>${c==='6'?'Ride warm-up':'Wrap up'}</h2><p class="note">${esc(s.w.adj)}</p></div>`}
 else {label='Workout complete';sub=G.codes.map(c=>'KCA '+c).join(' + ');
  body=`<div class="done"><div class="check">✓</div><h2>Workout complete</h2><p class="meta">Nice work. Record your loads, sets × reps, last-set RPE and any discomfort in TrainingPeaks.</p><ul>${G.codes.map(c=>`<li>KCA ${c} · ${esc(W[c].name)}${G.round[c]>1?` — ${G.round[c]} rounds`:''}</li>`).join('')}</ul><button class="btn pri" style="width:100%" data-act="exitgo">Done</button><button class="btn ghost" style="width:100%;margin-top:6px" data-act="restart">Start again</button></div>`}
 const lastOfRound = s.t==='ex' && ROUNDS(s.w.code) && s.i===s.w.ex.length-1;
 const html=`<div class="go" role="dialog" aria-label="Guided workout"><div class="gotop"><div class="r1"><button class="iconbtn" data-act="exitgo" aria-label="Exit">✕</button><div class="lbl"><b>${esc(label)}</b><span>${esc(sub)}</span></div><span style="font-size:13px;opacity:.75">${G.i+1}/${n}</span></div><div class="prog"><i style="width:${(G.i+1)/n*100}%"></i></div></div><div class="gobody" id="gobody">${body}</div>${lastOfRound?`<button class="btn nextround" data-act="round">↺ Next round (Round ${r+1})</button>`:''}${s.t!=='done'?`<div class="gobar"><button class="btn back" data-act="prev" ${G.i===0?'disabled':''}>‹ Back</button><button class="btn pri" data-act="next">${G.steps[G.i+1]&&G.steps[G.i+1].t==='done'?'Finish ✓':s.t==='warm'?'Start exercises ›':'Next ›'}</button></div>`:''}</div>`;
 let el=$('.go');if(!el){app.insertAdjacentHTML('beforeend','<div id="gowrap"></div>')}
 ($('#gowrap')||app).innerHTML=html;document.body.style.overflow='hidden';
 // preload next clip
 const nx=G.steps[G.i+1];if(nx&&nx.t==='ex'){const l=document.createElement('link');l.rel='preload';l.as='video';l.href=vid(nx.e.m);document.head.appendChild(l)}
}
function goStep(d){G.i=Math.max(0,Math.min(G.steps.length-1,G.i+d));renderGo();const b=$('#gobody');if(b)b.scrollTop=0}
/* ---------- router & events ---------- */
function render(){const h=location.hash.slice(2);const [r,arg]=[h.split('/')[0],h.split('/').slice(1).join('/')];document.body.style.overflow='';
 if(r!=='go'){const gw=$('#gowrap');if(gw)gw.remove()}
 if(r==='w')detail(decodeURIComponent(arg));
 else if(r==='s')multi(decodeURIComponent(arg).split('+'),'Combined session',false);
 else if(r==='session')multi(store.get(),"Today's session",true);
 else if(r==='guide')guide(arg);
 else if(r==='go'){const codes=decodeURIComponent(arg).split('+');if(!app.innerHTML){const s=store.get();(codes.length===1?detail(codes[0]):multi(codes,'Combined session',false))}startGo(codes)}
 else{G=null;home()}
}
let navStack=0;
window.addEventListener('hashchange',()=>{render();if(!location.hash.startsWith('#/go'))window.scrollTo(0,0)});
document.addEventListener('click',e=>{const t=e.target.closest('[data-add],[data-addall],[data-act],[data-cat],[data-go]');if(!t)return;
 if(t.dataset.add){e.stopPropagation();toggleSession(t.dataset.add);return}
 if(t.dataset.addall){const s=store.get();t.dataset.addall.split('+').forEach(c=>{if(!s.includes(c))s.push(c)});store.set(s);toast("Added to today's session");render();return}
 if(t.dataset.cat){state.cat=t.dataset.cat;state.q='';render();return}
 if(t.dataset.go){navStack++;location.hash=t.dataset.go;return}
 const a=t.dataset.act;
 if(a==='back'){if(navStack>0){navStack--;history.back()}else location.hash='#/';}
 else if(a==='clear'){state.q='';render()}
 else if(a==='clearsession'){store.set([]);toast('Session cleared');render()}
 else if(a==='next')goStep(1);else if(a==='prev')goStep(-1);
 else if(a==='round'){const s=G.steps[G.i];G.round[s.w.code]=(G.round[s.w.code]||1)+1;G.i=G.steps.findIndex(x=>x.t==='ex'&&x.w===s.w&&x.i===0);renderGo()}
 else if(a==='restart'){G.i=0;G.round={};renderGo()}
 else if(a==='exitgo'){G=null;const gw=$('#gowrap');if(gw)gw.remove();document.body.style.overflow='';if(navStack>0){navStack--;history.back()}else location.hash='#/'}
});
document.addEventListener('keydown',e=>{if(!G||!$('.go'))return;if(e.key==='ArrowRight')goStep(1);if(e.key==='ArrowLeft')goStep(-1);if(e.key==='Escape')$('[data-act=exitgo]').click()});
render();
})();

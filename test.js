/* Vamos a practicar · 1500 Preguntas — Prueba de nivel (level test) */
(function(){
  const LEVELS = ['A1','A2','B1','B2','C1','C2'];
  const LVINFO = {
    A1:{ko:'입문', es:'Inicial'}, A2:{ko:'초급', es:'Elemental'}, B1:{ko:'중급', es:'Intermedio'},
    B2:{ko:'중상급', es:'Intermedio alto'}, C1:{ko:'고급', es:'Avanzado'}, C2:{ko:'최상급', es:'Maestría'}
  };
  const PRACTICE = l => `https://yalli2.github.io/1500_${l}/`;
  const KEY = 'vap1500_leveltest';
  const L = 'ABCD';
  const $ = (s,el=document)=>el.querySelector(s);
  const app = $('#app');
  const esc = t => String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const optTxt = o => o==='ø' ? 'ø <span class="zero">(아무것도 넣지 않음)</span>' : esc(o);
  const isOk = (q,k)=> k!=null && k>=0 && q.o[k]===q.o[q.a];

  /* ---------- grading ---------- */
  // 95–100 A+ · 90 A · 85 B+ · 80 B · 75 C+ · 70 C · 65 D+ · 60 D · 그 이하 F
  const GRADES = [[95,'A+'],[90,'A'],[85,'B+'],[80,'B'],[75,'C+'],[70,'C'],[65,'D+'],[60,'D'],[0,'F']];
  const gradeOf = s => GRADES.find(g=>s>=g[0])[1];
  const gcls = g => 'g-'+g.replace('+','p');
  const gcolor = g => ({'A+':'#1f7a4d','A':'#1f7a4d','B+':'#2457a6','B':'#2457a6','C+':'#c88a00','C':'#c88a00','D+':'#d0611f','D':'#d0611f','F':'#b3261e'})[g];
  function verdict(lv,g){
    const i=LEVELS.indexOf(lv), nx=LEVELS[i+1], pv=LEVELS[i-1];
    if(g==='A+'||g==='A') return nx ? `${lv} 수준을 완전히 익혔습니다! 다음 단계 <b>${nx}</b> 레벨테스트에 도전해 보세요.` : `최상급 ${lv}까지 완벽합니다. 원어민 수준의 정확성을 갖추고 있어요!`;
    if(g==='B+'||g==='B') return `${lv} 수준을 대체로 잘 이해하고 있어요. 틀린 문제의 주제만 복습하면 ${lv}를 완성할 수 있습니다.`;
    if(g==='C+'||g==='C') return `${lv}의 기본은 갖췄지만 보완이 필요해요. ${lv} 연습 사이트에서 세트별로 꾸준히 풀어 보세요.`;
    if(g==='D+'||g==='D') return `${lv}는 아직 조금 어려워요. 오답노트를 중심으로 복습한 뒤 다시 도전해 보세요.`;
    return pv ? `지금은 <b>${pv}</b> 레벨이 더 잘 맞을 수 있어요. ${pv} 레벨테스트로 현재 수준을 먼저 확인해 보세요.` : `기초부터 차근차근! ${lv} 연습 사이트의 문법·어휘 세트로 시작해 보세요.`;
  }

  /* ---------- storage ---------- */
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } }
  let ST = load(); ST.records = ST.records||[]; ST.name = ST.name||'';
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(ST)); }catch(e){ alert('브라우저 저장 공간에 기록하지 못했습니다.'); } }

  /* ---------- data ---------- */
  const DATA = {};
  function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function loadLevel(lv){
    if(DATA[lv]) return Promise.resolve(DATA[lv]);
    return Promise.all(['G','V'].map(s=>loadScript(`data/${lv}_${s}.js?v=${window.TEST_V||1}`))).then(()=>{
      const m={}; for(const s of ['G','V']) for(const q of window['DATA_'+lv+'_'+s]) m[q.id]=q;
      DATA[lv]=m; return m;
    });
  }

  /* ---------- helpers ---------- */
  const fmtDate = iso => { const d=new Date(iso); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const fmtShort = iso => { const d=new Date(iso); return `${d.getMonth()+1}/${d.getDate()}`; };
  const fmtDur = s => `${Math.floor(s/60)}분 ${String(s%60).padStart(2,'0')}초`;
  const stem = (q,fill) => esc(q.q).replace(/____/g, ()=> fill||'<span class="blank">&nbsp;</span>');
  const lastOf = lv => ST.records.filter(r=>r.level===lv).slice(-1)[0];

  /* ---------- routing ---------- */
  let T=null, timerId=null;
  function route(){
    clearInterval(timerId);
    $('#dock').style.display='none'; $('#dock').innerHTML='';
    const h=location.hash.replace('#','');
    let m;
    if((m=h.match(/^test\/(A1|A2|B1|B2|C1|C2)$/))) return startTest(m[1]);
    if((m=h.match(/^result\/(\d+)$/))) return showResult(+m[1]);
    if(h==='records') return records();
    if(h==='wrongs') return wrongs();
    home();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', e=>{ if(T && !T.done && Object.keys(T.ans).length){ e.preventDefault(); e.returnValue=''; } });

  /* ---------- home ---------- */
  function home(){
    document.title='레벨테스트 · Vamos a practicar 1500 Preguntas';
    const n=ST.records.length;
    let html=`<section class="hero wrap">
      <h1>Prueba de <em>nivel</em></h1>
      <p>A1~C2 중 레벨을 고르면 그 레벨 1500문항에서 <b>문법 15세트 + 어휘 15세트마다 1문제씩, 총 30문제</b>를 무작위로 출제합니다. 칠 때마다 새로운 문제가 나와요.</p>
      <div class="namebox"><span>👤 학습자 이름</span><input id="nm" maxlength="20" placeholder="이름을 입력하세요" value="${esc(ST.name)}"><span id="nmok"></span>
        <span style="margin-left:auto"><a class="btn" href="#records">📈 내 기록 (${n}회)</a> <a class="btn" href="#wrongs">📕 누적 오답노트</a></span></div>
      <div class="lvgrid">`;
    for(const lv of LEVELS){
      const r=lastOf(lv), cnt=ST.records.filter(x=>x.level===lv).length;
      html+=`<a class="lvcard" href="#test/${lv}">
        <span class="big">${lv}</span><span class="nm">${LVINFO[lv].ko} <span class="mini">${LVINFO[lv].es}</span></span>
        <span class="ds">30문항 · 약 15~25분</span>
        <span class="last">${r?`최근 ${fmtShort(r.date)} · ${r.score}점 <span class="gchip ${gcls(r.grade)}">${r.grade}</span>`:`<span>아직 응시 기록 없음</span><span class="btn primary" style="padding:4px 10px;font-size:12.5px">시작 →</span>`}</span>
        ${cnt?`<span class="mini">응시 ${cnt}회</span>`:''}
      </a>`;
    }
    html+=`</div></section>
    <section class="wrap info2">
      <div class="panel"><h3>📝 이렇게 진행돼요</h3><ol>
        <li>레벨을 선택하면 <b>30문항</b>이 출제됩니다 (문법 15 · 어휘 15).</li>
        <li>한 문제씩 풀고, 아래 번호판으로 언제든 이동·수정할 수 있어요. 키보드 <b>1~4 / A~D</b>, <b>← →</b>도 됩니다.</li>
        <li><b>제출하기</b>를 누르면 점수(100점 만점)와 등급, 레벨 진단이 나옵니다.</li>
        <li>결과는 <b>내 기록</b>에 회차·날짜·점수·오답과 함께 자동 저장되어, 발전 그래프로 확인할 수 있어요.</li>
        <li>틀린 문제는 해석·해설과 함께 <b>오답노트</b>로 복습하세요.</li></ol></div>
      <div class="panel"><h3>🏅 등급 기준 (100점 만점)</h3>
        <table class="gtable"><tr><th>점수</th><th>등급</th><th>점수</th><th>등급</th></tr>
        <tr><td>95–100</td><td><span class="gchip g-Ap">A+</span></td><td>75–79</td><td><span class="gchip g-Cp">C+</span></td></tr>
        <tr><td>90–94</td><td><span class="gchip g-A">A</span></td><td>70–74</td><td><span class="gchip g-C">C</span></td></tr>
        <tr><td>85–89</td><td><span class="gchip g-Bp">B+</span></td><td>65–69</td><td><span class="gchip g-Dp">D+</span></td></tr>
        <tr><td>80–84</td><td><span class="gchip g-B">B</span></td><td>60–64</td><td><span class="gchip g-D">D</span></td></tr>
        <tr><td colspan="2" class="mini">1문항 = 100/30점, 반올림</td><td>0–59</td><td><span class="gchip g-F">F</span></td></tr></table>
      </div>
    </section>`;
    app.innerHTML=html; window.scrollTo(0,0);
    const nm=$('#nm'); nm.onchange=()=>{ ST.name=nm.value.trim(); save(); $('#nmok').textContent='저장됨 ✓'; };
  }

  /* ---------- test ---------- */
  function pick(lv){
    const out=[];
    for(const s of ['G','V']) for(let k=0;k<15;k++){
      const n=k*50+1+Math.floor(Math.random()*50);
      out.push(s+n);
    }
    return out;
  }
  function startTest(lv){
    if(T && !T.done && T.level===lv){ return renderTest(); }
    app.innerHTML='<div class="loading">문제를 준비하는 중…</div>';
    loadLevel(lv).then(()=>{
      T={level:lv, ids:pick(lv), ans:{}, cur:0, start:Date.now(), done:false};
      renderTest();
    }).catch(()=>{ app.innerHTML='<div class="empty wrap">문제를 불러오지 못했습니다. 새로고침해 주세요.</div>'; });
  }
  function renderTest(){
    const lv=T.level, D=DATA[lv], i=T.cur, id=T.ids[i], q=D[id], sel=T.ans[id];
    const sec=id[0]==='G'?'문법':'어휘', setNo=Math.floor((+id.slice(1)-1)/50)+1;
    const answered=Object.keys(T.ans).length;
    document.title=`${lv} 레벨테스트 ${i+1}/30`;
    app.innerHTML=`<section class="wrap">
      <div class="tbar"><div><div class="crumb mini"><a href="#" style="color:inherit">레벨테스트</a> › ${lv} ${LVINFO[lv].ko}</div><h1>${lv} 레벨테스트</h1></div>
        <span class="timer" id="tm">⏱ 0:00</span></div>
      <div class="tprog"><i style="width:${answered/30*100}%"></i></div>
      <div class="tcard">
        <div class="tmeta"><span class="no">문항 ${i+1} / 30</span><span class="pill">${sec}</span><span class="pill">${sec} 세트 ${setNo} 출제</span></div>
        <div class="tq">${stem(q, sel!=null?`<span class="blank">${esc(q.o[sel])}</span>`:null)}</div>
        <div class="opts">${q.o.map((o,k)=>`<button class="opt ${sel===k?'sel':''}" data-k="${k}"><span class="L">${L[k]}</span><span>${optTxt(o)}</span><span class="k">${k+1}</span></button>`).join('')}</div>
      </div>
      <div class="tnav"><button class="btn" id="pv" ${i===0?'disabled':''}>← 이전</button>
        ${i<29?`<button class="btn dark" id="nx">다음 →</button>`:`<button class="btn primary" id="sb">제출하기</button>`}</div>
      <div class="tgrid"><div class="lab">문법</div>${T.ids.map((x,j)=>(j===15?'<div class="lab">어휘</div>':'')+`<button data-j="${j}" class="${T.ans[x]!=null?'a':''} ${j===i?'cur':''}">${j+1}</button>`).join('')}</div>
    </section>`;
    app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>choose(+b.dataset.k));
    app.querySelectorAll('.tgrid button').forEach(b=>b.onclick=()=>{ T.cur=+b.dataset.j; renderTest(); });
    $('#pv').onclick=()=>{ if(T.cur>0){T.cur--; renderTest();} };
    const nx=$('#nx'); if(nx) nx.onclick=()=>{ T.cur++; renderTest(); };
    const sb=$('#sb'); if(sb) sb.onclick=submit;
    dockTest();
    const tick=()=>{ const s=Math.floor((Date.now()-T.start)/1000); const el=$('#tm'); if(el) el.textContent=`⏱ ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
    tick(); clearInterval(timerId); timerId=setInterval(tick,1000);
  }
  function choose(k){
    const id=T.ids[T.cur]; T.ans[id]=k;
    if(T.cur<29){ renderTest(); setTimeout(()=>{ T.cur++; renderTest(); },260); }
    else renderTest();
  }
  function dockTest(){
    const d=$('#dock'), a=Object.keys(T.ans).length;
    d.style.display='block';
    d.innerHTML=`<div class="wrap"><div class="prog"><div class="t"><b>${a}</b> / 30 문항 답함${a<30?` · 남은 문항 ${30-a}`:' · 모두 풀었어요!'}</div><div class="bar"><i style="width:${a/30*100}%"></i></div></div>
      <button class="btn" id="qt">그만두기</button><button class="btn primary" id="sb2">제출하기</button></div>`;
    $('#sb2').onclick=submit;
    $('#qt').onclick=()=>{ if(confirm('레벨테스트를 그만둘까요? 지금까지 푼 답은 저장되지 않습니다.')){ T=null; location.hash=''; } };
  }
  document.addEventListener('keydown',e=>{
    if(!T||T.done||!/^#test\//.test(location.hash)) return;
    if(e.target.tagName==='INPUT') return;
    const m={'1':0,'2':1,'3':2,'4':3,'a':0,'b':1,'c':2,'d':3}[e.key.toLowerCase()];
    if(m!=null){ e.preventDefault(); choose(m); }
    else if(e.key==='ArrowRight' && T.cur<29){ T.cur++; renderTest(); }
    else if(e.key==='ArrowLeft' && T.cur>0){ T.cur--; renderTest(); }
  });
  function submit(){
    const a=Object.keys(T.ans).length;
    if(a<30 && !confirm(`아직 ${30-a}문항을 풀지 않았습니다. 그래도 제출할까요?\n(안 푼 문항은 오답 처리됩니다)`)) return;
    const D=DATA[T.level];
    let c=0,g=0,v=0;
    const items=T.ids.map(id=>{ const s=T.ans[id]; const ok=isOk(D[id],s); if(ok){c++; if(id[0]==='G')g++; else v++;} return [id, s==null?-1:s]; });
    const score=Math.round(c/30*100), grade=gradeOf(score);
    const no=(ST.records.reduce((m,r)=>Math.max(m,r.no||0),0))+1;
    const rec={no, level:T.level, date:new Date().toISOString(), dur:Math.round((Date.now()-T.start)/1000), correct:c, g, v, score, grade, name:ST.name||'', items};
    ST.records.push(rec); save();
    T.done=true; T=null; clearInterval(timerId);
    location.hash='result/'+no;
  }

  /* ---------- result ---------- */
  function showResult(no){
    const r=ST.records.find(x=>x.no===no);
    if(!r){ app.innerHTML='<div class="empty wrap">기록을 찾을 수 없습니다. <a href="#records">내 기록</a></div>'; return; }
    app.innerHTML='<div class="loading">결과를 불러오는 중…</div>';
    loadLevel(r.level).then(D=>{
      const sameLv=ST.records.filter(x=>x.level===r.level); const idx=sameLv.indexOf(r); const prev=idx>0?sameLv[idx-1]:null;
      const diff=prev? r.score-prev.score : null;
      const wrongItems=r.items.filter(([id,s])=>!isOk(D[id],s));
      const topics={}; wrongItems.forEach(([id])=>{ const k=D[id].k; if(k) topics[k]=(topics[k]||0)+1; });
      document.title=`${r.level} 레벨테스트 결과 · ${r.score}점 ${r.grade}`;
      let html=`<section class="wrap">
        <div class="tbar"><div><div class="crumb mini"><a href="#" style="color:inherit">레벨테스트</a> › <a href="#records" style="color:inherit">내 기록</a> › ${r.no}회차</div><h1>${r.level} 레벨테스트 결과</h1></div></div>
        <div class="rhero">
          <div class="gradebig" style="background:${gcolor(r.grade)}"><b>${r.grade}</b><span>${r.score}점</span></div>
          <div><h2>${r.name?esc(r.name)+'님, ':''}${r.level} ${LVINFO[r.level].ko} · ${r.score}점</h2>
            <p>${verdict(r.level,r.grade)}</p>
            <div class="rstats">
              <div><b>${r.correct} / 30</b>정답</div>
              <div><b>${r.g} / 15</b>문법</div>
              <div><b>${r.v} / 15</b>어휘</div>
              <div><b>${fmtDur(r.dur)}</b>소요 시간</div>
              ${diff!=null?`<div><b style="color:${diff>=0?'var(--ok)':'var(--bad)'}">${diff>0?'▲ +':diff<0?'▼ ':'± '}${diff}점</b>지난 ${r.level} 대비</div>`:''}
            </div></div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn primary" href="#test/${r.level}">${r.level} 다시 응시 →</a>
          <a class="btn" href="${PRACTICE(r.level)}" target="_blank">${r.level} 연습 사이트에서 복습</a>
          <a class="btn" href="#records">📈 내 기록 보기</a></div>
        ${Object.keys(topics).length?`<div class="panel" style="margin-top:16px"><h3 style="font-size:15px">보완이 필요한 주제</h3><div class="topics">${Object.entries(topics).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<span>${esc(k)}${n>1?' ×'+n:''}</span>`).join('')}</div></div>`:''}
        <div class="rtabs"><button class="on" data-f="w">오답노트 (${wrongItems.length})</button><button data-f="all">전체 30문항</button></div>
        <div class="wn" id="wn"></div></section>`;
      app.innerHTML=html; window.scrollTo(0,0);
      const draw=f=>{ const list=f==='w'?wrongItems:r.items; $('#wn').innerHTML=list.length?list.map(([id,s])=>reviewCard(D[id],s,r.level,r.items.findIndex(x=>x[0]===id)+1)).join(''):'<div class="empty2">틀린 문제가 없습니다 🎉 완벽해요!</div>'; bindReview(); };
      app.querySelectorAll('.rtabs button').forEach(b=>b.onclick=()=>{ app.querySelectorAll('.rtabs button').forEach(x=>x.classList.toggle('on',x===b)); draw(b.dataset.f); });
      draw('w');
    });
  }
  function reviewCard(q,s,lv,num,extra){
    const ok=isOk(q,s);
    const fill = s==null||s<0 ? `<span class="blank no">?<span class="fix">${esc(q.o[q.a])}</span></span>`
      : ok ? `<span class="blank ok">${esc(q.o[q.a])}</span>` : `<span class="blank no"><s>${esc(q.o[s])}</s><span class="fix">${esc(q.o[q.a])}</span></span>`;
    const sec=q.id[0]==='G'?'문법':'어휘';
    return `<article class="qcard graded ${ok?'correct':'wrong'}">
      <div class="qtop"><div class="qnum">${num}</div><div><div class="mini" style="margin-bottom:2px">${lv} · ${sec} ${q.id.slice(1)}번${extra?' · '+extra:''}</div><div class="qtext">${stem(q,fill)}</div></div></div>
      <div class="opts">${q.o.map((o,k)=>`<button class="opt ${k===q.a||(k===s&&ok)?'ans':(k===s?'miss':'')}" disabled><span class="L">${L[k]}</span><span>${optTxt(o)}</span></button>`).join('')}</div>
      <button class="xbtn">${ok?'💡 해설 보기':'💡 해설 닫기'}</button>
      <div class="expl ${ok?'':'open'}">${q.k?`<span class="tag">${esc(q.k)}</span>`:''}
        <div class="tr"><b>해석</b>${esc(q.t)}</div><div class="ex"><b>해설</b>${esc(q.e)}</div>
        <ul>${(q.x||[]).map((x,k)=>`<li class="${k===q.a?'c':''}"><span class="L">${L[k]}</span><span>${esc(String(x).replace(/^\s*[A-D][\.\):]\s*/,''))}</span></li>`).join('')}</ul>
        ${q.f?`<div class="flagnote">📌 참고: ${esc(q.f)}</div>`:''}</div></article>`;
  }
  function bindReview(){
    app.querySelectorAll('.qcard .xbtn').forEach(b=>b.onclick=()=>{ const ex=b.nextElementSibling; ex.classList.toggle('open'); b.textContent=ex.classList.contains('open')?'💡 해설 닫기':'💡 해설 보기'; });
  }

  /* ---------- records ---------- */
  let recFilter='all';
  function records(){
    document.title='내 기록 · 레벨테스트';
    const R=ST.records.filter(r=>recFilter==='all'||r.level===recFilter);
    let html=`<section class="wrap">
      <div class="rec-top"><div><div class="crumb mini"><a href="#" style="color:inherit">레벨테스트</a> › 내 기록</div><h1>📈 ${ST.name?esc(ST.name)+'님의 ':'내 '}기록</h1></div><span class="sp"></span>
        <select id="flt"><option value="all">전체 레벨</option>${LEVELS.map(l=>`<option value="${l}" ${recFilter===l?'selected':''}>${l}</option>`).join('')}</select>
        <a class="btn" href="#wrongs">📕 누적 오답노트</a></div>`;
    if(!R.length){
      html+=`<div class="empty2">아직 응시 기록이 없습니다.<br><br><a class="btn primary" href="#">레벨테스트 시작하기 →</a></div>`;
    } else {
      const best=Math.max(...R.map(r=>r.score)), avg=Math.round(R.reduce((a,r)=>a+r.score,0)/R.length), last=R[R.length-1], first=R[0];
      html+=`<div class="stats">
        <div class="stat"><b>${R.length}회</b><span>응시 횟수</span></div>
        <div class="stat"><b>${best}점</b><span>최고 점수</span></div>
        <div class="stat"><b>${avg}점</b><span>평균 점수</span></div>
        ${recFilter==='all'?`<div class="stat"><b>${last.score}점 <span class="gchip ${gcls(last.grade)}">${last.grade}</span></b><span>최근 회차 (${last.level})</span>`:`<div class="stat"><b style="color:${last.score-first.score>=0?'var(--ok)':'var(--bad)'}">${R.length>1?(last.score-first.score>=0?'+':'')+(last.score-first.score)+'점':'–'}</b><span>첫 회차 대비 변화 (${recFilter})`}</span></div></div>
        <div class="chart">${chart(R)}</div>
        <table class="rtable"><tr><th>회차</th><th>날짜</th><th>레벨</th><th>점수</th><th>등급</th><th class="hm">문법</th><th class="hm">어휘</th><th class="hm">소요</th><th>오답</th><th></th></tr>
        ${R.slice().reverse().map(r=>`<tr class="row" data-no="${r.no}"><td><b>${r.no}</b></td><td>${fmtDate(r.date)}</td><td><b>${r.level}</b></td><td><b>${r.score}</b></td><td><span class="gchip ${gcls(r.grade)}">${r.grade}</span></td><td class="hm">${r.g}/15</td><td class="hm">${r.v}/15</td><td class="hm">${fmtDur(r.dur)}</td><td style="color:var(--bad);font-weight:700">${30-r.correct}</td><td><button class="del" data-del="${r.no}" title="삭제">✕</button></td></tr>`).join('')}
        </table>`;
    }
    html+=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 110px">
      <button class="btn" id="exp">⬇ 기록 백업(파일 저장)</button><label class="btn" style="cursor:pointer">⬆ 기록 불러오기<input type="file" id="imp" accept=".json" hidden></label>
      <span class="mini" style="align-self:center">기록은 이 브라우저에 저장됩니다. 다른 기기로 옮길 때 백업 파일을 사용하세요.</span></div></section>`;
    app.innerHTML=html; window.scrollTo(0,0);
    $('#flt').onchange=e=>{ recFilter=e.target.value; records(); };
    app.querySelectorAll('tr.row').forEach(tr=>tr.onclick=e=>{ if(e.target.dataset.del) return; location.hash='result/'+tr.dataset.no; });
    app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ if(confirm(b.dataset.del+'회차 기록을 삭제할까요?')){ ST.records=ST.records.filter(r=>r.no!==+b.dataset.del); save(); records(); } });
    $('#exp').onclick=()=>{ const blob=new Blob([JSON.stringify(ST,null,1)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`레벨테스트_기록_${ST.name||'학습자'}_${new Date().toISOString().slice(0,10)}.json`; a.click(); };
    $('#imp').onchange=e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ try{ const d=JSON.parse(t); if(!Array.isArray(d.records)) throw 0;
        const have=new Set(ST.records.map(r=>r.date)); let maxNo=ST.records.reduce((m,r)=>Math.max(m,r.no),0); let add=0;
        d.records.forEach(r=>{ if(!have.has(r.date)){ r.no=++maxNo; ST.records.push(r); add++; } });
        ST.records.sort((a,b)=>a.date<b.date?-1:1); ST.records.forEach((r,i)=>r.no=i+1); if(!ST.name&&d.name) ST.name=d.name; save(); alert(add+'개의 기록을 불러왔습니다.'); records();
      }catch(err){ alert('올바른 백업 파일이 아닙니다.'); } }); };
  }
  const LVCOL={A1:'#2a9d8f',A2:'#2457a6',B1:'#7b4bb7',B2:'#d0611f',C1:'#b3261e',C2:'#1f1b16'};
  function chart(R){
    const W=900,H=270,pl=46,pr=18,pt=18,pb=44, n=R.length;
    const x=i=> n===1? (pl+(W-pl-pr)/2) : pl+i*(W-pl-pr)/(n-1);
    const y=s=> pt+(100-s)*(H-pt-pb)/100;
    let g=`<rect x="${pl}" y="${y(60)}" width="${W-pl-pr}" height="${y(0)-y(60)}" fill="#fbe9e7" opacity=".5"/>`;
    for(const s of [100,50,0]){ g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(s)}" y2="${y(s)}" stroke="#ece4d8" ${s%20===0&&s!==60?'stroke-dasharray="4 4"':''}/><text x="${pl-8}" y="${y(s)+4}" font-size="11" text-anchor="end" fill="#8a8073">${s}</text>`; }
    for(const [s,lab] of [[90,'A'],[80,'B'],[70,'C'],[60,'D']]) g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(s)}" y2="${y(s)}" stroke="#e6dccd" stroke-dasharray="3 5"/><text x="${pl-8}" y="${y(s)+4}" font-size="11" text-anchor="end" fill="#8a8073">${s}</text><text x="${W-pr-2}" y="${y(s)-3}" font-size="10" text-anchor="end" fill="#b0a596">${lab}</text>`;
    g+=`<text x="${pl+6}" y="${y(4)}" font-size="11" fill="#c0392b">F (60점 미만)</text>`;
    const lvs=[...new Set(R.map(r=>r.level))];
    for(const lv of lvs){
      const pts=R.map((r,i)=>[r,i]).filter(([r])=>r.level===lv).map(([r,i])=>`${x(i)},${y(r.score)}`).join(' ');
      g+=`<polyline points="${pts}" fill="none" stroke="${LVCOL[lv]}" stroke-width="2.5" stroke-linejoin="round" opacity=".85"/>`;
    }
    R.forEach((r,i)=>{ g+=`<g><circle cx="${x(i)}" cy="${y(r.score)}" r="6.5" fill="${LVCOL[r.level]}" stroke="#fff" stroke-width="2"><title>${r.no}회차 · ${r.level} · ${r.score}점 ${r.grade}</title></circle>
      <text x="${x(i)}" y="${y(r.score)-11}" font-size="11.5" font-weight="700" text-anchor="middle" fill="#1f1b16">${r.score} ${r.grade}</text>
      ${n<=16||i%Math.ceil(n/16)===0?`<text x="${x(i)}" y="${H-pb+16}" font-size="10.5" text-anchor="middle" fill="#6f665b">${r.no}회 ${r.level}</text><text x="${x(i)}" y="${H-pb+29}" font-size="10" text-anchor="middle" fill="#a99f92">${fmtShort(r.date)}</text>`:''}</g>`; });
    const legend=lvs.length>1?`<div style="display:flex;gap:12px;justify-content:center;font-size:12.5px;color:var(--muted);padding:4px 0 6px">${lvs.map(l=>`<span><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${LVCOL[l]};margin-right:4px"></i>${l}</span>`).join('')}</div>`:'';
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="회차별 점수 그래프">${g}</svg>${legend}`;
  }

  /* ---------- cumulative wrong notes ---------- */
  let wnLevel=null;
  function wrongs(){
    const lvs=LEVELS.filter(l=>ST.records.some(r=>r.level===l));
    if(!lvs.length){ app.innerHTML=`<section class="wrap"><div class="rec-top"><h1>📕 누적 오답노트</h1></div><div class="empty2">아직 응시 기록이 없습니다.<br><br><a class="btn primary" href="#">레벨테스트 시작하기 →</a></div></section>`; return; }
    if(!wnLevel||!lvs.includes(wnLevel)) wnLevel=lvs[lvs.length-1];
    app.innerHTML='<div class="loading">오답노트를 불러오는 중…</div>';
    loadLevel(wnLevel).then(D=>{
      const map=new Map();
      ST.records.filter(r=>r.level===wnLevel).forEach(r=>r.items.forEach(([id,s])=>{ if(!isOk(D[id],s)){ const m=map.get(id)||{id,s,cnt:0,rounds:[]}; m.s=s; m.cnt++; m.rounds.push(r.no); map.set(id,m); } }));
      const list=[...map.values()].sort((a,b)=>b.cnt-a.cnt||(a.id<b.id?-1:1));
      app.innerHTML=`<section class="wrap"><div class="rec-top"><div><div class="crumb mini"><a href="#" style="color:inherit">레벨테스트</a> › 누적 오답노트</div><h1>📕 누적 오답노트</h1></div><span class="sp"></span>
        <select id="wl">${lvs.map(l=>`<option ${l===wnLevel?'selected':''}>${l}</option>`).join('')}</select><a class="btn" href="#records">📈 내 기록</a></div>
        <p class="mini">${wnLevel} 레벨테스트에서 틀린 문제 ${list.length}개 (여러 번 틀린 문제가 위에 표시됩니다)</p>
        <div class="wn">${list.length?list.map((m,i)=>reviewCard(D[m.id],m.s,wnLevel,i+1,`${m.rounds.join('·')}회차에서 틀림${m.cnt>1?' ('+m.cnt+'번)':''}`)).join(''):'<div class="empty2">이 레벨에서 틀린 문제가 없습니다 🎉</div>'}</div></section>`;
      $('#wl').onchange=e=>{ wnLevel=e.target.value; wrongs(); };
      bindReview(); window.scrollTo(0,0);
    });
  }

  /* ---------- header ---------- */
  $('#hdr').innerHTML=`<div class="wrap"><a class="brand" href="#"><span class="lv">TEST</span><span class="tt">1500 Preguntas<small>PRUEBA DE NIVEL · 레벨테스트</small></span></a>
    <nav class="levels"><a href="#" class="on">테스트</a><a href="#records">내 기록</a>${LEVELS.map(l=>`<a href="${PRACTICE(l)}" title="${l} 연습 사이트">${l}</a>`).join('')}</nav>
    <select class="lvsel" onchange="location.href=this.value"><option value="#">테스트</option><option value="#records">내 기록</option>${LEVELS.map(l=>`<option value="${PRACTICE(l)}">${l} 연습</option>`).join('')}</select></div>`;
  route();
})();

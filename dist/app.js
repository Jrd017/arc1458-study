const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const titles = {1:'The Architect',2:'Professional Life',3:"The Architect’s Services"};
const files = {1:'ARC1458 Module 1_The Architect.pdf',2:'ARC1458 Module 2_Professional Life.pdf',3:"ARC1458 Module 3_The Architect's Services.pdf"};
const state = {questions:[],terms:[],combined:[],page:'home',topic:'all',positions:{},selected:null,responses:{}};

function save() { try { localStorage.setItem('arc1458-study-responses-v1', JSON.stringify(state.responses)); } catch {} }
function load() { try { state.responses = JSON.parse(localStorage.getItem('arc1458-study-responses-v1') || '{}') || {}; } catch { state.responses={}; } }
function listForPage() {
  const base = state.page === 'combined' ? state.combined : state.questions.filter(q => q.module === Number(state.page.slice(-1)));
  return state.topic === 'all' ? base : base.filter(q => q.topic === state.topic);
}
function pageKey() { return `${state.page}:${state.topic}`; }
function renderHome() {
  const counts = [1,2,3].map(m => state.questions.filter(q => q.module === m).length);
  const cards = [
    {href:'#module-1',number:'01',name:'Module 1 quiz',desc:`${counts[0]} questions · The Architect`},
    {href:'#module-2',number:'02',name:'Module 2 quiz',desc:`${counts[1]} questions · Professional Life`},
    {href:'#module-3',number:'03',name:'Module 3 quiz',desc:`${counts[2]} questions · The Architect’s Services`},
    {href:'#combined',number:'04',name:'Combined Module 1 + 2',desc:`${state.combined.length} questions · Mixed practice`}
  ];
  $('#module-grid').innerHTML = cards.map(c=>`<a class="module-card" href="${c.href}"><small>${c.number} / PRACTICE</small><h2>${escapeHtml(c.name)}</h2><p>${escapeHtml(c.desc)}</p><span class="arrow" aria-hidden="true">↗</span></a>`).join('');
}
function renderGlossary() {
  const query = $('#search').value.trim().toLowerCase();
  const module = $('#glossary-module').value;
  const result = state.terms.filter(t => (module === 'all' || String(t.module) === module) && `${t.term} ${t.definition}`.toLowerCase().includes(query));
  $('#term-count').textContent = `${result.length} TERMS`;
  $('#term-list').innerHTML = result.length ? result.map(t=>`<article class="term"><h2>${escapeHtml(t.term)}</h2><div><p>${escapeHtml(t.definition)}</p><span class="source">MODULE ${t.module} · PAGE ${t.page}</span></div></article>`).join('') : '<p class="empty">No matching terms.</p>';
}
function updateTopics() {
  const prior = state.topic;
  const base = state.page === 'combined' ? state.combined : state.questions.filter(q=>q.module===Number(state.page.slice(-1)));
  const topics = [...new Set(base.map(q=>q.topic))];
  $('#topic').innerHTML = '<option value="all">All topics</option>' + topics.map(t=>`<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  state.topic = topics.includes(prior) ? prior : 'all';
  $('#topic').value = state.topic;
}
function updateScore() {
  const base = state.page === 'combined' ? state.combined : state.questions.filter(q=>q.module===Number(state.page.slice(-1)));
  const answered = base.filter(q=>Number.isInteger(state.responses[q.id]));
  const correct = answered.filter(q=>state.responses[q.id]===q.answer).length;
  $('#score').textContent = `${answered.length} answered · ${correct} correct`;
}
function renderQuiz() {
  const set = listForPage();
  if (!set.length) { $('#question-card').innerHTML='<p class="empty">No questions in this topic.</p>'; return; }
  const key = pageKey();
  const index = Math.max(0,Math.min(state.positions[key] || 0,set.length-1));
  state.positions[key]=index;
  const q=set[index];
  const recorded=state.responses[q.id];
  const checked=Number.isInteger(recorded);
  const selected=checked ? recorded : state.selected;
  $('#position').textContent=`QUESTION ${index+1} / ${set.length}`;
  $('#question-topic').textContent=q.topic.toUpperCase();
  $('#progress-fill').style.width=`${((index+1)/set.length)*100}%`;
  const options=q.options.map((choice,i)=>{
    const classes=['answer'];
    if(selected===i)classes.push('selected');
    if(checked&&q.answer===i)classes.push('correct');
    if(checked&&recorded===i&&q.answer!==i)classes.push('wrong');
    return `<button type="button" class="${classes.join(' ')}" data-choice="${i}" aria-pressed="${selected===i}" ${checked?'disabled':''}><span class="letter">${'ABCD'[i]}</span><span>${escapeHtml(choice)}</span></button>`;
  }).join('');
  $('#question-card').innerHTML=`<div class="question-inner"><h2>${escapeHtml(q.question)}</h2><div class="answers" role="group" aria-label="Answer choices">${options}</div>${checked?`<div class="explanation" role="status"><strong>${recorded===q.answer?'CORRECT':`CORRECT ANSWER: ${'ABCD'[q.answer]}`}</strong><p>${escapeHtml(q.explanation)}</p><span class="source">SOURCE: MODULE ${q.module} · PDF PAGE ${q.page} · ${escapeHtml(files[q.module])}</span></div>`:`<button type="button" class="check" id="check" ${state.selected===null?'disabled':''}>Check answer</button>`}</div>`;
  $('#question-card').querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{state.selected=Number(button.dataset.choice);renderQuiz();}));
  $('#check')?.addEventListener('click',()=>{state.responses[q.id]=state.selected;state.selected=null;save();updateScore();renderQuiz();});
  $('#prev').disabled=index===0;
  $('#next').disabled=index===set.length-1;
  updateScore();
}
function route() {
  const requested=location.hash.replace('#','');
  state.page=['home','glossary','module-1','module-2','module-3','combined'].includes(requested)?requested:'home';
  $('#home').hidden=state.page!=='home';
  $('#glossary').hidden=state.page!=='glossary';
  $('#quiz').hidden=!state.page.startsWith('module-')&&state.page!=='combined';
  document.querySelectorAll('#nav a').forEach(a=>{
    const active=a.dataset.page===state.page;
    a.classList.toggle('active',active);
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  if(!$('#quiz').hidden){
    const module=Number(state.page.slice(-1));
    $('#quiz-eyebrow').textContent=state.page==='combined'?'05 / MIXED PRACTICE':`0${module+1} / MODULE ${module}`;
    $('#quiz-title').innerHTML=state.page==='combined'?'Combined<br>Module 1 + 2<span class="dot">.</span>':`Module ${module} quiz<span class="dot">.</span>`;
    $('#quiz-intro').textContent=state.page==='combined'?'A balanced review of The Architect and Professional Life.':`${titles[module]} — answer each question to reveal a short explanation and source page.`;
    state.topic='all';state.selected=null;updateTopics();renderQuiz();
  }
  document.title=`${state.page==='home'?'Overview':state.page==='glossary'?'Glossary':state.page==='combined'?'Combined Module 1 + 2':`Module ${state.page.slice(-1)} quiz`} · Architectural Practice Study`;
  window.scrollTo({top:0,behavior:'instant'});
}
async function init(){
  load();
  $('#search').addEventListener('input',renderGlossary);
  $('#glossary-module').addEventListener('change',renderGlossary);
  $('#topic').addEventListener('change',e=>{state.topic=e.target.value;state.selected=null;renderQuiz();});
  $('#prev').addEventListener('click',()=>{state.positions[pageKey()]--;state.selected=null;renderQuiz();$('#quiz').scrollIntoView({behavior:'smooth'});});
  $('#next').addEventListener('click',()=>{state.positions[pageKey()]++;state.selected=null;renderQuiz();$('#quiz').scrollIntoView({behavior:'smooth'});});
  window.addEventListener('hashchange',route);
  try {
    const urls=['questions.json','glossary.json','combined.json'];
    const responses=await Promise.all(urls.map(u=>fetch(u)));
    if(responses.some(r=>!r.ok))throw new Error('Study data unavailable');
    [state.questions,state.terms,state.combined]=await Promise.all(responses.map(r=>r.json()));
    renderHome();renderGlossary();route();
  } catch(error) {
    $('#module-grid').innerHTML='<p class="empty">Study data could not load. Please refresh the page.</p>';
    $('#term-list').innerHTML='<p class="empty">Glossary could not load. Please refresh the page.</p>';
    $('#question-card').innerHTML='<p class="empty">Questions could not load. Please refresh the page.</p>';
  }
}
init();

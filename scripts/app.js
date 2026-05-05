// Core Game Constants, Metrics, and Difficulty Setup
// METRICS SYSTEM
// ═══════════════════════════════════════
function getMetrics(){try{return localStorage.getItem('gg_metrics')||'yards';}catch{return 'yards';}}
function setMetrics(m){try{localStorage.setItem('gg_metrics',m);}catch{}}
function fmtYds(yds){
  if(getMetrics()==='meters'){
    return Math.round(yds*0.9144)+' m';
  }
  return yds+' yds';
}
function refreshMetricText(text, yds){
  if(!Number.isFinite(yds)) return text;
  const distance = fmtYds(Math.max(0, yds));
  return String(text || '')
    .replace(/\d+\s+(?:yds|m)(?=\s+left\b)/gi, distance)
    .replace(/\d+\s+(?:yds|m)(?=\s+to hole\b)/gi, distance);
}
function refreshMetricSensitiveDisplays(){
  if(typeof renderLog === 'function') renderLog();
  const sub = document.getElementById('resSub');
  if(sub && /\b(?:yds|m)\b/i.test(sub.textContent || '')){
    sub.textContent = refreshMetricText(sub.textContent, S.yrdRemain);
  }
}
function updateMetricsUI(){
  const m=getMetrics();
  const el=document.getElementById('metricsToggle');
  if(el)el.classList.toggle('on', m==='meters');
  updateYrd();
  const h=HOLES[S.holeIdx];
  if(h){
    document.getElementById('holeYards').textContent=fmtYds(h.yards);
  }
  refreshMetricSensitiveDisplays();
}
function setMetricsPref(m){
  setMetrics(m);
  updateMetricsUI();
  updateYrd();
  const h=HOLES[S.holeIdx];
  if(h){
    document.getElementById('holeYards').textContent=fmtYds(h.yards);
  }
  refreshMetricSensitiveDisplays();
}

// ═══════════════════════════════════════
// ZONES
// ═══════════════════════════════════════
const Z={
  tee: {key:'tee', name:'Tee Box',      color:'#2c5f8a',emoji:'🏌️',cls:'z-tee'},
  fwy: {key:'fwy', name:'Fairway',       color:'#3a7a30',emoji:'🌿',cls:'z-fwy'},
  rgh: {key:'rgh', name:'Rough',         color:'#6b5e1e',emoji:'🌾',cls:'z-rgh'},
  chip:{key:'chip',name:'Chip',          color:'#7ab830',emoji:'🍃',cls:'z-chip'},
  sand:{key:'sand',name:'Sand',          color:'#c8a84b',emoji:'🏖️',cls:'z-sand'},
  grn: {key:'grn', name:'Green',         color:'#1da84a',emoji:'⛳',cls:'z-grn'},
  h2o: {key:'h2o', name:'Water',         color:'#1e6fa8',emoji:'💧',cls:'z-h2o'},
  ob:  {key:'ob',  name:'Out of Bounds', color:'#b03020',emoji:'🚫',cls:'z-ob'},
  hole:{key:'hole',name:'Hole In!',      color:'#f0c040',emoji:'🏆',cls:'z-hole'},
  p1:  {key:'p1',  name:'1 Putt',        color:'#52c87a',emoji:'🟢',cls:'z-1p'},
  p2:  {key:'p2',  name:'2 Putts',       color:'#e8a030',emoji:'🟡',cls:'z-2p'},
  p3:  {key:'p3',  name:'3 Putts',       color:'#e05050',emoji:'🔴',cls:'z-3p'},
};

// ═══════════════════════════════════════
// YARDAGE GATES
// ═══════════════════════════════════════
function getGate(yds, isPar3){
  if(yds<=0)   return 'green';
  if(yds<15)   return 'nearpin';
  if(yds<80)   return 'short';
  if(yds<220 && !isPar3) return 'mid';
  return 'far';
}

// ═══════════════════════════════════════
// PLAYER NAME + GAME START
// ═══════════════════════════════════════
let PLAYER_NAME='PLAYER';
let GAME_DIFF=1;

function setDiff(d){
  GAME_DIFF=d;
  [1,2,3].forEach(i=>{
    const b=document.getElementById('diff-btn-'+i);
    if(b)b.classList.toggle('active', i===d);
  });
}

function setCustomDiff(d){
  GAME_DIFF=d;
  [1,2,3].forEach(i=>{
    const b=document.getElementById('cdiff-btn-'+i);
    if(b)b.classList.toggle('active', i===d);
  });
}


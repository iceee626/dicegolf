// Grid Templates, Rendering, Distance, and Yardage Helpers

function _layoutForStage(h, stage){
  const key = stage === 'par3' ? 'par3Layout' : `${stage}Layout`;
  return h[key] || h.layout;
}
function _teeTmpl(h){
  const d=h.diff;
  const layout=_layoutForStage(h,'tee');
  switch(layout){
    case 'doglegs':      return d===1?T_TEE_DOG_E(): d===2?T_TEE_DOG_M(): T_TEE_DOG_H();
    case 'bunkerFwy':    return d===1?T_TEE_BFWY_E():d===2?T_TEE_BFWY_M():T_TEE_BFWY_H();
    case 'waterCross':   return d===1?T_TEE_WCRS_E():d===2?T_TEE_WCRS_M():T_TEE_WCRS_H();
    case 'waterTee':     return d===1?T_TEE_WTEE_E():d===2?T_TEE_WTEE_M():T_TEE_WTEE_H();
    case 'coastal':      return d===1?T_TEE_COAST_E():d===2?T_TEE_COAST_M():T_TEE_COAST_H();
    case 'desertWash':   return d===1?T_TEE_DSRT_E():d===2?T_TEE_DSRT_M():T_TEE_DSRT_H();
    case 'cathedral':    return d===1?T_TEE_CATH_E():d===2?T_TEE_CATH_M():T_TEE_CATH_H();
    default:             return d===1?T_TEE_OPEN_E():d===2?T_TEE_OPEN_M():T_TEE_OPEN_H();
  }
}
function _par3Tmpl(h){
  const d=h.diff;
  const layout=_layoutForStage(h,'par3');
  switch(layout){
    case 'waterCross':   return d===1?T_P3_WCRS_E():d===2?T_P3_WCRS_M():T_P3_WCRS_H();
    case 'waterTee':     return d===1?T_P3_WTEE_E():d===2?T_P3_WTEE_M():T_P3_WTEE_H();
    case 'bunkerGreen':  return d===1?T_P3_BGRN_E():d===2?T_P3_BGRN_M():T_P3_BGRN_H();
    case 'stadium':      return d===1?T_P3_STAD_E():d===2?T_P3_STAD_M():T_P3_STAD_H();
    default:             return d===1?T_P3_OPEN_E():d===2?T_P3_OPEN_M():T_P3_OPEN_H();
  }
}
function _appTmpl(h){
  const d=h.diff;
  const layout=_layoutForStage(h,'app');
  switch(layout){
    case 'doglegs':      return d===1?T_APP_DOG_E(): d===2?T_APP_DOG_M(): T_APP_DOG_H();
    case 'bunkerFwy':    return d===1?T_APP_BFWY_E():d===2?T_APP_BFWY_M():T_APP_BFWY_H();
    case 'bunkerGreen':  return d===1?T_APP_BGRN_E():d===2?T_APP_BGRN_M():T_APP_BGRN_H();
    case 'waterCross':   return d===1?T_APP_WCRS_E():d===2?T_APP_WCRS_M():T_APP_WCRS_H();
    case 'waterApproach':return d===1?T_APP_WAPR_E():d===2?T_APP_WAPR_M():T_APP_WAPR_H();
    case 'coastal':      return d===1?T_APP_COAST_E():d===2?T_APP_COAST_M():T_APP_COAST_H();
    case 'desertWash':   return d===1?T_APP_DSRT_E():d===2?T_APP_DSRT_M():T_APP_DSRT_H();
    case 'cathedral':    return d===1?T_APP_CATH_E():d===2?T_APP_CATH_M():T_APP_CATH_H();
    default:             return d===1?T_APP_OPEN_E():d===2?T_APP_OPEN_M():T_APP_OPEN_H();
  }
}
function _farTmpl(h){
  const d=h.diff;
  const layout=_layoutForStage(h,'far');
  switch(layout){
    case 'doglegs':
    case 'cathedral':    return d===1?T_FAR_TGHT_E():d===2?T_FAR_TGHT_M():T_FAR_TGHT_H();
    case 'bunkerFwy':    return d===1?T_FAR_BFWY_E():d===2?T_FAR_BFWY_M():T_FAR_BFWY_H();
    case 'waterCross':   return d===1?T_FAR_WCRS_E():d===2?T_FAR_WCRS_M():T_FAR_WCRS_H();
    case 'coastal':      return d===1?T_FAR_COAST_E():d===2?T_FAR_COAST_M():T_FAR_COAST_H();
    case 'desertWash':   return d===1?T_FAR_DSRT_E():d===2?T_FAR_DSRT_M():T_FAR_DSRT_H();
    default:             return d===1?T_FAR_OPEN_E():d===2?T_FAR_OPEN_M():T_FAR_OPEN_H();
  }
}
function _puttTmpl(h){
  const bd=h.baseDiff||2, gd=GAME_DIFF||1;
  const tbl=[[T_PUTT_1E,T_PUTT_1N,T_PUTT_1H],[T_PUTT_2E,T_PUTT_2N,T_PUTT_2H],[T_PUTT_3E,T_PUTT_3N,T_PUTT_3H]];
  return (tbl[bd-1]||tbl[1])[gd-1]();
}
// Count consecutive sand/chip shots — used to detect and break loops
function _sandChipLoopDepth(){
  const h=S.zoneHistory||[];
  let n=0;
  for(let i=h.length-1;i>=0;i--){
    if(h[i]==='sand'||h[i]==='chip')n++;
    else break;
  }
  return n;
}

function _chipTmpl(h){
  // Force easiest chip template if stuck in sand↔chip loop
  const d=_sandChipLoopDepth()>=2?1:h.diff;
  return d===1?T_CHIP_E():d===2?T_CHIP_M():T_CHIP_H();
}
function _sandTmpl(h){
  // Force easiest sand template if stuck in sand↔chip loop
  const looping=_sandChipLoopDepth()>=2;
  const d=looping?1:h.diff;
  // Far bunker (>80m) — fwy-exit grid, no rgh cells
  if(S.yrdRemain>87) return d===1?T_SAND_FAR_E():d===2?T_SAND_FAR_M():T_SAND_FAR_H();
  // Near-green bunker (≤80m) — green+chip+hole, no rgh
  return d===1?T_SAND_E():d===2?T_SAND_M():T_SAND_H();
}

function buildGrid(){
  // Tutorial override
  if(TUT.active){
    const tg=tutGetGrid();
    if(tg){
      S.currentGrid=tg.map(r=>[...r]);
      document.getElementById('gridTitle').textContent=S.zone==='grn'?'Putting Grid':S.zone==='tee'?'Tee Shot Grid':'Shot Grid';
      renderGrid();return;
    }
  }
  // Versus: player 1 gets base grid, applies own wildcards
  if(VS.active&&VS.currentPlayer===1){
    const cached=vsGetCachedGrid();
    if(cached){
      let tmpl=cached.map(r=>[...r]);
      if(WCS&&wcEnabled())tmpl=applyWcGridMods(tmpl);
      S.currentGrid=tmpl;renderGrid();return;
    }
  }

  const h=HOLES[S.holeIdx];
  const isPar3=h.par===3;
  const gate=getGate(S.yrdRemain,isPar3);
  let tmpl;

  const _emit=(title,t)=>{
    document.getElementById('gridTitle').textContent=title;
    // Replace chip cells with fwy when yardage is too high for chip zone after advance
    // (chip advance min 30yds; if pre-advance >117yds chip will always be overridden visually)
    // Don't replace chip→fwy on par 3 tee: chip is always valid there and hole cell must stay
    if(S.yrdRemain>117 && S.zone!=='chip' && S.zone!=='sand' && !(isPar3&&S.zone==='tee')){
      t=t.map(row=>row.map(c=>c==='chip'?'fwy':c));
    }
    if(VS.active)vsCacheGrid(t);
    if(WCS&&wcEnabled())t=applyWcGridMods(t);
    S.currentGrid=t;renderGrid();
  };

  // PUTTING
  if(S.zone==='grn'||gate==='green'){
    return _emit('Putting Grid',_puttTmpl(h));
  }

  // CHIP (no chip cells — chip→chip loop impossible)
  if(S.zone==='chip'||(gate==='nearpin'&&S.zone!=='grn'&&S.zone!=='sand') || ((S.zone==='fwy'||S.zone==='rgh') && S.yrdRemain <= 35)){
    return _emit('Chip Shot Grid',_chipTmpl(h));
  }

  // SAND ESCAPE (max 3 sand cells — sand→sand loop near-impossible)
  if(S.zone==='sand'){
    return _emit('Sand Shot Grid',_sandTmpl(h));
  }

  // TEE — par 3
  if(S.zone==='tee'&&isPar3){
    return _emit('Tee Shot Grid',_par3Tmpl(h));
  }

  // TEE — par 4/5
  if(S.zone==='tee'){
    return _emit('Tee Shot Grid',_teeTmpl(h));
  }

  // FAIRWAY
  if(S.zone==='fwy'){
    if(gate==='short'||gate==='nearpin'){
      tmpl=_appTmpl(h); // approach templates have no raw fwy cells
    } else if(gate==='mid'){
      tmpl=_appTmpl(h);
    } else {
      tmpl=_farTmpl(h);
    }
    return _emit('Fairway Shot Grid',tmpl);
  }

  // ROUGH
  if(S.zone==='rgh'){
    if(gate==='short'||gate==='nearpin'){
      // anti-loop: RGH_SHORT has no chip cells → breaks chip→rgh-short→chip
      tmpl=h.diff===1?T_RGH_SHORT_E():h.diff===2?T_RGH_SHORT_M():T_RGH_SHORT_H();
    } else if(gate==='far'){
      tmpl=h.diff===1?T_RGH_FAR_E():h.diff===2?T_RGH_FAR_M():T_RGH_FAR_H();
    } else {
      tmpl=h.diff===1?T_RGH_MID_E():h.diff===2?T_RGH_MID_M():T_RGH_MID_H();
    }
    return _emit('Rough Shot Grid',tmpl);
  }

  // Fallback
  tmpl=T_FAR_OPEN_M();
  if(VS.active)vsCacheGrid(tmpl);
  S.currentGrid=tmpl;renderGrid();
}

function flipCell(cell, zd){
  if(cell.dataset.flipping==='1')return;
  cell.dataset.flipping='1';
  cell.style.transition='transform .15s ease';
  cell.style.transform='scaleX(0)';
  
  // Use innerHTML instead of textContent so we don't destroy the shot markers
  const origHTML=cell.innerHTML; 
  
  setTimeout(()=>{
    cell.innerHTML=zd.name.toUpperCase();
    cell.style.fontSize='7px';
    cell.style.transform='scaleX(1)';
    setTimeout(()=>{
      cell.style.transform='scaleX(0)';
      setTimeout(()=>{
        cell.innerHTML=origHTML;
        cell.style.fontSize='';
        cell.style.transform='scaleX(1)';
        cell.style.transition='';
        cell.dataset.flipping='0';
      },150);
    },800);
  },150);
}

function renderGrid(){
  const ax=document.getElementById('gridAxes');ax.innerHTML='';
  const corner=document.createElement('div');ax.appendChild(corner);
  const alwaysLabels=getCellLabelMode()==='always';
  for(let c=1;c<=6;c++){const l=document.createElement('div');l.className='ax';l.textContent=c;ax.appendChild(l);}
  for(let r=0;r<6;r++){
    const rl=document.createElement('div');rl.className='ax';rl.textContent=r+1;ax.appendChild(rl);
    for(let c=0;c<6;c++){
      const zk=S.currentGrid[r][c];const zd=Z[zk]||Z.fwy;
      const cell=document.createElement('div');
      cell.className=`cell ${zd.cls}`;cell.id=`cell-${r}-${c}`;
      const abbr={ob:'OB',h2o:'H₂O',hole:'⛳',p1:'1P',p2:'2P',p3:'3P'};
      const alwaysName={h2o:'WATER',ob:'OB',grn:'GREEN',fwy:'FAIRWAY',rgh:'ROUGH',chip:'CHIP',sand:'SAND',tee:'TEE',hole:'HOLE',p1:'1P',p2:'2P',p3:'3P'};
      if(alwaysLabels){
        cell.textContent=(alwaysName[zk]||zd.name).toUpperCase();
        cell.style.cssText='font-size:6px;line-height:1.1;text-align:center;padding:1px;word-break:break-word;font-weight:700;';
      } else if(abbr[zk]){
        cell.textContent=abbr[zk];
      }
      if(getCellLabelMode()!=='always'){
        cell.addEventListener('click',()=>flipCell(cell,zd));
      }
      ax.appendChild(cell);
    }
  }
}

function litCell(r,c){
  document.querySelectorAll('.cell.lit').forEach(e=>e.classList.remove('lit'));
  const el=document.getElementById(`cell-${r}-${c}`);
  if(el)el.classList.add('lit');
}

// ═══════════════════════════════════════
// YARDAGE
// ═══════════════════════════════════════
function updateYrd(){
  const rem=Math.max(0,S.yrdRemain);
  const pct=S.yrdTotal>0?rem/S.yrdTotal:0;
  const pendingHoleFinish=!!S._pendingHoleFinish;
  const putts=S._pendingPuttResult?.putts||0;
  const puttLabel=`${putts} PUTT${putts===1?'':'S'}`;
  document.getElementById('yrdNum').textContent=
    pendingHoleFinish ? 'IN HOLE' :
    putts>0 ? puttLabel :
    S.zone==='grn' ? 'ON GREEN' :
    rem>0 ? fmtYds(rem) : 'On green';
  document.getElementById('yrdFill').style.width=`${Math.round(pct*100)}%`;
  document.getElementById('yrdLbl').textContent=
    pendingHoleFinish ? 'ready to finish' :
    putts>0 ? 'in a hole' :
    S.zone==='grn' ? 'putting' :
    rem>0 ? 'to hole' : 'putting';
}

function getOverallScoreDiff(){
  let total = 0, par = 0;
  S.scorecards.forEach(sc => sc.forEach((score, i) => {
    if(score !== null){
      total += score;
      par += HOLES[i].par;
    }
  }));
  return total - par;
}

function appendWcNoteToLastLog(noteStr){
  if(!noteStr || !Array.isArray(S.log) || S.log.length === 0) return;
  const last = S.log[S.log.length - 1];
  if(!last || typeof last.desc !== 'string') return;
  if(last.desc.includes(noteStr)) return;
  if(/\)\s*$/.test(last.desc) && last.desc.includes('(')){
    last.desc = last.desc.replace(/\)\s*$/, `, ${noteStr})`);
  } else {
    last.desc += ` (${noteStr})`;
  }
}

function activateGreenReadOnGrid(grid){
  if(!Array.isArray(grid)) return grid;
  if(!(WCS.greenReadQueued || WCS.greenReadActive)) return grid;
  WCS.greenReadQueued = false;
  WCS.greenReadActive = false;
  const nextGrid = grid.map(row => row.map(cell => (cell === 'p3' ? 'p2' : cell)));
  showWcToast('🌱 Green Read activated!');
  appendWcNote('🌱 Green Read');
  return nextGrid;
}

function maybeArmBounceBackFromHoleResult(diff){
  if(!WCS.bounceBackPending) return;
  if(diff >= 1){
    WCS.bounceBackPending = false;
    WCS.bounceBackReady = true;
  }
}

function applyBogeyShieldToScore(rawScore, par){
  if(!WCS.bogeyShieldActive) return rawScore;
  if((rawScore - par) < 1) return rawScore;
  WCS.bogeyShieldActive = false;
  showWcToast('🛡️ Bogey Shield activated!');
  appendWcNoteToLastLog('🛡️ Bogey Shield');
  renderLog();
  return par;
}

function advanceYrd(zk){
  if (['h2o', 'ob', 'grn', 'p1', 'p2', 'p3', 'hole'].includes(zk)) return;

  const isPar3 = HOLES[S.holeIdx].par === 3;
  const isTee = S.zone === 'tee'; // This is the origin zone of the shot

  // 1. Short escapes (Greenside Bunkers and Chip zones)
  if (S.zone === 'sand' || S.zone === 'chip') {
    const advance = Math.round(20 + Math.random() * 30);
    S.yrdRemain = Math.max(5, S.yrdRemain - advance);
    return;
  }

  // 2. Par 3 Tee Shots landing in a hazard (Rough/Sand/Chip)
  // The ball travels all the way to the greenside area (5-25 yards left).
  if (isPar3 && isTee) {
    S.yrdRemain = Math.round(5 + Math.random() * 20);
    return;
  }

  // 3. Dynamic "Golf Club" Distance Logic
  let dist = 0;
  if (isTee) {
    dist = Math.round(240 + Math.random() * 50); // Driver range (240-290)
  } else {
    if (S.yrdRemain > 220) {
      dist = Math.round(190 + Math.random() * 50); // Wood / Long Iron (190-240)
    } else if (S.yrdRemain >= 150) {
      dist = Math.round(140 + Math.random() * 40); // Mid Iron (140-180)
    } else {
      // Approach shot (Short Iron/Wedge) - scaled to the distance remaining
      dist = Math.round(S.yrdRemain * (0.8 + Math.random() * 0.3));
    }
  }

  // 4. Apply distance penalties for landing in hazards
  if (zk === 'rgh' || zk === 'sand' || zk === 'chip') {
    let penalty = 1.0;
    
    // Using a +/- 5% variance around your target percentages to keep it organic
    const variance = (Math.random() * 0.10) - 0.05; 
    
    if (GAME_DIFF === 1) {
      penalty = 0.85 + variance; // ~15% distance loss on Easy
    } else if (GAME_DIFF === 2) {
      penalty = 0.70 + variance; // ~30% distance loss on Normal
    } else {
      penalty = 0.55 + variance; // ~45% distance loss on Hard
    }
    dist = Math.round(dist * penalty);
  }

  S.yrdRemain = Math.max(0, S.yrdRemain - dist);

  // 5. Clamp yardage for hazards so we don't accidentally reach 0 yds (the green)
  if ((zk === 'fwy' || zk === 'rgh' || zk === 'sand' || zk === 'chip') && S.yrdRemain < 5) {
    S.yrdRemain = Math.round(5 + Math.random() * 10);
  }
}

// ═══════════════════════════════════════
// ROLL
// ═══════════════════════════════════════

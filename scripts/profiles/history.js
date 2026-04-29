// Round Statistics, Versus Summary, and Tournament Panels

function getRoundStats(roundIdx){
  let stats = [
    { label: 'Total Strokes', val: 0 },
    { label: 'Hole in One', val: 0 },
    { label: 'Eagles+', val: 0 },
    { label: 'Birdies', val: 0 },
    { label: 'Pars', val: 0 },
    { label: 'Bogeys', val: 0 },
    { label: 'Double Bogeys+', val: 0 },
    { label: 'Penalties', val: 0 },
    { label: 'Wildcards Used', val: 0 }
  ];

  const rounds = roundIdx === 'overall'
    ? Array.from({length:S.currentRound}, (_,i)=>i)
    : [roundIdx - 1];

  rounds.forEach(rndIdx => {
    const sc = S.scorecards[rndIdx] || [];
    sc.forEach((score, i) => {
      if(score === null || score === undefined) return;
      const h = HOLES[i];
      const hist = (S.histories[rndIdx] || [])[i];
      if(!h || !hist) return;

      stats[0].val += score;
      const d = score - h.par;
      if (h.par === 3 && score === 1) stats[1].val++;
      else if (d <= -2) stats[2].val++;
      else if (d === -1) stats[3].val++;
      else if (d === 0) stats[4].val++;
      else if (d === 1) stats[5].val++;
      else if (d >= 2) stats[6].val++;

      stats[7].val += hist.log.filter(l => l.pen).length;
      stats[8].val += (hist.wcsUsed ? hist.wcsUsed.length : 0);
    });
  });

  if(!wcEnabled()) stats = stats.filter(s => s.label !== 'Wildcards Used');
  return stats;
}

function getVsRoundStats(playerIdx, roundIdx){
  let stats = [
    { label: 'Total Strokes', val: 0 },
    { label: 'Hole in One', val: 0 },
    { label: 'Eagles+', val: 0 },
    { label: 'Birdies', val: 0 },
    { label: 'Pars', val: 0 },
    { label: 'Bogeys', val: 0 },
    { label: 'Double Bogeys+', val: 0 },
    { label: 'Penalties', val: 0 },
    { label: 'Wildcards Used', val: 0 }
  ];
  let holesWon = 0;
  const rounds = roundIdx === 'overall'
    ? Array.from({length:Math.max(1, S.totalRounds || 1)}, (_,i)=>i)
    : [Math.max(0, (roundIdx || 1) - 1)];
  rounds.forEach(rndIdx=>{
    for(let i = S.startIdx; i <= S.endIdx; i++){
      const h = HOLES[i];
      const hist = vsGetHistory(playerIdx, i, rndIdx);
      if(!h || !hist || hist.strokes === null || hist.strokes === undefined) continue;
      const score = hist.strokes;
      stats[0].val += score;
      const d = score - h.par;
      if(h.par === 3 && score === 1) stats[1].val++;
      else if(d <= -2) stats[2].val++;
      else if(d === -1) stats[3].val++;
      else if(d === 0) stats[4].val++;
      else if(d === 1) stats[5].val++;
      else if(d >= 2) stats[6].val++;
      stats[7].val += (hist.log || []).filter(l=>l.pen).length;
      stats[8].val += (hist.wcsUsed ? hist.wcsUsed.length : 0);

      if(VS.format === 'match'){
        const opp = vsGetHistory(playerIdx === 0 ? 1 : 0, i, rndIdx);
        if(opp && opp.strokes !== null && opp.strokes !== undefined && score < opp.strokes) holesWon++;
      }
    }
  });
  if(VS.format === 'match'){
    stats.unshift({ label: 'Holes Won', val: holesWon });
  }
  if(!wcEnabled()) stats = stats.filter(s => s.label !== 'Wildcards Used');
  return stats;
}

function getVsSummaryComparisonRows(roundIdx){
  const leftStats = getVsRoundStats(0, roundIdx);
  const rightStats = getVsRoundStats(1, roundIdx);
  const rightMap = new Map(rightStats.map(s => [s.label, Number(s.val || 0)]));
  const rows = leftStats.map(s => ({
    label: s.label,
    left: Number(s.val || 0),
    right: Number(rightMap.get(s.label) || 0)
  }));
  rightStats.forEach(s=>{
    if(!rows.some(r=>r.label === s.label)){
      rows.push({ label: s.label, left: 0, right: Number(s.val || 0) });
    }
  });
  return rows;
}

function getVsSummaryStatColors(label, left, right){
  const neutral = 'var(--text)';
  if(left === right) return { leftColor: neutral, rightColor: neutral };
  const higherBetter = new Set(['Holes Won', 'Hole in One', 'Eagles+', 'Birdies', 'Pars']);
  const lowerBetter = new Set(['Total Strokes', 'Bogeys', 'Double Bogeys+', 'Penalties', 'Wildcards Used']);
  if(higherBetter.has(label)){
    return left > right
      ? { leftColor: 'var(--c-fwyl)', rightColor: '#e05252' }
      : { leftColor: '#e05252', rightColor: 'var(--c-fwyl)' };
  }
  if(lowerBetter.has(label)){
    return left < right
      ? { leftColor: 'var(--c-fwyl)', rightColor: '#e05252' }
      : { leftColor: '#e05252', rightColor: 'var(--c-fwyl)' };
  }
  return { leftColor: neutral, rightColor: neutral };
}

function setVsSummaryPlayer(playerIdx, viewRound = S.currentRound, backTarget = _summaryBackTarget){
  _vsSummaryPlayer = Math.max(0, Math.min(1, playerIdx || 0));
  if(_summaryContext && _summaryContext.mode === 'versus'){
    _summaryContext.playerIdx = _vsSummaryPlayer;
  }
  const body=document.getElementById('sumBody');
  const savedScroll = body ? body.scrollTop : 0;
  _vsSummaryPreserveScroll = true;
  openVersusSummary(viewRound, backTarget);
  _vsSummaryPreserveScroll = false;
  if(body) requestAnimationFrame(()=>{ body.scrollTop = savedScroll; });
}

let _vsSummaryPreserveScroll = false;
function openVersusSummary(viewRound = S.currentRound, backTarget = _summaryBackTarget){
  document.getElementById('overlay').classList.remove('show');
  if(backTarget === 'hcScreen'){
    setMainAppConcealed(true);
    hideMainAppImmediate();
  } else {
    concealMainApp();
  }
  _summaryBackTarget = backTarget || null;
  closeSummaryHoleModal();
  const body=document.getElementById('sumBody');
  body.innerHTML='';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.flex = '1';
  body.style.minHeight = '0';
  if(!_vsSummaryPreserveScroll) body.scrollTop = 0;
  const backBtn=document.getElementById('sumBackBtn');
  const backSpacer=document.getElementById('sumHeadSpacer');
  if(backBtn){ backBtn.style.display='flex'; backBtn.style.visibility = _summaryBackTarget ? 'visible' : 'hidden'; }
  if(backSpacer){ backSpacer.style.display='block'; backSpacer.style.visibility = _summaryBackTarget ? 'hidden' : 'visible'; }
  document.getElementById('sumTitle').textContent='SUMMARY';

  if (S.totalRounds > 1) {
    const tabs = document.createElement('div');
    tabs.className = 'sum-tabs';
    tabs.style.position = 'static';
    for(let r=1; r<=S.totalRounds; r++){
      const tab = document.createElement('button');
      tab.className = `sum-tab ${r === viewRound ? 'active' : ''}`;
      tab.textContent = `ROUND ${r}`;
      tab.onclick = () => openVersusSummary(r, backTarget);
      tabs.appendChild(tab);
    }
    body.appendChild(tabs);
  }

  const playerIdx = Math.max(0, Math.min(1, _vsSummaryPlayer || 0));
  setSummaryContext({ mode:'versus', playerIdx });
  const player = VS.players[playerIdx] || { name:'PLAYER' };
  const scData = vsRoundScores(playerIdx, viewRound - 1) || Array(18).fill(null);
  const histData = vsRoundHistories(playerIdx, viewRound - 1) || Array(18).fill(null);
  const activeHoles = HOLES.slice(S.startIdx, S.endIdx + 1);
  const roundTotal = scData.reduce((a,b)=>a+(b||0),0);
  const roundPar = activeHoles.reduce((a,h)=>a+h.par,0);
  const roundDiff = roundTotal - roundPar;
  const totals = vsStrokeTotals(playerIdx, S.totalRounds);
  const gDiffStr = totals.diff===0 ? 'E' : totals.diff>0 ? `+${totals.diff}` : `${totals.diff}`;
  const compareRows = getVsSummaryComparisonRows(viewRound);

  const statsHead = document.createElement('div');
  statsHead.className = 'sum-section-head';
  statsHead.innerHTML = `<div class="ttl">STATISTICS</div><div class="line"></div>`;
  body.appendChild(statsHead);
  const statsList = document.createElement('div');
  statsList.className = 'sum-stats-list';
  compareRows.forEach(s=>{
    const colors = getVsSummaryStatColors(s.label, s.left, s.right);
    const row = document.createElement('div');
    row.className = 'sum-vs-stats-row';
    row.innerHTML = `
      <div class="l" style="color:${colors.leftColor};">${s.left}</div>
      <div class="m">${s.label}</div>
      <div class="r" style="color:${colors.rightColor};">${s.right}</div>
    `;
    statsList.appendChild(row);
  });
  body.appendChild(statsList);

  const scoreHead = document.createElement('div');
  scoreHead.className = 'sum-section-head';
  scoreHead.innerHTML = `<div class="ttl">SCORECARD</div><div class="line"></div>`;
  const pillWrap = document.createElement('div');
  pillWrap.style.cssText = 'display:flex;gap:6px;overflow-x:auto;';
  VS.players.forEach((pl, idx)=>{
    const btn = document.createElement('button');
    const isActive = idx === playerIdx;
    btn.style.cssText = `background:${isActive?'var(--c-fwy)':'rgba(255,255,255,.05)'};color:${isActive?'#fff':'var(--muted)'};border:1px solid ${isActive?'var(--c-fwyl)':'var(--border)'};border-radius:14px;padding:6px 12px;font-family:'Sen',sans-serif;font-size:10px;font-weight:bold;cursor:pointer;white-space:nowrap;transition:all .2s;`;
    btn.textContent = String(pl.name || `P${idx+1}`).toUpperCase().slice(0, 10);
    btn.onclick = ()=>setVsSummaryPlayer(idx, viewRound, backTarget);
    pillWrap.appendChild(btn);
  });
  scoreHead.appendChild(pillWrap);
  body.appendChild(scoreHead);

  let tournamentTotalBox = null;
  if (S.totalRounds > 1) {
    tournamentTotalBox = document.createElement('div');
    tournamentTotalBox.style.cssText = 'background:var(--summary-chip-bg);border:1px solid var(--summary-chip-border);border-radius:10px;padding:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;';
    tournamentTotalBox.innerHTML = `
      <div><div style="font-family:'Sen',sans-serif;font-size:10px;color:var(--gold);letter-spacing:1px;">TOURNAMENT TOTAL</div><div style="font-family:'Sen',sans-serif;font-size:12px;color:var(--text);">${totals.total} strokes</div></div>
      <div style="font-family:'Bebas Neue',cursive;font-size:28px;color:var(--gold);">${gDiffStr}</div>
    `;
  }

  const sc=document.createElement('div');
  sc.className = 'sc-table-wrapper';
  sc.style.cssText='display:block;overflow-x:auto;overflow-y:hidden;flex-shrink:0;margin-bottom:14px;background:var(--card);border:1px solid var(--border);border-radius:10px;-webkit-overflow-scrolling:touch;overscroll-behavior-x:none;transform:translateZ(0);';
  const table=document.createElement('table');
  const minW = activeHoles.length <= 9 ? '100%' : `${Math.max(320, (activeHoles.length + 2) * 34)}px`;
  table.style.cssText=`width:100%;min-width:${minW};border-collapse:collapse;font-family:"Sen",sans-serif;font-size:10px;`;
  const td=(txt,styles='')=>{
    const c=document.createElement('td'); c.textContent=txt;
    c.style.cssText='padding:5px 3px;text-align:center;border:1px solid var(--border);'+styles;
    return c;
  };

  const headRow=document.createElement('tr');
  headRow.style.background='var(--c-fwy)';
  ['HOLE', ...activeHoles.map((_,i)=>S.startIdx+i+1), 'TOT'].forEach((v,i)=>{
    headRow.appendChild(td(v,'color:#fff;font-weight:600;font-size:10px;letter-spacing:1px;'+(i===0?'text-align:left;padding-left:8px;':'')+(i===activeHoles.length+1?'background:rgba(0,0,0,.2);':'')));
  });
  table.appendChild(headRow);

  const parRow=document.createElement('tr');
  parRow.style.background='rgba(255,255,255,.04)';
  ['PAR', ...activeHoles.map(h=>h.par), roundPar].forEach((v,i)=>{
    parRow.appendChild(td(v,'color:var(--muted);'+(i===0?'text-align:left;padding-left:8px;color:var(--text);':'')+(i===activeHoles.length+1?'font-weight:600;color:var(--text);':'')));
  });
  table.appendChild(parRow);

  const scoreRow=document.createElement('tr');
  scoreRow.style.background='rgba(255,255,255,.03)';
  const playerLabel = String(player.name || '').toUpperCase();
  const scoreCells=[playerLabel, ...activeHoles.map((h,i)=>scData[S.startIdx+i] !== null ? scData[S.startIdx+i] : '–'), roundTotal];
  scoreCells.forEach((v,i)=>{
    const cell=document.createElement('td');
    cell.style.cssText='padding:3px 2px;text-align:center;border:1px solid var(--border);font-size:11px;font-weight:700;'+(i===activeHoles.length+1?'background:rgba(0,0,0,.2);':'');
    if(i===0){
      cell.textContent=v;
      cell.style.cssText+='text-align:left;padding-left:8px;font-family:"Bebas Neue",cursive;font-size:13px;letter-spacing:1px;';
    } else if(i===activeHoles.length+1){
      cell.textContent=v;
      cell.style.color=roundDiff<0?'var(--gold)':roundDiff>0?'#e05252':'var(--c-fwyl)';
    } else {
      const score=scData[S.startIdx + i - 1];
      const h=activeHoles[i-1];
      if(score===null){cell.textContent='–';cell.style.color='var(--muted)';}
      else {
        const d=score-h.par;
        const span=document.createElement('span');
        span.textContent=v;
        span.className = 'sc-sym';
        if(d<=-2)       span.classList.add('sc-sym-eagle');
        else if(d===-1) span.classList.add('sc-sym-birdie');
        else if(d===1)  span.classList.add('sc-sym-bogey');
        else if(d>=2)   span.classList.add('sc-sym-double');
        cell.appendChild(span);
      }
    }
    scoreRow.appendChild(cell);
  });
  table.appendChild(scoreRow);

  const diffRow=document.createElement('tr');
  diffRow.style.background='rgba(0,0,0,.15)';
  let runningDiff=0;
  ['±',...activeHoles.map((h,i)=>{
    const score=scData[S.startIdx+i];
    if(score===null)return null;
    runningDiff+=score-h.par; return runningDiff;
  }),roundDiff].forEach((v,i)=>{
    const cell=document.createElement('td');
    cell.style.cssText='padding:4px 2px;text-align:center;border:1px solid var(--border);font-family:"Sen",sans-serif;font-size:9px;'+(i===activeHoles.length+1?'background:rgba(0,0,0,.2);font-weight:700;':'')+(i===0?'text-align:left;padding-left:8px;':'');
    if(i===0 || v===null){cell.textContent=v===null?'–':'±';cell.style.color='var(--muted)';diffRow.appendChild(cell);return;}
    const txt=v===0?'E':v>0?`+${v}`:`${v}`;
    cell.textContent=txt;
    if(v<0)cell.style.color='var(--gold)'; else if(v===0)cell.style.color='var(--c-fwyl)'; else cell.style.color='#e05252';
    diffRow.appendChild(cell);
  });
  table.appendChild(diffRow);
  sc.appendChild(table);
  body.appendChild(sc);
  if(tournamentTotalBox) body.appendChild(tournamentTotalBox);

  const detailSec=document.createElement('div');
  detailSec.className = 'sum-detail-hint';
  detailSec.textContent='Tap a hole for details';
  body.appendChild(detailSec);

  const holeList=document.createElement('div');
  holeList.className='sum-hole-list';
  activeHoles.forEach((h,i)=>{
    const absoluteIdx = S.startIdx + i;
    const hist=histData[absoluteIdx];
    if(!hist)return;
    const d=hist.strokes-hist.par;
    let numColor='var(--text)';
    if(h.par===3 && hist.strokes===1) numColor='var(--gold)';
    else if(d<=-2) numColor='var(--gold)';
    else if(d===-1) numColor='#52c87a';
    else if(d===0) numColor='var(--text)';
    else if(d===1) numColor='#e05252';
    else numColor='#c04444';
    const row=document.createElement('div');
    row.className = 'sum-hole-pill';
    row.dataset.holeIdx=String(absoluteIdx);
    row.style.background = 'rgba(255,255,255,.07)';
    row.style.position = 'relative';
    row.style.overflow = 'hidden';
    const hasWcVs = hist.wcsUsed && hist.wcsUsed.length > 0;
    row.innerHTML=`<div class="shp-num" style="color:${numColor};">${absoluteIdx+1}</div>${hasWcVs?'<div style="position:absolute;top:4px;right:4px;font-size:7px;line-height:1;pointer-events:none;opacity:.9;">🃏</div>':''}`;
    row.onclick=()=>{
      if(!Array.isArray(S.histories[viewRound - 1])) S.histories[viewRound - 1] = Array(18).fill(null);
      for(let hIdx = S.startIdx; hIdx <= S.endIdx; hIdx++){
        S.histories[viewRound - 1][hIdx] = histData[hIdx] || null;
      }
      openHistInline(absoluteIdx, holeList, row, viewRound);
    };
    holeList.appendChild(row);
  });
  body.appendChild(holeList);

  const spacer=document.createElement('div');
  spacer.style.cssText='flex:1 1 auto;min-height:8px;';
  body.appendChild(spacer);

  const btnRow=document.createElement('div');
  btnRow.className = 'sum-btn-row';
  btnRow.style.flexShrink = '0';
  const returnBtn=document.createElement('button');
  returnBtn.style.cssText='width:100%;background:var(--c-fwy);color:#fff;border:none;border-radius:10px;padding:13px;font-family:"Bebas Neue",cursive;font-size:18px;letter-spacing:2px;cursor:pointer;';
  returnBtn.textContent='RETURN TO MAIN MENU';
  returnBtn.onclick=()=>summaryReturnToMenu();
  btnRow.appendChild(returnBtn);
  const playAgainBtn=document.createElement('button');
  playAgainBtn.style.cssText='width:100%;background:transparent;border:1px solid var(--border);color:var(--muted);border-radius:10px;padding:13px;font-family:"Bebas Neue",cursive;font-size:18px;letter-spacing:2px;cursor:pointer;';
  playAgainBtn.textContent='PLAY AGAIN';
  playAgainBtn.onclick=()=>summaryPlayAgain();
  btnRow.appendChild(playAgainBtn);
  body.appendChild(btnRow);

  const summaryModal = document.getElementById('summaryModal');
  summaryModal.scrollTop = 0;
  summaryModal.classList.add('show');
}

function renderTournamentStatsPanel(selectedKey=S.currentRound){
  const statsContainer = document.getElementById('hcVsStats');
  if(!statsContainer) return;

  const rounds = Array.from({ length: Math.max(1, S.currentRound || 1) }, (_,i)=>i+1);
  const showRoundPills = (S.mode === 'tournament' || S.mode === 'custom') && rounds.length > 1;
  const selectedRound = (typeof selectedKey === 'number' && rounds.includes(selectedKey))
    ? selectedKey
    : rounds[rounds.length - 1];
  const selectedStatsKey = selectedKey === 'overall' ? 'overall' : selectedRound;
  const pills = showRoundPills ? ['overall', ...rounds] : [selectedRound];
  const stats = getRoundStats(selectedStatsKey);

  let html = `
    <div style="display:flex;flex-direction:column;min-height:0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-shrink:0;padding:8px 0 0;">
      <div style="font-family:'Sen',sans-serif;font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;">STATISTICS</div>
      <div style="flex:1;height:1px;background:var(--border);"></div>
      <div style="display:flex;gap:6px;overflow-x:auto;${showRoundPills ? '' : 'display:none;'}">
  `;
  pills.forEach(key => {
    const isOverall = key === 'overall';
    const isActive = isOverall ? selectedStatsKey === 'overall' : key === selectedRound && selectedStatsKey !== 'overall';
    const pillLabel = isOverall ? 'ALL' : `R${key}`;
    const clickExpr = isOverall ? "renderTournamentStatsPanel('overall')" : `renderTournamentStatsPanel(${key})`;
    html += `<button onclick="${clickExpr}" style="background:${isActive?'var(--c-fwy)':'rgba(255,255,255,.05)'};color:${isActive?'#fff':'var(--muted)'};border:1px solid ${isActive?'var(--c-fwyl)':'var(--border)'};border-radius:14px;padding:6px 12px;font-family:'Sen',sans-serif;font-size:10px;font-weight:bold;cursor:pointer;white-space:nowrap;transition:all 0.2s;">${pillLabel}</button>`;
  });
  html += `</div></div>`;

  const hideLastDivider = S.mode === 'single';
  stats.forEach((s, idx) => {
    const isLast = idx === stats.length - 1;
    const rowBorder = hideLastDivider && isLast ? 'none' : '1px solid rgba(255,255,255,.05)';
    html += `
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:center;column-gap:12px;padding:8px 12px;border-bottom:${rowBorder};font-family:'Sen',sans-serif;font-size:11px;">
        <div style="color:var(--muted);min-width:0;">${s.label}</div>
        <div style="color:var(--text);font-weight:bold;text-align:center;">${s.val}</div>
      </div>
    `;
  });

  html += `</div>`;
  statsContainer.innerHTML = html;
  statsContainer.style.display = 'block';
}

function startNextRound() {
  S.currentRound++;
  S.scorecards.push(Array(18).fill(null));
  S.histories.push(Array(18).fill(null));
  S.holeIdx = S.startIdx;
  S._wcUsedThisRound = 0;
  S._wcDiscardedThisRound = 0; 
  S._roundWaterHits = 0;
  S._roundSandHits = 0;
  S._roundRoughHits = 0;
  S._roundPrevWasDoubleOrWorse = false;
  S._roundIceTriggered = false;
  S._roundEndProcessed = false;
  S._roundEndMeta = null;
  _summaryBackTarget = null;
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('summaryModal').classList.remove('show');
  const hc=document.getElementById('hcScreen');
  if(hc) hc.classList.remove('show');
  setMainAppConcealed(true);
  hideMainAppImmediate();
  loadHole();
  saveGameState();
  showSingleRoundSplash();
}

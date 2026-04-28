// Hidden wildcard diagnostics. Runs only with ?wcdiag=1.

(function(){
  let enabled = false;
  try{
    enabled = new URLSearchParams(window.location.search).get('wcdiag') === '1';
  }catch{}
  if(!enabled) return;

  const logs = [];

  function cloneGrid(grid){
    return Array.isArray(grid) ? grid.map(row => Array.isArray(row) ? [...row] : row) : null;
  }

  function visibleGrid(){
    const grid = [];
    for(let r = 0; r < 6; r++){
      const row = [];
      for(let c = 0; c < 6; c++){
        const cell = document.getElementById(`cell-${r}-${c}`);
        row.push({
          zone: cell?.dataset?.zone || null,
          text: cell?.textContent || '',
          className: cell?.className || ''
        });
      }
      grid.push(row);
    }
    return grid;
  }

  function flagState(){
    return {
      greenReadActive: !!WCS.greenReadActive,
      greenReadQueued: !!WCS.greenReadQueued,
      goldenPutterActive: !!WCS.goldenPutterActive,
      birdieBoostActive: !!WCS.birdieBoostActive,
      ferrettActive: !!WCS.ferrettActive
    };
  }

  function flatZones(grid){
    return grid.flat().map(cell => typeof cell === 'string' ? cell : cell.zone);
  }

  function log(label, data){
    const entry = { label, data };
    logs.push(entry);
    console.log(`WCDIAG_${label}`, JSON.stringify(data));
    renderPanel();
  }

  function wrap(name){
    const original = window[name];
    if(typeof original !== 'function') return;
    window[name] = function(...args){
      log(`${name}_before`, {
        zone: S.zone,
        title: document.getElementById('gridTitle')?.textContent || '',
        flags: flagState(),
        pendingPutt: S._pendingPuttResult ? {...S._pendingPuttResult} : null
      });
      const result = original.apply(this, args);
      log(`${name}_after`, {
        zone: S.zone,
        title: document.getElementById('gridTitle')?.textContent || '',
        flags: flagState(),
        currentCounts: countZones(flatZones(cloneGrid(S.currentGrid) || [])),
        visibleCounts: countZones(flatZones(visibleGrid()))
      });
      return result;
    };
  }

  function countZones(zones){
    return zones.reduce((acc, zone) => {
      if(zone) acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {});
  }

  function setButtonsForRoll(){
    const roll = document.getElementById('rollBtn');
    const next = document.getElementById('nextShotBtn');
    if(roll){
      roll.classList.add('shot-btn-visible');
      roll.classList.remove('shot-btn-hidden');
      roll.disabled = false;
      roll.style.pointerEvents = 'auto';
    }
    if(next){
      next.classList.add('shot-btn-hidden');
      next.classList.remove('shot-btn-visible');
      next.disabled = true;
      next.style.pointerEvents = 'none';
    }
  }

  function resetFlags(){
    WCS.greenReadActive = false;
    WCS.greenReadQueued = false;
    WCS.goldenPutterActive = false;
    WCS.birdieBoostActive = false;
    WCS.ferrettActive = false;
    S._pendingPuttResult = null;
    S.holeDone = false;
    S.rolling = false;
  }

  function forceGrid(grid, zone, title){
    resetFlags();
    S.zone = zone;
    S.currentGrid = cloneGrid(grid);
    S.yrdRemain = zone === 'sand' ? 45 : 100;
    const titleEl = document.getElementById('gridTitle');
    if(titleEl) titleEl.textContent = title;
    setButtonsForRoll();
    renderGrid();
  }

  function useCard(id, name, icon){
    WCS.equipped = [{ id, name, icon, desc: '' }];
    activateWildcard(0);
    return snapshot();
  }

  function snapshot(){
    return {
      title: document.getElementById('gridTitle')?.textContent || '',
      zone: S.zone,
      currentGrid: cloneGrid(S.currentGrid),
      visibleGrid: visibleGrid(),
      flags: flagState(),
      pendingPutt: S._pendingPuttResult ? {...S._pendingPuttResult} : null
    };
  }

  function allZonesAre(grid, zone){
    return flatZones(grid).every(cell => cell === zone);
  }

  function noZone(grid, zone){
    return !flatZones(grid).includes(zone);
  }

  function result(label, passed, detail){
    log(`RESULT_${label}`, { passed, detail });
    return passed;
  }

  function runDiagnostics(){
    wrap('activateWildcard');
    wrap('applyWildcardEffect');
    wrap('applyWcGridMods');
    wrap('applyPendingGridWildcardsToCurrentGrid');
    wrap('buildGrid');
    wrap('doNextShot');
    wrap('renderGrid');
    wrap('updateVisibleGridCell');

    const putt = [
      ['p1','p2','p3','p1','p2','p3'],
      ['p2','p3','p1','p2','p3','p1'],
      ['p3','p2','p1','p3','p2','p1'],
      ['p1','p1','p2','p2','p3','p3'],
      ['p2','p1','p3','p1','p2','p3'],
      ['p3','p3','p2','p2','p1','p1']
    ];

    forceGrid(putt, 'grn', 'Putting Grid');
    const greenRead = useCard('green_read', 'Green Read', '🌱');
    result('GREEN_READ', noZone(greenRead.currentGrid, 'p3') && noZone(greenRead.visibleGrid, 'p3'), greenRead);

    forceGrid(putt, 'grn', 'Putting Grid');
    const goldenPutter = useCard('golden_putter', 'Golden Putter', '🥇');
    result('GOLDEN_PUTTER', allZonesAre(goldenPutter.currentGrid, 'p1') && allZonesAre(goldenPutter.visibleGrid, 'p1'), goldenPutter);

    forceGrid(putt, 'grn', 'Putting Grid');
    S._pendingPuttResult = { putts: 3, row: 0, col: 2 };
    const goldenPending = useCard('golden_putter', 'Golden Putter', '🥇');
    result('GOLDEN_PUTTER_PENDING', allZonesAre(goldenPending.currentGrid, 'p1') && goldenPending.pendingPutt?.putts === 1, goldenPending);

    const approach = Array.from({length: 6}, (_, r) => Array.from({length: 6}, (_, c) => (r + c) % 2 === 0 ? 'fwy' : 'grn'));
    forceGrid(approach, 'fwy', 'Fairway Shot Grid');
    const beforeApproachFwy = flatZones(S.currentGrid).filter(zone => zone === 'fwy').length;
    const birdieBoost = useCard('birdie_boost', 'Birdie Boost', '🚀');
    const afterApproachFwy = flatZones(birdieBoost.currentGrid).filter(zone => zone === 'fwy').length;
    result('BIRDIE_BOOST', beforeApproachFwy - afterApproachFwy === 8, birdieBoost);

    const sand = Array.from({length: 6}, () => Array(6).fill('sand'));
    forceGrid(sand, 'sand', 'Sand Shot Grid');
    const ferrett = useCard('the_ferrett', 'The Ferrett', '🦡');
    result('FERRETT', flatZones(ferrett.currentGrid).every(zone => zone === 'hole' || zone === 'grn'), ferrett);

    const passed = logs
      .filter(entry => entry.label.startsWith('RESULT_'))
      .every(entry => entry.data.passed);
    log('SUMMARY', { passed, resultCount: logs.filter(entry => entry.label.startsWith('RESULT_')).length });
  }

  function renderPanel(){
    let panel = document.getElementById('wcDiagPanel');
    if(!panel){
      panel = document.createElement('pre');
      panel.id = 'wcDiagPanel';
      panel.style.cssText = 'position:fixed;inset:12px;z-index:99999;overflow:auto;background:#081018;color:#dfffe0;border:1px solid #4e9e42;border-radius:8px;padding:12px;font:11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;';
      document.body.appendChild(panel);
    }
    const resultLines = logs
      .filter(entry => entry.label.startsWith('RESULT_') || entry.label === 'SUMMARY')
      .map(entry => `${entry.label}: ${JSON.stringify(entry.data, null, 2)}`);
    panel.textContent = resultLines.join('\n\n') || 'Wildcard diagnostics running...';
  }

  window.addEventListener('load', () => {
    try{
      renderPanel();
      runDiagnostics();
    }catch(err){
      log('ERROR', { message: err?.message || String(err), stack: err?.stack || '' });
    }
  });
})();

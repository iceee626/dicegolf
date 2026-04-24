// Hole-in-One Confirmation Flow and Remaining Rule Helpers
// HOLE IN ONE CONFIRMATION ROLL
// ═══════════════════════════════════════
let _hioRow,_hioCol,_hioSnap;

function setHioBallGraphic(){
  const hioBall=document.getElementById('hioBall');
  if(hioBall) hioBall.innerHTML='<img src="assets/golf_ball.png" style="width:56px;height:56px;object-fit:contain;">';
}

function showHoleInConfirmation(row, col, snapGrid){
  _hioRow=row; _hioCol=col; _hioSnap=snapGrid;
  setHioBallGraphic();
  document.getElementById('hioDie1').textContent='?';
  document.getElementById('hioDie2').textContent='?';
  document.getElementById('hioResult').style.display='none';
  document.getElementById('hioRollBtn').style.display='block';
  document.getElementById('hioRollBtn').disabled=false;
  const isHaptic=getRollMode()==='haptic'&&_shakePermissionGranted;
  document.getElementById('hioSub').textContent=isHaptic?'SHAKE OR TAP TO ROLL DOUBLES':'ROLL DOUBLES TO HOLE IT';
  document.getElementById('hioOverlay').classList.add('show');
  document.getElementById('hioBall').style.animation='hio-spin 0.8s linear infinite';
}

function doHioRoll(){
  const btn=document.getElementById('hioRollBtn');
  btn.disabled=true;btn.style.display='none';
  let r1=Math.ceil(Math.random()*6), r2=Math.ceil(Math.random()*6);
  // Tutorial: force doubles for guaranteed HIO
  if(TUT.active){ r1=3; r2=3; }
  const d1=document.getElementById('hioDie1'), d2=document.getElementById('hioDie2');
  let ticks=0;
  const anim=setInterval(()=>{
    d1.textContent=Math.ceil(Math.random()*6);
    d2.textContent=Math.ceil(Math.random()*6);
    ticks++;
    if(ticks>12){
      clearInterval(anim);
      d1.textContent=r1; d2.textContent=r2;
      setTimeout(()=>resolveHio(r1,r2),300);
    }
  },80);
}

function resolveHio(r1, r2){
  const isDoubles=r1===r2;
  const resultEl=document.getElementById('hioResult');
  const prevZone = S.zone;
  const prevYrdRemain = S.yrdRemain;
  document.getElementById('hioBall').style.animation='none';
  setHioBallGraphic();
  resultEl.style.display='block';
  if(isDoubles){
    resultEl.textContent='HOLE IN ONE!!!';
    resultEl.className='hio-result success';
    document.getElementById('hioSub').textContent='🎉 UNBELIEVABLE!';
    playSound('putt', 1.0);
    vibHoleInOne();
    setTimeout(()=>playSound('cheer', 0.9), 400);
    if (!TUT.active) {
      const profiles=loadProfiles();
      const idx=Math.min(getActiveProfileIdx(),profiles.length-1);
      if(profiles[idx])profiles[idx].holeInOnes=(profiles[idx].holeInOnes||0)+1;
      saveProfiles(profiles);
    }
    const tutorialHio = TUT.active;
    setTimeout(()=>{
      if(tutorialHio && !TUT.active) return;
      document.getElementById('hioOverlay').classList.remove('show');
      const snapGrid=_hioSnap;
      S.strokes+=1; S.yrdRemain=0;
      let wcNote = S._wcNextShotNote ? S._wcNextShotNote : '';
      S._wcNextShotNote = null;
      addLog(S.shotNum,`⛳ HOLE IN ONE!${wcNote}`,'hole','+1',false,_hioRow,_hioCol,snapGrid, prevZone, prevYrdRemain);
      showResult(Z.hole,'HOLE IN ONE!','good','');
      S.shotNum++;S.holeDone=true;
      hideNextShotBtn();hidePostShotWcBtn();
      updateYrd();
      setTimeout(()=>{ if(tutorialHio && !TUT.active) return; completeHole(); },900);
    },2200);
  } else {
    resultEl.textContent='SO CLOSE...';
    resultEl.className='hio-result fail';
    document.getElementById('hioSub').textContent=fmtYds(1).toUpperCase()+' TO THE HOLE — TAP TO PUTT';
    setHioBallGraphic();
    setTimeout(()=>{
      document.getElementById('hioOverlay').classList.remove('show');
      const snapGrid=_hioSnap;
      S.strokes+=1; S.yrdRemain=1;
      S.zone='grn';
      advanceYrd('grn'); S.yrdRemain=1;
      S.shotCount++;
      let wcNote = S._wcNextShotNote ? S._wcNextShotNote : '';
      S._wcNextShotNote = null;
      addLog(S.shotNum,`${Z[prevZone].name} → Green · ${fmtYds(1)}${wcNote}`,'grn','+1',false,_hioRow,_hioCol,snapGrid, prevZone, prevYrdRemain);
      showResult(Z.grn,`Ball stopped ${fmtYds(1)} from hole`,'ok',`${fmtYds(1)} to hole`);
      S.shotNum++;updateFloat();updateYrd();updateZonePill();updateTVBanner();
      S.currentGrid=Array(6).fill(null).map(()=>Array(6).fill('p1'));
      S._forceGrid=true;
      renderGrid();
      S.rolling=false;showNextShotBtn();
    },2000);
  }
}

function showConfirm(msg, onYes){
  document.getElementById('confirmMsg').textContent=msg;
  document.getElementById('confirmYes').onclick=()=>{closeConfirm();onYes();};
  document.getElementById('confirmModal').classList.add('show');
}
function closeConfirm(){
  document.getElementById('confirmModal').classList.remove('show');
}

function openGameScreenMenu(){
  if(TUT.active){
    tutMenuIntercept();
    return;
  }
  document.getElementById('gameMenuModal').classList.add('show');
}

function resumeGameScreenMenu(){
  document.getElementById('gameMenuModal').classList.remove('show');
}

function saveAndMenuFromGameScreen(){
  resumeGameScreenMenu();
  returnToMenuSave();
}

function abandonFromGameScreenMenu(){
  abandonCurrentGame();
}

function showToast(msg){
  let el=document.getElementById('gg-toast');
  if(!el){
    el=document.createElement('div');el.id='gg-toast';
    el.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(30,30,40,.95);color:#fff;font-family:"Bebas Neue",cursive;font-size:15px;letter-spacing:2px;padding:10px 22px;border-radius:10px;border:1px solid rgba(255,255,255,.12);z-index:9999;pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap;';
    document.body.appendChild(el);
  }
  el.textContent=msg;el.style.opacity='1';
  clearTimeout(el._t);el._t=setTimeout(()=>el.style.opacity='0',2000);
}

// ═══════════════════════════════════════════════════════

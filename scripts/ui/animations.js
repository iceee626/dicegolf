// Dice Renderer and Early Animation Helpers
// ── DICE PIP RENDERER ────────────────────────────────
const PIP_LAYOUTS={
  0: [],
  1: [4],
  2: [0,8],
  3: [0,4,8],
  4: [0,2,6,8],
  5: [0,2,4,6,8],
  6: [0,2,3,5,6,8],
};
function setDie(dieId, val){
  const container=document.getElementById(dieId);
  if(!container)return;
  container.innerHTML='';
  const pips=PIP_LAYOUTS[val]||[];
  for(let i=0;i<9;i++){
    const p=document.createElement('div');
    p.className='pip'+(pips.includes(i)?'':' hidden');
    container.appendChild(p);
  }
}
function getDieVal(dieId){
  const container=document.getElementById(dieId);
  if(!container)return 1;
  return container.querySelectorAll('.pip:not(.hidden)').length||1;
}

// ═══════════════════════════════════════

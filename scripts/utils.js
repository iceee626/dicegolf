// Shared Utility Helpers

function stripEmojiChars(text){
  return String(text||'').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D\u20E3]/gu,'');
}
function sanitizeName(text, maxLen=10){
  return stripEmojiChars(text).replace(/\s+/g,' ').trim().toUpperCase().substring(0,maxLen);
}
function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));
}
function bindNameSanitizer(id, maxLen=10){
  const el=document.getElementById(id);
  if(!el)return;
  el.addEventListener('input',()=>{
    const clean=sanitizeName(el.value,maxLen);
    if(el.value!==clean) el.value=clean;
    if(id==='profileNewInput'){
      const count=document.getElementById('newNameCount');
      if(count) count.textContent=`${clean.length}/10`;
    }
  });
}

function initFloatingEntities() {
  const container = document.getElementById('floatingEntities');
  if(!container) return;
  container.innerHTML = '';
  const emojis = ['⛳', '🏌️', '🎲', 'assets/golf_ball.png', 'assets/golf_bag.png', 'assets/golf_iron.png'];
  const items = [];
  const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const shouldAnimateFloatingEntities = () => {
    const menu = document.getElementById('menuScreen');
    return !document.hidden
      && !(reducedMotionQuery && reducedMotionQuery.matches)
      && !!menu
      && menu.classList.contains('visible')
      && menu.style.display !== 'none';
  };
  
  // Helper to spawn/respawn items
  const spawnItem = (item, isInitial = false) => {
    if (isInitial) {
      // On first load, spawn them immediately visible across the screen
      item.x = Math.random() * window.innerWidth;
      item.y = Math.random() * (window.innerHeight * 0.4); // Top 40% of screen
      item.speedX = (Math.random() * 0.8 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
    } else {
      // For respawns, place them off-screen to the left or right
      const isLeft = Math.random() > 0.5;
      const offset = Math.random() * 50;
      item.x = isLeft ? -60 - offset : window.innerWidth + 60 + offset;
      item.y = window.innerHeight * 0.1 + Math.random() * (window.innerHeight * 0.3);
      item.speedX = (Math.random() * 0.8 + 0.3) * (isLeft ? 1 : -1);
    }
    
    // Float upwards
    item.speedY = -(Math.random() * 0.6 + 0.2); 
    item.rot = Math.random() * 360;
    item.rotSpeed = (Math.random() * 1.5 - 0.75);
  };
  
  for(let i=0; i<25; i++) {
    const el = document.createElement('div');
    el.className = 'float-item';
    
    const content = emojis[i % emojis.length];
    if (content.endsWith('.png')) {
        el.innerHTML = `<img src="${content}" style="width:40px;height:40px;object-fit:contain;pointer-events:none;">`;
    } else {
        el.textContent = content;
    }
    
    const item = { el: el, isDragging: false, offsetX: 0, offsetY: 0 };
    spawnItem(item, true); // Do the initial staggered off-screen spawn
    // Apply transform immediately so items don't briefly clump at (0,0) before the RAF animate loop runs
    el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rot}deg)`;

    container.appendChild(el);
    
    const startDrag = (e) => {
      item.isDragging = true;
      item.el.style.zIndex = '100';
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      item.offsetX = clientX - item.x;
      item.offsetY = clientY - item.y;
    };
    const moveDrag = (e) => {
      if(!item.isDragging) return;
      e.preventDefault(); // Prevents mobile screen from scrolling while dragging
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      item.x = clientX - item.offsetX;
      item.y = clientY - item.offsetY;
      item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rot}deg)`;
    };
    const endDrag = () => {
      if(!item.isDragging) return;
      item.isDragging = false;
      item.el.style.zIndex = '';
    };
    
    el.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag, {passive: false});
    window.addEventListener('mouseup', endDrag);
    el.addEventListener('touchstart', startDrag, {passive: false});
    window.addEventListener('touchmove', moveDrag, {passive: false});
    window.addEventListener('touchend', endDrag, {passive: false});
    
    items.push(item);
  }
  
  const animate = () => {
    if(shouldAnimateFloatingEntities()){
      items.forEach(item => {
        if(!item.isDragging) {
          item.x += item.speedX;
          item.y += item.speedY; 
          item.rot += item.rotSpeed;
          
          // If an item floats completely off the top, or drifts completely across to the opposite side
          const isOffTop = item.y < -60;
          const isOffRight = item.speedX > 0 && item.x > window.innerWidth + 60;
          const isOffLeft = item.speedX < 0 && item.x < -60;
          
          if (isOffTop || isOffRight || isOffLeft) {
              spawnItem(item, false); // Respawn it smoothly off-screen
          }
          
          // Failsafe: if dragged completely off the bottom of the screen, respawn it
          if(item.y > window.innerHeight + 60) {
              spawnItem(item, false);
          }
          
          item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rot}deg)`;
        }
      });
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
function makeGrid(t){const s=shuffle([...t]);const g=[];for(let r=0;r<6;r++)g.push(s.slice(r*6,r*6+6));return g;}
function rep(k,n){return Array(n).fill(k);}
function cells(...pairs){const c=[];pairs.forEach(([k,n])=>c.push(...rep(k,n)));while(c.length<36)c.push(c[0]);return makeGrid(c.slice(0,36));}

// ═══════════════════════════════════════

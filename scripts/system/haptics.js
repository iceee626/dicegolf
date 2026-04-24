// Haptics and Vibration Preferences

// VIBRATION SYSTEM
// ═══════════════════════════════════════
function vibEnabled(){try{return localStorage.getItem('gg_vibration')!=='off';}catch{return true;}}
function setVibEnabled(v){try{localStorage.setItem('gg_vibration',v?'on':'off');}catch{}}

// Haptics — uses Capacitor native API when running as iOS app, silent otherwise
function _doHaptic(style){
  if(!vibEnabled())return;
  try{
    if(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Haptics){
      window.Capacitor.Plugins.Haptics.impact({style});
    }else if(navigator.vibrate){
      navigator.vibrate(style==='HEAVY'?80:style==='LIGHT'?20:40);
    }
  }catch(e){}
}
function _hapticClick(){ _doHaptic('LIGHT'); }
function _androidVib(){}
function vibDiceRoll()  { _doHaptic('MEDIUM'); }
function vibDiceLand()  { _doHaptic('LIGHT'); }
function vibWildcard()  { _doHaptic('HEAVY'); }
function vibHoleInOne() {
  if(!vibEnabled())return;
  try{
    if(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Haptics){
      window.Capacitor.Plugins.Haptics.notification({type:'SUCCESS'});
    }else if(navigator.vibrate){
      navigator.vibrate([50,30,50,30,100]);
    }
  }catch(e){}
}
function vibShot(){ _doHaptic('LIGHT'); }

// ═══════════════════════════════════════

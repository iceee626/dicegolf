// Central Event Binding for Markup That No Longer Uses Inline Handlers

function bindStaticUiEvents(){
  const tutOverlayBtn = document.getElementById('tutOverlayBtn');
  if(tutOverlayBtn) tutOverlayBtn.addEventListener('click', tutNext);
}

document.addEventListener('DOMContentLoaded', bindStaticUiEvents);

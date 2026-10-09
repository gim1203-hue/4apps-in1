/* App discovery and keyboard access; navigation remains owned by script.js. */
(function(){
  'use strict';
  var tabs = Array.from(document.querySelectorAll('.hub-tab'));
  var directory = document.getElementById('app-directory');
  var toggle = document.getElementById('directory-toggle');
  var search = document.getElementById('directory-search');
  var filters = document.getElementById('directory-filters');
  var grid = document.getElementById('app-cards');
  var category = 'All apps';
  var descriptions = {
    calendar:['Everyday','Organize your day with events and a monthly calendar.'],
    weather:['Everyday','Check live conditions and a five-day forecast.'],
    radio:['Entertainment','Listen to live radio stations around the world.'],
    iwatch:['Entertainment','Search videos, play music and manage your Library.'],
    'games-tab':['Entertainment','Explore your connected games collection.'],
    'Airplane-Games-tab':['Entertainment','Open your airplane games.'],
    'GODS WORD-tab':['Learning','Explore your connected scripture app.'],
    'skill-spring-tab':['Learning','Open your Skill Spring learning app.'],
    'learnflow-tab':['Learning','Continue learning with LearnFlow.'],
    'complete-web-app-guide-tab':['Learning','Explore your web application guide.'],
    'exercise-tab':['Everyday','Open your connected fitness app.'],
    'pocket-pantry-tab':['Everyday','Open Pocket Pantry. Access may be required.'],
    'launch-lane-tab':['Tools','Open Launch Lane. Access may be required.'],
    'myai-private-tab':['Tools','Open your AI app. Sign-in is required.']
  };
  var records = tabs.map(function(tab){
    var metadata = descriptions[tab.dataset.view || tab.id] || ['Tools','Open this connected app in a new tab.'];
    var button = document.createElement('button');
    button.type = 'button'; button.className = 'app-card';
    var title = document.createElement('span'); title.className = 'app-card-name'; title.textContent = tab.textContent.trim();
    var description = document.createElement('span'); description.className = 'app-card-description'; description.textContent = metadata[1];
    var status = document.createElement('span'); status.className = 'app-card-status';
    status.textContent = tab.dataset.locked ? 'PIN required' : /pocket-pantry|launch-lane/.test(tab.id) ? 'Access required' : tab.id === 'myai-private-tab' ? 'Sign-in required' : tab.dataset.view ? 'Built in' : 'Opens in a new tab';
    button.append(title, description, status);
    button.addEventListener('click', function(){
      closeDirectory();
      tab.click();
      if(!tab.dataset.locked && tab.dataset.view) document.getElementById('hub-content').focus({preventScroll:true});
    });
    grid.appendChild(button);
    return {button:button, category:metadata[0], text:(title.textContent + ' ' + description.textContent + ' ' + metadata[0]).toLowerCase()};
  });
  ['All apps','Everyday','Entertainment','Learning','Tools'].forEach(function(name){
    var button = document.createElement('button'); button.type = 'button'; button.textContent = name;
    button.setAttribute('aria-pressed', String(name === category));
    button.addEventListener('click', function(){ category=name; update(); });
    filters.appendChild(button);
  });
  function update(){
    var query = search.value.trim().toLowerCase(); var count = 0;
    records.forEach(function(record){
      record.button.hidden = !((category === 'All apps' || record.category === category) && record.text.includes(query));
      if(!record.button.hidden) count++;
    });
    Array.from(filters.children).forEach(function(button){ button.setAttribute('aria-pressed', String(button.textContent === category)); });
    document.getElementById('directory-count').textContent = count + ' app' + (count === 1 ? '' : 's') + ' available';
    document.getElementById('directory-empty').hidden = count !== 0;
  }
  function closeDirectory(){ directory.hidden = true; toggle.setAttribute('aria-expanded','false'); }
  toggle.addEventListener('click', function(){
    directory.hidden = !directory.hidden; toggle.setAttribute('aria-expanded',String(!directory.hidden));
    if(!directory.hidden) search.focus({preventScroll:true});
  });
  document.getElementById('directory-close').addEventListener('click', function(){ closeDirectory(); toggle.focus({preventScroll:true}); });
  search.addEventListener('input', update);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !directory.hidden && !activeDialog()){ closeDirectory(); toggle.focus({preventScroll:true}); }
  });
  update();
  document.getElementById('youtube-search-input').setAttribute('aria-label','Search videos, music, movies and TV, or paste a YouTube link');
  document.getElementById('website-pin-error').setAttribute('role','alert');

  // Dialog focus follows the existing open/close controls, including the PIN gate.
  var lastOutside = toggle, currentDialog = null, returnFocus = null;
  function activeDialog(){
    var pin = document.querySelector('.website-pin-modal');
    if(!pin.parentElement.hidden) return pin;
    var library = document.querySelector('#libraryBackdrop.open [role=dialog]');
    if(library) return library;
    return document.querySelector('#modal.open');
  }
  function focusable(dialog){
    return Array.from(dialog.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')).filter(function(el){ return !el.disabled && el.getClientRects().length; });
  }
  document.addEventListener('focusin', function(e){
    var dialog = activeDialog();
    if(!dialog) lastOutside=e.target;
    else if(!dialog.contains(e.target)){
      var first = focusable(dialog)[0]; if(first) first.focus({preventScroll:true});
    }
  });
  document.addEventListener('keydown', function(e){
    var dialog = activeDialog(); if(!dialog) return;
    if(e.key === 'Tab'){
      var elements = focusable(dialog), first = elements[0], last = elements[elements.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });
  function syncAccessibility(){
    var dialog = activeDialog();
    if(dialog !== currentDialog){
      if(dialog){
        returnFocus = lastOutside;
        if(!dialog.contains(document.activeElement)){ var first=focusable(dialog)[0]; if(first) first.focus({preventScroll:true}); }
      }else if(currentDialog && returnFocus){
        var target = returnFocus.getClientRects().length ? returnFocus : document.querySelector('.hub-tab.active');
        if(target) target.focus({preventScroll:true});
      }
      currentDialog=dialog;
    }
    tabs.forEach(function(tab){
      if(tab.dataset.view && tab.classList.contains('active')) tab.setAttribute('aria-current','true');
      else tab.removeAttribute('aria-current');
    });
    document.querySelectorAll('.cell,.mini td span,.legend li,.sw,.yt-card,.library-item,.search-history-item,.youtube-search-results li:not(.yt-res-note)').forEach(function(el){
      if(el.classList.contains('sw')) el.setAttribute('aria-pressed',String(el.classList.contains('on')));
      if(el.matches('.legend li')) el.setAttribute('aria-pressed',String(!el.classList.contains('off')));
      if(el.dataset.keyboardReady || !el.getClientRects().length) return;
      el.dataset.keyboardReady='true'; el.tabIndex=0; el.setAttribute('role','button');
      if(el.classList.contains('sw')) el.setAttribute('aria-label',el.title + ' category');
      el.addEventListener('keydown',function(e){ if(e.target === el && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); el.click(); } });
    });
  }
  new MutationObserver(syncAccessibility).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  syncAccessibility();
})();

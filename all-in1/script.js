/* ============================== HUB NAV SWITCHING ============================== */
(function(){
  var tabs = document.querySelectorAll(".hub-tab");
  var views = document.querySelectorAll(".view");
  tabs.forEach(function(tab){
    tab.addEventListener("click", function(){
      if(!tab.dataset.view) return; // Website tab has its own PIN-gate handler below — not a view switch
      var target = tab.dataset.view;
      tabs.forEach(function(t){ t.classList.toggle("active", t === tab); });
      views.forEach(function(v){ v.classList.toggle("active", v.dataset.viewPanel === target); });
    });
  });
})();

/* ============================== WEBSITE TAB — PIN GATE ============================== */
/* Asks for the PIN every single time the tab is pressed — there is no
   remembered unlock. A correct PIN opens the linked site in a new tab;
   the gate is reset immediately afterward so the next press asks again. */
(function(){
  var websiteTab = document.getElementById('website-tab');
  var overlay = document.getElementById('website-pin-overlay');
  if(!websiteTab || !overlay) return;

  var input = document.getElementById('website-pin-input');
  var submitBtn = document.getElementById('website-pin-submit');
  var closeBtn = document.getElementById('website-pin-close');
  var errorMsg = document.getElementById('website-pin-error');
  var PIN_CODE = '0123';
  var targetUrl = websiteTab.dataset.websiteUrl;

  function openGate(){
    overlay.hidden = false;
    errorMsg.hidden = true;
    input.value = '';
    input.focus();
  }
  function closeGate(){
    overlay.hidden = true;
    input.value = '';
    errorMsg.hidden = true;
  }
  function attemptUnlock(){
    if(input.value.trim() === PIN_CODE){
      closeGate();
      window.open(targetUrl, '_blank', 'noopener');
    } else {
      errorMsg.hidden = false;
      input.value = '';
      input.focus();
    }
  }

  websiteTab.addEventListener('click', function(e){
    e.preventDefault();
    openGate();
  });
  submitBtn.addEventListener('click', attemptUnlock);
  input.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); attemptUnlock(); }
  });
  closeBtn.addEventListener('click', closeGate);
  overlay.addEventListener('click', function(e){
    if(e.target === overlay) closeGate();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !overlay.hidden) closeGate();
  });
})();

/* ============================== EXTERNAL LINK TABS (e.g. GIF) ============================== */
/* Any hub-tab with data-external-url just opens that link in a new tab —
   no PIN gate, no view switch. Add more tabs like this the same way. */
(function(){
  document.querySelectorAll('.hub-tab[data-external-url]').forEach(function(tab){
    tab.addEventListener('click', function(e){
      e.preventDefault();
      window.open(tab.dataset.externalUrl, '_blank', 'noopener');
    });
  });
})();

/* ================================== CALENDAR ================================== */
document.addEventListener("DOMContentLoaded", function () {

  var MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  var DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var COLORS = { work:"#4B5BD7", personal:"#12A594", health:"#E0733D",
                 social:"#C2418E", study:"#8B5CF6" };

  var today = new Date();
  var view  = new Date(today.getFullYear(), today.getMonth(), 1);
  var selected = null;

  function key(d){ return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
  function sameDay(a,b){ return key(a) === key(b); }

  function rel(days, h, m){
    var d = new Date(today.getFullYear(), today.getMonth(), today.getDate()+days, h, m||0);
    return d;
  }
  var events = [
    { id:1, title:"Team standup",        when:rel(0,9,30),  cat:"work" },
    { id:2, title:"Design review",       when:rel(0,14,0),  cat:"work" },
    { id:3, title:"Gym session",         when:rel(0,18,30), cat:"health" },
    { id:4, title:"1:1 with manager",    when:rel(1,11,0),  cat:"work" },
    { id:5, title:"Dentist",             when:rel(2,8,15),  cat:"health" },
    { id:6, title:"Sprint planning",     when:rel(3,10,0),  cat:"work" },
    { id:7, title:"Dinner with Sam",     when:rel(3,19,30), cat:"social" },
    { id:8, title:"Algorithms lecture",  when:rel(4,13,0),  cat:"study" },
    { id:9, title:"Code review block",   when:rel(5,15,0),  cat:"work" },
    { id:10,title:"Farmers market",      when:rel(6,9,0),   cat:"personal" },
    { id:11,title:"Project deadline",    when:rel(8,17,0),  cat:"work" },
    { id:12,title:"Weekend trip",        when:rel(10,7,0),  cat:"personal" },
    { id:13,title:"Study group",         when:rel(-2,16,0), cat:"study" },
    { id:14,title:"Retro",               when:rel(-3,15,30),cat:"work" }
  ];
  var nextId = 15;
  var hidden = {};

  function fmtTime(d){
    var h = d.getHours(), m = d.getMinutes(), ap = h < 12 ? "am" : "pm";
    h = h % 12; if (h === 0) h = 12;
    return h + (m ? ":" + (m<10?"0":"") + m : "") + ap;
  }

  function eventsOn(d){
    var q = (document.getElementById("q").value || "").trim().toLowerCase();
    return events
      .filter(function(e){ return sameDay(e.when, d); })
      .filter(function(e){ return !hidden[e.cat]; })
      .filter(function(e){ return !q || e.title.toLowerCase().indexOf(q) > -1; })
      .sort(function(a,b){ return a.when - b.when; });
  }

  function renderGrid(){
    document.getElementById("title").textContent =
      MONTHS[view.getMonth()] + " " + view.getFullYear();

    var grid = document.getElementById("grid");
    grid.innerHTML = "";

    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var start = new Date(first);
    start.setDate(1 - first.getDay());

    for (var i = 0; i < 42; i++){
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate()+i);
      var cell = document.createElement("div");
      cell.className = "cell"
        + (d.getMonth() !== view.getMonth() ? " mut" : "")
        + (sameDay(d, today) ? " today" : "");

      var num = document.createElement("div");
      num.className = "dnum";
      num.textContent = d.getDate();
      cell.appendChild(num);

      var list = eventsOn(d);
      list.slice(0,3).forEach(function(e){
        var el = document.createElement("div");
        el.className = "ev";
        el.style.background = COLORS[e.cat] + "1A";
        el.style.color = COLORS[e.cat];
        el.style.borderLeftColor = COLORS[e.cat];
        el.textContent = fmtTime(e.when) + "  " + e.title;
        cell.appendChild(el);
      });
      if (list.length > 3){
        var m = document.createElement("div");
        m.className = "more";
        m.textContent = "+" + (list.length - 3) + " more";
        cell.appendChild(m);
      }

      (function(dd){
        cell.addEventListener("click", function(){ openPanel(dd); });
      })(d);

      grid.appendChild(cell);
    }
    renderMini();
  }

  function renderMini(){
    document.getElementById("mini-title").textContent =
      MONTHS[view.getMonth()].slice(0,3) + " " + view.getFullYear();
    var body = document.getElementById("mini-body");
    body.innerHTML = "";
    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var start = new Date(first); start.setDate(1 - first.getDay());
    for (var r = 0; r < 6; r++){
      var tr = document.createElement("tr");
      for (var c = 0; c < 7; c++){
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + r*7 + c);
        var td = document.createElement("td");
        var sp = document.createElement("span");
        sp.textContent = d.getDate();
        if (d.getMonth() !== view.getMonth()) sp.className = "mut";
        if (sameDay(d, today)) sp.className = "today";
        if (selected && sameDay(d, selected)) sp.className += " sel";
        (function(dd){ sp.addEventListener("click", function(e){ e.stopPropagation(); openPanel(dd); }); })(d);
        td.appendChild(sp); tr.appendChild(td);
      }
      body.appendChild(tr);
    }
  }

  var panel = document.getElementById("panel");
  function openPanel(d){
    selected = d;
    document.getElementById("panel-title").textContent =
      DOWS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate();
    var body = document.getElementById("panel-body");
    body.innerHTML = "";
    var list = eventsOn(d);
    if (!list.length){
      var e = document.createElement("div");
      e.className = "empty";
      e.textContent = "Nothing scheduled. Enjoy the gap.";
      body.appendChild(e);
    } else {
      list.forEach(function(ev){
        var el = document.createElement("div");
        el.className = "pev";
        el.style.borderLeftColor = COLORS[ev.cat];
        var b = document.createElement("b"); b.textContent = ev.title;
        var s = document.createElement("span");
        s.textContent = fmtTime(ev.when) + "  ·  " + ev.cat;
        el.appendChild(b); el.appendChild(s);
        body.appendChild(el);
      });
    }
    panel.classList.add("open");
    renderMini();
  }
  document.getElementById("panel-close").addEventListener("click", function(){
    panel.classList.remove("open");
  });

  var mask = document.getElementById("mask"), modal = document.getElementById("modal"), cat = "work";
  function openModal(d){
    var dd = d || selected || today;
    document.getElementById("f-date").value =
      dd.getFullYear() + "-" + ("0"+(dd.getMonth()+1)).slice(-2) + "-" + ("0"+dd.getDate()).slice(-2);
    document.getElementById("f-time").value = "09:00";
    document.getElementById("f-title").value = "";
    document.getElementById("f-title").closest(".fw").classList.remove("bad");
    mask.classList.add("open"); modal.classList.add("open");
    document.getElementById("f-title").focus();
  }
  function closeModal(){ mask.classList.remove("open"); modal.classList.remove("open"); }

  document.getElementById("new-btn").addEventListener("click", function(){ openModal(); });
  document.getElementById("panel-add").addEventListener("click", function(){ openModal(selected); });
  document.getElementById("cancel").addEventListener("click", closeModal);
  mask.addEventListener("click", closeModal);
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeModal(); });

  document.querySelectorAll(".view-calendar .sw").forEach(function(s){
    s.addEventListener("click", function(){
      document.querySelectorAll(".view-calendar .sw").forEach(function(x){ x.classList.remove("on"); });
      s.classList.add("on"); cat = s.dataset.cat;
    });
  });

  document.getElementById("save").addEventListener("click", function(){
    var t = document.getElementById("f-title").value.trim();
    var dv = document.getElementById("f-date").value;
    var tv = document.getElementById("f-time").value || "09:00";
    if (!t || !dv){
      document.getElementById("f-title").closest(".fw").classList.toggle("bad", !t);
      return;
    }
    var p = dv.split("-"), h = tv.split(":");
    var when = new Date(+p[0], +p[1]-1, +p[2], +h[0], +h[1]);
    events.push({ id: nextId++, title: t, when: when, cat: cat });
    view = new Date(when.getFullYear(), when.getMonth(), 1);
    closeModal(); renderGrid(); openPanel(when);
  });

  document.getElementById("prev").addEventListener("click", function(){
    view = new Date(view.getFullYear(), view.getMonth()-1, 1); renderGrid();
  });
  document.getElementById("next").addEventListener("click", function(){
    view = new Date(view.getFullYear(), view.getMonth()+1, 1); renderGrid();
  });
  document.getElementById("mini-prev").addEventListener("click", function(){
    view = new Date(view.getFullYear(), view.getMonth()-1, 1); renderGrid();
  });
  document.getElementById("mini-next").addEventListener("click", function(){
    view = new Date(view.getFullYear(), view.getMonth()+1, 1); renderGrid();
  });
  document.getElementById("today-btn").addEventListener("click", function(){
    view = new Date(today.getFullYear(), today.getMonth(), 1); renderGrid(); openPanel(today);
  });
  document.getElementById("q").addEventListener("input", function(){
    renderGrid(); if (selected) openPanel(selected);
  });

  document.querySelectorAll(".view-calendar .legend li").forEach(function(li){
    li.addEventListener("click", function(){
      var c = li.dataset.cat;
      hidden[c] = !hidden[c];
      li.classList.toggle("off", hidden[c]);
      renderGrid(); if (selected) openPanel(selected);
    });
  });

  var burger = document.getElementById("burger"), side = document.getElementById("side");
  if (burger) burger.addEventListener("click", function(){ side.classList.toggle("open"); });

  renderGrid();
});

/* =================================== WEATHER =================================== */
(function(){
  var $=function(s){ return document.querySelector(s); },
      country=$('#wx-country'), state=$('#wx-state'), city=$('#wx-city'),
      content=$('#wx-content'), note=$('#wx-note');
  var countries=[], states=[], countryDirectory=[];
  var icon=function(c){ return c===0?'☀️':c<3?'⛅':c===3?'☁️':c<49?'🌫️':c<60?'🌦️':c<70?'🌧️':c<80?'❄️':c<90?'🌧️':'⛈️'; };
  var desc=function(c){ return c===0?'Clear':c<3?'Partly cloudy':c===3?'Overcast':c<49?'Foggy':c<60?'Drizzle':c<70?'Rain':c<80?'Snow':c<90?'Showers':'Thunderstorm'; };
  var esc=function(x){ var d=document.createElement('div'); d.textContent=x||''; return d.innerHTML; };
  var get=async function(u){ var r=await fetch(u); if(!r.ok) throw Error(); return r.json(); };

  async function loadCountries(){
    try{
      var response = await get('https://countriesnow.space/api/v0.1/countries/states');
      countryDirectory = response.data || [];
      countries = countryDirectory.filter(function(x){ return x.iso2 && x.name; })
        .map(function(x){ return {name:{common:x.name}, cca2:x.iso2, capital:[]}; })
        .sort(function(a,b){ return a.name.common.localeCompare(b.name.common); });
      country.innerHTML = '<option value="">Choose a country</option>' +
        countries.map(function(x){ return '<option value="'+x.cca2+'">'+esc(x.name.common)+'</option>'; }).join('');
      content.textContent = 'Choose a location to see live weather.';
    }catch(e){
      content.className='error';
      content.textContent='Could not load the world location list. Check your connection and refresh.';
    }
  }

  async function loadStates(){
    state.disabled=true; city.disabled=true; $('#wx-show').disabled=true;
    city.innerHTML='<option>Select a state first</option>';
    var chosen = countries.find(function(x){ return x.cca2===country.value; });
    state.innerHTML='<option>Loading regions&hellip;</option>';
    try{
      var record = countryDirectory.find(function(x){ return x.iso2===country.value; });
      states = (record && record.states) || [];
      if(!states.length) states=[{name: chosen && chosen.name.common}];
      state.innerHTML='<option value="">Choose a state or region</option>'+states.map(function(x){ return '<option>'+esc(x.name)+'</option>'; }).join('');
      state.disabled=false;
      note.textContent='Now choose a state or region.';
    }catch(e){
      states=[{name: chosen && chosen.name.common}];
      state.innerHTML='<option value="">Choose a state or region</option>'+states.map(function(x){ return '<option>'+esc(x.name)+'</option>'; }).join('');
      state.disabled=false;
      note.textContent='Regional list is limited for this country—select the available location.';
    }
  }

  async function loadCities(){
    city.disabled=true; $('#wx-show').disabled=true;
    city.innerHTML='<option>Loading cities&hellip;</option>';
    var chosen = countries.find(function(x){ return x.cca2===country.value; });
    try{
      var r = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({country: chosen.name.common, state: state.value})
      });
      if(!r.ok) throw Error();
      var data = await r.json(), cities = data.data || [];
      if(!cities.length) throw Error();
      city.innerHTML='<option value="">Choose a city</option>'+cities.sort().map(function(x){ return '<option>'+esc(x)+'</option>'; }).join('');
      city.disabled=false;
      note.textContent='Choose a city, then view its live weather.';
    }catch(e){
      var fallback = (chosen.capital && chosen.capital[0]) || state.value;
      city.innerHTML='<option value="'+esc(fallback)+'">'+esc(fallback)+'</option>';
      city.disabled=false; city.value=fallback; $('#wx-show').disabled=false;
      note.textContent='City list is unavailable for this region. The main city is ready to use.';
    }
  }

  async function showWeather(name){
    content.className='loading'; content.textContent='Loading live weather&hellip;';
    try{
      var chosen = countries.find(function(x){ return x.cca2===country.value; });
      var q = encodeURIComponent(name+', '+state.value+', '+((chosen && chosen.name.common) || ''));
      var geo = await get('https://geocoding-api.open-meteo.com/v1/search?name='+q+'&count=1&language=en&format=json');
      if(!(geo.results && geo.results[0])) throw Error();
      var p = geo.results[0];
      var w = await get('https://api.open-meteo.com/v1/forecast?latitude='+p.latitude+'&longitude='+p.longitude+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto');
      render(p,w);
    }catch(e){
      content.className='error';
      content.textContent='Live weather could not be loaded for this location. Please try another city.';
    }
  }

  function render(p,w){
    var c=w.current, d=w.daily;
    var days = d.time.slice(1,6).map(function(x,i){
      return '<div class="day"><b>'+new Intl.DateTimeFormat('en',{weekday:'short'}).format(new Date(x+'T12:00:00'))+'</b>'+
        '<div class="weather">'+icon(d.weather_code[i+1])+'</div>'+
        '<b>'+Math.round(d.temperature_2m_max[i+1])+'°</b>'+
        '<span class="low">'+Math.round(d.temperature_2m_min[i+1])+'°</span></div>';
    }).join('');
    content.className='';
    content.innerHTML='<section class="card"><div class="place">'+esc(p.name)+(p.admin1?', '+esc(p.admin1):'')+'</div>'+
      '<div class="date">LIVE CONDITIONS · '+new Intl.DateTimeFormat('en',{dateStyle:'full',timeStyle:'short'}).format(new Date())+'</div>'+
      '<div class="icon">'+icon(c.weather_code)+'</div>'+
      '<div class="temp">'+Math.round(c.temperature_2m)+'°</div>'+
      '<div class="desc">'+desc(c.weather_code)+'</div>'+
      '<div class="details"><div><small>FEELS LIKE</small><b>'+Math.round(c.apparent_temperature)+'°</b></div>'+
      '<div><small>HUMIDITY</small><b>'+c.relative_humidity_2m+'%</b></div>'+
      '<div><small>WIND</small><b>'+Math.round(c.wind_speed_10m)+' km/h</b></div>'+
      '<div><small>TIMEZONE</small><b>'+esc(w.timezone_abbreviation||'Local')+'</b></div></div></section>'+
      '<h2 class="forecast-title">5-day forecast</h2><section class="forecast">'+days+'</section>';
  }

  country.onchange=loadStates;
  state.onchange=loadCities;
  city.onchange=function(){ $('#wx-show').disabled=!city.value; };
  $('#wx-show').onclick=function(){ showWeather(city.value); };
  $('#wx-nearby').onclick=function(){
    if(!navigator.geolocation){ alert('Location is not supported in this browser.'); return; }
    navigator.geolocation.getCurrentPosition(async function(x){
      content.className='loading'; content.textContent='Loading weather near you&hellip;';
      try{
        var w = await get('https://api.open-meteo.com/v1/forecast?latitude='+x.coords.latitude+'&longitude='+x.coords.longitude+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto');
        render({name:'Your location'}, w);
      }catch(e){
        content.className='error';
        content.textContent='Could not load weather for your location.';
      }
    });
  };
  loadCountries();
})();

/* ==================================== RADIO ==================================== */
(function(){
  var API = "https://de1.api.radio-browser.info/json";
  var countrySelect = document.querySelector("#country"),
      stationList = document.querySelector("#station-list"),
      message = document.querySelector("#message"),
      count = document.querySelector("#results-count"),
      search = document.querySelector("#search"),
      audio = document.querySelector("#audio"),
      playButton = document.querySelector("#play"),
      loadMore = document.querySelector("#load-more");
  var allStations = [], visibleStations = [], selectedStation = null, activeFilter = "all", page = 0;
  var pageSize = 40;
  var radioTab = document.querySelector('.hub-tab[data-view="radio"]');

  var escapeHTML = function(value){ value = value || ""; var node = document.createElement("div"); node.textContent = value; return node.innerHTML; };
  var showMessage = function(text){ message.textContent = text; message.hidden = false; };
  var hideMessage = function(){ message.hidden = true; };
  var stationText = function(station){ return ((station.tags || "") + " " + (station.name || "") + " " + (station.language || "")).toLowerCase(); };

  async function getJSON(path){ var response = await fetch(API+path); if (!response.ok) throw new Error(); return response.json(); }

  async function loadCountries(){
    try{
      var countries = await getJSON("/countries?order=name");
      var usable = countries.filter(function(country){ return country.iso_3166_1 && country.stationcount > 0; })
        .sort(function(a,b){ return a.name.localeCompare(b.name); });
      countrySelect.innerHTML = '<option value="">Select a country or region</option>' +
        usable.map(function(country){ return '<option value="'+escapeHTML(country.iso_3166_1)+'">'+escapeHTML(country.name)+' ('+Number(country.stationcount).toLocaleString()+' stations)</option>'; }).join("");
      countrySelect.disabled = false;
      document.querySelector("#directory-note").textContent = usable.length + " countries and regions are available in the live directory.";
    }catch(e){
      showMessage("We could not reach the live directory. Check your internet connection and try again.");
    }
  }

  async function loadStations(){
    var code = countrySelect.value; if (!code) return;
    allStations = []; page = 0; stationList.innerHTML = ""; loadMore.hidden = true;
    showMessage("Finding live stations…");
    try{
      var stations = await getJSON("/stations/bycountrycodeexact/"+encodeURIComponent(code)+"?hidebroken=true&order=votes&reverse=true&limit=500");
      allStations = stations.filter(function(station){ return station.url_resolved || station.url; })
        .filter(function(station, index, array){ return array.findIndex(function(other){ return other.stationuuid === station.stationuuid; }) === index; });
      applyFilters();
    }catch(e){
      showMessage("Stations could not be loaded right now. Please choose the country again in a moment.");
    }
  }

  function applyFilters(){
    var term = search.value.trim().toLowerCase();
    visibleStations = allStations.filter(function(station){
      var text = stationText(station);
      var typeMatch = activeFilter === "all" || (activeFilter === "music" ? /music|rock|pop|jazz|classical|dance|hip hop|electronic|country/.test(text) : text.includes(activeFilter));
      return typeMatch && (!term || text.includes(term));
    });
    page = 0; renderStations();
  }

  function renderStations(){
    var items = visibleStations.slice(0, (page + 1) * pageSize);
    stationList.innerHTML = items.map(function(station, index){
      var active = selectedStation && selectedStation.stationuuid === station.stationuuid;
      var icon = station.favicon ? '<img src="'+escapeHTML(station.favicon)+'" alt="" onerror="this.remove()">' : "◉";
      var details = [station.country, station.language, station.tags].filter(Boolean).join(" · ").slice(0, 120) || "Live radio";
      return '<article class="station '+(active ? "playing" : "")+'"><div class="station-icon">'+icon+'</div><div class="station-info"><strong title="'+escapeHTML(station.name)+'">'+escapeHTML(station.name || "Unnamed live station")+'</strong><span title="'+escapeHTML(details)+'">'+escapeHTML(details)+'</span></div><button data-index="'+index+'" aria-label="Play '+escapeHTML(station.name)+'">'+(active && !audio.paused ? "Ⅱ" : "▶")+'</button></article>';
    }).join("");
    count.textContent = visibleStations.length.toLocaleString() + " station"+(visibleStations.length === 1 ? "" : "s")+" found";
    loadMore.hidden = items.length >= visibleStations.length;
    if (!items.length) showMessage("No matching stations were found. Try another search or select All live radio.");
    else hideMessage();
    stationList.querySelectorAll("button").forEach(function(button){
      button.addEventListener("click", function(){ playStation(visibleStations[Number(button.dataset.index)]); });
    });
  }

  function setNowPlaying(station){
    document.querySelector("#now-title").textContent = station.name || "Live radio";
    document.querySelector("#now-info").textContent = [station.country, station.language].filter(Boolean).join(" · ") || "Live public stream";
  }

  async function playStation(station){
    if (selectedStation && selectedStation.stationuuid === station.stationuuid && !audio.paused){ audio.pause(); return; }
    selectedStation = station; setNowPlaying(station);
    audio.src = station.url_resolved || station.url;
    audio.volume = Number(document.querySelector("#volume").value) / 100;
    try{ await audio.play(); renderStations(); }
    catch(e){ showMessage("This stream could not play in this browser. Please try another station."); renderStations(); }
  }

  audio.addEventListener("play", function(){
    playButton.textContent = "Ⅱ"; playButton.setAttribute("aria-label", "Pause"); renderStations();
    if (radioTab) radioTab.classList.add("is-playing");
  });
  audio.addEventListener("pause", function(){
    playButton.textContent = "▶"; playButton.setAttribute("aria-label", "Play selected station"); renderStations();
    if (radioTab) radioTab.classList.remove("is-playing");
  });
  audio.addEventListener("error", function(){ if (selectedStation) showMessage("This station is unavailable right now. Choose another live station."); });

  playButton.addEventListener("click", function(){
    if (audio.src) (audio.paused ? audio.play().catch(function(){ showMessage("This stream could not play in this browser."); }) : audio.pause());
    else showMessage("Choose a station first.");
  });
  document.querySelector("#volume").addEventListener("input", function(event){ audio.volume = Number(event.target.value) / 100; });

  document.querySelector("#previous").addEventListener("click", function(){
    var index = visibleStations.findIndex(function(station){ return selectedStation && station.stationuuid === selectedStation.stationuuid; });
    if (visibleStations.length) playStation(visibleStations[(index - 1 + visibleStations.length) % visibleStations.length]);
  });
  document.querySelector("#radio-next").addEventListener("click", function(){
    var index = visibleStations.findIndex(function(station){ return selectedStation && station.stationuuid === selectedStation.stationuuid; });
    if (visibleStations.length) playStation(visibleStations[(index + 1) % visibleStations.length]);
  });

  countrySelect.addEventListener("change", loadStations);
  search.addEventListener("input", applyFilters);
  document.querySelectorAll(".view-radio .filter").forEach(function(button){
    button.addEventListener("click", function(){
      activeFilter = button.dataset.filter;
      document.querySelectorAll(".view-radio .filter").forEach(function(item){ item.classList.toggle("active", item === button); });
      applyFilters();
    });
  });
  loadMore.addEventListener("click", function(){ page += 1; renderStations(); });

  loadCountries();

  function updateClock(){
    document.querySelector("#live-clock").textContent = new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit",second:"2-digit"}).format(new Date());
  }
  updateClock(); setInterval(updateClock, 1000);
})();

/* ---------- I-WATCH (YouTube widget) ---------- */
(function(){
  const LIBRARY_CAP = 1000;
  const TMDB_KEY = "7e632299820a47439270beeea56a83bf"; // The Movie Database — search only (posters/info), no video hosting
  const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

  const SEARCH_HISTORY_CAP = 200;

  const state = {
    apiKey: "AIzaSyB0J5bv6BP3KPpRXGyfiFUbJhPFu02qvLU", // embedded so it doesn't need to be re-entered
    library: [], // newest first: {id, title, channelTitle, channelId, thumb, addedAt}
    currentVideo: null, // {id, title, channelTitle, channelId} — whatever is loaded in the player right now
    playlist: [], // whatever list Next/Previous currently steps through: {id, title, channelTitle, channelId}[]
    playlistIndex: -1,
    searchHistory: [], // newest first: {query, searchedAt} — capped at SEARCH_HISTORY_CAP
  };

  const suggestCache = new Map();      // query -> items[]
  const uploadsPlaylistCache = new Map(); // channelId -> uploads playlist id (or null)
  let suggestReqId = 0;

  const flyoutState = { playlistId: null, channelId: null, nextPageToken: null, loadedIds: new Set(), items: [], collapsed: false };

  const yEls = {
    wrap: document.getElementById('youtube-searchbar-wrap'),
    searchInput: document.getElementById('youtube-search-input'),
    searchBtn: document.getElementById('youtube-search-btn'),
    dropdown: document.getElementById('youtube-search-results'),
    apiKeyBtn: document.getElementById('youtube-api-key-btn'),
    apiKeyPanel: document.getElementById('youtube-api-key-panel'),
    apiKeyInput: document.getElementById('youtube-api-key-input'),
    apiKeySave: document.getElementById('youtube-api-key-save'),
    apiKeyClear: document.getElementById('youtube-api-key-clear'),
    apiKeyStatus: document.getElementById('youtube-api-key-status'),
    resultsGrid: document.getElementById('youtube-results'),
    tmdbGrid: document.getElementById('tmdb-results'),
    tmdbLabel: document.getElementById('tmdb-results-label'),
    screen: document.getElementById('youtube-screen'),
    screenHint: document.getElementById('youtube-screen-hint'),
    flyout: document.getElementById('youtube-related-panel'),
    flyoutThumb: document.getElementById('yt-flyout-thumb'),
    flyoutTitle: document.getElementById('yt-flyout-title'),
    flyoutSubtitle: document.getElementById('yt-flyout-subtitle'),
    flyoutClose: document.getElementById('yt-flyout-close'),
    flyoutBody: document.getElementById('yt-flyout-body'),
    flyoutMore: document.getElementById('yt-flyout-more'),
    libraryBtn: document.getElementById('youtube-library-btn'),
    libraryBackdrop: document.getElementById('libraryBackdrop'),
    libraryList: document.getElementById('library-list'),
    libraryCountLabel: document.getElementById('library-count-label'),
    libraryExportBtn: document.getElementById('library-export-btn'),
    libraryImportBtn: document.getElementById('library-import-btn'),
    libraryImportInput: document.getElementById('library-import-input'),
    libraryClearBtn: document.getElementById('library-clear-btn'),
    libraryCloseBtn: document.getElementById('library-close-btn'),
    prevBtn: document.getElementById('yt-prev-btn'),
    nextBtn: document.getElementById('yt-next-btn'),
    queueHint: document.getElementById('yt-queue-hint'),
    searchHistoryList: document.getElementById('search-history-list'),
    searchHistoryCountLabel: document.getElementById('search-history-count-label'),
    searchHistoryClearBtn: document.getElementById('search-history-clear-btn'),
  };

  const thumbFor = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

  function debounce(fn, wait){
    let t;
    return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
  }

  function extractVideoId(raw){
    const input = raw.trim();
    if(!input) return null;
    if(/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    try{
      const url = new URL(input);
      const host = url.hostname.replace(/^www\./,'');
      if(host==='youtu.be'){
        return url.pathname.slice(1).split('/')[0] || null;
      }
      if(host==='youtube.com' || host==='m.youtube.com' || host==='music.youtube.com'){
        if(url.searchParams.get('v')) return url.searchParams.get('v');
        const parts = url.pathname.split('/').filter(Boolean);
        if(parts[0]==='embed' || parts[0]==='shorts' || parts[0]==='live'){
          return parts[1] || null;
        }
      }
    } catch(e){ /* not a valid URL, and not a bare 11-char id either */ }
    return null;
  }

  /* ---------- API key panel ---------- */
  function setKeyStatus(msg, kind){
    yEls.apiKeyStatus.textContent = msg || '';
    yEls.apiKeyStatus.className = kind || '';
  }
  yEls.apiKeyBtn.addEventListener('click', ()=>{
    yEls.apiKeyPanel.hidden = !yEls.apiKeyPanel.hidden;
    if(!yEls.apiKeyPanel.hidden){
      yEls.apiKeyInput.value = state.apiKey;
      yEls.apiKeyInput.focus();
    }
  });
  yEls.apiKeySave.addEventListener('click', ()=>{
    const key = yEls.apiKeyInput.value.trim();
    if(!key){ setKeyStatus('Enter a key first.', 'err'); return; }
    state.apiKey = key;
    suggestCache.clear();
    setKeyStatus('Key saved for this session.', 'ok');
  });
  yEls.apiKeyClear.addEventListener('click', ()=>{
    state.apiKey = '';
    yEls.apiKeyInput.value = '';
    setKeyStatus('Key cleared.', 'ok');
  });
  yEls.apiKeyInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') yEls.apiKeySave.click(); });

  /* ---------- Player + Library ---------- */
  function addToLibrary(entry){
    state.library = state.library.filter(e => e.id !== entry.id);
    state.library.unshift(entry);
    if(state.library.length > LIBRARY_CAP){
      state.library.length = LIBRARY_CAP;
    }
    renderLibraryButton();
    if(!yEls.libraryBackdrop.classList.contains('open')) return;
    renderLibraryList();
  }

  function renderLibraryButton(){
    yEls.libraryBtn.textContent = `📁 Library (${state.library.length})`;
  }

  function renderLibraryList(){
    yEls.libraryCountLabel.textContent = `${state.library.length} / ${LIBRARY_CAP} saved`;
    yEls.libraryList.innerHTML = '';
    state.library.forEach((item, idx)=>{
      const row = document.createElement('div');
      row.className = 'library-item';
      row.innerHTML = `
        <img src="${item.thumb}" alt="" loading="lazy">
        <div class="li-meta">
          <div class="li-title">${escapeHtml(item.title)}</div>
          <div class="li-sub">${escapeHtml(item.channelTitle || '')}</div>
        </div>
        <button class="li-remove" type="button" title="Remove">✕</button>`;
      row.querySelector('.li-remove').addEventListener('click', (e)=>{
        e.stopPropagation();
        state.library = state.library.filter(e2 => e2.id !== item.id);
        renderLibraryButton();
        renderLibraryList();
      });
      row.addEventListener('click', ()=>{
        setPlaylist(state.library.slice(), idx);
        loadVideo(item.id, item.title, item.channelTitle, item.channelId);
        closeLibrary();
      });
      yEls.libraryList.appendChild(row);
    });
  }

  /* ---------- Search history (what you've searched for, saved for this session) ---------- */
  function addSearchHistory(query){
    const q = (query || '').trim();
    if(!q) return;
    state.searchHistory = state.searchHistory.filter(e => e.query.toLowerCase() !== q.toLowerCase());
    state.searchHistory.unshift({ query: q, searchedAt: Date.now() });
    if(state.searchHistory.length > SEARCH_HISTORY_CAP){
      state.searchHistory.length = SEARCH_HISTORY_CAP;
    }
    if(yEls.libraryBackdrop.classList.contains('open')) renderSearchHistoryList();
  }

  function renderSearchHistoryList(){
    yEls.searchHistoryCountLabel.textContent = `${state.searchHistory.length} / ${SEARCH_HISTORY_CAP} saved`;
    yEls.searchHistoryList.innerHTML = '';
    state.searchHistory.forEach(entry=>{
      const row = document.createElement('div');
      row.className = 'search-history-item';
      row.innerHTML = `
        <span class="sh-text">${escapeHtml(entry.query)}</span>
        <button class="sh-remove" type="button" title="Remove">&#10005;</button>`;
      row.querySelector('.sh-remove').addEventListener('click', (e)=>{
        e.stopPropagation();
        state.searchHistory = state.searchHistory.filter(e2 => e2 !== entry);
        renderSearchHistoryList();
      });
      row.addEventListener('click', ()=>{
        yEls.searchInput.value = entry.query;
        closeLibrary();
        handleSearch();
      });
      yEls.searchHistoryList.appendChild(row);
    });
  }

  yEls.searchHistoryClearBtn.addEventListener('click', ()=>{
    if(state.searchHistory.length && !confirm('Clear your recent searches? This cannot be undone.')) return;
    state.searchHistory = [];
    renderSearchHistoryList();
  });

  function openLibrary(){ yEls.libraryBackdrop.classList.add('open'); renderLibraryList(); renderSearchHistoryList(); }
  function closeLibrary(){ yEls.libraryBackdrop.classList.remove('open'); }
  yEls.libraryBtn.addEventListener('click', openLibrary);
  yEls.libraryCloseBtn.addEventListener('click', closeLibrary);
  yEls.libraryBackdrop.addEventListener('click', (e)=>{ if(e.target===yEls.libraryBackdrop) closeLibrary(); });
  yEls.libraryClearBtn.addEventListener('click', ()=>{
    if(state.library.length && !confirm('Clear all songs from your Library? This cannot be undone.')) return;
    state.library = [];
    renderLibraryButton();
    renderLibraryList();
  });
  yEls.libraryExportBtn.addEventListener('click', ()=>{
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), items: state.library }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'i-listen-library.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  yEls.libraryImportBtn.addEventListener('click', ()=> yEls.libraryImportInput.click());
  yEls.libraryImportInput.addEventListener('change', ()=>{
    const file = yEls.libraryImportInput.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : null);
        if(!items) throw new Error('Unrecognized file format.');
        const cleaned = items.filter(it => it && it.id && it.title).slice(0, LIBRARY_CAP);
        if(!confirm(`Import ${cleaned.length} song(s)? This replaces your current Library.`)) return;
        state.library = cleaned;
        renderLibraryButton();
        renderLibraryList();
      } catch(err){
        alert("Couldn't import that file: " + err.message);
      } finally {
        yEls.libraryImportInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  function escapeHtml(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  /* ---------- YouTube IFrame Player API ---------- */
  let ytApiInjected = false;
  let ytApiReady = false;
  let ytPlayer = null;
  let pendingVideoId = null;

  function ensureYTApi(){
    if(ytApiInjected) return;
    ytApiInjected = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }
  window.onYouTubeIframeAPIReady = function(){
    ytApiReady = true;
    if(pendingVideoId){
      const id = pendingVideoId;
      pendingVideoId = null;
      mountPlayer(id);
    }
  };

  const PLAYER_ERROR_MESSAGES = {
    2: "That video ID doesn't look valid.",
    5: "This video can't be played in an embedded player right now.",
    100: 'Video not found — it may have been removed or made private.',
    101: 'The video owner has disabled playback outside YouTube.',
    150: 'The video owner has disabled playback outside YouTube.',
  };

  function mountPlayer(id){
    if(!ytApiReady){ pendingVideoId = id; ensureYTApi(); return; }
    const oldHolder = document.getElementById('youtube-player-holder');
    if(oldHolder) oldHolder.remove();
    if(ytPlayer){ try{ ytPlayer.destroy(); }catch(e){ /* already gone */ } ytPlayer = null; }
    const holder = document.createElement('div');
    holder.id = 'youtube-player-holder';
    yEls.screen.insertBefore(holder, yEls.screenHint);
    ytPlayer = new YT.Player('youtube-player-holder', {
      width: '100%',
      height: '100%',
      videoId: id,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: (e)=>{ try{ e.target.playVideo(); }catch(err){ /* ignore */ } },
        onStateChange: (e)=>{
          if(e.data === YT.PlayerState.ENDED && state.playlistIndex > -1 && state.playlistIndex < state.playlist.length - 1){
            playFromPlaylist(state.playlistIndex + 1);
          }
        },
        onError: (e)=>{
          yEls.screenHint.textContent = PLAYER_ERROR_MESSAGES[e.data] || `Playback error (code ${e.data}).`;
          yEls.screen.classList.remove('has-video');
        }
      }
    });
  }

  function loadVideo(id, title, channelTitle, channelId){
    if(!id) return;
    ensureYTApi();
    mountPlayer(id);
    yEls.screen.classList.add('has-video');
    yEls.screenHint.textContent = title ? `Now playing: ${title}` : 'Now playing…';
    closeDropdown();

    const entry = { id, title: title || `Video (${id})`, channelTitle: channelTitle || '', channelId: channelId || null, thumb: thumbFor(id), addedAt: Date.now() };
    addToLibrary(entry);
    state.currentVideo = entry;
    updateNavButtons();

    if((!title || !channelId) && state.apiKey){
      fetchVideoSnippet(id).then(snip=>{
        if(!snip) return;
        const fixed = { id, title: snip.title, channelTitle: snip.channelTitle, channelId: snip.channelId, thumb: thumbFor(id), addedAt: entry.addedAt };
        addToLibrary(fixed);
        if(state.currentVideo && state.currentVideo.id === id) state.currentVideo = fixed;
        yEls.screenHint.textContent = `Now playing: ${snip.title}`;
      }).catch(()=>{ /* ignore — direct playback still works without metadata */ });
    }
  }

  /* ---------- Next / Previous — steps through whatever list (search results,
     "more from this channel", or Library) was last used to reach the current video ---------- */
  function setPlaylist(items, index){
    state.playlist = items || [];
    state.playlistIndex = typeof index === 'number' ? index : -1;
    updateNavButtons();
  }

  function updateNavButtons(){
    if(!yEls.prevBtn || !yEls.nextBtn) return;
    const hasPrev = state.playlist.length > 0 && state.playlistIndex > 0;
    const hasNext = state.playlist.length > 0 && state.playlistIndex > -1 && state.playlistIndex < state.playlist.length - 1;
    yEls.prevBtn.disabled = !hasPrev;
    yEls.nextBtn.disabled = !hasNext;
    if(yEls.queueHint){
      if(state.playlist.length > 1 && state.playlistIndex > -1){
        yEls.queueHint.style.display = '';
        yEls.queueHint.textContent = `Up next ${state.playlistIndex + 1} of ${state.playlist.length} in this list`;
      } else {
        yEls.queueHint.style.display = 'none';
      }
    }
  }

  function playFromPlaylist(newIndex){
    if(newIndex < 0 || newIndex >= state.playlist.length) return;
    const v = state.playlist[newIndex];
    state.playlistIndex = newIndex;
    loadVideo(v.id, v.title, v.channelTitle, v.channelId);
  }

  if(yEls.prevBtn) yEls.prevBtn.addEventListener('click', ()=> playFromPlaylist(state.playlistIndex - 1));
  if(yEls.nextBtn) yEls.nextBtn.addEventListener('click', ()=> playFromPlaylist(state.playlistIndex + 1));

  async function fetchVideoSnippet(id){
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part','snippet');
    url.searchParams.set('id', id);
    url.searchParams.set('key', state.apiKey);
    const res = await fetch(url.toString());
    const data = await res.json();
    if(!res.ok || !data.items || !data.items.length) return null;
    const s = data.items[0].snippet;
    return { title: s.title, channelTitle: s.channelTitle, channelId: s.channelId };
  }

  /* ---------- Autocomplete dropdown ---------- */
  function openDropdown(){ yEls.dropdown.classList.add('open'); }
  function closeDropdown(){ yEls.dropdown.classList.remove('open'); yEls.dropdown.innerHTML = ''; }

  function renderDropdownNote(text){
    yEls.dropdown.innerHTML = `<li class="yt-res-note">${escapeHtml(text)}</li>`;
    openDropdown();
  }

  function renderSuggestions(items){
    yEls.dropdown.innerHTML = '';
    if(!items.length){
      renderDropdownNote('No matches found.');
      return;
    }
    items.forEach(item=>{
      const isChannel = item.id.kind === 'youtube#channel';
      const snip = item.snippet;
      const thumbUrl = (snip.thumbnails && (snip.thumbnails.default || snip.thumbnails.medium) || {}).url || '';
      const li = document.createElement('li');
      if(isChannel) li.classList.add('yt-channel-suggest');
      li.innerHTML = `
        ${thumbUrl ? `<img src="${thumbUrl}" alt="" loading="lazy">` : '<span class="yt-type-badge">' + (isChannel?'Artist':'Video') + '</span>'}
        <div class="yt-res-text">
          <div class="yt-res-title">${escapeHtml(snip.title)}</div>
          <div class="yt-res-channel">${isChannel ? 'Artist / Channel' : escapeHtml(snip.channelTitle||'')}</div>
        </div>
        ${thumbUrl ? `<span class="yt-type-badge">${isChannel?'Artist':'Video'}</span>` : ''}`;
      li.addEventListener('click', ()=> selectSuggestion(item, isChannel));
      yEls.dropdown.appendChild(li);
    });
    openDropdown();
  }

  async function fetchSuggestions(query){
    const key = query.toLowerCase();
    if(suggestCache.has(key)){
      renderSuggestions(suggestCache.get(key));
      return;
    }
    if(!state.apiKey){
      renderDropdownNote('🔑 Add an API key above to see live suggestions.');
      return;
    }
    const reqId = ++suggestReqId;
    renderDropdownNote('Searching…');
    try{
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part','snippet');
      url.searchParams.set('type','video,channel');
      url.searchParams.set('maxResults','8');
      url.searchParams.set('q', query);
      url.searchParams.set('key', state.apiKey);
      const res = await fetch(url.toString());
      const data = await res.json();
      if(reqId !== suggestReqId) return;
      if(!res.ok){
        renderDropdownNote((data.error && data.error.message) || 'Search failed.');
        return;
      }
      const items = data.items || [];
      suggestCache.set(key, items);
      renderSuggestions(items);
    } catch(err){
      if(reqId !== suggestReqId) return;
      renderDropdownNote("Couldn't reach YouTube: " + err.message);
    }
  }

  const debouncedSuggest = debounce((query)=>{
    if(query.length < 2){ closeDropdown(); return; }
    fetchSuggestions(query);
  }, 450);

  yEls.searchInput.addEventListener('input', ()=> debouncedSuggest(yEls.searchInput.value.trim()));
  yEls.searchInput.addEventListener('focus', ()=>{ if(yEls.dropdown.children.length) openDropdown(); });

  function selectSuggestion(item, isChannel){
    if(isChannel){
      const channelId = item.id.channelId;
      openArtistFlyout(channelId, item.snippet.title, item.snippet.thumbnails);
    } else {
      const videoId = item.id.videoId;
      const snip = item.snippet;
      yEls.resultsGrid.innerHTML = '';
      loadVideo(videoId, snip.title, snip.channelTitle, snip.channelId);
      openSongFlyout(snip.channelId, snip.channelTitle, videoId, snip.title, snip.thumbnails);
    }
    closeDropdown();
  }

  /* ---------- "Related" flyout ---------- */
  function flyoutThumbUrl(thumbnails){
    return (thumbnails && (thumbnails.medium || thumbnails.default) || {}).url || '';
  }

  function openArtistFlyout(channelId, channelTitle, thumbnails){
    yEls.flyoutThumb.src = flyoutThumbUrl(thumbnails);
    yEls.flyoutTitle.textContent = channelTitle;
    yEls.flyoutSubtitle.textContent = `Videos by ${channelTitle}`;
    openFlyout(channelId);
  }

  function openSongFlyout(channelId, channelTitle, videoId, videoTitle, thumbnails){
    if(!channelId) return;
    yEls.flyoutThumb.src = thumbFor(videoId);
    yEls.flyoutTitle.textContent = videoTitle;
    yEls.flyoutSubtitle.textContent = `More from ${channelTitle || 'this channel'}`;
    openFlyout(channelId);
  }

  async function openFlyout(channelId){
    if(!state.apiKey){
      yEls.flyoutBody.innerHTML = `<div class="status-msg">Add an API key to browse by artist/channel.</div>`;
      yEls.flyout.hidden = false;
      yEls.flyoutMore.hidden = true;
      setFlyoutCollapsed(false);
      return;
    }
    flyoutState.channelId = channelId;
    flyoutState.playlistId = null;
    flyoutState.nextPageToken = null;
    flyoutState.loadedIds = new Set();
    flyoutState.items = [];
    if(state.currentVideo) flyoutState.loadedIds.add(state.currentVideo.id);
    yEls.flyoutBody.innerHTML = '';
    yEls.flyoutMore.hidden = true;
    yEls.flyout.hidden = false;
    setFlyoutCollapsed(false);
    const nowCard = buildNowPlayingCard();
    if(nowCard){
      const pinnedGrid = document.createElement('div');
      pinnedGrid.className = 'youtube-results';
      pinnedGrid.appendChild(nowCard);
      yEls.flyoutBody.appendChild(pinnedGrid);
    }
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'status-msg';
    loadingMsg.textContent = 'Loading…';
    yEls.flyoutBody.appendChild(loadingMsg);
    try{
      const playlistId = await getUploadsPlaylistId(channelId);
      loadingMsg.remove();
      if(!playlistId){
        if(!nowCard) yEls.flyoutBody.innerHTML = `<div class="status-msg">Couldn't find this channel's uploads.</div>`;
        return;
      }
      flyoutState.playlistId = playlistId;
      const page = await fetchPlaylistPage(playlistId, null);
      renderFlyoutItems(page.items);
      flyoutState.nextPageToken = page.nextPageToken || null;
      yEls.flyoutMore.hidden = !flyoutState.nextPageToken;
    } catch(err){
      loadingMsg.remove();
      const errMsg = document.createElement('div');
      errMsg.className = 'status-msg';
      errMsg.textContent = `Couldn't load videos: ${err.message}`;
      yEls.flyoutBody.appendChild(errMsg);
    }
  }

  function buildNowPlayingCard(){
    if(!state.currentVideo) return null;
    const v = state.currentVideo;
    const card = document.createElement('div');
    card.className = 'yt-card yt-card-current';
    const safeTitle = escapeHtml(v.title);
    card.innerHTML = `
      <div class="yt-thumb"><img src="${thumbFor(v.id)}" alt="${safeTitle}" loading="lazy"><span class="yt-now-badge">▶ Now Playing</span></div>
      <div class="yt-meta">
        <div class="yt-title">${safeTitle}</div>
        <div class="yt-channel">${escapeHtml(v.channelTitle||'')}</div>
      </div>`;
    card.addEventListener('click', ()=> loadVideo(v.id, v.title, v.channelTitle, v.channelId));
    return card;
  }

  async function getUploadsPlaylistId(channelId){
    if(uploadsPlaylistCache.has(channelId)) return uploadsPlaylistCache.get(channelId);
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part','contentDetails');
    url.searchParams.set('id', channelId);
    url.searchParams.set('key', state.apiKey);
    const res = await fetch(url.toString());
    const data = await res.json();
    if(!res.ok || !data.items || !data.items.length){
      uploadsPlaylistCache.set(channelId, null);
      return null;
    }
    const playlistId = data.items[0].contentDetails.relatedPlaylists.uploads;
    uploadsPlaylistCache.set(channelId, playlistId);
    return playlistId;
  }

  async function fetchPlaylistPage(playlistId, pageToken){
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part','snippet');
    url.searchParams.set('maxResults','24');
    url.searchParams.set('playlistId', playlistId);
    if(pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', state.apiKey);
    const res = await fetch(url.toString());
    const data = await res.json();
    if(!res.ok) throw new Error((data.error && data.error.message) || `Request failed (${res.status})`);
    return data;
  }

  function renderFlyoutItems(items){
    const grid = document.createElement('div');
    grid.className = 'youtube-results';
    let added = 0;
    items.forEach(item=>{
      const snip = item.snippet;
      const videoId = snip.resourceId && snip.resourceId.videoId;
      if(!videoId || flyoutState.loadedIds.has(videoId)) return;
      flyoutState.loadedIds.add(videoId);
      added++;
      const thumb = flyoutThumbUrl(snip.thumbnails);
      const card = document.createElement('div');
      card.className = 'yt-card';
      const safeTitle = escapeHtml(snip.title || 'Untitled');
      card.innerHTML = `
        <div class="yt-thumb">${thumb ? `<img src="${thumb}" alt="${safeTitle}" loading="lazy">` : ''}</div>
        <div class="yt-meta">
          <div class="yt-title">${safeTitle}</div>
          <div class="yt-channel">${escapeHtml(snip.channelTitle||'')}</div>
        </div>`;
      const channelTitle = snip.channelTitle || snip.videoOwnerChannelTitle;
      flyoutState.items.push({ id: videoId, title: snip.title, channelTitle, channelId: flyoutState.channelId });
      const queueIndex = flyoutState.items.length - 1;
      card.addEventListener('click', ()=>{
        setPlaylist(flyoutState.items.slice(), queueIndex);
        loadVideo(videoId, snip.title, channelTitle, flyoutState.channelId);
        closeFlyout();
      });
      grid.appendChild(card);
    });
    if(added === 0){
      if(!yEls.flyoutBody.querySelector('.yt-card')){
        yEls.flyoutBody.innerHTML = `<div class="status-msg">No videos found for this channel.</div>`;
      }
      return;
    }
    yEls.flyoutBody.appendChild(grid);
  }

  yEls.flyoutMore.addEventListener('click', async ()=>{
    if(!flyoutState.playlistId || !flyoutState.nextPageToken) return;
    yEls.flyoutMore.disabled = true;
    try{
      const page = await fetchPlaylistPage(flyoutState.playlistId, flyoutState.nextPageToken);
      renderFlyoutItems(page.items);
      flyoutState.nextPageToken = page.nextPageToken || null;
      yEls.flyoutMore.hidden = !flyoutState.nextPageToken;
    } catch(err){
      alert("Couldn't load more: " + err.message);
    } finally {
      yEls.flyoutMore.disabled = false;
    }
  });

  function closeFlyout(){ yEls.flyout.hidden = true; yEls.flyoutBody.innerHTML = ''; }

  /* The header button no longer closes/clears the flyout — it just shows/hides
     its content in place, so switching away and back doesn't lose or re-fetch it. */
  function setFlyoutCollapsed(collapsed){
    flyoutState.collapsed = collapsed;
    yEls.flyout.classList.toggle('collapsed', collapsed);
    yEls.flyoutClose.innerHTML = collapsed ? '&#9660;' : '&#9650;';
    yEls.flyoutClose.title = collapsed ? 'Show' : 'Hide';
    yEls.flyoutClose.setAttribute('aria-label', collapsed ? 'Show related videos' : 'Hide related videos');
  }
  yEls.flyoutClose.addEventListener('click', ()=> setFlyoutCollapsed(!flyoutState.collapsed));

  /* ---------- Freeform search ---------- */
  function renderResults(items){
    yEls.resultsGrid.innerHTML = '';
    if(!items || items.length===0){
      yEls.resultsGrid.innerHTML = `<div class="status-msg">No results found.</div>`;
      return;
    }
    const queue = [];
    items.forEach(item=>{
      const id = item.id && item.id.videoId;
      const snip = item.snippet;
      if(!id || !snip) return;
      const thumb = (snip.thumbnails && (snip.thumbnails.medium || snip.thumbnails.default)) || {};
      const card = document.createElement('div');
      card.className = 'yt-card';
      const safeTitle = escapeHtml(snip.title);
      card.innerHTML = `
        <div class="yt-thumb">${thumb.url ? `<img src="${thumb.url}" alt="${safeTitle}" loading="lazy">` : ''}</div>
        <div class="yt-meta">
          <div class="yt-title">${safeTitle}</div>
          <div class="yt-channel">${escapeHtml(snip.channelTitle||'')}</div>
        </div>`;
      const queueIndex = queue.length;
      queue.push({ id, title: snip.title, channelTitle: snip.channelTitle, channelId: snip.channelId });
      card.addEventListener('click', ()=>{
        setPlaylist(queue, queueIndex);
        loadVideo(id, snip.title, snip.channelTitle, snip.channelId);
        openSongFlyout(snip.channelId, snip.channelTitle, id, snip.title, snip.thumbnails);
      });
      yEls.resultsGrid.appendChild(card);
    });
    state.playlist = queue;
    state.playlistIndex = -1;
    updateNavButtons();
  }

  async function searchYouTube(query, opts={}){
    if(!state.apiKey){
      setKeyStatus('Add a YouTube API key to search, or paste a video link/ID directly.', 'err');
      yEls.apiKeyPanel.hidden = false;
      return;
    }
    yEls.resultsGrid.innerHTML = `<div class="status-msg">Searching…</div>`;
    if(opts.autoplay) yEls.screenHint.textContent = 'Finding a match…';
    try{
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part','snippet');
      url.searchParams.set('type','video');
      url.searchParams.set('maxResults','12');
      url.searchParams.set('q', query);
      url.searchParams.set('key', state.apiKey);
      const res = await fetch(url.toString());
      const data = await res.json();
      if(!res.ok) throw new Error((data.error && data.error.message) || `Search failed (${res.status})`);
      const items = data.items || [];
      renderResults(items);
      if(opts.autoplay){
        if(items.length){
          const top = items[0];
          state.playlistIndex = 0;
          loadVideo(top.id.videoId, top.snippet.title, top.snippet.channelTitle, top.snippet.channelId);
        } else {
          yEls.screenHint.textContent = "Couldn't find a matching video to play.";
        }
      }
    } catch(err){
      yEls.resultsGrid.innerHTML = `<div class="status-msg">Couldn't search: ${err.message}</div>`;
      if(opts.autoplay) yEls.screenHint.textContent = "Couldn't search: " + err.message;
    }
  }

  /* ---------- Movies & TV (The Movie Database) — search/browse only.
     Posters, titles and info come from TMDb; nothing here streams a full
     movie or episode. Clicking a card finds and plays that title's trailer
     on YouTube through the same player above, the same way it plays a song. */
  async function searchTMDb(query){
    const url = new URL('https://api.themoviedb.org/3/search/multi');
    url.searchParams.set('api_key', TMDB_KEY);
    url.searchParams.set('query', query);
    url.searchParams.set('include_adult', 'false');
    const res = await fetch(url.toString());
    const data = await res.json();
    if(!res.ok) throw new Error((data.status_message) || `TMDb search failed (${res.status})`);
    return (data.results || []).filter(it => it.media_type === 'movie' || it.media_type === 'tv');
  }

  function renderTMDbResults(items){
    yEls.tmdbGrid.innerHTML = '';
    yEls.tmdbLabel.style.display = items.length ? '' : 'none';
    items.slice(0, 18).forEach(it=>{
      const isTV = it.media_type === 'tv';
      const title = isTV ? it.name : it.title;
      const dateStr = isTV ? it.first_air_date : it.release_date;
      const year = dateStr ? dateStr.slice(0,4) : '';
      const poster = it.poster_path ? (TMDB_IMG + it.poster_path) : '';
      const card = document.createElement('div');
      card.className = 'yt-card';
      const safeTitle = escapeHtml(title || 'Untitled');
      card.innerHTML = `
        <div class="yt-thumb">${poster ? `<img src="${poster}" alt="${safeTitle}" loading="lazy">` : ''}<span class="yt-now-badge" style="left:auto;right:6px;background:rgba(0,0,0,.72)">${isTV ? '📺 TV' : '🎬 Movie'}</span></div>
        <div class="yt-meta">
          <div class="yt-title">${safeTitle}</div>
          <div class="yt-channel">${escapeHtml(year)}</div>
        </div>`;
      card.addEventListener('click', ()=>{
        searchYouTube(`${title} ${isTV ? 'official trailer' : 'trailer'}`, { autoplay: true });
      });
      yEls.tmdbGrid.appendChild(card);
    });
  }

  async function searchTMDbAndRender(query){
    try{
      const items = await searchTMDb(query);
      renderTMDbResults(items);
    }catch(err){
      yEls.tmdbGrid.innerHTML = '';
      yEls.tmdbLabel.style.display = 'none';
      // TMDb being unreachable shouldn't block YouTube results — fail quietly.
    }
  }

  function handleSearch(){
    const raw = yEls.searchInput.value.trim();
    if(!raw) return;
    closeDropdown();
    const videoId = extractVideoId(raw);
    if(videoId){ yEls.resultsGrid.innerHTML = ''; yEls.tmdbGrid.innerHTML = ''; yEls.tmdbLabel.style.display = 'none'; loadVideo(videoId); return; }
    closeFlyout();
    addSearchHistory(raw);
    searchYouTube(raw, { autoplay: true });
    searchTMDbAndRender(raw);
  }

  yEls.searchBtn.addEventListener('click', handleSearch);
  yEls.searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') handleSearch(); });

  /* ---------- Global dismiss handlers ---------- */
  document.addEventListener('click', (e)=>{
    if(!yEls.wrap.contains(e.target)) closeDropdown();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key !== 'Escape') return;
    closeDropdown();
    closeFlyout();
    closeLibrary();
  });

  renderLibraryButton();
})();
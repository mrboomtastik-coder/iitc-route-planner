// ==UserScript==
// @id             iitc-plugin-route-planner
// @name           IITC Plugin: Portal Route Planner
// @category       Layer
// @version        0.1.0
// @description    Calculate an efficient route through visible portals
// @updateURL      https://raw.githubusercontent.com/mrboomtastik-coder/iitc-route-planner/main/dist/mrboomtastik-coder/route-planner.meta.js
// @downloadURL    https://raw.githubusercontent.com/mrboomtastik-coder/iitc-route-planner/main/dist/mrboomtastik-coder/route-planner.user.js
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
  if(typeof window.plugin !== 'function') window.plugin = function() {};
  const plugin = window.plugin.routePlanner = {};
  plugin.routeLayer = null;
  plugin.startPortal = null;

  // Bereken afstand
  function distance(a,b) {
    const dx = a.lat - b.lat;
    const dy = a.lng - b.lng;
    return Math.sqrt(dx*dx + dy*dy);
  }

  // Alle zichtbare portals ophalen
  function getVisiblePortals() {
    const portals = [];
    for(const id in window.portals) {
      const portal = window.portals[id];
      const ll = portal.getLatLng();
      portals.push({id:id, lat:ll.lat, lng:ll.lng});
    }
    return portals;
  }

  // Route berekenen (Nearest Neighbor)
  function nearestNeighborRoute(start, portals) {
    const route = [start];
    const remaining = portals.filter(p=>p.id !== start.id);
    let current = start;
    while(remaining.length > 0) {
      let bestIndex = 0;
      let bestDistance = distance(current, remaining[0]);
      for(let i=1;i<remaining.length;i++){
        const d = distance(current, remaining[i]);
        if(d < bestDistance){ bestDistance=d; bestIndex=i; }
      }
      current = remaining.splice(bestIndex,1)[0];
      route.push(current);
    }
    return route;
  }

  // Teken route
  plugin.drawRoute = function() {
    if(!plugin.startPortal){ alert('Selecteer eerst een portal als startpunt.'); return; }
    const portals = getVisiblePortals();
    if(portals.length<2){ alert('Niet genoeg portals zichtbaar.'); return; }
    const route = nearestNeighborRoute(plugin.startPortal, portals);
    const latlngs = route.map(p=>[p.lat,p.lng]);
    if(plugin.routeLayer) window.map.removeLayer(plugin.routeLayer);
    plugin.routeLayer = L.polyline(latlngs,{color:'orange', weight:4, opacity:0.8}).addTo(window.map);
  };

  // Hook portal select
  window.addHook('portalSelected', function(data){
    const portal = window.portals[data.selectedPortalGuid];
    if(!portal) return;
    const ll = portal.getLatLng();
    plugin.startPortal = {id:data.selectedPortalGuid, lat:ll.lat, lng:ll.lng};
  });

  // Setup UI knop
  const setup = function() {
    $('#toolbox').append('<a onclick="window.plugin.routePlanner.drawRoute();">Route from selected portal</a>');
  };

  setup.info = plugin_info;
  window.bootPlugins.push(setup);
  if(window.iitcLoaded) setup();
}

// Injecteer wrapper
const script = document.createElement('script');
script.appendChild(document.createTextNode('('+wrapper+')({});'));
(document.body||document.head||document.documentElement).appendChild(script);

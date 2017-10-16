const map = L.map('mapid').setView([45.3901848, -75.7456261], 15)
const settings = [{ color: '#0099cc', weight: 3, key: 'LTS1', zIndex: 1, title: 'LTS 1 - Suitable for Children', url: 'data/level_1.json' },
                { color: '#1C7C54', weight: 3, key: 'LTS2', zIndex: 2, title: 'LTS 2 - Low Stress', url: 'data/level_2.json' },
                { color: '#F0C808', weight: 3, key: 'LTS3', zIndex: 3, title: 'LTS 3 - Moderate Stress', url: 'data/level_3.json' },
                { color: '#DD5454', weight: 3, key: 'LTS4', zIndex: 4, title: 'LTS 4 - High Stress', url: 'data/level_4.json' }]
const homePage = 'https://bikeottawa.ca/index.php/advocacy/advocacy-news/213-data_group'
const legendTitle = 'Cycling Stress Map'
const layers = {}
const tree = rbush.rbush();

addLegend()
addStressLayers()
addIconLayers()


///// Functions ////

function addLegend () {
  const legend = L.control({position: 'topright'})
  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info legend')
    let legendHtml = '<center><a href="' + homePage + '" target="_blank"><h3>' + legendTitle + '</h3></a></center><table>'
    for (let setting of settings) {
      legendHtml += addLegendLine(setting)
    }
    legendHtml += '</table>'
    div.innerHTML = legendHtml
    div.addEventListener('mouseover', function () {map.doubleClickZoom.disable(); });
    div.addEventListener('mouseout', function () {map.doubleClickZoom.enable(); });
    return div
  }
  legend.addTo(map)
}

function addStressLayers () {
  for (let setting of settings) {
    addStressLayerToMap(setting)
  }
}

function addStressLayerToMap (setting) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', setting.url)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.onload = function () {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText)
      const tileIndex = geojsonvt(data, { maxZoom: 18 })
      tree.load(data)

      const canvasTiles = L.tileLayer.canvas()
      canvasTiles.drawTile = function (canvas, tilePoint, zoom) {
        const tile = tileIndex.getTile(zoom, tilePoint.x, tilePoint.y)
        if (!tile) { return }
        drawFeatures(canvas.getContext('2d'), tile.features, setting.color, setting.weight)
      }
      canvasTiles.addTo(map)
      layers[setting.key] = canvasTiles
    } else {
      alert('Request failed.  Returned status of ' + xhr.status)
    }
  }
  xhr.send()
}

function drawFeatures (ctx, features, lineColor, weight) {
  ctx.strokeStyle = lineColor
  ctx.lineWidth = weight

  for (let feature of features) {
    const type = feature.type
    ctx.fillStyle = feature.tags.color ? feature.tags.color : 'rgba(255,0,0,0.05)'
    ctx.beginPath()
    for (let geom of feature.geometry) {
      const pad = 1
      const ratio = .1
      if (type === 1) {
        ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false)
        continue
      }
      for (var k = 0; k < geom.length; k++) {
        var p = geom[k]
        var extent = 4096
        var x = p[0] / extent * 256
        var y = p[1] / extent * 256
        if (k) {
          ctx.lineTo(x + pad, y + pad)
        } else {
          ctx.moveTo(x + pad, y + pad)
        }
      }
    }
    if (type === 3 || type === 1) ctx.fill('evenodd')
    ctx.stroke()
  }
}

function toggleLayer (checkbox) {
  if (checkbox.checked) {
    map.addLayer(layers[checkbox.id])
  } else {
    map.removeLayer(layers[checkbox.id])
  }
}

function addLegendLine (setting) {
  return ('<tr><td><input type="checkbox" id="' +
    setting.key +
    '" onclick="toggleLayer(this)" checked /></td>' +
    '<td><hr style="display:inline-block; width: 50px;" color="' +
    setting.color +
    '" size="5" /></td><td>' +
    setting.title +
    '</td></tr>'
  )
}


function addIconLayers(){

  const providers = [];
  providers.push({
      title: 'mapnik',
      icon: 'img/icons-mapnik.png',
      layer: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 22,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      })
  });

  providers.push({
      title: 'osm bw',
      icon: 'img/icons-osm-bw.png',
      layer: L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
          maxZoom: 22,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      })
  });

  providers.push({
      title: 'streets',
      icon: 'img/icons-streets.png',
      layer: L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
          attribution: "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
          maxZoom: 22,
          id: 'mapbox.streets',
          accessToken: 'pk.eyJ1IjoienpwdGljaGthIiwiYSI6ImNqN2FubTQ5ejBpZDAyd285MmZsdHN3d3IifQ.dc6SvmJLcl7KGPQlBYFj-g'
      })
  });

  providers.push({
      title: 'satellite',
      icon: 'img/icons-satellite.png',
      layer: L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
          attribution: "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
          maxZoom: 22,
          id: 'mapbox.satellite',
          accessToken: 'pk.eyJ1IjoienpwdGljaGthIiwiYSI6ImNqN2FubTQ5ejBpZDAyd285MmZsdHN3d3IifQ.dc6SvmJLcl7KGPQlBYFj-g'
      })
  });

  providers.push({
      title: 'light',
      icon: 'img/icons-light.png',
      layer: L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
          attribution: "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
          maxZoom: 22,
          id: 'mapbox.light',
          accessToken: 'pk.eyJ1IjoienpwdGljaGthIiwiYSI6ImNqN2FubTQ5ejBpZDAyd285MmZsdHN3d3IifQ.dc6SvmJLcl7KGPQlBYFj-g'
      })
  });

  providers.push({
      title: 'run-bike-hike',
      icon: 'img/icons-run-bike-hike.png',
      layer: L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
          attribution: "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
          maxZoom: 22,
          id: 'mapbox.run-bike-hike',
          accessToken: 'pk.eyJ1IjoienpwdGljaGthIiwiYSI6ImNqN2FubTQ5ejBpZDAyd285MmZsdHN3d3IifQ.dc6SvmJLcl7KGPQlBYFj-g'
      })
  });

  L.control.iconLayers(providers).addTo(map);

}


function getFeaturesNearby(point, maxMeters, breakOnFirst)
{
  ret = [];
  const pt = turf.helpers.point(point);
  const nearby = tree.search(pt);
  for(let feature of nearby.features){
    if(breakOnFirst && ret.length){return ret;}
    const line = turf.helpers.lineString(feature.geometry.coordinates);
    if(turf.pointToLineDistance(pt, line, {units: 'meters'})<maxMeters){
      ret.push(feature);
    }
  }

  return ret;
}


function displayOsmElementInfo(element, latlng) {

  const xhr = new XMLHttpRequest()
  xhr.open('GET','https://api.openstreetmap.org/api/0.6/'+element)
  xhr.onload = function () {
    let popup = '<b><a href="https://www.openstreetmap.org/' + element + '" target="_blank">' + element + '</a></b><hr>'
    if (xhr.status === 200) {
      const xmlDOM = new DOMParser().parseFromString(xhr.responseText, 'text/xml');
      for(let tag of xmlDOM.getElementsByTagName("tag"))
      {
        popup += tag.attributes["k"].value+": <b>"+tag.attributes["v"].value+'</b><br>';
      }
    } else {
      popup += 'Failed to request details from osm.org';
    }
    map.openPopup(popup, latlng);
  }
  xhr.send()
}


let highlight;
let timer;
map.on('mousemove', function(e) {
  const features = getFeaturesNearby([e.latlng.lng,e.latlng.lat], 5, true)
  clearTimeout(timer);
  if (features.length!=0) {
    document.getElementById('mapid').style.cursor = 'pointer'
  }
  else {    
    timer = setTimeout(function()
                {
	                 document.getElementById('mapid').style.cursor = ''
                 }, 300);
  }
})

map.on('click', function(e) {
  if (highlight){
    map.removeLayer(highlight)
  }
  const features = getFeaturesNearby([e.latlng.lng,e.latlng.lat], 5, true);
  if (features.length!=0) {
    displayOsmElementInfo(features[0].id, e.latlng);
    highlight = new L.geoJson(features[0],{style: {color:'#df42f4',  weight: 5}}).addTo(map);
    map.on('popupclose', function() {
     map.removeLayer(highlight)
   });
  }
 });

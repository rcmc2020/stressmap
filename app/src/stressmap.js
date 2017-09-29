var map = L.map('mapid').setView([45.3941848, -75.7456261], 14)
var settings = [{ color: '#0099cc', key: 'LTS1', title: 'LTS 1 - Suitable for Children', url: 'data/level_1.json' },
                { color: '#1C7C54', key: 'LTS2', title: 'LTS 2 - Low Stress', url: 'data/level_2.json' },
                { color: '#F0C808', key: 'LTS3', title: 'LTS 3 - Moderate Stress', url: 'data/level_3.json' },
                { color: '#DD5454', key: 'LTS4', title: 'LTS 4 - High Stress', url: 'data/level_4.json' }]
var homePage = 'https://bikeottawa.ca/index.php/advocacy/advocacy-news/213-data_group'
var legendTitle = 'Cycling Stress Map'
var layers = {}

addMapTileLayer()
addLegend()
addStressLayers()

function addMapTileLayer () {
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18}
  ).addTo(map)
}

function addLegend () {
  var legend = L.control({position: 'topright'})
  legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend')
    var legendHtml = '<center><a href="' + homePage + '" target="_blank"><h3>' + legendTitle + '</h3></a></center><table>'
    for (var i = 0; i < settings.length; i++) {
      legendHtml += addLegendLine(settings[i])
    }
    legendHtml += '</table>'
    div.innerHTML = legendHtml
    return div
  }
  legend.addTo(map)
}

function addStressLayers () {
  for (var i = 0; i < settings.length; i++) {
    addStressLayerToMap(settings[i])
  }
}

function addStressLayerToMap (setting) {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', setting.url)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.onload = function () {
    if (xhr.status === 200) {
      var data = JSON.parse(xhr.responseText)
      var tileIndex = geojsonvt(data, { maxZoom: 18 })
      var canvasTiles = L.tileLayer.canvas()
      canvasTiles.drawTile = function (canvas, tilePoint, zoom) {
        var tile = tileIndex.getTile(zoom, tilePoint.x, tilePoint.y)
        if (!tile) {
          return
        }
        drawFeatures(canvas.getContext('2d'), tile.features, setting.color)
      }
      canvasTiles.addTo(map)
      layers[setting.key] = canvasTiles
    } else {
      alert('Request failed.  Returned status of ' + xhr.status)
    }
  }
  xhr.send()
}

function drawFeatures (ctx, features, lineColor) {
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 2

  for (var i = 0; i < features.length; i++) {
    var feature = features[i], type = feature.type
    ctx.fillStyle = feature.tags.color ? feature.tags.color : 'rgba(255,0,0,0.05)'
    ctx.beginPath()
    for (var j = 0; j < feature.geometry.length; j++) {
      const pad = 1
      const ratio = .1
      var geom = feature.geometry[j]
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

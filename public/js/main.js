var mapGlobal = null
var markers = new Map();
var moneyMarkers = new Map();
var locationMarker = null
var headingMarker = null
var pannedThisSession = false
var chosenDestinationMarker = null

var locationBaseColor = '#40b3ff'

var headingIconBaseOptions = {
  path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
  scale: 4,
  fillOpacity: 1,
  fillColor: locationBaseColor,
  anchor: new google.maps.Point(0, 4),
  strokeOpacity: 0
}

var locationIconBaseOptions = {
  path: google.maps.SymbolPath.CIRCLE,
  scale: 10,
  fillOpacity: 1,
  fillColor: locationBaseColor,
  strokeOpacity: 0
}

var defaultMapSettings = {
  lat: 60.1729721445,
  lng: 24.9399946767,
  zoom: 15
}

function initializeGoogleMaps() {

  var styles = [{"featureType": "all", "elementType": "labels.text.fill", "stylers": [{"saturation": 36 }, {"color": "#333333"}, {"lightness": 40 } ] }, {"featureType": "all", "elementType": "labels.text.stroke", "stylers": [{"visibility": "on"}, {"color": "#ffffff"}, {"lightness": 16 } ] }, {"featureType": "all", "elementType": "labels.icon", "stylers": [{"visibility": "off"} ] }, {"featureType": "administrative", "elementType": "geometry.fill", "stylers": [{"color": "#fefefe"}, {"lightness": 20 } ] }, {"featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{"color": "#fefefe"}, {"lightness": 17 }, {"weight": 1.2 } ] }, {"featureType": "landscape", "elementType": "geometry", "stylers": [{"color": "#f5f5f5"}, {"lightness": 20 } ] }, {"featureType": "poi", "elementType": "geometry", "stylers": [{"color": "#f5f5f5"}, {"lightness": 21 } ] }, {"featureType": "poi.park", "elementType": "geometry", "stylers": [{"color": "#e6e6e6"}, {"lightness": 21 } ] }, {"featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{"color": "#ffffff"}, {"lightness": 17 } ] }, {"featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{"color": "#ffffff"}, {"lightness": 29 }, {"weight": 0.2 } ] }, {"featureType": "road.arterial", "elementType": "geometry", "stylers": [{"color": "#ffffff"}, {"lightness": 18 } ] }, {"featureType": "road.local", "elementType": "geometry", "stylers": [{"color": "#ffffff"}, {"lightness": 16 } ] }, {"featureType": "transit", "elementType": "geometry", "stylers": [{"color": "#f2f2f2"}, {"lightness": 19 } ] }, {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#e0eff8"}, {"lightness": 17 } ] } ]

  var mapOptions = {
    center: new google.maps.LatLng(defaultMapSettings.lat, defaultMapSettings.lng),
    zoom: defaultMapSettings.zoom,
    disableDefaultUI: true,
    zoomControl: false,
    styles: styles
  }

  var mapElement = document.getElementById('map-canvas')
  mapGlobal = new google.maps.Map(mapElement, mapOptions)

  //getUserGPSLocation()
  renderUserGPSLocation()
}

/**
* draws route based on JSON coordinatelist
*/
function drawRoute(routeObj) {
  for (var i = 0; i < routeObj.coordinates.length -2; i++) {
        var line = new google.maps.Polyline({
          path: [new google.maps.LatLng(routeObj.coordinates[i].lat, routeObj.coordinates[i].lon), new google.maps.LatLng(routeObj.coordinates[i + 1].lat, routeObj.coordinates[i + 1].lon)],
          strokeColor: "#425cf4",
          strokeOpacity: 1.0,
          strokeWeight: 7,
          map: mapGlobal
        });

    }

}

// Create a blank marker
function createNormalBlankMarker(lat, lon) {
  var marker = new MarkerWithLabel({
    position: new google.maps.LatLng(lat, lon),
    map: mapGlobal,
    icon: {
      path: 'M1.0658141e-14,-54 C-11.0283582,-54 -20,-44.5228029 -20,-32.873781 C-20,-19.2421314 -1.49104478,-1.30230657 -0.703731343,-0.612525547 L-0.00447761194,-7.10542736e-15 L0.697761194,-0.608583942 C1.48656716,-1.29048175 20,-19.0458394 20,-32.873781 C20,-44.5228029 11.0276119,-54 1.0658141e-14,-54 L1.0658141e-14,-54 Z',
      fillOpacity: 0.5,
      scale: 1.1,
      strokeWeight: 1
    },
    labelAnchor: new google.maps.Point(20, 43),

  })
  return marker
}

// Set color for normal marker
function setNormalLabelColorThreeTone(bikesAvailable, totalSpaces) {
  var fillRate = (Math.floor(((1-(totalSpaces-bikesAvailable)/totalSpaces))*10))*10
  if (fillRate > 80) {
    var labelColor = '#ff704d'
  } else if (fillRate < 10 || bikesAvailable < 3) {
    var labelColor = '#80ccff'
  } else {
    labelColor = '#ccffcc'
  }
  return labelColor;
}

// Normal station content
function setNormalStationMarkerContent(marker, bikesAvailable, totalSpaces) {
  var labelContent = '<div class="count">' + bikesAvailable + ' / ' + totalSpaces + '</div>'
  var labelColor = setNormalLabelColorThreeTone(bikesAvailable, totalSpaces)

  marker.icon.fillColor = labelColor
  marker.icon.fillOpacity = 0.5
  marker.labelContent = labelContent

  return marker
}

// Create a normal station with bike availability
function createNormalStation (stationObject) {
  var stationMarker = createNormalBlankMarker(stationObject.lat, stationObject.lon)
  var spacesAvailable = parseInt(stationObject.spacesAvailable)
  var bikesAvailable = parseInt(stationObject.bikesAvailable)
  var totalSpaces = spacesAvailable + bikesAvailable
  markers.set(stationObject.id, setNormalStationMarkerContent(stationMarker, bikesAvailable, totalSpaces))
}

// Create a new marker for a bike station
// Param money is the reward in euros
function createStation(stationObject, money) {
  var stationMarker = createBlankMarker(stationObject.lat, stationObject.lon)

  var spacesAvailable = parseInt(stationObject.spacesAvailable)
  var bikesAvailable = parseInt(stationObject.bikesAvailable)
  var totalSpaces = spacesAvailable + bikesAvailable

  var newMarker = setStationMarkerContent(stationMarker, bikesAvailable, totalSpaces, money)
  markers.set(stationObject.id, {marker: newMarker, fullness: bikesAvailable/totalSpaces})
  // If marker is worth money
  if (money > 0) {
    // Push to moneyMarkers
    newMarker.labelClass = "destinationOptionMarker"
    moneyMarkers.set(stationObject.id, {marker: newMarker, fullness: bikesAvailable/totalSpaces})
  }
}

// Create station marker for possible departure stations
function createPossibleDepartureStation(stationObject) {
  var stationMarker = createBlankMarker(stationObject.lat, stationObject.lon)
  moneyMarkers.set(stationObject.id, {marker: stationMarker, fullness: stationObject.bikesAvailable/stationObject.totalSpaces})
  stationMarker.icon.fillColor = '#82ff86'
}

// Set styles of a marker: reward in euros and color
function setStationMarkerContent(marker, bikesAvailable, totalSpaces, money) {
  var labelContent = '<div class="count">' + money + '€</div>'
  var labelColor = setLabelColorThreeTone(bikesAvailable, totalSpaces)

  marker.icon.fillColor = labelColor
  marker.icon.fillOpacity = 0.5
  marker.labelContent = labelContent
  marker.labelClass = "basicMarker"

  return marker
}

function createBlankMarker(lat, lon) {
  var marker = new MarkerWithLabel({
    position: new google.maps.LatLng(lat, lon),
    map: mapGlobal,
    icon: {
      path: 'M1.0658141e-14,-54 C-11.0283582,-54 -20,-44.5228029 -20,-32.873781 C-20,-19.2421314 -1.49104478,-1.30230657 -0.703731343,-0.612525547 L-0.00447761194,-7.10542736e-15 L0.697761194,-0.608583942 C1.48656716,-1.29048175 20,-19.0458394 20,-32.873781 C20,-44.5228029 11.0276119,-54 1.0658141e-14,-54 L1.0658141e-14,-54 Z',
      fillOpacity: 0.5,
      scale: 1.1,
      strokeWeight: 1
    },
    labelAnchor: new google.maps.Point(20, 43)
  })
  return marker
}

function setLabelColorThreeTone(bikesAvailable, totalSpaces) {
  var fillRate = (Math.floor(((1-(totalSpaces-bikesAvailable)/totalSpaces))*10))*10
  if (fillRate > 80) {
    var labelColor = '#c9c9c9'
  } else if (fillRate < 10 || bikesAvailable < 3) {
    var labelColor = '#03c100'
  } else {
    labelColor = '#c9c9c9'
  }
  return labelColor;
}

function outsideOperationTheatre(position) {
  var theatreWestSouthPoint = {
    lat: 60.152162,
    lng: 24.910469
  }
  var theatreEastNorthPoint = {
    lat: 60.191951,
    lng: 24.985142
  }

  var latMin = theatreWestSouthPoint.lat
  var latMax = theatreEastNorthPoint.lat
  var lngMin = theatreWestSouthPoint.lng
  var lngMax = theatreEastNorthPoint.lng

  var latInside = position.coords.latitude <= latMax && position.coords.latitude >= latMin
  var lngInside = position.coords.longitude <= lngMax && position.coords.longitude >= lngMin

  return !latInside && !lngInside
}

function getCompassHeading() {
  if (event.webkitCompassHeading) {
    return event.webkitCompassHeading
  } else {
    return event.alpha
  }
}

function setupHeadingMarker(userLatLng) {
  function updateHeadingMarker() {
    var iconOptions = headingIconBaseOptions
    iconOptions.rotation = getCompassHeading()

    headingMarker.setOptions({
      position: userLatLng,
      icon: iconOptions
    })
  }
  function drawHeadingMarker() {
    headingMarker = new google.maps.Marker({
      position: userLatLng,
      icon: headingIconBaseOptions,
      map: mapGlobal
    })
  }
  function rotateHeadingIcon(eventData) {
    if (headingMarker) {
      updateHeadingMarker()
    } else if (event.webkitCompassHeading || event.alpha) {
      drawHeadingMarker()
    }
  }

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', rotateHeadingIcon)
  }
}

function createOrUpdateLocationMarker(userLatLng) {
  if (locationMarker) {
    locationMarker.setOptions({
      position: userLatLng,
      icon: locationIconBaseOptions
    })
  } else {
    locationMarker = new google.maps.Marker({
      position: userLatLng,
      icon: locationIconBaseOptions,
      map: mapGlobal
    })
  }
}

function renderUserGPSLocation() {
  var lat = 60.170555
  var lon = 24.940640
  var userLatLng = new google.maps.LatLng(lat, lon)

  createOrUpdateLocationMarker(userLatLng)
  setupHeadingMarker(userLatLng)

  mapGlobal.panTo(userLatLng)
  /*
  if (!outsideOperationTheatre(position) && !pannedThisSession) {
    mapGlobal.panTo(userLatLng)
    pannedThisSession = true
  }
  */
}

function getJSON(url, callback) {
  var request = new XMLHttpRequest()
  request.open('GET', url, true)

  request.onreadystatechange = function() {
    if (this.readyState === 4) {
      if (this.status >= 200 && this.status < 400) {
        var data = JSON.parse(this.responseText)
        callback(data)
      }
    }
  }

  request.send()
  request = null
}


// Create array of markers and distances
function createMarkerDistArr() {
  var arr = []
  // Get user's locations
  var usrLat = locationMarker.position.lat()
  var usrLng = locationMarker.position.lng()
  markers.forEach(function (m, id) {
    // Push markers and their distances  to user in an array
    arr.push({
      distance: getDistanceFromLatLonInKm(usrLat, usrLng, m.marker.position.lat(), m.marker.position.lng()),
      marker: m.marker,
      id: id,
      fullness: m.fullness
    })
  })
  return arr
}

// Get X nearest arrays to user
function getNearestStationsHelper (count, markerDistancesArr) {
  var arr = []
  // Get 3 nearest stations to the user that are at least half full
  for (var i=0; i<count; i++) {
    var smallestDistObj = {distance: 1000, marker: null, fullness: 0} // Max distance we show is 1000km
    // For each 'distance/marker' -pair
    for (var y=0; y<markerDistancesArr.length; y++) {
      var obj = markerDistancesArr[y]
      // Marker is the new nearest and has >50% bikes
      if (smallestDistObj.distance > obj.distance && obj.distance !== -1 && obj.fullness >= 0.5) {
          smallestDistObj = obj
      }
    }
    smallestDistObj.distance = -1
    arr.push(smallestDistObj) // Nearest marker to user
  }
  return arr
}

// Get x nearest stations
function getNearestStations(count) {
    // Array of markers with distances to user
    var markerDistancesArr = createMarkerDistArr()
    // Array of 'count' nearest markers to user
    var nearestMarkersArr = getNearestStationsHelper(count, markerDistancesArr)
    return nearestMarkersArr
}

// Clear map of markers
function clearTheMap() {
  markers.forEach(function (mrk) {
    mrk.marker.setMap(null)
  })
  markers.clear()
  moneyMarkers.clear()
}

function clearNormalTheMap() {
  markers.forEach(function (mrk) {
    mrk.setMap(null)
  })
  markers.clear()
  moneyMarkers.clear()
}

// Create markers for the nearest stations
function createNearestStationsToUser(data, nearestStations) {
  data.bikeRentalStations.map(function (station) {
    var available = false // if available for pick up
    nearestStations.forEach(function (mNear) {
      if (mNear.id === station.id) {
        available = true
      }
    })
    console.log(station.id)
    if (available) {
      createPossibleDepartureStation(station)
    } else {
      createBasicStationMarker(station)
    }
    console.log("Chosen target station:")
    console.log(chosenDestinationMarker)
  })
}

// Choose a pick-up station for a bike
function setPickUpPointClicks (target, choices) {
  choices.forEach(function (choice) {
    google.maps.event.addListener(choice.marker, 'click', function (e) {
      var latT = target.position.lat()
      var lonT = target.position.lng()
      var latC = choice.marker.position.lat()
      var lonC = choice.marker.position.lng()
      getRoute(latT, lonT, latC, lonC)
    })
  })
}

function createBasicStationMarker(station) {
  var marker = new MarkerWithLabel({
    position: new google.maps.LatLng(station.lat, station.lon),
    map: mapGlobal,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      strokeWeight: 2,
      fillColor: '#c9c9c9',
      fillOpacity: 1.0,
      strokeColor: '#515151'
    },
    labelClass: "basicMarker"
  })
}

// Click on a marker hides all the nearby markers
function setMarkerClickEvents () {
  // Set click events to moneyMarkers
  moneyMarkers.forEach(function (mObj) {
    // Set click event
    google.maps.event.addListener(mObj.marker, 'click', function (e) {
      saveChosenDestinationStation(mObj.marker)
      $('#hText').text('Choose the starting point')
      // Get the 3 nearest stations to user
      var nearestStations = getNearestStations(3)
      // Clear map of markers
      clearTheMap()
      // Update data and set possible pick up markers
      getJSON('/api/stations', function(data) {
        createNearestStationsToUser(data, nearestStations)
        setPickUpPointClicks(mObj.marker, moneyMarkers)
      })
    })
  })
}

function saveChosenDestinationStation(chosenMarker) {
  chosenDestinationMarker = new MarkerWithLabel({
    position: chosenMarker.position,
    map: mapGlobal,
    icon: {
      path: 'M1.0658141e-14,-54 C-11.0283582,-54 -20,-44.5228029 -20,-32.873781 C-20,-19.2421314 -1.49104478,-1.30230657 -0.703731343,-0.612525547 L-0.00447761194,-7.10542736e-15 L0.697761194,-0.608583942 C1.48656716,-1.29048175 20,-19.0458394 20,-32.873781 C20,-44.5228029 11.0276119,-54 1.0658141e-14,-54 L1.0658141e-14,-54 Z',
      fillOpacity: 0.5,
      scale: 1.1,
      strokeWeight: 1,
      fillColor: '#03c100'
    },
    labelAnchor: new google.maps.Point(20, 43)
  })
}

// Draw the distance between two dots
function travelBetweenDots() {

}

// Calculate distance between a pair of latitude longitude points
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}
// Helper for the function above - getDistanceFromLatLonInKm
function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function initializeApp() {
  //document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar)
  //document.getElementById('sidebar-close').addEventListener('click', toggleSidebar)

  initializeGoogleMaps()

  //initializeMarkers()
  createTestMarker()
}

function createTestMarker() {
  var lat = 60.170555
  var lon = 24.948845
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(lat, lon),
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      strokeWeight: 2,
      fillColor: '#c9c9c9',
      fillOpacity: 1.0,
      strokeColor: '#515151'
    },
    draggable: true,
    map: mapGlobal
  });
}

// Creates a target station
function createTargetStation (data, stationObject) {
  var lat = stationObject.lat // latitude
  var lon = stationObject.lon // longitude
  // Urgent need if 0 bikes
  var urgent = (stationObject.bikesAvailable === 0 ? true : false)
  var bikesAvailableNearby = false;
  // Check all the nearby stations
  data.bikeRentalStations.forEach(function (station) {
    var distance = getDistanceFromLatLonInKm(lat, lon, station.lat, station.lon)
    // If station is near and has more than 5 bikes
    if (distance < 0.25 && station.bikesAvailable>5) {
      bikesAvailableNearby = true
    }
  })
  // If urgent and not many bikes available nearby 1e
  if (urgent && !bikesAvailableNearby) {
    createStation(stationObject, 1)
  } else if (urgent) {
    // Urgent, but there are bikes available nearby 0.5e
    createStation(stationObject, 0.5)
  } else if (!bikesAvailableNearby) {
    // Not urgent, but not many bikes available nearby 0.7e
    createStation(stationObject, 0.7)
  } else {
    // Not urgent and bikes available nearby 0.2e
    createStation(stationObject, 0.2)
  }
}

// Create the markers with rewards
function initializeAppMarkers () {
  getJSON('/api/stations', function(data) {
    // For each bike station
    data.bikeRentalStations.map(function (stationObject) {
      // Create a reward marker if less than 4 bikes available
      if (stationObject.bikesAvailable < 3) {
        createTargetStation(data, stationObject)
      } else {
        createStation(stationObject, 0)
      }
    })
    setMarkerClickEvents(data)
  })
}

// Create the markers with bike numbers
function initializeNormalMarkers () {
  getJSON('/api/stations', function(data) {
    // For each bike station
    data.bikeRentalStations.map(createNormalStation)
  })
}

function initializeMarkers(ultimateApp) {
  if (ultimateApp) {
    // Initialize the markers with possible rewards
    initializeAppMarkers()
  } else {
    // Initialize the markers with bike availability
    initializeNormalMarkers()
  }
}

function getRoute(latF, lonF, latS, lonS) {
  getJSON('/api/route/'+latF+'/'+lonF+'/'+latS+'/'+lonS, function(data) {
    drawRoute(data)
  })
}

function testLogger(message) {
  console.log(message)
}

function ready(fn) {
  if (document.readyState != 'loading'){
    fn()
  } else {
    document.addEventListener('DOMContentLoaded', fn)
  }
}

function initialMonetizerButton () {
  $('#euroBtn').click(function () {
    $('#bikeBtn').attr('style','display:inline')
    $('#euroBtn').attr('style','display:none')
    clearNormalTheMap()
    initializeMarkers(true)
  })
  $('#bikeBtn').click(function () {
    $('#euroBtn').attr('style','display:inline')
    $('#bikeBtn').attr('style','display:none')
    clearTheMap()
    initializeMarkers(false)
  })
}

ready(initializeApp)
ready(initializeMarkers(false))
ready(initialMonetizerButton)

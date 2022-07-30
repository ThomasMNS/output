var bounds = [[-0.876584, -4.101210], [-1029.876584, 1024.898790]];
var image = L.imageOverlay('resources/valorant_bind_minimap.png', bounds);

var markerOptions = {
    radius: 3,
    fillColor: "#ff7800",
    color: "#000",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
};

var deaths = L.geoJSON(deathsJSON, {
    filter: function (feature) {
        if (feature.properties.map === "Bind") return true
    },
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, markerOptions);
    }
});

var map = L.map('mapid', {
    crs: L.CRS.Simple,
    minZoom: -7, 
    maxZoom: 5,
    zoomSnap: 0.15,
    zoomDelta: 0.15,
    wheelPxPerZoomLevel: 200,
    layers: [image, deaths]
});

map.fitBounds(bounds);
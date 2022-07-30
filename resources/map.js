// A function to check if 2 arrays are the same
function arraysEqual(a, b) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;    
}

var baseLabels = []

// The bounds of the background map (in British National Grid metres)
var bounds = [[11058.092837, -9713.518396], [-11169.907163, 8829.481604]];
var image = L.imageOverlay('resources/New Conquest Map.png', bounds);

// Sets
// Create a list with each unique set in the dataset 
var sets = []
for (feature of killsJSON.features) {
    var set = [feature.properties.Team1, feature.properties.Team2, feature.properties.SetDate];
    if (sets.length == 0) {
        sets.push(set);
    }

    var included = false;
    for (includedSet of sets) {
        if (arraysEqual(includedSet, set) == true) {
            included = true;
        }
    }
    if (included == false) {
        sets.push(set)
    }
}
// Sort the list of lists by date
function sortSets(a, b) {
    if (a[2] > b[2]) {
        return 1;
    }
    else if (a[2] < b[2]) {
        return -1;
    }

    if (a[0] > b[0]) {
        return 1;
    }
    else if (a[0] < b[0]) {
        return -1;
    }
    else {
        return 0;
    }
}
sets.sort(sortSets);

// Populate the select box with each unique set 
for (set of sets) {
    var opt = document.createElement("option")
    opt.innerHTML = set[0] + " vs " + set[1] + " " + new Date(set[2]).toLocaleDateString()
    document.getElementById("setSelect").appendChild(opt)
}

// Filter points to only include those from that set. This is used to populate the Game dropdown 
function setsFilter(feature) {
    var e = document.getElementById("setSelect");
    var set = e.options[e.selectedIndex].text;
    if (feature.properties.Team1 + " vs " + feature.properties.Team2 + " " + new Date(feature.properties.SetDate).toLocaleDateString() === set) {
        return true
    }
}

function sortPlayers(a, b) {
    if (a[1] > b[1]) {
        return 1;
    }
    else if (a[1] < b[1]) {
        return -1;
    }

    if (a[0] > b[0]) {
        return 1;
    }
    else if (a[0] < b[0]) {
        return -1;
    }
    else {
        return 0;
    }
}

// The selected set has been changed. Update the games and players selects with the appropriate options
function setChanged() {
    // Filter the complete JSON to only include the selected set. Using the Leaflet filter feature for convenience 
    setsFiltered = L.geoJSON(killsJSON, {
        filter: setsFilter,
    }); // Outputs a Leaflet layer
    setsFilteredGeoJSON = setsFiltered.toGeoJSON(); // Convert the Leaflet layer to JSON that we can work with 

    // Remove all the current options
    for (a in document.getElementById("gameSelect").options) {
        document.getElementById("gameSelect").remove(0);
    }
    for (a in document.getElementById("playersSelect").options) {
        document.getElementById("playersSelect").remove(0);
    }

    // Update the options in the games select 
    games = []
    players = []
    for (feature of setsFilteredGeoJSON.features) {
        var game = feature.properties.Game;
        if (games.includes(game) == false) {
            games.push(game);
        }
        
        var player = [feature.properties.Source, feature.properties.SourceTeam];
        if (players.length == 0) {
            players.push(player);
        } 

        var included = false;
        for (includedPlayer of players) {
            if (arraysEqual(includedPlayer, player) == true) {
                included = true;
            }
        }
        
        if (included == false) {
            players.push(player)
        }
    }
    for (game of games) {
        var opt = document.createElement("option");
        opt.innerHTML = game
        document.getElementById("gameSelect").appendChild(opt)
    }
    players.sort(sortPlayers);
    for (player of players) {
        var opt = document.createElement("option");
        opt.innerHTML = player[0] + " (" + player[1] + ")";
        opt.selected = true;
        document.getElementById("playersSelect").appendChild(opt);
    }
    
    // To-do: Low priority: Pull out populating the players dropdown so it shows only players who got kills in that game (how will event filtering change this...?)
    // To-do: Sort the players by team then by name
}
setChanged();

// Filters points to the selected set and game. 
// This is used to set the length of the time slider. 
function gamesFilter(feature) {
    var e = document.getElementById("setSelect");
    var set = e.options[e.selectedIndex].text;

    var f = document.getElementById("gameSelect");
    var game = f.options[f.selectedIndex].text;
   

    if ((feature.properties.Team1 + " vs " + feature.properties.Team2 + " " + new Date(feature.properties.SetDate).toLocaleDateString() === set) 
    && (feature.properties.Game == game)) {
        return true
    }
}

function setGameChanged() {
    // Filter the complete JSON to only include the selected set and game. Using the Leaflet filter feature for convenience 
    gamesFiltered = L.geoJSON(killsJSON, {
        filter: gamesFilter,
    }); // Outputs a Leaflet layer
    gamesFilteredGeoJSON = gamesFiltered.toGeoJSON(); // Convert the Leaflet layer to JSON that we can work with

    // Update the end time slider 
    var times = []
    for (feature of gamesFilteredGeoJSON.features) {
        times.push(feature.properties.Time);
    }
    times.sort(function (a,b) { return a-b});
    var lastTime = times[times.length - 1];

    document.getElementById("startTime").min = 0;
    document.getElementById("startTime").max = lastTime;
    document.getElementById("startTime").value = 0;
    document.getElementById("endTime").min = 1;
    document.getElementById("endTime").max = lastTime;
    document.getElementById("endTime").value = lastTime;

    

    document.getElementById("startTimeLabel").innerHTML = `${Math.floor(document.getElementById("startTime").value / 60)} minutes ${Math.round(document.getElementById("startTime").value - Math.floor(document.getElementById("startTime").value / 60) * 60)} seconds`;
    document.getElementById("endTimeLabel").innerHTML = `${Math.floor(document.getElementById("endTime").value / 60)} minutes ${Math.round(document.getElementById("endTime").value - Math.floor(document.getElementById("endTime").value / 60) * 60)} seconds`;
}
setGameChanged();

// Set the marker options 

var markerOptions = {
    radius: 10,
    fillColor: "#ff7800",
    color: "#000",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
};

// Update the points based on the selected dropdowns
var killsFiltered = L.geoJSON(killsJSON, {
    filter: killsFilter,
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, markerOptions);
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties.EventType == "DIT_KillingBlow") {
            var popupText = 
            `${feature.properties.Source} killed ${feature.properties.Target}<br>
            at ${Math.floor(feature.properties.Time / 60)} minutes ${Math.round(feature.properties.Time - Math.floor(feature.properties.Time / 60) * 60)} seconds`
        }
        else {
            var popupText =
            `Ward placed by ${feature.properties.Source}<br>
            at ${Math.floor(feature.properties.Time / 60)} minutes ${Math.round(feature.properties.Time - Math.floor(feature.properties.Time / 60) * 60)} seconds`
        }
        layer.bindPopup(popupText);
    }
});

function jsonToHeat() {
    var heatData = [];
    for (feature of killsFiltered.toGeoJSON().features) {
        heatData.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0], 1]);
    }
    return heatData;
}

function killsFilter(feature) {
    var e = document.getElementById("setSelect");
    var set = e.options[e.selectedIndex].text;

    var f = document.getElementById("gameSelect");
    var game = f.options[f.selectedIndex].text;

    var g = document.getElementById("playersSelect");
    var players = []
    for (var i = 0; i < g.length; i++) {
        if (g.options[i].selected) {
            players.push(g.options[i].value);
        }
    }

    var h = document.getElementById("eventSelect");
    if (h.options[h.selectedIndex].text == "Kills") {
        var event = "DIT_KillingBlow";
    }
    else {
        var event = "Ward_Placement";
    }

    var startTime = document.getElementById("startTime").value;
    var endTime = document.getElementById("endTime").value;
    
    if ((feature.properties.Team1 + " vs " + feature.properties.Team2 + " " + new Date(feature.properties.SetDate).toLocaleDateString() === set) 
    && (feature.properties.Game == game)
    && (players.includes(feature.properties.Source + " (" + feature.properties.SourceTeam + ")"))
    && (feature.properties.EventType == event)
    && (feature.properties.Time >= startTime)
    && (feature.properties.Time <= endTime)) {
        return true
    }
}

var killsHeatmap = L.heatLayer(
    jsonToHeat(), {radius: 35, minOpacity: 0.4}
)

var map = L.map('mapid', {
    crs: L.CRS.Simple,
    minZoom: -7, 
    maxZoom: 5,
    zoomSnap: 0.15,
    zoomDelta: 0.15,
    wheelPxPerZoomLevel: 200,
    layers: [image, killsFiltered, killsHeatmap]
});

map.fitBounds([[12000, -9713.518396], [-12000, 8829.481604]]);

var orderMarker = L.marker([-12500, 0]).addTo(map);
orderMarker.bindTooltip("Order base", {permanent: true}).openTooltip();

var chaosMarker = L.marker([11000, 0]).addTo(map);
chaosMarker.bindTooltip("Chaos base", {permanent: true}).openTooltip();


// One of the dropdowns have changed
function selectChange() {
    killsFiltered.clearLayers();
    killsFiltered.addData(killsJSON);

    var e = document.getElementById("displaySelect");
    var display = e.options[e.selectedIndex].text;

    if (display == "Heatmap") {
        killsHeatmap.setLatLngs(jsonToHeat());
    }

    var team1 = killsFiltered.toGeoJSON().features[0].properties.Team1;
    var team2 = killsFiltered.toGeoJSON().features[0].properties.Team2;
    baseLabels[0] = killsFiltered.toGeoJSON().features[0].properties.OrderSide;
    if (team1 == baseLabels[0]) {
        baseLabels[1] = team2;
    }
    else {
        baseLabels[1] = team1;
    }

    orderMarker.setTooltipContent(baseLabels[0] + " base");
    chaosMarker.setTooltipContent(baseLabels[1] + " base");

    document.getElementById("flipBox").checked = false;

    // Colour picker
    document.getElementById("team1Label").innerHTML = baseLabels[0] + ":"
    document.getElementById("team2Label").innerHTML = baseLabels[1] + ":"
    updateColours();
}
selectChange();

function flipChange() {
    var flippedKills = killsFiltered.toGeoJSON();

    for (feature of flippedKills.features) {
        feature.geometry.coordinates[1] = feature.geometry.coordinates[1] * -1;
    }

    killsFiltered.clearLayers();
    killsFiltered.addData(flippedKills);

    var e = document.getElementById("displaySelect");
    var display = e.options[e.selectedIndex].text;

    if (display == "Heatmap") {
        killsHeatmap.setLatLngs(jsonToHeat());
    }

    baseLabels.reverse();
    orderMarker.setTooltipContent(baseLabels[0] + " base");
    chaosMarker.setTooltipContent(baseLabels[1] + " base");

    updateColours();

}

function displayChange() {
    map.removeLayer(killsFiltered);
    map.removeLayer(killsHeatmap);;

    var e = document.getElementById("displaySelect");
    var display = e.options[e.selectedIndex].text;

    if (display == "Points") {
        map.addLayer(killsFiltered);
        document.getElementById("colourPara").style.display = "block";
    }
    else {
        map.addLayer(killsHeatmap);
        document.getElementById("colourPara").style.display = "none";
    }

}
displayChange();

function startChange() {
    killsFiltered.clearLayers();
    killsFiltered.addData(killsJSON);
    updateColours();

    var e = document.getElementById("displaySelect");
    var display = e.options[e.selectedIndex].text;

    if (display == "Heatmap") {
        killsHeatmap.setLatLngs(jsonToHeat());
    }

    if (parseInt(document.getElementById("startTime").value) >= parseInt(document.getElementById("endTime").value)) {
        document.getElementById("startTime").value = parseInt(document.getElementById("endTime").value) - 1;
    }
    document.getElementById("startTimeLabel").innerHTML = `${Math.floor(document.getElementById("startTime").value / 60)} minutes ${Math.round(document.getElementById("startTime").value - Math.floor(document.getElementById("startTime").value / 60) * 60)} seconds`;
}

function endChange() {
    killsFiltered.clearLayers();
    killsFiltered.addData(killsJSON);
    updateColours();

    var e = document.getElementById("displaySelect");
    var display = e.options[e.selectedIndex].text;

    if (display == "Heatmap") {
        killsHeatmap.setLatLngs(jsonToHeat());
    }

    if (parseInt(document.getElementById("endTime").value) <= parseInt(document.getElementById("startTime").value)) {
        document.getElementById("endTime").value = parseInt(document.getElementById("startTime").value) + 1;
    }
    document.getElementById("endTimeLabel").innerHTML = `${Math.floor(document.getElementById("endTime").value / 60)} minutes ${Math.round(document.getElementById("endTime").value - Math.floor(document.getElementById("endTime").value / 60) * 60)} seconds`;
}

function hideLabelChange() {
    if (document.getElementById("hideLabelBox").checked) {
        map.removeLayer(orderMarker);
        map.removeLayer(chaosMarker);
    }
    else {
        map.addLayer(orderMarker);
        map.addLayer(chaosMarker);
    }
}

function updateColours() {

    if (document.getElementById("flipBox").checked == false) {
        killsFiltered.eachLayer(function(layer) {
            if (layer.feature.properties.SourceTeam == baseLabels[0]) {
                layer.setStyle({fillColor: document.getElementById("team1Colour").value});
            }
            else if (layer.feature.properties.SourceTeam == baseLabels[1]) {
                layer.setStyle({fillColor: document.getElementById("team2Colour").value});
            }
        });
    }
    else {
        killsFiltered.eachLayer(function(layer) {
            if (layer.feature.properties.SourceTeam == baseLabels[0]) {
                layer.setStyle({fillColor: document.getElementById("team2Colour").value});
            }
            else if (layer.feature.properties.SourceTeam == baseLabels[1]) {
                layer.setStyle({fillColor: document.getElementById("team1Colour").value});
            }
        });
    }



}
updateColours();

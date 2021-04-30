var mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGZpZWxkMjMiLCJhIjoiY2p4NThuaGYxMDB3bDQ4cXd0eWJiOGJoeSJ9.T94xCeDwJ268CmzfMPXdmw';
// map tiles and token //
var Dark_Grey_Base = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'});

var Light_Grey_Base = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'});

// initialize layers (wells, census tracts, nitrate IDW, joined cancer rates, regression)//
var wellPointsLayerGroup = L.layerGroup(),
    censusTractsLayerGroup = L.layerGroup(),
    nitrateRatesIDWLayerGroup = L.layerGroup(),
    joinedCancerNitrateRatesIDWLayerGroup = L.layerGroup(),
    regressionResidualsLayerGroup = L.layerGroup();

// initialize variables for layers  //
var censusTracts,
    wellPoints,
    nitrateRateHexbins,
    collectedFeaturesHexbins,
    regressionFeaturesHexbins;

// arrays to store nitrate wells, census tracts, interpolated nitrate and cancer, predicted/observed cancer rates
var wellPointsArray = [],
    censusTractsArray = [],
    interpolatedNitrateRatesArray = [],
    interpolatedNitratesCancerRatesArray = [],
    observedNitratesCancerRatesArray = [];

// global variables for turf.js //
var censusTractsCentroidTurf,
    wellPointsFeatureCollection,
    nitrateRateHexbinsTurf,
    cancerRatesGridPointsTurf,
    collectedFeaturesHexbinsTurf;

// global variables for layer list/overlays //
var layerList,
    overlays;

// default value for k factor/hexbin size variables //
var distanceDecayCoefficient = 1,
    hexbinArea = 10; // 10 sq km

// Set the basemap //
var baseMaps = {
    "Dark Grey": Dark_Grey_Base,
    "Light Grey": Light_Grey_Base
};

// overlay layers for layer list
var overlays = {
    "Wells": wellPointsLayerGroup,
    "Census Tracts": censusTractsLayerGroup,
};

// map options (lat/lon of map center, zoom extents, layers for layer control, etc) //
var mapOptions = {
    center: [44.437778, -90.130186],
    zoom: 6.5,
    minZoom: 5,
    maxZoom: 17,
    maxBounds: L.latLngBounds([41, -82], [49, -101]),
    bounceAtZoomLimits: true,
    layers: [Dark_Grey_Base, wellPointsLayerGroup, censusTractsLayerGroup, nitrateRatesIDWLayerGroup, joinedCancerNitrateRatesIDWLayerGroup, regressionResidualsLayerGroup]
};

// creates map //
var map = L.map('map', mapOptions);

// add basemap //
map.addLayer(Dark_Grey_Base);
//map.addLayer(Light_Grey_Base);

// zoom control for map //
map.zoomControl.setPosition('topleft');

// listener for user input //
userInputs();

// layer list for leaflet //
buildLayerList(overlays);

// leaflet controls //
// source: https://github.com/nickpeihl/leaflet-sidebar-v2 //
var sidebar = L.control.sidebar({
    autopan: true,
    closeButton: false,
    container: 'sidebar',
    position: 'left',
}).addTo(map);

// sidebar home //
sidebar.open('home');

// Hide the regression equation and r-squared labels in the sidebar
$('#regressionEquationLabel').hide();
$('#rSqLabel').hide();

// Leaflet easyPrint plugin //(user can print A4 in portrait or landscape) //
// Source: https://github.com/rowanwins/leaflet-easyPrint //
var easyPrint= L.easyPrint({
    title: 'Print Map (collapse side panel before printing)',
    position: 'bottomleft',
    sizeModes: ['A4Landscape','A4Portrait'],
    hideClasses: ['#sidebar'],
    addClasses: ['legend'],
}).addTo(map);

// JQuery getJSON() used to load cancer rates and census tracts
$.getJSON("data/cancer_tracts.json", function (data) {

    // creates GeoJson layer for census tracts
    censusTracts = L.geoJson(data, {

        // symbology fill and stroke for census tracts
        style: function (feature) {
            return {
                color: '#FFFFFF', // set stroke color
                weight: 0.25, // set stroke weight
                fillOpacity: .80, // override the default fill opacity
                opacity: 1 // border opacity
            };
        }

    }).addTo(censusTractsLayerGroup);

    // draw census tracts
    drawCensusTracts();

});

// JQuery getJSON() to load wells and nitrate concentrations from file
$.getJSON("data/well_nitrate.json", function (data) {

    // creates Leaflet GeoJson layer for wells
    wellPoints = L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                fillColor: '#3d3d3d',
                fillOpacity: 1,
                color: '#FFFFFF',
                weight: 0.25,
                opacity: 1,
                radius: 4
            });
        }

    }).addTo(wellPointsLayerGroup);

    // draw wells locations
    drawWellPoints();

});


// Draw census tracts, symbolized by cancer rate
// Get the class breaks based on the ckmeans classification method (https://simplestatistics.org/docs/#ckmeans)
// Loop through each tract and:
// 1. Set its color based on which cluster its cancer rate falls into
// 2. Build and bind its popup
// 3. Draw the legend
// 4. Move it to the back of the layer order
function drawCensusTracts() {

    // Get the class breaks based on the ckmeans classification method
    var breaks = getCancerRateClassBreaks(censusTracts);

    // Loop through each feature, set its symbology, and build and bind its popup
    censusTracts.eachLayer(function (layer) {

        // Set its color based on the cancer rate
        layer.setStyle({
            fillColor: getCancerRateColor(layer.feature.properties.canrate, breaks)
        });

        // Build the popup for the census tract
        var popup = "<b>Cancer rate: </b>" + (layer.feature.properties.canrate * 100).toLocaleString() + "%";

        // Bind the popup to the tract
        layer.bindPopup(popup);

    });

    // draw legend for census tract cancer rates, move tracts to back
    drawCancerRatesLegend(breaks);
    censusTracts.bringToBack();

}

// simple satistics "ck means" defines classification breaks (https://simplestatistics.org/docs/#ckmeans)
function getCancerRateClassBreaks(cancerRateDataSource) {

    // empty array to store values for cancer rates
    var values = [];
    cancerRateDataSource.eachLayer(function (layer) {
        var value = layer.feature.properties.canrate;
        values.push(value);
    });

    // 5 groups of statistically similar value ranges, using ckmeans
    var clusters = ss.ckmeans(values, 5);

    // array of highest and lowest values in each value range
    var breaks = clusters.map(function (cluster) {
        return [cluster[0], cluster.pop()];
    });

    return breaks;

}

// cancer color symbology fills based on value ranges
function getCancerRateColor(d, breaks) {

    // If the data value <= the upper value of the first cluster
    if (d <= breaks[0][1]) {
        return '#f0f9e8';

        // If the data value <= the upper value of the second cluster
    } else if (d <= breaks[1][1]) {
        return '#bae4bc';

        // If the data value <= the upper value of the third cluster
    } else if (d <= breaks[2][1]) {
        return '#7bccc4';

        // If the data value <= the upper value of the fourth cluster
    } else if (d <= breaks[3][1]) {
        return '#43a2ca';

        // If the data value <= the upper value of the fifth cluster
    } else if (d <= breaks[4][1]) {
        return '#045a8d';

    }
}

// cancer rates legend (by census tract) //
function drawCancerRatesLegend(breaks) {

    //  new Leaflet control
    var legend = L.control({
        position: 'bottomright'
    });

    legend.onAdd = function () {

        // Create a new HTML <div> element and give it a class name of "legend"
        var div = L.DomUtil.create('div', 'legend');
        div.innerHTML = "<h3><b>Cancer rate</b></h3>"+"<h4><i>percent of population</i></h4>";

        // For each of our breaks
        for (var i = 0; i < breaks.length; i++) {

            // Determine the color associated with each break value, including the lower range value
            var color = getCancerRateColor(breaks[i][0], breaks);

            // Concatenate a <span> tag styled with the color and the range values of that class and include a label with the low and high ends of that class range
            div.innerHTML +=
                '<span style="background:' + color + '"></span> ' +
                '<label>' + parseFloat(breaks[i][0] * 100).toFixed(2).toLocaleString() + '% &mdash; ' +
                parseFloat(breaks[i][1] * 100).toFixed(2).toLocaleString() + '%</label>';
        }

        // Return the populated legend div to be added to the map
        return div;

    }; // end onAdd method

    // Add the legend to the map
    legend.addTo(map);

} // end drawCancerRatesLegend()


// Draw well points, symbolized by nitrate concentration
// Get the class breaks based on the ckmeans classification method (https://simplestatistics.org/docs/#ckmeans)
// Loop through each well and:
// 1. Set its color based on which cluster its nitrate concentration falls into
// 2. Build and bind its popup
// 3. Draw the legend
function drawWellPoints() {

    // Get the class breaks based on the ckmeans classification method
    var breaks = getNitrateRateClassBreaks(wellPoints);

    // Loop through each feature, set its symbology, and build and bind its popup
    wellPoints.eachLayer(function (layer) {

        // Set its color based on the nitrate concentration
        layer.setStyle({
            fillColor: getNitrateRatesColors(layer.feature.properties.nitr_ran, breaks)
        });

        // Build the popup for the well point
        var popup = "<b>Nitrate concentration: </b>" + layer.feature.properties.nitr_ran.toFixed(2) + " ppm";

        // Bind the popup to the well point
        layer.bindPopup(popup);

    });

    // Draw the legend for the well points
    drawNitrateRatesLegend(breaks);

} // end drawWellPoints()


// Establish classification breaks for nitrate concentrations using the ckmeans classification method (https://simplestatistics.org/docs/#ckmeans)
function getNitrateRateClassBreaks(nitrateRatesDataSource) {

    // Create an empty array to store the nitrate concentrations
    var values = [];

    // Loop through each feature to get its nitrate concentration
    nitrateRatesDataSource.eachLayer(function (layer) {
        var value = layer.feature.properties.nitr_ran;

        // Push each nitrate concentration into the array
        values.push(value);
    });

    // Determine 5 clusters of statistically similar values, sorted in ascending order
    var clusters = ss.ckmeans(values, 5);

    // Create a 2-dimensional array of the break points (lowest and highest values) in each cluster. The lowest value in each cluster is cluster[0]; the highest value is cluster.pop().
    var breaks = clusters.map(function (cluster) {
        return [cluster[0], cluster.pop()];
    });

    // Return the array of class breaks
    return breaks;

} // end getNitrateRateClassBreaks()


// Set the color of the features depending on which cluster the value falls in
function getNitrateRatesColors(d, breaks) {

    // If the data value <= the upper value of the first cluster
    if (d <= breaks[0][1]) {
        return '#fef0d9';

        // If the data value <= the upper value of the second cluster
    } else if (d <= breaks[1][1]) {
        return '#fdcc8a';

        // If the data value <= the upper value of the third cluster
    } else if (d <= breaks[2][1]) {
        return '#fc8d59';

        // If the data value <= the upper value of the fourth cluster
    } else if (d <= breaks[3][1]) {
        return '#e34a33';

        // If the data value <= the upper value of the fifth cluster
    } else if (d <= breaks[4][1]) {
        return '#b30000';

    }
}


// nitrate concentration legend; style based on previous value ranges; add to map
function drawNitrateRatesLegend(breaks) {
    var legend = L.control({
        position: 'bottomright'
    });

    legend.onAdd = function () {

        var div = L.DomUtil.create('div', 'legend');

        div.innerHTML = "<h3><b><p>Nitrate Concentration<p></b></h3>"+"<h4><i><p>Parts per million (ppm)<p></i></h4>";

        for (var i = 0; i < breaks.length; i++) {

            var color = getNitrateRatesColors(breaks[i][0], breaks);

            div.innerHTML +=
                '<span style="background:' + color + '"></span> ' +
                '<label>' + parseFloat(breaks[i][0]).toFixed(2).toLocaleString() + ' &mdash; ' +
                parseFloat(breaks[i][1]).toFixed(2).toLocaleString() + ' ppm' + '</label>';

        }

        return div;

    }; // end onAdd method

    // Add the legend to the map
    legend.addTo(map);

}

// Build the layer list control and add it to the map
function buildLayerList(overlays) {

    // add layer controls to the map (layer draw ordering, basemaps)
    layerList = L.control.layers(baseMaps, overlays, {
        collapsed: false,
        autoZIndex: true,
        hideSingleBase: false
    }).addTo(map);

}

// When the user clicks Submit or Reset
// If Submit is clicked, get the distance decay coefficient and hexbin size and redraw the map with the interpolated nitrate concentrations, cancer rates, and regression residuals
// If Reset is clicked, redraw the map with the original well points and census tracts
function userInputs() {

    // Select the submit button
    var submit = $('#submitButton');

    // When the user clicks submit
    submit.on('click', function (e) {

        console.log("Processing...");

        // Call the submitParameters() function to get the distance decay coefficient and hexbin size and redraw the map with the interpolated nitrate concentrations, cancer rates, and regression residuals
        submitParameters();

    });

    // Select the reset button
    var reset = $('#resetButton');

    // When the user clicks reset
    reset.on('click', function (e) {

        console.log("Resetting...");

        // Call the resetParameters() function to redraw the map with the original well points and census tracts
        resetParameters();

        // Hide the regression equation and r-squared labels and values in the sidebar
        $('#regressionEquationLabel').hide();
        $('#regressionEquation').hide();
        $('#rSqLabel').hide();
        $('#rSquared').hide();

    });

}

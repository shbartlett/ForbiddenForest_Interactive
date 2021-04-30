//Basemap tiles
var basemap = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
    });

var baseMaps = {
    "Default": basemap
}

// Initialize layers in global scope, to include them in the layer list
var wellPointsLayerGroup = L.layerGroup(),
    censusTractsLayerGroup = L.layerGroup(),
    nitrateRatesIDWLayerGroup = L.layerGroup(),
    joinedCancerNitrateRatesIDWLayerGroup = L.layerGroup(),
    regressionResidualsLayerGroup = L.layerGroup();


// Initialize global variables for data layers
var censusTracts,
    wellPoints,
    nitrateRatesHexbins,
    collectedFeaturesHexbins,
    regressionFeaturesHexbins;


// Initialize global variables for the distance decay coefficient and hexbin size with default values
var distanceDecayCoefficient = 2,
    hexbinArea = 10; // 10 sq km


// Initialize arrays to store the well points, census tracts, interpolated nitrate concentrations, interpolated cancer rates, and predicted and observed cancer rates
var wellPointsArray = [],
    censusTractsArray = [],
    interpolatedNitrateRatesArray = [],
    interpolatedNitrateAndCancerRatesArray = [],
    observedNitrateAndCancerRatesArray = [];


// Initialize global variables for the Turf.js feature collections
var censusTractCentroidsTurf,
    wellPointsFeatureCollection,
    nitrateRatesHexbinsTurf,
    cancerRatesGridPointsTurf,
    collectedFeaturesHexbinsTurf;


// Initialize global variables for the layer list and overlays
var layerList,
    overlays;


// Set the overlays to include in the layer list
var overlays = {
    "Well Points": wellPointsLayerGroup,
    "Census Tracts": censusTractsLayerGroup,
};

// Set the map options
var mapOptions = {
    center: [43.375, -90.125], // centered in central Wisconsin
    zoom: 7,
    minZoom: 5,
    maxZoom: 12,
    maxBounds: L.latLngBounds([40.15, -87.56], [48.45, -94.21]), // panning bounds so the user doesn't pan too far away from Wisconsin
    bounceAtZoomLimits: true, // Set it to false if you don't want the map to zoom beyond min/max zoom and then bounce back when pinch-zooming
    layers: [basemap, wellPointsLayerGroup, censusTractsLayerGroup, nitrateRatesIDWLayerGroup, joinedCancerNitrateRatesIDWLayerGroup, regressionResidualsLayerGroup] // Set the layers to build into the layer control
};


var map = L.map('map', mapOptions);


map.zoomControl.setPosition('topleft');

map.addLayer(basemap);

getUIActions();


buildLayerList(overlays);


$('#regressionEquationLabel').hide();
$('#rSquaredLabel').hide();


// Use JQuery's getJSON() method to load the census tract and cancer rate data asynchronously
$.getJSON("data/tracts.geojson", function (data) {

    censusTracts = L.geoJson(data, {
        style: function (feature) {
            return {
                color: '#585858', // set stroke color
                weight: 0.25, // set stroke weight
                fillOpacity: 0.5, // override the default fill opacity
                opacity: 1 // border opacity
            };
        }

    }).addTo(censusTractsLayerGroup);

    // Draw the census tracts
    drawCensusTracts();

});


// Use JQuery's getJSON() method to load the well point and nitrate concentration data asynchronously
$.getJSON("data/wells.geojson", function (data) {

    // Create a Leaflet GeoJson layer for the well points and add it to the well points layer group
    wellPoints = L.geoJson(data, {

        // Create a style for the well points
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                fillColor: '#3d3d3d',
                fillOpacity: 1,
                color: '#3d3d3d',
                weight: 0.25,
                opacity: 1,
                radius: 2.5
            });
        }

    }).addTo(wellPointsLayerGroup);

    // Draw the well points
    drawWellPoints();

});


//Draw the census tracts, color classifications, and add to the map at the back.
function drawCensusTracts() {

    // Get the class breaks based on the ckmeans classification method
    var breaks = getCancerRateClassBreaks(censusTracts);

    // Loop through each feature, set its symbology, and build and bind its popup
    censusTracts.eachLayer(function (layer) {

        // Set its color based on the cancer rate
        layer.setStyle({
            fillColor: getCancerRateColor(layer.feature.properties.canrate, breaks),
            fillOpacity: 0.45
        });
        var popup = "<b>Cancer Rate: </b>" + (layer.feature.properties.canrate * 100).toLocaleString() + "%";
        layer.bindPopup(popup);
    });
    drawCancerRatesLegend(breaks);
    censusTracts.bringToBack();
}


// Establish classification breaks for cancer rates using the ckmeans classification method (https://simplestatistics.org/docs/#ckmeans)
function getCancerRateClassBreaks(cancerRatesDataSource) {

   var values = [];

   cancerRatesDataSource.eachLayer(function (layer) {
        var value = layer.feature.properties.canrate;

        // Push each cancer rate into the array
        values.push(value);
    });

    var clusters = ss.ckmeans(values, 5);

    var breaks = clusters.map(function (cluster) {
        return [cluster[0], cluster.pop()];
    });

    return breaks;

} // end getCancerRateClassBreaks()


// Set the color of the features depending on which cluster the value falls in
function getCancerRateColor(d, breaks) {

    if (d <= breaks[0][1]) {
        return '#F9F3FE';

    } else if (d <= breaks[1][1]) {
        return '#C99CF6';

    } else if (d <= breaks[2][1]) {
        return '#A960F3';

    } else if (d <= breaks[3][1]) {
        return '#8D28F3';

    } else if (d <= breaks[4][1]) {
        return '#7902F1';

    }
} // end getCancerRateColor()


// Create the legend for cancer rates by census tract
function drawCancerRatesLegend(breaks) {

    var legend = L.control({
        position: 'bottomleft'
    });

    legend.onAdd = function () {

        var div = L.DomUtil.create('div', 'legend');

        div.innerHTML = "<h3><b>Cancer Rate</b></h3>";

        for (var i = 0; i < breaks.length; i++) {

            var color = getCancerRateColor(breaks[i][0], breaks);

            div.innerHTML +=
                '<span style="background:' + color + '"></span> ' +
                '<label>' + parseFloat(breaks[i][0] * 100).toFixed(2).toLocaleString() + '% &mdash; ' +
                parseFloat(breaks[i][1] * 100).toFixed(2).toLocaleString() + '%</label><br/>';

        }
    return div;
    }
    legend.addTo(map);

    //Code to remove legends on layerRemove; add legends on layerAdd

    map.on('overlayadd', function(eventLayer){
        if (eventLayer.name === 'Census Tracts'){
            map.addControl(legend);
        }
    });

    map.on('overlayremove', function(eventLayer){
        if (eventLayer.name === 'Census Tracts'){
            map.removeControl(legend);
        }
    });
}


// Draw well points, symbolized by nitrate concentration
function drawWellPoints() {
    var breaks = getNitrateRateClassBreaks(wellPoints);

    wellPoints.eachLayer(function (layer) {
        layer.setStyle({
            fillColor: getNitrateRateColor(layer.feature.properties.nitr_con, breaks)
        });

        var popup = "<b>Nitrate Concentration: </b>" + layer.feature.properties.nitr_con.toFixed(2) + " ppm";
        layer.bindPopup(popup);
    });

    drawNitrateRatesLegend(breaks);
}


// Establish classification breaks for nitrate concentrations using the ckmeans classification method (https://simplestatistics.org/docs/#ckmeans)
function getNitrateRateClassBreaks(nitrateRatesDataSource) {

    // Create an empty array to store the nitrate concentrations
    var values = [];

    // Loop through each feature to get its nitrate concentration
    nitrateRatesDataSource.eachLayer(function (layer) {
        var value = layer.feature.properties.nitr_con;

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
function getNitrateRateColor(d, breaks) {

    // If the data value <= the upper value of the first cluster
    if (d <= breaks[0][1]) {
        return '#557EBE';

        // If the data value <= the upper value of the second cluster
    } else if (d <= breaks[1][1]) {
        return '#3363AE';

        // If the data value <= the upper value of the third cluster
    } else if (d <= breaks[2][1]) {
        return '#104BA9';

        // If the data value <= the upper value of the fourth cluster
    } else if (d <= breaks[3][1]) {
        return '#0B3982';

        // If the data value <= the upper value of the fifth cluster
    } else if (d <= breaks[4][1]) {
        return '#072C66';

    }
} // end getNitrateRateColor()


// Create the legend for nitrate concentrations
function drawNitrateRatesLegend(breaks) {

    // Create a new Leaflet control object, and position it bottom right
    var legend = L.control({
        position: 'bottomleft'
    });

    // When the legend is added to the map
    legend.onAdd = function () {

        // Create a new HTML <div> element and give it a class name of "legend"
        var div = L.DomUtil.create('div', 'legend');

        // First append an <h3> heading tag to the div holding the current attribute
        div.innerHTML = "<h3><b>Nitrate Concentration</b></h3>";

        // For each of our breaks
        for (var i = 0; i < breaks.length; i++) {

            // Determine the color associated with each break value, including the lower range value
            var color = getNitrateRateColor(breaks[i][0], breaks);

            // Concatenate a <span> tag styled with the color and the range values of that class and include a label with the low and high ends of that class range
            div.innerHTML +=
                '<span style="background:' + color + '"></span> ' +
                '<label>' + parseFloat(breaks[i][0]).toFixed(2).toLocaleString() + ' &mdash; ' +
                parseFloat(breaks[i][1]).toFixed(2).toLocaleString() + ' ppm' + '</label><br/>';

        }

        // Return the populated legend div to be added to the map
        return div;

    }; // end onAdd method

    // Add the legend to the map
    legend.addTo(map);

    //Code to remove legends on layerRemove; add legends on layerAdd

    map.on('overlayadd', function(eventLayer){
        if (eventLayer.name === 'Well Points'){
            map.addControl(legend);
        }
    });

    map.on('overlayremove', function(eventLayer){
        if (eventLayer.name === 'Well Points'){
            map.removeControl(legend);
        }
    });

} // end drawNitrateRatesLegend()


// Build the layer list control and add it to the map
function buildLayerList(overlays) {

    // Add the layer control to the map
    layerList = L.control.layers(baseMaps, overlays, {
        collapsed: false, // Keep the layer list open
        autoZIndex: true, // Assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off
        hideSingleBase: true // Hide the base layers section when there is only one layer
    }).addTo(map);

} // end buildLayerList()


// When the user clicks Submit or Reset
function getUIActions() {

    var submit = $('#submitButton');

    submit.on('click', function (e) {

        console.log("Spatial analysis processing...");
        submitParameters();
    });

    var reset = $('#resetButton');

    reset.on('click', function (e) {

        console.log("Restoring Defaults");

        resetParameters();

        $('#regressionEquationLabel').hide();
        $('#regressionEquation').hide();
        $('#rSquaredLabel').hide();
        $('#rSquared').hide();

    });

}
// Get the distance decay coefficient and hexbin size
function submitParameters() {

    // Remove the current layers from the map

    if (wellPoints !== undefined) {
        wellPoints.remove();
    }

    if (censusTracts !== undefined) {
        censusTracts.remove();
    }

    if (nitrateRatesHexbins !== undefined) {
        nitrateRatesHexbins.remove();
    }

    if (collectedFeaturesHexbins !== undefined) {
        collectedFeaturesHexbins.remove();
    }

    if (regressionFeaturesHexbins !== undefined) {
        regressionFeaturesHexbins.remove();
    }

    distanceDecayCoefficient = $('#distanceDecayCoefficient').val();
    distanceDecayCoefficient = parseFloat(distanceDecayCoefficient);

    hexbinArea = $('#hexbinArea').val();
    hexbinArea = parseFloat(hexbinArea);

    if (isNaN(hexbinArea) || hexbinArea < 3 || hexbinArea > 45) { //Error checking hexbinArea as sq miles
        window.alert("Enter a hexbin size between 6 and 90");
        $('#hexbinArea').val(10);
        resetParameters();
        return;

    } else if (isNaN(distanceDecayCoefficient) || distanceDecayCoefficient < 0 || distanceDecayCoefficient > 100) { //error checking k-value
        window.alert("Enter a distance decay coefficient between 0 and 100");
        $('#distanceDecayCoefficient').val(2);
        resetParameters();
        return;
    }

    console.log("Distance Decay Coefficient: " + distanceDecayCoefficient);
    console.log("Hexbin Area: " + hexbinArea);

    $('.legend').hide();

    layerList.remove();

    overlays = {
        "Nitrate Concentrations": nitrateRatesIDWLayerGroup,
        "Cancer Rates": joinedCancerNitrateRatesIDWLayerGroup,
        "Regression Residuals": regressionResidualsLayerGroup
    };

    buildLayerList(overlays);

    interpolateNitrateRates(distanceDecayCoefficient, hexbinArea);

    joinCancerRatesToNitrateInterpolation(distanceDecayCoefficient, hexbinArea);

}

// Redraw the map, layer list, and legend with the original well points and census tracts
function resetParameters() {

    $('.legend').hide();


    if (wellPoints !== undefined) {
        wellPoints.remove();
    }

    if (censusTracts !== undefined) {
        censusTracts.remove();
    }

    if (nitrateRatesHexbins !== undefined) {
        nitrateRatesHexbins.remove();
    }

    if (collectedFeaturesHexbins !== undefined) {
        collectedFeaturesHexbins.remove();
    }

    if (regressionFeaturesHexbins !== undefined) {
        regressionFeaturesHexbins.remove();
    }

    censusTracts.addTo(map);
    wellPoints.addTo(map);

    drawWellPoints();

    drawCensusTracts();

    layerList.remove();

    overlays = {
        "Well Points": wellPointsLayerGroup,
        "Census Tracts": censusTractsLayerGroup
    };

    censusTracts.bringToBack();

    buildLayerList(overlays);
}


// Build a Turf feature collection from the well points
function interpolateNitrateRates(distanceDecayCoefficient, hexbinArea) {

    if (nitrateRatesIDWLayerGroup !== undefined) {
        nitrateRatesIDWLayerGroup.clearLayers();
    }

    wellPoints.eachLayer(function (layer) {
        var props = layer.feature.properties;
        var coordinates = layer.feature.geometry.coordinates;

        wellPointsFeature = turf.point(coordinates, props);

        wellPointsArray.push(wellPointsFeature);

    });

    // Create a Turf feature collection from the array of well point features
    wellPointsFeatureCollection = turf.featureCollection(wellPointsArray);


    var options = {
        gridType: 'hex', // use hexbins as the grid type
        property: 'nitr_con', // interpolate values from the nitrate concentrations
        units: 'miles', // hexbin size units
        weight: distanceDecayCoefficient // distance decay coefficient, q
    };

    nitrateRatesHexbinsTurf = turf.interpolate(wellPointsFeatureCollection, hexbinArea, options);

    for (var hexbin in nitrateRatesHexbinsTurf.features) {
        var interpolatedNitrateRate = nitrateRatesHexbinsTurf.features[hexbin].properties.nitr_con;
        interpolatedNitrateRatesArray.push(interpolatedNitrateRate);
    }

    nitrateRatesHexbins = L.geoJson(nitrateRatesHexbinsTurf, {

        style: function (feature) {
            return {
                color: '#585858', // Stroke Color
                weight: 0.5, // Stroke Weight
                fillOpacity: 0.6, // Override the default fill opacity
                opacity: 0.5 // Border opacity
            };
        }

    }).addTo(nitrateRatesIDWLayerGroup);

    var breaks = getNitrateRateClassBreaks(nitrateRatesHexbins);

    nitrateRatesHexbins.eachLayer(function (layer) {

        layer.setStyle({
            fillColor: getNitrateRateColor(layer.feature.properties.nitr_con, breaks)
        });

        var popup = "<b>Nitrate Concentration: </b>" + layer.feature.properties.nitr_con.toFixed(2) + " ppm";

        layer.bindPopup(popup);

    });

    nitrateRatesHexbins.bringToFront();

    drawNitrateRatesHexbinsLegend(breaks);

} // end interpolateNitrateRates()

function drawNitrateRatesHexbinsLegend(breaks) {

    // Create a new Leaflet control object, and position it bottom right
    var legend = L.control({
        position: 'bottomleft'
    });

    // When the legend is added to the map
    legend.onAdd = function () {

        // Create a new HTML <div> element and give it a class name of "legend"
        var div = L.DomUtil.create('div', 'legend');

        // First append an <h3> heading tag to the div holding the current attribute
        div.innerHTML = "<h3><b>Nitrate Concentration</b></h3>";

        // For each of our breaks
        for (var i = 0; i < breaks.length; i++) {

            // Determine the color associated with each break value, including the lower range value
            var color = getNitrateRateColor(breaks[i][0], breaks);

            // Concatenate a <span> tag styled with the color and the range values of that class and include a label with the low and high ends of that class range
            div.innerHTML +=
                '<span style="background:' + color + '"></span> ' +
                '<label>' + parseFloat(breaks[i][0]).toFixed(2).toLocaleString() + ' &mdash; ' +
                parseFloat(breaks[i][1]).toFixed(2).toLocaleString() + ' ppm' + '</label><br/>';

        }

        // Return the populated legend div to be added to the map
        return div;

    }; // end onAdd method

    // Add the legend to the map
    legend.addTo(map);

    //Code to remove legends on layerRemove; add legends on layerAdd

    map.on('overlayadd', function(eventLayer){
        if (eventLayer.name === 'Nitrate Concentrations'){
            map.addControl(legend);
        }
    });

    map.on('overlayremove', function(eventLayer){
        if (eventLayer.name === 'Nitrate Concentrations'){
            map.removeControl(legend);
        }
    });

} // end drawNitrateRatesLegend()


// Build a Turf feature collection from census tract centroids
function joinCancerRatesToNitrateInterpolation(distanceDecayCoefficient, hexbinArea) {

    if (joinedCancerNitrateRatesIDWLayerGroup !== undefined) {
        joinedCancerNitrateRatesIDWLayerGroup.clearLayers();
    }

    censusTracts.eachLayer(function (layer) {

        var props = layer.feature.properties;
        var coordinates = layer.feature.geometry.coordinates;

        censusTractsFeature = turf.polygon(coordinates, props);

        var censusTractsCentroidFeature = turf.centroid(censusTractsFeature, props);

        censusTractsArray.push(censusTractsCentroidFeature);

    });

    censusTractCentroidsTurf = turf.featureCollection(censusTractsArray);

    var gridOptions = {
        gridType: 'point', // use points as the grid type, required to use the collect function
        property: 'canrate', // interpolate values from the cancer rates
        units: 'miles', // hexbin size units
        weight: distanceDecayCoefficient // distance decay coefficient, q
    };

    cancerRatesGridPointsTurf = turf.interpolate(censusTractCentroidsTurf, hexbinArea, gridOptions);

    collectedFeaturesHexbinsTurf = turf.collect(nitrateRatesHexbinsTurf, cancerRatesGridPointsTurf, 'canrate', 'values');

    for (var i in collectedFeaturesHexbinsTurf.features) {

        var canrateArray = collectedFeaturesHexbinsTurf.features[i].properties.values;

        var canrateArraySum = 0;
        for (var j in canrateArray) {

            if (canrateArray.length > 0) {
                canrateArraySum += parseFloat(canrateArray[j]);
            }

        }

        var canrateArrayAvg = canrateArraySum / canrateArray.length;

        if (canrateArrayAvg !== undefined) {
            collectedFeaturesHexbinsTurf.features[i].properties.canrate = canrateArrayAvg;
        } else {
            collectedFeaturesHexbinsTurf.features[i].properties.canrate = "";
        }

    }

    collectedFeaturesHexbins = L.geoJson(collectedFeaturesHexbinsTurf, {

        style: function (feature) {
            return {
                color: '#585858', // Stroke Color
                weight: 0.5, // Stroke Weight
                fillOpacity: 0.6, // Override the default fill opacity
                opacity: 0.5 // Border opacity
            };
        }

    }).addTo(joinedCancerNitrateRatesIDWLayerGroup);

    var breaks = getCancerRateClassBreaks(collectedFeaturesHexbins);

    collectedFeaturesHexbins.eachLayer(function (layer) {

        layer.setStyle({
            fillColor: getCancerRateColor(layer.feature.properties.canrate, breaks)
        });

        var popup = "<b>Cancer Rate: </b>" + (layer.feature.properties.canrate * 100).toFixed(2).toLocaleString() + "% of census tract population";

        layer.bindPopup(popup);

    });

    collectedFeaturesHexbins.bringToFront();

    drawCancerRatesHexbinsLegend(breaks);

    calculateLinearRegression(collectedFeaturesHexbinsTurf);

} // end joinCancerRatesToNitrateInterpolation()

// Create the legend for cancer rates by census tract
function drawCancerRatesHexbinsLegend(breaks) {

    var legend = L.control({
        position: 'bottomleft'
    });

    legend.onAdd = function () {

        var div = L.DomUtil.create('div', 'legend');

        div.innerHTML = "<h3><b>Cancer Rate</b></h3>";

        for (var i = 0; i < breaks.length; i++) {

            var color = getCancerRateColor(breaks[i][0], breaks);

            div.innerHTML +=
                '<span style="background:' + color + '"></span> ' +
                '<label>' + parseFloat(breaks[i][0] * 100).toFixed(2).toLocaleString() + '% &mdash; ' +
                parseFloat(breaks[i][1] * 100).toFixed(2).toLocaleString() + '%</label><br/>';

        }
    return div;
    }
    legend.addTo(map);

    //Code to remove legends on layerRemove; add legends on layerAdd

    map.on('overlayadd', function(eventLayer){
        if (eventLayer.name === 'Cancer Rates'){
            map.addControl(legend);
        }
    });

    map.on('overlayremove', function(eventLayer){
        if (eventLayer.name === 'Cancer Rates'){
            map.removeControl(legend);
        }
    });
}


// Calculate a linear regression where x is the nitrate concentration and y is the cancer rate
function calculateLinearRegression(collectedFeaturesHexbinsTurf) {

    if (regressionResidualsLayerGroup !== undefined) {
        regressionResidualsLayerGroup.clearLayers();
    }

    // Loop through each of the collected hexbins
    for (var i in collectedFeaturesHexbinsTurf.features) {

        var props = collectedFeaturesHexbinsTurf.features[i].properties;

        var interpolatedNitrateConcentration = props.nitr_con;
        var interpolatedCancerRate = props.canrate;

        var currentNitrateAndCancerRates = [parseFloat(interpolatedNitrateConcentration), parseFloat(interpolatedCancerRate)];

        interpolatedNitrateAndCancerRatesArray.push(currentNitrateAndCancerRates);

    }

    // Run the linearRegression method from the Simple Statistics library to return an object containing the slope and intercept of the linear regression line
    var regressionEquation = ss.linearRegression(interpolatedNitrateAndCancerRatesArray);

    var m = regressionEquation.m;
    var b = regressionEquation.b;

    var regressionEquationFormatted = "y = " + parseFloat(m).toFixed(5) + "x + " + parseFloat(b).toFixed(5);
    console.log("Regression Equation: " + regressionEquationFormatted);

    for (var j in collectedFeaturesHexbinsTurf.features) {

        var collectedFeatureHexbinProps = collectedFeaturesHexbinsTurf.features[j].properties;

        var collectedHexbinInterpolatedNitrateConcentration = collectedFeatureHexbinProps.nitr_con;
        var collectedHexbinInterpolatedCancerRate = collectedFeatureHexbinProps.canrate;

        var predictedCancerRate = m * (parseFloat(collectedHexbinInterpolatedNitrateConcentration)) + b;

        var residual = predictedCancerRate - collectedHexbinInterpolatedCancerRate;

        collectedFeaturesHexbinsTurf.features[j].properties.predictedCancerRate = predictedCancerRate;
        collectedFeaturesHexbinsTurf.features[j].properties.residual = residual;

        var observedNitrateAndCancerRatesPair = [collectedHexbinInterpolatedNitrateConcentration, collectedHexbinInterpolatedCancerRate];

        observedNitrateAndCancerRatesArray.push(observedNitrateAndCancerRatesPair);

    }


    var regressionLine = ss.linearRegressionLine(regressionEquation);

    var rSquared = parseFloat(ss.rSquared(observedNitrateAndCancerRatesArray, regressionLine)).toFixed(5); // 1 is a perfect fit, 0 indicates no correlation
    console.log("r-Squared: " + rSquared);

    $('#regressionEquationLabel').show();
    $('#regressionEquation').show();
    $('#rSquaredLabel').show();
    $('#rSquared').show();

    var regressionEquationDiv = $('#regressionEquation');
    regressionEquationDiv.html(regressionEquationFormatted);

    var rSquaredDiv = $('#rSquared');
    rSquaredDiv.html(rSquared);

    regressionFeaturesHexbins = L.geoJson(collectedFeaturesHexbinsTurf, {

        style: function (feature) {
            return {
                color: '#999999', // Stroke Color
                weight: 0.5, // Stroke Weight
                fillOpacity: 0.5, // Override the default fill opacity
                opacity: 0.5 // Border opacity
            };
        }

    }).addTo(regressionResidualsLayerGroup);

    var breaks = getRegressionResidualClassBreaks(regressionFeaturesHexbins);

    regressionFeaturesHexbins.eachLayer(function (layer) {

        layer.setStyle({
            fillColor: getRegressionResidualColor(layer.feature.properties.residual, breaks)
        });

        if (getRegressionResidualColor(layer.feature.properties.residual, breaks) == '#f7f7f7') {
            layer.setStyle({
                fillOpacity: 0.1
            });
        }

        var popup = "<b>Nitrate Concentration: </b>" + layer.feature.properties.nitr_con.toFixed(2) + " ppm" + "<br/>" +
            "<b>Observed Cancer Rate: </b>" + (layer.feature.properties.canrate * 100).toFixed(2).toLocaleString() + "%" + "<br/>" +
            "<b>Predicted Cancer Rate: </b>" + (layer.feature.properties.predictedCancerRate * 100).toFixed(2).toLocaleString() + "%";

        layer.bindPopup(popup);

    });

    regressionFeaturesHexbins.bringToFront();

    map.removeLayer(nitrateRatesIDWLayerGroup);
    map.removeLayer(joinedCancerNitrateRatesIDWLayerGroup);

    drawRegressionResidualsLegend(breaks);

} // end calculateLinearRegression()


// Establish classification breaks for regression residuals, based on their standard deviation (https://simplestatistics.org/docs/#standarddeviation)
function getRegressionResidualClassBreaks(regressionFeaturesHexbins) {

    var values = [];

    regressionFeaturesHexbins.eachLayer(function (layer) {
        var value = layer.feature.properties.residual;

        values.push(value);
    });

    var standardDeviation = ss.sampleStandardDeviation(values);

    var breaks = [-2 * standardDeviation, -1 * standardDeviation, standardDeviation, 2 * standardDeviation];

    console.log("Standard Deviation of Residuals: " + parseFloat(standardDeviation).toFixed(5));

    return breaks;

} // end getRegressionResidualClassBreaks()


// Set the color of the features depending on which cluster the value falls in
function getRegressionResidualColor(d, breaks) {


    if (d <= breaks[0]) {
        return '#A6611A';

    } else if (d <= breaks[1]) {
        return '#DFC27D';

    } else if (d <= breaks[2]) {
        return '#F5F5F5';

    } else if (d <= breaks[3]) {
        return '#80CDC1';

    } else if (d > breaks[3]) {
        return '#018571';

    }
} // end getRegressionResidualColor()


// Create the legend for regression residuals
function drawRegressionResidualsLegend(breaks) {

    // Create a new Leaflet control object, and position it bottom right
    var legend = L.control({
        position: 'bottomleft'
    });

    // When the legend is added to the map
    legend.onAdd = function () {

        // Create a new HTML <div> element and give it a class name of "legend"
        var div = L.DomUtil.create('div', 'legend');

        // First append an <h3> heading tag to the div holding the current attribute
        div.innerHTML = "<h3><b>Residual Values</b></h3>";

        var colorMoreThanMinus2StdDev = getRegressionResidualColor(breaks[0], breaks);
        var colorMinus2ToMinus1StdDev = getRegressionResidualColor(breaks[1], breaks);
        var colorMinus1To1StdDev = getRegressionResidualColor(breaks[2], breaks);
        var color1To2StdDev = getRegressionResidualColor(breaks[3], breaks);
        var colorMoreThan2StdDev = '#0571b0';

        div.innerHTML +=
            '<span style="background:' + colorMoreThanMinus2StdDev + '"></span> ' +
            '<label>< -2 Std. Dev. (Underprediction)</label><br/>';

        div.innerHTML +=
            '<span style="background:' + colorMinus2ToMinus1StdDev + '"></span> ' +
            '<label>-2 Std. Dev. &mdash; -1 Std. Dev.</label></br/>';

        div.innerHTML +=
            '<span style="background:' + colorMinus1To1StdDev + '"></span> ' +
            '<label>-1 Std. Dev. &mdash; 1 Std. Dev.</label><br/>';

        div.innerHTML +=
            '<span style="background:' + color1To2StdDev + '"></span> ' +
            '<label>1 Std. Dev. &mdash; 2 Std. Dev.</label><br/>';

        div.innerHTML +=
            '<span style="background:' + colorMoreThan2StdDev + '"></span> ' +
            '<label>> 2 Std. Dev. (Overprediction)</label><br/>';

        return div;

    }; // end onAdd method

    // Add the legend to the map
    legend.addTo(map);

        //Code to remove legends on layerRemove; add legends on layerAdd

        map.on('overlayadd', function(eventLayer){
            if (eventLayer.name === 'Regression Residuals'){
                map.addControl(legend);
            }
        });

        map.on('overlayremove', function(eventLayer){
            if (eventLayer.name === 'Regression Residuals'){
                map.removeControl(legend);
            }
        });

} // end drawRegressionResidualsLegend()

function getUIActions() {

    var submit = $('#submitButton');

    submit.on('click', function (e) {

        console.log("Spatial analysis processing...");
        submitParameters();
    });

    var reset = $('#resetButton');

    reset.on('click', function (e) {

        console.log("Restoring Defaults");

        resetParameters();

        $('#regressionEquationLabel').hide();
        $('#regressionEquation').hide();
        $('#rSquaredLabel').hide();
        $('#rSquared').hide();

    });

}

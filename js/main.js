$(document).ready(function() {

const map = L.map('map',{ zoomControl: false }).setView([57.186,-3.58], 11);
map.scrollWheelZoom.enable();

var voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
  maxZoom: 16
});

var antique = L.tileLayer('https://cartocdn_{s}.global.ssl.fastly.net/base-antique/{z}/{x}/{y}.png', {
  maxZoom: 16
});

var mapboxTiles = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic3RlcGhhbmllODIiLCJhIjoiY2tocGRyYmthMDlodzJxbXpla2RpMmIzbyJ9.xIUBarmYhunm9pdpCBfmdg', {
       attribution: '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

mapboxTiles.addTo(map); //initial layer according to initial zoom


map.options.minZoom = 4;
map.options.maxZoom = 16;


// leaflet sidebar controls //
// source: https://github.com/nickpeihl/leaflet-sidebar-v2 //
var sidebar = L.control.sidebar({
    autopan: false,
    closeButton: false,
    container: 'sidebar',
    position: 'left',
}).addTo(map);

// sidebar home //
sidebar.close('home');

L.Control.Watermark = L.Control.extend({
    onAdd: function(map) {
        var img = L.DomUtil.create('img');
        img.src = 'images/HP_GREEN.svg';
        img.style.width = '35px';
        img.style.color = 'green';
        return img;
    },
    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.watermark = function(opts) {
    return new L.Control.Watermark(opts);
}

L.control.watermark({ position: 'bottomright' }).addTo(map);


L.control.scale({
    imperial: false}).addTo(map);


var antique2 = L.tileLayer('https://cartocdn_{s}.global.ssl.fastly.net/base-antique/{z}/{x}/{y}.png');

var mapboxTiles2 = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic3RlcGhhbmllODIiLCJhIjoiY2tocGRyYmthMDlodzJxbXpla2RpMmIzbyJ9.xIUBarmYhunm9pdpCBfmdg', {
       attribution: '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

var rect1 = {color: "#ff1100", weight: 1.5};
var rect2 = {color: "#0000AA", weight: 1, opacity:0, fillOpacity:0};
var littleMap = (mapboxTiles2);
var miniMap = new L.Control.MiniMap(littleMap,{position:'bottomleft',aimingRectOptions : rect1, shadowRectOptions: rect2, toggleDisplay: true, zoomLevelOffset: -5.5, width: 180,
			height: 180},shelter1).addTo(map);

const client = new carto.Client({
  apiKey: 'lWm4IJqqGPfjjnrGPY6rmQ',
  username: 'shbartlett'
});



const surroundingSource = new carto.source.Dataset('landcover_1');
const surroundingStyle = new carto.style.CartoCSS(`
  #area_layer{
    polygon-pattern-file:
    url('https://s3.amazonaws.com/com.cartodb.users-assets.production/production/mamataakella/assets/20170822202613TexturesCom_PaperDecorative0061_1_seamless_S.jpg');
    polygon-pattern-opacity: 0.4;
    polygon-fill:#CCBE9A;
    polygon-opacity: 0.8;
    polygon-comp-op: multiply;
    line-width: 5;
    line-color: fadeout(#fff,85);
    [zoom>=12.25]{line-width: 2.5;}
    [zoom>=12.25]{line-width: 1;}
    [zoom < 12.25]{polygon-opacity: .5;}
    [zoom < 12.25] {polygon-pattern-opacity: .5;}
    [zoom <= 11] {polygon-opacity: 0;}
    [zoom <= 11] {polygon-pattern-opacity: 0;}
    [zoom <= 11] {line-width: 0;}
  }
`);
const surroundingLayer = new carto.layer.Layer(surroundingSource, surroundingStyle);

const landcoverSource = new carto.source.Dataset('landcover');
const landcoverStyle = new carto.style.CartoCSS(`
  #landcover_layer[type="Grass"] {
    polygon-pattern-file:
    url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210417215242grassv2.png);
    polygon-pattern-opacity: 0.3;
    polygon-fill:#6ea92f;
    polygon-opacity: 0.2;
    polygon-comp-op: overlay;
    line-width: 5;
    line-color: fadeout(#fff,85);
    line-offset: -0.9;
    [zoom>=12.25]{line-width: 5;}
    [zoom>=12.25]{line-width: 1;}
    [zoom < 12.25] {polygon-opacity: .2;}
    [zoom < 12.25] {polygon-pattern-opacity: .2;}
    [zoom <= 11] {polygon-opacity: 0;}
    [zoom <= 11] {polygon-pattern-opacity: 0;}
    [zoom <= 11] {line-width: 0;}
  }

  #landcover_layer[type="Agriculture"] {
  polygon-fill: orange;
  line-color: fadeout(#fff,85);
  [zoom>=12.25]{line-width: 2.5;}
  [zoom>=12.25]{line-width: 1;}
  [zoom >= 12.25] {polygon-opacity: .2;}
  [zoom <= 11] {polygon-opacity: 0;}
  [zoom <= 11] {line-width: 0;}
  line-offset: -0.9;
  }

  #landcover_layer[type="Residential Area"] {
  polygon-fill: #826DBA;
  line-color: fadeout(#fff,85);
  [zoom>=12.25]{line-width: 2.5;}
  [zoom>=12.25]{line-width: 1;}
  [zoom >= 12.25] {polygon-opacity: .2;}
  [zoom <= 11] {polygon-opacity: 0;}
  [zoom <= 11] {line-width: 0;}
  line-offset: -0.9;
  }

  #landcover_layer[type="Commercial Area"] {
  polygon-fill: gray;
  line-color: fadeout(#fff,85);
  [zoom>=12.25]{line-width: 2.5;}
  [zoom>=12.25]{line-width: 1;}
  [zoom >= 12.25] {polygon-opacity: .2;}
  [zoom <= 11] {polygon-opacity: 0;}
  [zoom <= 11] {line-width: 0;}
  line-offset: -0.9;
  }

  #landcover_layer[type="Recreation"] {
  polygon-fill: purple;
  line-color: fadeout(#fff,85);
  [zoom>=12.25]{line-width: 2.5;}
  [zoom>=12.25]{line-width: 1;}
  [zoom >= 12.25] {polygon-opacity: .2;}
  [zoom <= 11] {polygon-opacity: 0;}
  [zoom <= 11] {line-width: 0;}
  [zoom < 12] {line-width: 0;}
  }

  #landcover_layer[type="Stream"] {
    polygon-fill: #718c9f;
    polygon-opacity: 1;
    line-width: 5;
    line-cap: round;
    line-join: round;
    line-color: fadeout(#fff,85);
    line-offset: -0.9;
    [zoom>=12]{line-width: 5;}
    [zoom < 12] {polygon-opacity: 0;}
    [zoom < 12] {line-width: 0;}
  }

  #landcover_layer[type="Lake"] {
  polygon-fill: #718c9f;
  polygon-opacity: .7;
  polygon-pattern-file: url('https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210417221546water.jpg');
  polygon-pattern-opacity: 0.1;
  line-width: 5;
  line-cap: round;
  line-join: round;
  line-color: fadeout(#fff,85);
  line-offset: -0.9;
  [zoom>=12]{line-width: 5;}
  [zoom < 12] {line-width: 0;}
  [zoom < 12.25] {polygon-pattern-opacity: .2;}
  [zoom <= 11] {polygon-opacity: 0;}
  [zoom <= 11] {polygon-pattern-opacity: 0;}
  }

  #landcover_layer[type="Forest"] {
  polygon-pattern-file:
  url('https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210417214334forest2.png');
  polygon-pattern-opacity: 0.3;
  polygon-fill:mix(#6ea92f,#CCBE9A,40);
  polygon-opacity: 0.8;
  polygon-comp-op: multiply;
  line-width: 5;
  line-color: fadeout(#CCBE9A,85);
  line-offset: -0.9;
  [zoom>=12]{line-width: 5;}
  [zoom < 12] {polygon-opacity: 0;}
  [zoom < 12] {polygon-pattern-opacity: 0;}
  [zoom < 12] {line-width: 0;}
  }

  #landcover_layer[type="Mountain"] {
  polygon-fill: #CCBE9A;
  polygon-pattern-file: url('https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210417220242rock3.png');
  polygon-pattern-opacity: 0.6;
  polygon-pattern-simplify: 5;
  polygon-opacity: 0.5;
  polygon-comp-op: multiply;
  line-width: 5;
  line-color: fadeout(#CCBE9A,85);
  line-offset: -0.9;
  [zoom>=12]{line-width: 5;}
  [zoom < 12] {polygon-opacity: 0;}
  [zoom < 12] {polygon-pattern-opacity: 0;}
  [zoom < 12] {line-width: 0;}
  }

  #landcover_layer[type="Forest"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Serif Book';
  text-fill: #FFFFFF;
  text-label-position-tolerance: 0;
  text-halo-radius: 1;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: -10;
  text-allow-overlap: true;
  text-placement: point;
  text-placement-type: dummy;
  text-character-spacing: 3;
  text-transform: uppercase;
  text-wrap-width: 200;
  text-wrap-before: true;
  text-line-spacing: 5;
  [zoom<13]{text-size: 11;}
  [zoom>=13]{text-size: 15;}
  [zoom>=15]{text-size: 20;}
  [zoom>=12]{text-opacity: 1;}
  [zoom < 12] {text-opacity: 0;}
  [zoom < 12] {text-halo-radius: 0;}
}

  #landcover_layer[type="Lake"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Serif Italic';
  text-fill: #004881;
  text-label-position-tolerance: 0;
  text-halo-radius: 2;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: -10;
  text-allow-overlap: true;
  text-placement: point;
  text-placement-type: dummy;
  text-character-spacing: 5;
  text-wrap-width: 75;
  text-wrap-before: false;
  text-line-spacing: 10;
  [zoom<13]{text-size: 0;}
  [zoom>=13]{text-size: 15;}
  [zoom>=15]{text-size: 25;}
  [zoom>=12]{text-opacity: 1;}
  [zoom < 12] {text-opacity: 0;}
  [zoom < 12] {text-halo-radius: 0;}
}

#landcover_layer[type="Mountain"]::z1  {
text-name: [name];
text-face-name: 'DejaVu Serif Book';
text-fill: #FFFFFF;
text-label-position-tolerance: 0;
text-halo-radius: 2;
text-halo-fill: fadeout(lighten(#7E9968,12),70);
text-dy: 0;
text-allow-overlap: true;
text-placement: point;
text-placement-type: dummy;
text-character-spacing: 2;
text-transform: uppercase;
text-wrap-width: 100;
text-wrap-before: true;
[zoom<13]{text-size: 11;}
[zoom>=13]{text-size: 15;}
[zoom>=15]{text-size: 20;}
[zoom>=12]{text-opacity: 1;}
[zoom < 12] {text-opacity: 0;}
[zoom < 12] {text-halo-radius: 0;}
}

`);
const landcoverLayer = new carto.layer.Layer(landcoverSource, landcoverStyle);


const transportationSource = new carto.source.Dataset('transportation');
const transportationStyle = new carto.style.CartoCSS(`
  [type='Main Road']{
     ::case {
       line-width: 2.5;
       line-color: gold;
       line-opacity: 1;

       [zoom>=12]{line-width: 2.5;}
       [zoom < 12] {line-opacity: 0;}
       [zoom < 12] {line-width: 0;}
       }

     ::fill{
       line-width: 2;
       line-color: lighten(white,10);
       line-opacity: 0.9;

       [zoom>=12]{line-width: 1.5;}
       [zoom < 12] {line-opacity: 0;}
       [zoom < 12] {line-width: 0;}
     }
   }

   [type='Road']{
     ::case {
       line-width: 1;
       line-color: gold;
       line-opacity: 1;

       [zoom>=12]{line-width: 1;}
       [zoom < 12] {line-opacity: 0;}
       [zoom < 12] {line-width: 0;}
       }

     ::fill{
       line-width: .5;
       line-color: lighten(white,10);
       line-opacity: 0.9;

       [zoom>=12]{line-width: .5;}
       [zoom < 12] {line-opacity: 0;}
       [zoom < 12] {line-width: 0;}
     }
   }

    [type='Railway']{
       ::case {
         line-color: #0D0D0D;
         line-opacity: 0.9;
         line-dasharray: 1,10;

           [zoom<12]{line-width: 0;}
           [zoom>=12]{line-width: 5;}
         }

                ::fill{
                  line-width: .5;
                  line-color: #0D0D0D;
                  line-opacity: 0.9;

                    [zoom<12]{line-width: 0;}
                    [zoom>=12]{line-width: 1;}
                }
              }

  #transportation_layer [type="Tunnel"]{
      line-color: purple;
      line-opacity: 0.8;
      line-cap: round;
      line-join: round;
      line-dasharray: 0.1,6;
      [zoom<13]{line-width: 0;}
      [zoom>=13]{line-width: 3;}
  }

  #transportation_layer [type="Ferry"]{
      line-width: 1.5;
      line-color: #4b63cc;
      line-opacity: 0.8;
      line-cap: butt;
      line-join: round;
      line-dasharray: 5,4;

      [zoom<13]{line-width: 0;}
      [zoom>=13]{line-width: 1.5;}
  }

  #transportation_layer[type="Main Road"]::z1 {
  text-name: [name];
  text-face-name: 'DejaVu Sans Book';
  text-fill: #383838;
  text-label-position-tolerance: 0;
  text-halo-radius: 2;
  text-halo-fill: fadeout(lighten(#CCBE9A,12),70);
  text-dy: -5;
  text-allow-overlap: true;
  text-placement: line;
  text-placement-type: dummy;
  text-spacing: 100;
  text-min-path-length:400;
  [zoom>=15]{text-size: 20;}
  [zoom>=13]{text-opacity: 1;}
  [zoom>=13]{text-size: 12;}
  [zoom < 13] {text-opacity: 0;}
  [zoom < 13] {text-halo-radius: 0;}

}

#transportation_layer[type="Tunnel"]::z1 {
text-name: [name];
text-face-name: 'DejaVu Sans Book';
text-fill: purple;
text-label-position-tolerance: 0;
text-halo-radius: 2;
text-halo-fill: fadeout(lighten(#CCBE9A,12),70);
text-dy: -5;
text-allow-overlap: true;
text-placement: line;
text-placement-type: dummy;
text-spacing: 100;
text-min-path-length:500;
[zoom>=15]{text-size: 16;}
[zoom>=13]{text-opacity: 1;}
[zoom>=13]{text-size: 10;}
[zoom < 13] {text-opacity: 0;}
[zoom < 13] {text-halo-radius: 0;}

}

#transportation_layer[type="Ferry"]::z1  {
text-name: [name];
text-face-name: 'DejaVu Sans Book';
text-fill: #4b63cc;
text-label-position-tolerance: 0;
text-halo-radius: 1;
text-halo-fill: fadeout(lighten(#7E9968,12),70);
text-dy: -5;
text-allow-overlap: true;
text-placement: line;
text-placement-type: dummy;
[zoom>=15]{text-size: 16;}
[zoom>=13]{text-opacity: 1;}
[zoom>=13]{text-size: 12;}
[zoom < 13] {text-opacity: 0;}
[zoom < 13] {text-halo-radius: 0;}
}

#transportation_layer[type="Railway"]::z1  {
text-name: [name];
text-face-name: 'DejaVu Sans Book';
text-fill: #0D0D0D;
text-label-position-tolerance: 0;
text-halo-radius: 1;
text-halo-fill: fadeout(lighten(#CCBE9A,12),70);
text-dy: -5;
text-allow-overlap: true;
text-placement: line;
text-placement-type: dummy;
text-transform: uppercase;
[zoom>=15]{text-size: 18;}
[zoom>=13]{text-opacity: 1;}
[zoom>=13]{text-size: 12;}
[zoom < 13] {text-opacity: 0;}
[zoom < 13] {text-halo-radius: 0;}
}

`);
const transportationLayer = new carto.layer.Layer(transportationSource, transportationStyle);

const structuresSource = new carto.source.Dataset('structures');
const structuresStyle = new carto.style.CartoCSS(`
  #structures_layer::z1{
  [zoom>=15]{building-height:[height]*1.5}
  [zoom>=15]{building-fill-opacity: 1;}
  [zoom>=15]{building-fill: #a5978a;}
  [zoom >= 15] {polygon-opacity: 0;}
  [zoom >= 15] {line-width: 0;}

  [zoom<15]{line-width: 1;}
  [zoom<15]{line-color: grey;}
  [zoom<15]{polygon-fill: #ddcdba;}

  [zoom < 12] {polygon-opacity: 0;}
  [zoom < 12] {line-width: 0;}
  }

  #structure_layer[name="Hogwarts Castle"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Serif Book';
  text-fill: #0D0D0D;
  text-label-position-tolerance: 10;
  text-halo-radius: 1;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: -15;
  text-allow-overlap: true;
  text-placement: point;
  text-wrap-width: 100;
  text-wrap-before: true;
  text-line-spacing: 2;
  text-transform: uppercase;
  [zoom>=15]{text-size: 17;}
  [zoom>=13]{text-opacity: 1;}
  [zoom>=13]{text-size: 13;}
  [zoom < 13] {text-opacity: 0;}
  [zoom < 13] {text-halo-radius: 0;}
  }


  #structure_layer[name="Dragon Pavillion"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Sans Book';
  text-fill: #383838;
  text-label-position-tolerance: 10;
  text-halo-radius: 1;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: 0;
  text-allow-overlap: true;
  text-placement: point;
  text-wrap-width: 100;
  text-wrap-before: true;
  text-line-spacing: 2;
  [zoom>=16]{text-size: 20;}
  [zoom>=16]{text-opacity: 1;}
  [zoom < 14] {text-opacity: 0;}
  [zoom < 14] {text-halo-radius: 0;}
  }
`);
const structuresLayer = new carto.layer.Layer(structuresSource, structuresStyle);

const barrierSource = new carto.source.Dataset('barrier');
const barrierStyle = new carto.style.CartoCSS(`
  #barrier_layer [type="Fence"]{
      line-width: 3;
      line-color: white;
      line-opacity: 0.8;
      line-cap: butt;
      line-join: round;
      [zoom<12]{line-width: 0;}
      [zoom>=12]{line-width: 1;}


  }

  #barrier_layer [type="Wall"]{
      line-width: 2;
      line-color: black;
      line-opacity: 0.8;
      line-cap: butt;
      line-join: round;
      [zoom<12]{line-width: 0;}
      [zoom>=12]{line-width: 1;}
  }

    #barrier_layer [type="Gate"]{
        line-width: 4;
        line-color: black;
        line-opacity: 0.8;
        line-cap: butt;
        line-join: round;
        [zoom<12]{line-width: 0;}
        [zoom>=12]{line-width: 1;}
    }

    [type='Magical']{
       ::case {
         line-width: 4;
         line-color: #3b3b3b;
         line-opacity: 0.3;
         line-cap: butt;
         line-join: round;
         line-dasharray: 2,4;

           [zoom<12]{line-width: 0; opacity:0;}
           [zoom>=12]{line-width: 5;opacity:1;}
         }

       ::fill{
         line-width: 2;
         line-color: lighten(#8C9F71,10);
         line-opacity: 0.9;

           [zoom<12]{line-width: 0;opacity:0;}
           [zoom>=12]{line-width: 3;opacity:1;}
       }
     }

`);
const barrierLayer = new carto.layer.Layer(barrierSource, barrierStyle);

const localSource = new carto.source.Dataset('local_sites');
const localStyle = new carto.style.CartoCSS(`

  #local_layer [name="Apparition Point"]{
      marker-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210418232454APPARITION.svg);
      marker-fill: purple;
      [zoom <13]{marker-fill-opacity: 0;}
      [zoom >=13]{marker-width: 16;}
      [zoom >=16]{marker-width: 25;}
  }


  #local_layer [type="Historic Site"]{
      marker-file: url(http://www.clipartbest.com/cliparts/nTX/AGX/nTXAGXyTB.svg);
      marker-fill: red;
      [zoom <13]{marker-fill-opacity: 0;}
      [zoom >=13]{marker-width: 16;}
      [zoom >=16]{marker-width: 25;}
  }

  #local_layer [category="Historic Event"]{
      marker-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210419000115INFO.svg);
      marker-fill: #317393;
      [zoom <13]{marker-fill-opacity: 0;}
      [zoom >=13]{marker-width: 16;}
      [zoom >=16]{marker-width: 25;}
  }

  #local_layer [type="Retail"]{
      marker-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210418232551shop-15.svg);
      marker-fill: #383838;
      [zoom <16]{marker-fill-opacity: 0;}
      [zoom >=16]{marker-width: 16;}
      [zoom >=16]{marker-width: 20;}
  }

  #local_layer [type="Dining"]{
      marker-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210418232503BAR.svg);
      marker-fill: #383838;
      [zoom <16]{marker-fill-opacity: 0;}
      [zoom >=16]{marker-width: 16;}
      [zoom >=16]{marker-width: 20;}
  }

  #local_layer[category="Commercial"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Sans Book';
  text-fill: black;
  text-label-position-tolerance: 10;
  text-halo-radius: 1;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: -15;
  text-allow-overlap: true;
  text-placement: point;
  text-wrap-width: 130;
  text-wrap-before: true;
  text-line-spacing: 2;
  [zoom>=16]{text-size: 18;}
  [zoom>=16]{text-opacity: 1;}
  [zoom < 16] {text-opacity: 0;}
  [zoom < 16] {text-halo-radius: 0;}
  }

  #local_layer[name="Whomping Willow"],[name="Sirius Black's Cavern"],[name="Hagrid's Hut"],[name="Stables"],[name="Hogsmeade Station"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Sans Book';
  text-fill: #383838;
  text-label-position-tolerance: 1;
  text-halo-radius: 1;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: 0;
  text-allow-overlap: true;
  text-placement: point;
  text-wrap-width: 100;
  text-wrap-before: true;
  text-line-spacing: 2;
  [zoom>=14]{text-size: 12;}
  [zoom>=14]{text-opacity: 1;}
  [zoom < 14] {text-opacity: 0;}
  [zoom < 14] {text-halo-radius: 0;}
  }

  #local_layer[name="Downtown Hogsmeade"],[name="Hogsmeade Planned Community"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Sans Book';
  text-fill: #383838;
  text-label-position-tolerance: 10;
  text-halo-radius: 1;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: 0;
  text-allow-overlap: true;
  text-placement: point;
  text-wrap-width: 100;
  text-wrap-before: true;
  text-line-spacing: 2;
  text-transform: uppercase;
  [zoom>=14]{text-size: 16;}
  [zoom>=14]{text-opacity: 1;}
  [zoom < 14] {text-opacity: 0;}
  [zoom < 14] {text-halo-radius: 0;}
  }

  #local_layer[category="Residential"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Sans Book';
  text-fill: black;
  text-label-position-tolerance: 10;
  text-halo-radius: 1;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: 0;
  text-allow-overlap: false;
  text-placement: point;
  text-wrap-width: 150;
  text-wrap-before: true;
  text-line-spacing: 2;
  [zoom>=16]{text-size: 20;}
  [zoom>=16]{text-opacity: 1;}
  [zoom < 14] {text-opacity: 0;}
  [zoom < 14] {text-halo-radius: 0;}
  }

  #local_layer[name="Quidditch Pitch"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Sans Book';
  text-fill: #383838;
  text-label-position-tolerance: 10;
  text-halo-radius: 1;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: 0;
  text-allow-overlap: true;
  text-placement: point;
  text-wrap-width: 100;
  text-wrap-before: true;
  text-line-spacing: 2;
  [zoom>=14]{text-size: 12;}
  [zoom>=14]{text-opacity: 1;}
  [zoom < 14] {text-opacity: 0;}
  [zoom < 14] {text-halo-radius: 0;}
  }

  #local_layer[name="Apparition Point"]::z1  {
  text-name: [name];
  text-face-name: 'DejaVu Sans Book';
  text-fill: purple;
  text-label-position-tolerance: 10;
  text-halo-radius: 1;
  text-halo-fill: fadeout(lighten(#7E9968,12),70);
  text-dy: -10;
  text-allow-overlap: true;
  text-placement: point;
  text-wrap-width: 50;
  text-wrap-before: true;
  text-line-spacing: 2;
  [zoom>=14]{text-size: 12;}
  [zoom>=14]{text-opacity: 1;}
  [zoom < 14] {text-opacity: 0;}
  [zoom < 14] {text-halo-radius: 0;}
  }


`);
const localLayer = new carto.layer.Layer(localSource, localStyle, {
            featureClickColumns: ['name','category','type','image_src']
        });

const magicalSource = new carto.source.Dataset('magical_creatures');
const magicalStyle = new carto.style.CartoCSS(`
  #magical_layer [mom_class="X"]{
      marker-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210418234404dragon.svg);
      marker-fill: #3E5189;
      marker-line-color: #808080;
      marker-line-width: .5;
      [zoom <13]{marker-fill-opacity: 0;}
      [zoom <13]{marker-line-width: 0;}
      [zoom >=13]{marker-width: 25;}
      [zoom >=15]{marker-width: 35;}
  }

  #magical_layer [mom_class="XX"] {
      marker-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210418234404dragon.svg);
      marker-fill: #3E9348;
      marker-line-color: #808080;
      marker-line-width: 0.5;
      [zoom <13]{marker-fill-opacity: 0;}
      [zoom <13]{marker-line-width: 0;}
      [zoom >=13]{marker-width: 25;}
      [zoom >=15]{marker-width: 35;}
  }

  #magical_layer [mom_class="XXX"] {
      marker-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210418234404dragon.svg);
      marker-fill: #FFB600;
      marker-line-color: #808080;
      marker-line-width: 0.5;
      [zoom <13]{marker-fill-opacity: 0;}
      [zoom <13]{marker-line-width: 0;}
      [zoom >=13]{marker-width: 25;}
      [zoom >=15]{marker-width: 35;}
  }

  #magical_layer [mom_class="XXXX"] {
      marker-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210418234404dragon.svg);
      marker-fill: #EA7159;
      marker-line-color: #808080;
      marker-line-width: 0.5;
      [zoom <13]{marker-fill-opacity: 0;}
      [zoom <13]{marker-line-width: 0;}
      [zoom >=13]{marker-width: 25;}
      [zoom >=15]{marker-width: 35;}
  }

  #magical_layer [mom_class="XXXXX"]{
      marker-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/shbartlett/assets/20210418234404dragon.svg);
      marker-fill: #BF3C9D;
      marker-line-color: #808080;
      marker-line-width: 0.5;
      [zoom <13]{marker-fill-opacity: 0;}
      [zoom <13]{marker-line-width: 0;}
      [zoom >=13]{marker-width: 25;}
      [zoom >=15]{marker-width: 35;}
  }
`);
const magicalLayer = new carto.layer.Layer(magicalSource, magicalStyle, {
            featureClickColumns: ['image_src','name','mom_class','category','type','image_src'],
            featureOverColumns: ['name', 'mom_class']
        });


client.addLayers([surroundingLayer, landcoverLayer, structuresLayer, barrierLayer, transportationLayer, localLayer, magicalLayer]);
client.getLeafletLayer().addTo(map);

var pulsingIcon = L.icon.pulse({iconSize:[25,25],fillColor: 'none',heartbeat:2, color:'rgba(255, 0, 0,.75)'});
var shelterMarkers = new L.FeatureGroup();
var shelter1 = L.marker([57.186,-3.58],{icon: pulsingIcon});
shelterMarkers.addLayer(shelter1);
map.addLayer(shelterMarkers)

map.on('zoomstart', function(ev){
  if (map.getZoom() >= 10.5) {
    map.removeLayer(shelterMarkers);
  } else {
    map.addLayer(shelterMarkers);
  }
})

const popup = L.popup({
    closeButton: true,
    closeOnClick: true,
    autoPan: false,
    className: 'leaflet-popup',
    maxWidth: "auto"
});

function openMagicalPopUp(featureEvent) {
    console.log(featureEvent)
    // set where the popup will be displayed
    // coordinates of clicked/hover geometry
    popup.setLatLng(featureEvent.latLng);
    // if it is not opened, display popup
    if (!popup.isOpen()) {
        let content = '';

        if (featureEvent.data.name) {
            content += `
            <class=span>
            <div style="float: left;"><img src=" ${featureEvent.data.image_src}" style="width: 130px","maxHeight: 120px"/></div></br>
            <small-text><b>${featureEvent.data.name}</b></div></br>
            <small-text>Category: ${featureEvent.data.category}<br>
            <small-text>Type: ${featureEvent.data.type}<br>
            <small-text>MoM Class: ${featureEvent.data.mom_class}
            </span>
            `
        }

        console.log(content)
        // add values to Leafet popup element
        popup.setContent(content);
        // displayn Leaflet popup on map
        popup.openOn(map);
    }
};

function closeMagicalPopUp(featureEvent) {
    // remove popup from map object
    popup.removeFrom(map)
}


function openLocalPopUp(featureEvent) {
    console.log(featureEvent)
    // set where the popup will be displayed
    // coordinates of clicked/hover geometry
    popup.setLatLng(featureEvent.latLng);
    // if it is not opened, display popup
    if (!popup.isOpen()) {
        let content = '';
        if (featureEvent.data.name) {
            content += `
            <class=span>
            <div style="float: left;"><img src=" ${featureEvent.data.image_src}" style="width: 130px","maxHeight: 120px"/></div></br>
            <small-text><b>${featureEvent.data.name}</b></div></br>
            <small-text>Category: ${featureEvent.data.category}<br>
            <small-text>Type: ${featureEvent.data.type}<br>
            </span>
            `
        }

        console.log(content)
        // add values to Leafet popup element
        popup.setContent(content);
        // displayn Leaflet popup on map
        popup.openOn(map);
    }
};

function closeLocalPopUp(featureEvent) {
    // remove popup from map object
    popup.removeFrom(map)
}

// define what will happen when we do the mouse event
// featureClick on the geometries of the CARTO layer

magicalLayer.on('featureClicked', openMagicalPopUp);
localLayer.on('featureClicked', openLocalPopUp);


const categoryWidget = document.querySelector('as-category-widget');
categoryWidget.showHeader = true;
categoryWidget.disableInteractivity = true;


const dataView = new carto.dataview.Category(magicalSource, 'mom_class', {
  operation: carto.operation.COUNT,
  operationColumn: 'mom_class'
});


dataView.on('dataChanged', function (newData) {
  categoryWidget.categories = newData.categories;
});

dataView.on('dataChanged', data => {
      console.log('Updating category widget');
      colorDict = {
          "X": "#3E5189",
          "XX": "#3E9348",
          "XXX": "#FFB600",
          "XXXX": "#EA7159",
          "XXXXX": "#BF3C9D"
      };

      data.categories.forEach((item, index, arr)=>
      {
          arr[index]["color"] = colorDict[item.name.trim()];
      });
      categoryWidget.categories = data.categories;
  });

client.addDataview(dataView);

const bboxFilter = new carto.filter.BoundingBoxLeaflet(map);
dataView.addFilter(bboxFilter);


const style = new carto.style.CartoCSS(`
  #magical_creatures_1{
  }
`);
const source = new carto.source.SQL(`
SELECT * FROM magical_creatures_1
`);

// create CARTO layer from source and style variables
const magLayer = new carto.layer.Layer(source,style);

// add CARTO layer to the client
client.addLayer(magLayer);

// get tile from client and add them to the map object
client.getLeafletLayer().addTo(map);

const formulaWidget = document.querySelector('as-formula-widget');
formulaWidget.showHeader = true;
formulaWidget.useTotalPercentage = false;


// create formula dataview using pop_max column values
// SUM formula
const formulaDataview = new carto.dataview.Formula(source, 'name', {
    operation: carto.operation.COUNT
});

// when there is a change on the data, execute function to
// display result from dataview in DOM element


formulaDataview.on('dataChanged', function (data) {
  formulaWidget.value = data.result;
});


// add category dataview to client
client.addDataview(formulaDataview);

// Set bounding box filter
const bboxFilter2 = new carto.filter.BoundingBoxLeaflet(map);

// add filter to formula dataview, so when the BBOX change, the formula data view will be recalculated
formulaDataview.addFilter(bboxFilter2);


//dropdown menu to select and zoom to magical creature
let input;

// populate dropdown menu
populateDrowpDown()

// function to get list of country names to populate dropdown menu
function populateDrowpDown(){
    return fetch(
        `https://shbartlett.carto.com/api/v2/sql?format=geojson&q=SELECT the_geom, name FROM magical_creatures_1 ORDER BY name ASC`
        ).then((resp) => resp.json())
        .then((response) => {
            return response['features'].map(function(feature){
                option = document.createElement("option")
                option.setAttribute("value", feature.properties.name)
                option.textContent = feature.properties.name
                document.getElementById("selectDrop").appendChild(option);
            });
        }).catch((error) => {
            console.log(error)
        })
}

// when select option from downdown menu, change bounding box of map
// to geometry of the selected country
document.getElementById('selectDrop').addEventListener("change", function (e) {
    input = e.currentTarget.selectedOptions[0].attributes[0].value;
    return  fetch(`https://shbartlett.carto.com/api/v2/sql?format=geojson&q=SELECT * FROM magical_creatures_1 where name Ilike '${input}'`)
    .then((resp) => resp.json())
    .then((response) => {
        geojsonLayer = L.geoJson(response)
        map.fitBounds(geojsonLayer.getBounds());
    })
});

//Leaflet zoom-home
var lat = 57.186;
var lng = -3.58;
var zoom = 12.25;

//Leaflet zoom-muggle
var lat2 = 57.186;
var lng2 = -3.58;
var zoom2 = 11;
// custom zoom bar control that includes a Zoom Home function
L.Control.zoomHome = L.Control.extend({
    options: {
        position: 'topleft',
        zoomInText: '+',
        zoomInTitle: 'Zoom in',
        zoomOutText: '-',
        zoomOutTitle: 'Zoom out',
        zoomHomeText: '<i class="fa fa-tree" style="line-height:1.65;"></i>',
        zoomHomeTitle: 'Magical Extent',
        zoomMuggleText: '<i class="fa fa-home" style="line-height:1.65;"></i>',
        zoomMuggleTitle: 'Mischief Managed'
    },

    onAdd: function (map) {
        var controlName = 'gin-control-zoom',
            container = L.DomUtil.create('div', controlName + ' leaflet-bar'),
            options = this.options;

        this._zoomHomeButton = this._createButton(options.zoomHomeText, options.zoomHomeTitle,
        controlName + '-home', container, this._zoomHome);

        this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle,
        controlName + '-in', container, this._zoomIn);

        this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
        controlName + '-out', container, this._zoomOut);

        this._zoomMuggleButton = this._createButton(options.zoomMuggleText, options.zoomMuggleTitle,
        controlName + '-home', container, this._zoomMuggle);

        this._updateDisabled();
        map.on('zoomend zoomlevelschange', this._updateDisabled, this);

        return container;
    },

    onRemove: function (map) {
        map.off('zoomend zoomlevelschange', this._updateDisabled, this);
    },

    _zoomIn: function (e) {
        this._map.zoomIn(e.shiftKey ? 3 : 1);
    },

    _zoomOut: function (e) {
        this._map.zoomOut(e.shiftKey ? 3 : 1);
    },

    _zoomHome: function (e) {
        map.setView([lat, lng], zoom);
    },

    _zoomMuggle: function (e) {
        map.setView([lat2, lng2], zoom2);
    },

    _createButton: function (html, title, className, container, fn) {
        var link = L.DomUtil.create('a', className, container);
        link.innerHTML = html;
        link.href = '#';
        link.title = title;

        L.DomEvent.on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', fn, this)
            .on(link, 'click', this._refocusOnMap, this);

        return link;
    },

    _updateDisabled: function () {
        var map = this._map,
            className = 'leaflet-disabled';

        L.DomUtil.removeClass(this._zoomInButton, className);
        L.DomUtil.removeClass(this._zoomOutButton, className);

        if (map._zoom === map.getMinZoom()) {
            L.DomUtil.addClass(this._zoomOutButton, className);
        }
        if (map._zoom === map.getMaxZoom()) {
            L.DomUtil.addClass(this._zoomInButton, className);
        }
    }
});
// add the new control to the map
var zoomHome = new L.Control.zoomHome();
zoomHome.addTo(map);


// Create feature group for drawn items & layer group for previously drawn items
let drawnItems = L.featureGroup().addTo(map);
let cartoData = L.layerGroup();

// Add Data from Carto using the SQL API
let url = 'https://shbartlett.carto.com/api/v2/sql';
let urlGeoJSON = url+'?format=GeoJSON&q=';
let sqlQuery = 'SELECT the_geom, description, name FROM comment';
let apiKey = 'lWm4IJqqGPfjjnrGPY6rmQ';

function addPopup(feature, comment_layer) {
    comment_layer.bindPopup(
        feature.properties.description +
        "<br>Submitted by " + feature.properties.name
    );
}
fetch(urlGeoJSON + sqlQuery)
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(cartoData);
    });


    var customMarker= L.Icon.extend({
        options: {
            shadowUrl: null,
            iconAnchor: new L.Point(12, 12),
            iconSize: new L.Point(24, 24),
            iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Information_icon4_orange.svg'
        }
    });

// Add draw control
new L.Control.Draw({
    draw : {
        polygon : false,
        polyline : false,
        rectangle : false,     // Rectangles disabled
        circle : false,        // Circles disabled
        circlemarker : false,  // Circle markers disabled
        marker: {
          icon: new customMarker() //Here assign your custom marker
        }
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);

// On draw - create editable popup
map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    createFormPopup();
});

// On edit or delete - Close popup
map.addEventListener("draw:editstart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
    drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function(e) {
    if(drawnItems.getLayers().length > 0) {
        drawnItems.openPopup();
    }
});

// Create editable popup
function createFormPopup() {
    let popupContent =
        '<form>' +
        'Description:<br><input type="text" id="input_desc"><br>' +
        'Name:<br><input type="text" id="input_name"><br>' +
        '<input type="button" value="Submit" id="submit">' +
        '</form>';
    drawnItems.bindPopup(popupContent).openPopup();
}

// Submission - Sending to CARTO
function setData(e) {

    if(e.target && e.target.id == "submit") {

        // Get user name and description
        let enteredUsername = document.getElementById("input_name").value;
        let enteredDescription = document.getElementById("input_desc").value;

        // For each drawn layer
        drawnItems.eachLayer(function(comment_layer) {

            // Create SQL expression to insert layer
                let drawing = JSON.stringify(comment_layer.toGeoJSON().geometry);
                let sql =
                    "INSERT INTO comment (the_geom, description, name) "+
                    "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('"+
                    drawing +"'), 4326),'"+
                    enteredDescription+"', '"+
                    enteredUsername+"')"+"&api_key=lWm4IJqqGPfjjnrGPY6rmQ";
                console.log(sql);

                // Send the data
                fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: "q="+encodeURI(sql)
                })
                    .then(function(response) {
                        return response.json();
                    })
                    .then(function(data) {
                        console.log("Data saved:", data);
                    })
                    .catch(function(error) {
                        console.log("Problem saving the data:", error);
                    });

            // Transfer submitted drawing to the CARTO layer
            let postData = comment_layer.toGeoJSON();
            postData.properties.description = enteredDescription;
            postData.properties.name = enteredUsername;
            L.geoJSON(postData, {onEachFeature: addPopup}).addTo(cartoData);

        });

        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();

    }

}

// Click on 'submit' event listener
document.addEventListener("click", setData);

map.on('zoomend' , function (e) {
    console.log(map.getZoom());
    if (map.getZoom()<=14)
    {
        cartoData.remove();
    }else if(map.getZoom()>14) {
        cartoData.addTo(map);
    }
});

})

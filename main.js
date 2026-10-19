
import './style.css';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import Draw from 'ol/interaction/Draw.js';
import ImageWMS from 'ol/source/ImageWMS.js';
import ImageLayer from 'ol/layer/Image.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import {getRenderPixel} from 'ol/render.js';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4.js';
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';


//Vector Drawing Layer
const source = new VectorSource({
    wrapX: false
});

const vector = new VectorLayer({
    source: source
});


//Projection

// Register the EPSG:3006 projection
proj4.defs(
    'EPSG:3006',
    '+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs +type=crs'
);

register(proj4);



// Satellite Image Extent


const extent3006 = [
    396750.00009037124,
    6174290.00374018,
    404450.0000836506,
    6179860.00373251
];


//Open Street Map Background

const osmLayer = new TileLayer({
    source: new OSM()
});


//Satellite image 2022
const image2022 = new ImageLayer({
    source: new ImageWMS({
        url: 'https://geoserver.gis.lu.se/geoserver/TTA_NGEN26/wms',
        params: {
            'LAYERS': '2022',
            'FORMAT': 'image/png',
            'VERSION': '1.1.1'
        },
        serverType: 'geoserver',
        ratio: 1
    })
});


//Satellite Image 2024

const image2024 = new ImageLayer({
    source: new ImageWMS({
        url: 'https://geoserver.gis.lu.se/geoserver/TTA_NGEN26/wms',
        params: {
            'LAYERS': '2024',
            'FORMAT': 'image/png',
            'VERSION': '1.1.1'
        },
        serverType: 'geoserver',
        ratio: 1
    })
});


//Create Map

const map = new Map({
    layers: [
        osmLayer,
        image2024,
        image2022,
        vector
    ],
    target: 'map',
    view: new View({
        projection: 'EPSG:3006',
        center: [400600, 6177075],
        zoom: 2
    })
});

// Update map size
map.updateSize();

// Zoom to satellite imagery
map.getView().fit(extent3006, {
    size: map.getSize(),
    padding: [20, 20, 20, 20]
});


// Drawing Interaction
const typeSelect = document.getElementById('type');

let draw;

// Add drawing interaction
function addInteraction() {

    const value = typeSelect.value;

    if (value !== 'None') {

        draw = new Draw({
            source: source,
            type: typeSelect.value
        });

        map.addInteraction(draw);
    }
}

// Change drawing type
typeSelect.onchange = function () {
    map.removeInteraction(draw)
    addInteraction();
};

// Undo last drawn point
document.getElementById('undo').addEventListener(
    'click',
    function () {

        if (draw) {
            draw.removeLastPoint();
        }

    }
);

// Activate drawing interaction
addInteraction();


// -------------------------------------
// SATELLITE COMPARISON SLIDER
// -------------------------------------

const swipe = document.getElementById('swipe');


// Clip the 2022 satellite image
image2022.on('prerender', function (event) {

    const ctx = event.context;
    const mapSize = map.getSize();

    // Calculate slider position
    const width = mapSize[0] *
        (Number(swipe.value) / 100);

    // Calculate corners
    const tl = getRenderPixel(event, [width, 0]);

    const tr = getRenderPixel(
        event,
        [mapSize[0], 0]
    );

    const bl = getRenderPixel(
        event,
        [width, mapSize[1]]
    );

    const br = getRenderPixel(
        event,
        mapSize
    );

    // Clip the 2022 image
    ctx.save();
    ctx.beginPath();

    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(tr[0], tr[1]);

    ctx.closePath();
    ctx.clip();
});


// Restore canvas
image2022.on('postrender', function (event) {

    const ctx = event.context;
    ctx.restore();

});


// Update map when slider moves
swipe.addEventListener('input', function () {

    map.render();

});


/* global itowns, document, renderer, GuiTools, Promise */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Annecy lake.
// var positionOnGlobe = { longitude: 6.2230, latitude: 45.8532, altitude: 5000 };

var fetchlink = itowns.fetchLink;
// Position near Gerbier mountain.
let lat1  =  48.859031;
let long1 = 2.293377;
let lat2  = 48.857577;
let long2 = 2.295619;
var positionOnGlobe = { longitude: long1, latitude: lat1, altitude: 100 };
var THREE = itowns.THREE;

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe, { renderer: renderer });

var promises = [];

var menuGlobe = new GuiTools('menuDiv');

menuGlobe.view = globeView;

function addLayerCb(layer) {
    return globeView.addLayer(layer);
}
// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb));
// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promises.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));
         
let promises_mp = [];

fetchlink.all("https://a.mapillary.com/v3/images/?"
    +"bbox="
    +long1
    +","
    +lat1
    +","
    +long2
    +","
    +lat2
    +"&client_id=VTRaYjFvTUZ4THpELTQ1ODFQaV9QUTo2NmI1YTM3MjlmNjM4NDFk").then(
        results => {
            for(let i=0; i< results.length; i++){
                promises_mp.push(results[i].json());
            };
}).then(() => {
    Promise.all(promises_mp).then(jsons => {
        jsons.forEach(json=>{
            addMeshes(json);
        });
    })
});



function testNext(props) {
    let isNext = false;
    for (var i = 0; i < props.length; i++) {
        //console.log(props[i]);
        let sousProps = props[i].split(';');
        let keyword = sousProps[1].substring(5);
        console.log(keyword);
            if (keyword == '"next"') {
                isNext = true;
            }
    }
    return isNext;
}
function addMeshes(json) {
    for (let i = 0; i < json.features.length; i++) {
        addMeshToScene(json.features[i].geometry.coordinates[0], json.features[i].geometry.coordinates[1],0xff0000,0.1);
    }
    
}
function addMeshToScene(long, lat, color, size) {
    // creation of the new mesh (a cylinder)

    var geometry = new THREE.CylinderGeometry(size, size, 100, 8);
    var material = new THREE.MeshBasicMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);

    let coord = new itowns.Coordinates('EPSG:4326',
                     long,
                     lat,
                    positionOnGlobe.altitude).as('EPSG:4978').xyz();

    // position and orientation of the mesh
    mesh.position.copy(coord);

    mesh.lookAt(new THREE.Vector3(0, 0, 0));
    mesh.rotateX(Math.PI / 2);

    // update coordinate of the mesh
    mesh.updateMatrixWorld();

    // add the mesh to the scene
    globeView.scene.add(mesh);

    // make the object usable from outside of the function
    //globeView.mesh = mesh;
}

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function () {
    // eslint-disable-next-line no-console
    console.info('Globe initialized');

    Promise.all(promises).then(function (result) {

            //console.log(result[3]);

            addMeshToScene(long1,lat1,new THREE.Color( 'skyblue' ),5);
            addMeshToScene(long2,lat1,new THREE.Color( 'skyblue' ),5);
            addMeshToScene(long2,lat2,new THREE.Color( 'skyblue' ),5);
            addMeshToScene(long1,lat2,new THREE.Color( 'skyblue' ),5);

            menuGlobe.addImageryLayersGUI(globeView.getLayers(function (l) { return l.type === 'color'; }));
            menuGlobe.addElevationLayersGUI(globeView.getLayers(function (l) { return l.type === 'elevation'; }));
            globeView.controls.setTilt(60, true);
    });
});


exports.view = globeView;
exports.initialPosition = positionOnGlobe;
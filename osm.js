var logEle = document.getElementById("log");

let categoriesZoom1=['motorway','motorway_link','primary','primary_link'];
let categoriesZoom2=['secondary','secondary_link'];
let categoriesZoom3=['tertiary','tertiary_link','residential','service','trunk','living_street']

function log(msg) {
    logEle.textContent += msg + '\n';
}

function initmap() {
    // set up the map
    map = new L.Map('map');

    // create the tile layer with correct attribution
    var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, { minZoom: 8, maxZoom: 18, attribution: osmAttrib });

    // start the map in South-East England
    map.setView(new L.LatLng(53, 8.8), 9);
    map.addLayer(osm);

    // create a red polyline from an array of LatLng points
    let zoom1=[];
    let zoom2=[];
    let zoom3=[];
    for(let i=0;i<edges.length;i++){
        if(categoriesZoom1.includes(edges[i].tags.highway)){
            var latlngs = [
                [nodes[nodeIdMap[edges[i].from]].lat, nodes[nodeIdMap[edges[i].from]].lon],
                [nodes[nodeIdMap[edges[i].to]].lat, nodes[nodeIdMap[edges[i].to]].lon]
            ];
            let polyline=L.polyline(latlngs, { color: 'red' }).bindPopup('distance:'+edges[i].distance);
            zoom1.push(polyline);
        }
        else if(categoriesZoom2.includes(edges[i].tags.highway)){
            var latlngs = [
                [nodes[nodeIdMap[edges[i].from]].lat, nodes[nodeIdMap[edges[i].from]].lon],
                [nodes[nodeIdMap[edges[i].to]].lat, nodes[nodeIdMap[edges[i].to]].lon]
            ];
            let polyline=L.polyline(latlngs, { color: 'red' }).bindPopup('distance:'+edges[i].distance);
            zoom2.push(polyline);
        }
        else if(categoriesZoom3.includes(edges[i].tags.highway)){
            var latlngs = [
                [nodes[nodeIdMap[edges[i].from]].lat, nodes[nodeIdMap[edges[i].from]].lon],
                [nodes[nodeIdMap[edges[i].to]].lat, nodes[nodeIdMap[edges[i].to]].lon]
            ];
            let polyline=L.polyline(latlngs, { color: 'red' }).bindPopup('distance:'+edges[i].distance);
            zoom3.push(polyline);
        }
        
        
        // zoom the map to the polyline
        // map.fitBounds(polyline.getBounds());
    }

    let layer1=L.layerGroup(zoom1);
        let layer2=L.layerGroup(zoom2);
        let layer3=L.layerGroup(zoom3);
        map.addLayer(layer1)

        map.on('zoomend', function() {
            console.log(map.getZoom())
            if (map.getZoom() <10){
                if (map.hasLayer(layer2)) {
                    map.removeLayer(layer2);
                }
                if (map.hasLayer(layer3)) {
                    map.removeLayer(layer3);
                }
            }
            if (map.getZoom() >= 10){
                if (!map.hasLayer(layer2)){
                    map.addLayer(layer2)
                }
                if (map.hasLayer(layer3)) {
                    map.removeLayer(layer3);
                }
            }
            if (map.getZoom() >= 14){
                if (!map.hasLayer(layer2)){
                    map.addLayer(layer2)
                }
                if(!map.hasLayer(layer3)){
                    map.addLayer(layer3);
                }
            }
        });

    
    
}

let nodes = [],
    ways = [],
    relations = [],
    edges = [],
    nodeIdMap = {},
    offsetArray = [],
    offsetEdges = [],
    contractedEdges=[];

function parse(file) {
    var cNodes = 0,
        cWays = 0,
        cRels = 0,
        bounds = [];

    log('parsing "' + file.name + '" ...');

    pbfParser.parse({
        file: file,
        endDocument: function () {
            console.log('nodes')
            console.log(nodes);
            console.log('ways')
            console.log(ways);
            console.log('relations')
            console.log(relations);
            console.log('bounds')
            console.log(bounds);
            log('done.\n');
            log('nodes: ' + cNodes);
            log('ways:  ' + cWays);
            log('rels:  ' + cRels + '\n');
            getEdges();
        },
        bounds: function (bounds) {
            bounds.push(bounds);
        },
        node: function (node) {
            nodes.push(node);
            cNodes++;
        },
        way: function (way) {
            ways.push(way);
            cWays++;
        },
        relation: function (relation) {
            relations.push(relation);
            cRels++;
        },
        error: function (msg) {
            log('error: ' + msg);
            throw msg;
        }
    });
}

function getEdges() {
    for (let i = 0; i < ways.length; i++) {
        for (let j = 0; j < ways[i].nodeRefs.length - 1; j++) {
            edges.push({
                from: ways[i].nodeRefs[j],
                to: ways[i].nodeRefs[j + 1],
                wayId: ways[i].id,
                tags: ways[i].tags
            })
        }
    }
    buildOffsetArray();
}

function buildOffsetArray() {
    // fill nodeIdMap
    for (let i = 0; i < nodes.length; i++) {
        nodeIdMap[nodes[i].id] = i;
        offsetArray[i] = 0;
    }

    for (let i = 0; i < edges.length; i++) {
        offsetArray[nodeIdMap[edges[i].from] + 1]++;
    }
    // sum up offset indices
    let sum = 0;
    for (let i = 0; i < offsetArray.length; i++) {
        sum += offsetArray[i];
        offsetArray[i] = sum;
    }
    buildOffsetEdges();
}

function buildOffsetEdges() {
    for (let i = 0; i < edges.length; i++) {
        let minPos = offsetArray[nodeIdMap[edges[i].from]];
        while (offsetEdges[minPos] != null) minPos++;
        offsetEdges[minPos] = i;
    }
    calculateAllDistances();
}

function contractEdges(){
    for(let i=0;i<nodes.length;i++){
        if(offsetArray[nodeIdMap[i]+1]-offsetArray[nodeIdMap[i]]==1){
            if(offsetArray[nodeIdMap[edges[offsetArray[nodeIdMap[i]+1]].to]]-offsetArray[nodeIdMap[edges[offsetArray[nodeIdMap[i]]].to]]==1){

            }
        }
    }
}

function calculateAllDistances() {
    for (let i = 0; i < edges.length; i++) {
        let lat1 = nodes[nodeIdMap[edges[i].from]].lat;
        let lon1 = nodes[nodeIdMap[edges[i].from]].lon;
        let lat2 = nodes[nodeIdMap[edges[i].to]].lat;
        let lon2 = nodes[nodeIdMap[edges[i].to]].lon;
        edges[i].distance = distance(lat1, lon1, lat2, lon2);
    }
    // console.log(edges);
    initmap();
}



function handleFile() {
    var file = this.files[0];
    parse(file);
}

document.getElementById("file").addEventListener("change", handleFile, false);

function distance(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}
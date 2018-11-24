var logEle = document.getElementById("log");

let categoriesZoom1=['motorway','motorway_link','primary','primary_link'];
let categoriesZoom2=['secondary','secondary_link'];
let categoriesZoom3=['tertiary','tertiary_link','residential','service','trunk','living_street']

function log(msg) {
    logEle.textContent += msg + '\n';
}

function fillTable(entries){
    let $content=$('.popup-content');
    let $tables=$(document.createElement('table'));
    $tables.html('<tr><td>nodes</td><td>edges</td></tr>');
    $tables.css('text-align','center')
    $tables.css('table-layout','fixed');
    $content.append($tables);
    $nodeTableContainer=$(document.createElement('td'));
    $nodeTableContainer.css('border-right','1px solid #333');
    $nodeTableContainer.css('width','50%');
    $tables.append($nodeTableContainer);
    let $nodeTable=$(document.createElement('table'));
    $nodeTable.html('<td>id</td><td>lat</td><td>lon</td>');
    for(let i=0;i<Math.min(entries,nodes.length);i++){
        $nodeTable.append('<tr><td>'+nodes[i].id+'</td><td>'+nodes[i].lat+'</td><td>'+nodes[i].lon+'</td></tr>');
    }
    $nodeTableContainer.append($nodeTable);
    $edgeTableContainer=$(document.createElement('td'));
    $tables.append($edgeTableContainer);
    let $edgeTable=$(document.createElement('table'));
    $edgeTable.html('<td>index</td><td>from node</td><td>to node</td><td>distance (m)</td>');
    for(let i=0;i<Math.min(entries,edges.length);i++){
        console.log(edges[i])
        $edgeTable.append('<tr><td>'+i+'</td><td>'+edges[i].from+'</td><td>'+edges[i].to+'</td><td>'+Math.round(edges[i].distance*1000)+'</td></tr>');
    }
    $edgeTableContainer.append($edgeTable);
    $('.popup-show').show();
}
$('.popup-close').click(function(){
    $('.overlay').fadeOut();
})

$('.popup-show').click(function(){
    $('.overlay').fadeIn();
})

function initmap() {
    fillTable(100);
    // set up the map
    map = new L.Map('map',{renderer:L.canvas(),zoomControl:false});

    // create the tile layer with correct attribution
    var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, { minZoom: 8, maxZoom: 22, attribution: osmAttrib });
    const polylineOptions={color:'red',smoothFactor:2.0};
    let routeFrom=[];
    let routeTo=[];
    let fromSelected=false;
    let fromMarker;
    let toMarker;

    // start the map in South-East England
    map.setView(new L.LatLng(53.0752, 8.8067), 16);
    map.addLayer(osm);

    $('.route-from-close').click(function(){
        map.removeLayer(fromMarker);
        fromMarker=null;
        $('.route-from').addClass('empty');
        $('.route-from').empty();
        fromSelected=false;
        $('.route-from-close').hide();
    })

    $('.route-to-close').click(function(){
        map.removeLayer(toMarker);
        toMarker=null;
        $('.route-to').addClass('empty');
        $('.route-to').empty();
        $('.route-to-close').hide();
    })

    

    map.on('click', function(e) { 
        if(!fromSelected){
            routeFrom=[e.latlng.lat,e.latlng.lng];
            $('.route-from').html('lat:'+Math.round(e.latlng.lat*1000)/1000+' lng:'+Math.round(e.latlng.lng*1000)/1000);
            $('.route-from').removeClass('empty');
            $('.top-left').fadeIn();
            fromSelected=true;
            if(fromMarker==null) fromMarker=L.marker([e.latlng.lat,e.latlng.lng],{draggable:true}).addTo(map);
            else fromMarker.setLatLng(e.latlng);
            $(fromMarker._icon).css('filter','hue-rotate(270deg)');
            $('.route-from-close').show();
        }else{
            routeTo=[e.latlng.lat,e.latlng.lng];
            $('.route-to').html('lat:'+Math.round(e.latlng.lat*1000)/1000+' lng:'+Math.round(e.latlng.lng*1000)/1000);
            $('.route-to').removeClass('empty');
            if(toMarker==null) toMarker=L.marker([e.latlng.lat,e.latlng.lng],{draggable:true}).addTo(map);
            else toMarker.setLatLng(e.latlng);
            $('.route-to-close').show();
        }
        // var requestform = e.latlng;
        // var formpopup = L.popup()
        // .setLatLng(requestform)
        // .setContent('lat: ' + e.latlng.lat + 
        //             'lon: '+e.latlng.lng) 
        // .openOn(map);
    });

    // create a red polyline from an array of LatLng points
    let zoom1=[];
    let zoom2=[];
    let zoom3=[];
    console.log('ways')
    console.log(ways)
    for(let i=0;i<ways.length;i++){
        let polylinePoints=[];
        for(let j=0;j<ways[i].nodeRefs.length;j++){
            let ref1=ways[i].nodeRefs[j];
            try{
                polylinePoints.push([nodes[nodeIdMap[ref1]].lat,nodes[nodeIdMap[ref1]].lon]);
            }catch(err){
                console.log(ref1);
                console.log(nodes[nodeIdMap[ref1]].lat)
                console.log(nodes[nodeIdMap[ref1]].lon)
            }
            
        }
        let p=L.polyline(polylinePoints, polylineOptions);
        if(categoriesZoom1.includes(ways[i].tags.highway)){
            zoom1.push(p);
        }
        else if(categoriesZoom2.includes(ways[i].tags.highway)){
            zoom2.push(p);
        }
        else if(categoriesZoom3.includes(ways[i].tags.highway)){
            zoom3.push(p);
        }
        // if(categoriesZoom1.includes(edges[i].tags.highway)){
        //     var latlngs = [
        //         [nodes[nodeIdMap[edges[i].from]].lat, nodes[nodeIdMap[edges[i].from]].lon],
        //         [nodes[nodeIdMap[edges[i].to]].lat, nodes[nodeIdMap[edges[i].to]].lon]
        //     ];
        //     let polyline=L.polyline(latlngs, polylineOptions).bindPopup('distance:'+edges[i].distance);
        //     zoom1.push(polyline);
        // }
        // else if(categoriesZoom2.includes(edges[i].tags.highway)){
        //     var latlngs = [
        //         [nodes[nodeIdMap[edges[i].from]].lat, nodes[nodeIdMap[edges[i].from]].lon],
        //         [nodes[nodeIdMap[edges[i].to]].lat, nodes[nodeIdMap[edges[i].to]].lon]
        //     ];
        //     let polyline=L.polyline(latlngs, polylineOptions).bindPopup('distance:'+edges[i].distance);
        //     zoom2.push(polyline);
        // }
        // else if(categoriesZoom3.includes(edges[i].tags.highway)){
        //     var latlngs = [
        //         [nodes[nodeIdMap[edges[i].from]].lat, nodes[nodeIdMap[edges[i].from]].lon],
        //         [nodes[nodeIdMap[edges[i].to]].lat, nodes[nodeIdMap[edges[i].to]].lon]
        //     ];
        //     let polyline=L.polyline(latlngs, polylineOptions).bindPopup('distance:'+edges[i].distance);
        //     zoom3.push(polyline);
        // }
        
        
        // zoom the map to the polyline
        // map.fitBounds(polyline.getBounds());
    
    }

    let layer1=L.layerGroup(zoom1);
        let layer2=L.layerGroup(zoom2);
        let layer3=L.layerGroup(zoom3);
        map.addLayer(layer1)
        map.addLayer(layer2)
        map.addLayer(layer3)

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
            if (map.getZoom() >= 13){
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
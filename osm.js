var logEle = document.getElementById("log");


function fillTable(entries) {
    let $content = $('.popup-content');
    let $table = $(document.createElement('table'));
    $table.html('<tr><td>Typ</td><td>Anzahl</td></tr>');
    $table.css('text-align', 'center')
    $table.css('table-layout', 'fixed');
    $table.css('width', '100%');
    $content.append($table);
    // let types = {};
    // for (way of ways) {
    //     if (types[way.tags.highway]) types[way.tags.highway]++;
    //     else types[way.tags.highway] = 1;
    // }
    // $table.append('<tr><td>Knoten</td><td>' + nodes.length + '</td></tr>')
    // for (type in types) {
    //     $table.append('<tr><td>' + type + '</td><td>' + types[type] + '</td></tr>')
    // }

    // $nodeTableContainer=$(document.createElement('td'));
    // $nodeTableContainer.css('border-right','1px solid #333');
    // $nodeTableContainer.css('width','50%');
    // $tables.append($nodeTableContainer);
    // let $nodeTable=$(document.createElement('table'));
    // $nodeTable.html('<td>id</td><td>lat</td><td>lon</td>');
    // for(let i=0;i<Math.min(entries,nodes.length);i++){
    //     $nodeTable.append('<tr><td>'+nodes[i].id+'</td><td>'+nodes[i].lat+'</td><td>'+nodes[i].lon+'</td></tr>');
    // }
    // $nodeTableContainer.append($nodeTable);
    // $edgeTableContainer=$(document.createElement('td'));
    // $tables.append($edgeTableContainer);
    // let $edgeTable=$(document.createElement('table'));
    // $edgeTable.html('<td>index</td><td>from node</td><td>to node</td><td>distance (m)</td>');
    // for(let i=0;i<Math.min(entries,edges.length);i++){
    //     $edgeTable.append('<tr><td>'+i+'</td><td>'+edges[i].from+'</td><td>'+edges[i].to+'</td><td>'+Math.round(edges[i].distance*1000)+'</td></tr>');
    // }
    // $edgeTableContainer.append($edgeTable);
    $('.popup-show').show();
}
$('.popup-close').click(function () {
    $('.overlay').fadeOut();
})

$('.popup-show').click(function () {
    $('.overlay').fadeIn();
})

function dijkstra(startNodeId, endNodeId) {
    let distances = [];
    let previous = [];
    let visited = [];
    let neighborEdges = [];
    let currentNode;
    let bestSolution = Number.MAX_SAFE_INTEGER;
    let maxDist = 10 * distance(nodes[nodeIdMap[startNodeId]].lat, nodes[nodeIdMap[startNodeId]].lon, nodes[nodeIdMap[endNodeId]].lat, nodes[nodeIdMap[endNodeId]].lon);
    console.log('maxdist:' + maxDist)
    distances[nodeIdMap[startNodeId]] = 0;
    addToQueue(startNodeId, 0);
    while (queue.length > 0 ? (queue[0][1] < Math.min(bestSolution, maxDist)) : false) {
        currentNode = queue.shift()[0];
        if (!visited[nodeIdMap[currentNode]]) {
            neighborEdges = [];
            for (let i = offsetArray[nodeIdMap[currentNode]]; i < offsetArray[nodeIdMap[currentNode] + 1]; i++) {
                if (!visited[nodeIdMap[edges[offsetEdges[i]].to]]) {
                    neighborEdges.push(offsetEdges[i]);
                }
            }
            for (let i = 0; i < neighborEdges.length; i++) {

                let newDistance = distances[nodeIdMap[edges[neighborEdges[i]].from]] + edges[neighborEdges[i]].distance;
                let oldDistance = distances[nodeIdMap[edges[neighborEdges[i]].to]] || Number.MAX_SAFE_INTEGER;
                if (newDistance < oldDistance) {
                    distances[nodeIdMap[edges[neighborEdges[i]].to]] = newDistance;
                    previous[nodeIdMap[edges[neighborEdges[i]].to]] = (previous[nodeIdMap[edges[neighborEdges[i]].from]] || []).concat([neighborEdges[i]]);
                    if (edges[neighborEdges[i]].to == endNodeId) {
                        bestSolution = newDistance;
                    } else {
                        addToQueue(edges[neighborEdges[i]].to, distances[nodeIdMap[edges[neighborEdges[i]].to]]);
                    }
                }

            }
            visited[nodeIdMap[currentNode]] = true;
        }
    }
    if (previous[nodeIdMap[endNodeId]] == null) {
        console.log('no path found')
    }
    queue = [];
    return [previous[nodeIdMap[endNodeId]], bestSolution];
}

function drawPath(edgeIndices) {
    let startPolylinePoints = [fromLatLon, [nodes[nodeIdMap[edges[edgeIndices[0]].from]].lat, nodes[nodeIdMap[edges[edgeIndices[0]].from]].lon]];
    let endPolylinePoints = [[nodes[nodeIdMap[edges[edgeIndices[edgeIndices.length - 1]].to]].lat, nodes[nodeIdMap[edges[edgeIndices[edgeIndices.length - 1]].to]].lon], toLatLon]
    let polylinePoints = [];
    polylinePoints.push([nodes[nodeIdMap[edges[edgeIndices[0]].from]].lat, nodes[nodeIdMap[edges[edgeIndices[0]].from]].lon]);
    for (let i = 0; i < edgeIndices.length; i++) {
        polylinePoints.push([nodes[nodeIdMap[edges[edgeIndices[i]].to]].lat, nodes[nodeIdMap[edges[edgeIndices[i]].to]].lon]);
    }
    if (map.hasLayer(routeLayer)) map.removeLayer(routeLayer)
    routeLine = L.polyline(polylinePoints, { color: 'blue', smoothFactor: 2.0 });
    let startLine = L.polyline(startPolylinePoints, { color: 'blue', smoothFactor: 2.0, dashArray: '3 10' });
    let endLine = L.polyline(endPolylinePoints, { color: 'blue', smoothFactor: 2.0, dashArray: '3 10' });
    routeLayer = L.layerGroup([startLine, routeLine, endLine]);
    map.addLayer(routeLayer)

}


// [[id,weight],[id,weight],...]
function addToQueue(nodeId, weight) {
    for (let i = 0; i < queue.length; i++) {
        let item = queue[i];
        if (item[1] > weight) {
            queue.splice(i, 0, [nodeId, weight]);
            return;
        }
        if (item[0] == nodeId) return;
    }
    queue.push([nodeId, weight]);
}

function initmap() {
    $('#map').removeClass('hidden')
    fillTable(100);
    // set up the map
    map = new L.Map('map', { renderer: L.canvas(), zoomControl: false });

    // create the tile layer with correct attribution
    var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, { minZoom: 5, maxZoom: 19, attribution: osmAttrib });
    const polylineOptions = { color: 'red', smoothFactor: 2.0 };
    let fromSelected = false;
    let fromMarker;
    let fromPointMarker;
    let toPointMarker;
    let toMarker;

    // start the map in South-East England
    map.setView(new L.LatLng(53.0752, 8.8067), 16);
    map.addLayer(osm);

    $('.route-from-close').click(function () {
        map.removeLayer(fromMarker);
        fromMarker = null;
        $('.route-from').addClass('empty');
        $('.route-from').empty();
        fromSelected = false;
        $('.route-from-close').hide();
    })

    $('.route-to-close').click(function () {
        map.removeLayer(toMarker);
        toMarker = null;
        $('.route-to').addClass('empty');
        $('.route-to').empty();
        $('.route-to-close').hide();
    })


    function updateMarkers(e) {
        let pointId = getClosestPoint(e.latlng.lat, e.latlng.lng, getClosePoints(e.latlng.lat, e.latlng.lng));
        let point = nodes[nodeIdMap[pointId]];

        if (!fromSelected) {
            routeFrom = pointId;
            fromLatLon = e.latlng;
            $('.route-from').html('lat:' + Math.round(e.latlng.lat * 1000) / 1000 + ' lng:' + Math.round(e.latlng.lng * 1000) / 1000);
            $('.route-from').removeClass('empty');
            $('.top-left').fadeIn();
            fromSelected = true;
            if (fromMarker == null) {
                fromMarker = L.marker([e.latlng.lat, e.latlng.lng], { draggable: true }).addTo(map);
                fromMarker.on('dragend', function (e) {
                    fromSelected = false;
                    var marker = e.target;
                    var position = marker.getLatLng();
                    e.latlng = position;
                    updateMarkers(e);
                })
            } else fromMarker.setLatLng(e.latlng);
            $(fromMarker._icon).css('filter', 'hue-rotate(270deg)');
            $('.route-from-close').show();

        } else {
            routeTo = pointId;
            toLatLon = e.latlng;
            $('.route-to').html('lat:' + Math.round(e.latlng.lat * 1000) / 1000 + ' lng:' + Math.round(e.latlng.lng * 1000) / 1000);
            $('.route-to').removeClass('empty');
            if (toMarker == null) {
                toMarker = L.marker([e.latlng.lat, e.latlng.lng], { draggable: true }).addTo(map);
                toMarker.on('dragend', function (e) {
                    fromSelected = true;
                    var marker = e.target;
                    var position = marker.getLatLng();
                    e.latlng = position;
                    updateMarkers(e);
                })
            } else toMarker.setLatLng(e.latlng);
            $('.route-to-close').show();

        }
        if (routeFrom != null && (routeTo != null)) {
            let d = dijkstra(routeFrom, routeTo);
            console.log(d)
            if (d[0]) drawPath(d[0]);
        }
        // var requestform = e.latlng;
        // var formpopup = L.popup()
        // .setLatLng(requestform)
        // .setContent('lat: ' + e.latlng.lat + 
        //             'lon: '+e.latlng.lng) 
        // .openOn(map);
    }

    map.on('click', function (e) {
        updateMarkers(e)
    });

    // create a red polyline from an array of LatLng points
    let zoom1 = [];
    let zoom2 = [];
    let zoom3 = [];
    let i = 0;
    for (let i = 0; i < ways.length; i++) {
        let polylinePoints = [];
        for (let j = 0; j < ways[i].nodeRefs.length; j++) {
            let ref1 = ways[i].nodeRefs[j];
            try {
                polylinePoints.push([nodes[nodeIdMap[ref1]].lat, nodes[nodeIdMap[ref1]].lon]);
            } catch (err) {
                console.log(ref1);
                console.log(nodes[nodeIdMap[ref1]].lat)
                console.log(nodes[nodeIdMap[ref1]].lon)
            }

        }
        let p = L.polyline(polylinePoints, polylineOptions);
        // if(categoriesZoom1.includes(ways[i].tags.highway)){
        //     zoom1.push(p);
        // }
        // else if(categoriesZoom2.includes(ways[i].tags.highway)){
        //     zoom2.push(p);
        // }
        // else if(categoriesZoom3.includes(ways[i].tags.highway)){
        //     zoom3.push(p);
        // }

    }

    let layer1 = L.layerGroup(zoom1);
    let layer2 = L.layerGroup(zoom2);
    let layer3 = L.layerGroup(zoom3);
    map.addLayer(layer1)
    map.addLayer(layer2)
    map.addLayer(layer3)

    map.on('zoomend', function () {
        console.log(map.getZoom())
        if (map.getZoom() < 10) {
            if (map.hasLayer(layer2)) {
                map.removeLayer(layer2);
            }
            if (map.hasLayer(layer3)) {
                map.removeLayer(layer3);
            }
        }
        if (map.getZoom() >= 10) {
            if (!map.hasLayer(layer2)) {
                map.addLayer(layer2)
            }
            if (map.hasLayer(layer3)) {
                map.removeLayer(layer3);
            }
        }
        if (map.getZoom() >= 13) {
            if (!map.hasLayer(layer2)) {
                map.addLayer(layer2)
            }
            if (!map.hasLayer(layer3)) {
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
    contractedEdges = [],
    dimensions = { xMin: null, xMax: null, yMin: null, yMax: null },
    gridDX = null,
    gridDY = null,
    pointDistanceGrid = [],
    sortedEdges = [],
    queue = [],
    routeFrom,
    routeTo,
    toLatLon,
    fromLatLon,
    routeLine,
    routeLayer,
    a = false,
    b = false,
    validNodeIds = {},
    parseDone=true,
    nodesDone=true,
    edgesDone=true,
    cNodes=0,
    cWays = 0,
    cRels = 0,
    bounds = [],
    cEdges=0;
const gridStepsX = 3000,
    gridStepsY = 3000;

function parseInfoLoop(){
    if(!parseDone){
        $('#parse-text').html('Parsing... ('+(cWays+cNodes)+')');
        setTimeout(parseInfoLoop,200);
    }
}

function nodesInfoLoop(){
    if(!nodesDone){
        $('#nodes-text').html('Parsing... ('+(cNodes)+')');
        setTimeout(parseInfoLoop,200);
    }
}

function edgesInfoLoop(){
    if(!nodesDone){
        $('#edges-text').html('Parsing... ('+(cEdges)+')');
        setTimeout(parseInfoLoop,200);
    }
}

function parse(file) {
    parseDone=false;
    cNodes = 0;
    cWays = 0;
    cRels = 0;
    bounds = [];
    parseInfoLoop();

    console.log('parsing "' + file.name + '" ...');

    pbfParser.parse({
        file: file,
        endDocument: function () {
            pbfParser.parse({
                file: file,
                endDocument: function () {
                    parseDone=true;
                    $('#parse-text').html('Parsing... ('+(cWays+cNodes)+')');
                    saveNodes();
                    // saveNodesAsText();
                    // getEdges();
                },
                node: function (node) {
                    if (validNodeIds[node.id]) {
                        nodes.push({
                            id:node.id,
                            newId:cNodes,
                            lat:node.lat,
                            lon:node.lon
                        });
                        cNodes++;
                    }
                },
                error: function (msg) {
                    console.log('error: ' + msg);
                    throw msg;
                }
            });
        },
        way: function (way) {
            if (way.tags.highway) {
                if(way.tags.highway!='footway' && way.tags.highway!='cycleway' && way.tags.highway!='path'){
                    
                    ways.push({
                        id:way.id,
                        nodeRefs:way.nodeRefs
                    });
                    cWays++;
                    for (let nr of way.nodeRefs) {
                        validNodeIds[nr] = true;
                    }
                }   
                
            }
        },
        error: function (msg) {
            log('error: ' + msg);
            throw msg;
        }
    });
}

function saveNodesAsString(){
    let l = nodes.length;
    let s = [];
    let step = 500000;
    for (let i = 0; i < l; i += step) {
        s.push(JSON.stringify(nodes.slice(i, Math.min(i + step, l))))
        console.log(i + '/' + l)
    }
    console.log(l + '/' + l)
    saveText(s,'nodes.data','Nodes');
    saveWaysAsText();
}

function saveNodes() {
    
    let buffer=new ArrayBuffer(nodes.length*12);
    let view=new Uint32Array(buffer);
    let separator=12345;
    let index=0;
    for(let node of nodes){
        view[index]=parseInt(node.id);
        index++;
        view[index]=Math.round(node.lat*10000000);
        index++;
        view[index]=Math.round(node.lon*10000000);
        index++;
        // if(node.tags){
        //     if(node.tags.highway){
        //         for(let i=0;i<node.tags.highway.length;i++){
        //             view[index]=node.tags.highway.charCodeAt(i);
        //             index++;
        //         }
        //     }
        // }
        // view[index]=separator;
        // index++;
    }
    saveArr(view, 'nodes.data', 'Nodes');
    
    getEdges();
}

function saveEdges() {
    
    let buffer=new ArrayBuffer(edges.length*8);
    let view=new Uint32Array(buffer);
    let separator=12345;
    let index=0;
    for(let edge of edges){
        view[index]=parseInt(edge.from);
        index++;
        view[index]=parseInt(edge.to);
        index++;
    }
    saveEdgesArr(view, 'edges.data', 'Edges');
}

// function saveWays() {
    
//     let buffer=new ArrayBuffer(50000000);
//     let view=new Uint32Array(buffer);
//     let separator=12345;
//     let index=0;
//     for(let way of ways){
//         view[index]=parseInt(way.id);
//         index++;
//         view[index]=Math.round(way.lat*10000000);
//         index++;
//         view[index]=Math.round(way.lon*10000000);
//         index++;
//         view[index]=separator;
//         index++;
//     }
//     saveArr(view, 'ways.data', 'download ways');
    
// }

function handleEdgesFile() {
    edges=[];
    console.log('hello handle')
    let file = this.files[0];
    let reader = new FileReader();
    reader.onload = function () {
        console.log('reader result')
        console.log(reader.result)
        let view=new Uint32Array(reader.result);
        // for(let i=0;i<50;i++){
        //     console.log(view[i])
        // }
        let index=0;
        for(let i=0;i<view.length/2;i++){
            if(view[index]==0) break;
            let edge={};
            edge.from=view[index];
            index++;
            edge.to=view[index];
            index++;
            edges.push(edge);
            edges.push({from:edge.to,to:edge.from});
        }
        $('#ways-block').removeClass('false');
        $('#ways-block').addClass('true');
        $('#ways-icon').removeClass('fa-times');
        $('#ways-icon').addClass('fa-check');
        $('#edges-text').html('Open Edges File');
    }
    reader.readAsArrayBuffer(file)
}

function handleNodesFile2() {
    nodes=[];
    console.log('hello handle')
    let file = this.files[0];
    let reader = new FileReader();
    reader.onload = function () {
        console.log('reader result')
        console.log(reader.result)
        let view=new Uint32Array(reader.result);
        // for(let i=0;i<50;i++){
        //     console.log(view[i])
        // }
        let index=0;
        for(let i=0;i<view.length/3;i++){
            if(view[index]==0) break;
            let node={};
            node.id=view[index];
            index++;
            node.lat=view[index]/10000000.0;
            index++;
            node.lon=view[index]/10000000.0;
            // index++;
            // node.highway='';
            // while(view[index]!=12345 && index<view.length){
            //     node.highway+=String.fromCharCode(view[index]);
            //     index++;
            // }
            index++;
            nodes.push(node);
        }
        console.log(nodes)
        $('#nodes-block').removeClass('false');
        $('#nodes-block').addClass('true');
        $('#nodes-icon').removeClass('fa-times');
        $('#nodes-icon').addClass('fa-check');
        $('#nodes-text').html('Open Nodes File');
    }
    reader.readAsArrayBuffer(file)
}

function saveEdgesArr(buffer,filename,label){
    var a = document.createElement('a');
    let b=new Blob([buffer.buffer],{
        type:'application/octet-stream'
    });
    a.setAttribute('href', URL.createObjectURL(b));
    a.setAttribute('download', filename);
    a.innerHTML = label;
    $('.mini-block .right').empty();
    let em=$(document.createElement('em'));
    em.addClass('fas fa-download');
    $('.mini-block .right').append(em)
    $('.mini-block .right').append(a);
    requestAnimationFrame(function(){
        $('.mini-block').removeClass('hidden');
    }) 
}

function saveArr(buffer,filename,label){
    var a = document.createElement('a');
    let b=new Blob([buffer.buffer],{
        type:'application/octet-stream'
    });
    a.setAttribute('href', URL.createObjectURL(b));
    a.setAttribute('download', filename);
    a.innerHTML = label;
    $('.mini-block .left').empty();
    let em=$(document.createElement('em'));
    em.addClass('fas fa-download');
    $('.mini-block .left').append(em)
    $('.mini-block .left').append(a);
}

function saveText(text, filename, label) {
    var a = document.createElement('a');
    a.setAttribute('href', URL.createObjectURL(new Blob(text, {
        type: "application/octet-stream"
    })));
    a.setAttribute('download', filename);
    a.innerHTML = '<em class="fas fa-download"></em>'+label;
    $('.mini-block .right').empty();
    // let em=$(document.createElement('em'));
    // em.addClass('fas fa-download');
    // $('.mini-block .right').append(em)
    $('.mini-block .right').append(a);
    requestAnimationFrame(function(){
        $('.mini-block').removeClass('hidden');
    }) 

}


function saveWaysAsText() {
    let l = ways.length;
    let s = [];
    
    // let step = 500000;
    // for (let i = 0; i < l; i += step) {
    //     s.push(JSON.stringify(ways.slice(i, Math.min(i + step, l))))

    // }
    s.push(JSON.stringify(ways))
    // console.log(l + '/' + l)
    saveText(s, 'ways.data', 'Ways');
    $('#parse-text').html('Parse Map File')
}






function getEdges() {
    let addedNodes = [];
    console.log('get edges')
    for (let i = 0; i < ways.length; i++) {
        for (let j = 0; j < ways[i].nodeRefs.length - 1; j++) {
            if (ways[i].oneway != null) console.log('oh')
            edges.push({
                from: ways[i].nodeRefs[j],
                to: ways[i].nodeRefs[j + 1]
            })
        }
    }
    console.log('get edges done')
    console.log(edges)
    saveEdges();
    // requestAnimationFrame(buildOffsetArray);

}

function calc(){
    console.log('hey calc')
    $('#calc-text').html('Dijkstra Calculations (1/5)');
    setTimeout(buildOffsetArray,200);
}

function go(){
    $('.center').fadeOut(2000);
    initmap();
}

function buildOffsetArray() {
    // fill nodeIdMap
    console.log('nodeidmap')
    for (let i = 0; i < nodes.length; i++) {
        nodeIdMap[nodes[i].id] = i;
        offsetArray[i] = 0;
    }
    console.log('-')
    for (let i = 0; i < edges.length; i++) {
        offsetArray[nodeIdMap[edges[i].from] + 1]++;
    }
    // sum up offset indices
    console.log('offset indices')
    let sum = 0;
    for (let i = 0; i < offsetArray.length; i++) {
        sum += offsetArray[i];
        offsetArray[i] = sum;
    }
    $('#calc-text').html('Dijkstra Calculations (2/5)');
    setTimeout(buildOffsetEdges,200);
}

function buildOffsetEdges() {
    console.log('offset edges')
    let minPos = 0;
    for (let i = 0; i < edges.length; i++) {
        minPos = offsetArray[nodeIdMap[edges[i].from]];
        while (offsetEdges[minPos] != null) minPos++;
        offsetEdges[minPos] = i;
    }
    console.log('offset edges done')
    $('#calc-text').html('Dijkstra Calculations (3/5)');
    setTimeout(calculateAllDistances,200);
}

function contractEdges() {
    for (let i = 0; i < nodes.length; i++) {
        if (offsetArray[nodeIdMap[i] + 1] - offsetArray[nodeIdMap[i]] == 1) {
            if (offsetArray[nodeIdMap[edges[offsetArray[nodeIdMap[i] + 1]].to]] - offsetArray[nodeIdMap[edges[offsetArray[nodeIdMap[i]]].to]] == 1) {

            }
        }
    }
}

function calculateAllDistances() {
    console.log('calculate distances')
    for (let i = 0; i < edges.length; i++) {
        if (nodes[nodeIdMap[edges[i].from]] && nodes[nodeIdMap[edges[i].to]]) {
            edges[i].distance = distance(nodes[nodeIdMap[edges[i].from]].lat, nodes[nodeIdMap[edges[i].from]].lon, nodes[nodeIdMap[edges[i].to]].lat, nodes[nodeIdMap[edges[i].to]].lon);
        }
    }
    // console.log(edges);
    $('#calc-text').html('Dijkstra Calculations (4/5)');
    setTimeout(buildPointDistanceGrid,200);
}

function buildPointDistanceGrid() {
    getMapDimensions();
    for (let i = 0; i < gridStepsX; i++) {
        pointDistanceGrid[i] = [];
        for (let j = 0; j < gridStepsY; j++) {
            pointDistanceGrid[i][j] = [];
        }1042/862
    }
    let node = {};
    let c=0;
    for (let i = 0; i < nodes.length; i++) {
        node = nodes[i];
        xIndex = Math.floor((node.lon - dimensions.xMin) / gridDX);
        yIndex = Math.floor((node.lat - dimensions.yMin) / gridDY);
        pointDistanceGrid[xIndex][yIndex].push(node.id);
        c++;
    }
    $('#calc-text').html('Dijkstra Calculations (5/5)');
    $('#calc-block').removeClass('false');
    $('#calc-block').addClass('true');
    $('#calc-icon').removeClass('fa-times');
    $('#calc-icon').addClass('fa-check');

    $('#go-block').removeClass('false');
    $('#go-block').addClass('true');
}

function getClosestPoint(lat, lon, nodeIds) {
    let minDist = Number.MAX_SAFE_INTEGER;
    let minNode = null;
    for (id of nodeIds) {
        let node = nodes[nodeIdMap[id]];
        let dist = distance(lat, lon, node.lat, node.lon);
        if (dist < minDist) {
            minDist = dist;
            minNode = id;
        }
    }
    console.log('minDist: ' + minDist)
    return minNode;
}

function getClosePoints(lat, lon) {
    
    let xIndex = Math.floor((lon - dimensions.xMin) / gridDX);
    let yIndex = Math.floor((lat - dimensions.yMin) / gridDY);
    console.log('get close points')
    console.log(xIndex)
    console.log(yIndex)
    console.log(pointDistanceGrid)
    let points = [];
    for (let i = Math.max(0, xIndex - 1); i <= Math.min(gridStepsX - 1, xIndex + 1); i++) {
        for (let j = Math.max(0, yIndex - 1); j <= Math.min(gridStepsY - 1, yIndex + 1); j++) {
            console.log('i:' + i + ' j:' + j)
            points = points.concat(pointDistanceGrid[i][j]);
        }
    }
    console.log(points)
    return points;
}

function getMapDimensions() {
    let minLat = Number.MAX_SAFE_INTEGER;
    let minLon = Number.MAX_SAFE_INTEGER;
    let maxLat = 0;
    let maxLon = 0;
    for (node of nodes) {
        if (node.lat > maxLat) maxLat = node.lat;
        if (node.lat < minLat) minLat = node.lat;
        if (node.lon > maxLon) maxLon = node.lon;
        if (node.lon < minLon) minLon = node.lon;
    }
    dimensions = { xMin: minLon, xMax: maxLon + 0.01, yMin: minLat, yMax: maxLat + 0.01 };
    gridDX = (dimensions.xMax - minLon) / 2000;
    gridDY = (dimensions.yMax - minLat) / 2000;
    console.log('dimensions')
    console.log(dimensions)
}

function handleFile() {
    $('#parse-text').html('Parsing...');
    var file = this.files[0];
    parse(file);
}



function parseNodes(file) {
    console.log('parse nodes')
    console.log(file)
}

function handleWaysFile() {
    console.log('hello handle ways')
    let file = this.files[0];
    let reader = new FileReader();
    reader.onload = function () {
        console.log('done')
        ways = JSON.parse(reader.result)
        console.log('ways done')
        console.log(ways)
        $('#ways-block').removeClass('false');
        $('#ways-block').addClass('true');
        $('#ways-icon').removeClass('fa-times');
        $('#ways-icon').addClass('fa-check');
        getEdges();
    }
    reader.readAsText(file)
}

function handleNodesFile() {
    console.log('hello handle nodes')
    let file = this.files[0];
    console.log(file)
    let reader = new FileReader();
    reader.onload = function () {
        console.log('done')
        nodes = JSON.parse(reader.result)
        console.log('nodes done')
        console.log(nodes)
    }
    reader.readAsText(file)
}


document.getElementById("file").addEventListener("change", handleFile, false);
document.getElementById("nodes").addEventListener("change", handleNodesFile2, false);
document.getElementById("ways").addEventListener("change", handleEdgesFile, false);
document.getElementById("calc-button").addEventListener("click", calc);
document.getElementById("go-button").addEventListener("click", go);


function distance(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}
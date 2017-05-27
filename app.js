var t = [];
var finalGroup = 0;
var colors = [];
var selected = [];
var elements = [];
var links = [];
var n  = 0;
var graphToAlg = [];


const onClick = d => {
    if (selected.length < 2 && selected[0] !==  d.id) {
        selected.push(d.id);
    } else {
        selected = [];
    }

    if(selected.length === 2) {
        addRel(selected[0], selected[1]);
        selected = [];
    }
};

const DFSprint = (i, visited, graph, results) => {
    if(!visited[i]) {
        visited[i] = true;
        results.push(i);
    }

    if (graph[i]) {
        graph[i].forEach(el => {
            if (!visited[el]) {
                DFSprint(el, visited, graph, results)
            }
        });
    }
};


const DFSstack = (i, visited, stack, graph) => {
    visited[i] = true;
    graph[i].forEach(el => {
        if (!visited[el]) {
            DFSstack(el, visited, stack, graph);
        }
    });

    stack.push(i);
};


const printSCCs = graph => {


    let stack = [];
    let visited = graph.map(x => false);

    for (let i = 0; i < graph.length; i++) {
        if (!visited[i]) {
            DFSstack(i, visited, stack, graph);
        }
    }

    let graph2 = [];
    for (let i = 0; i < graph.length; i++) {
        graph[i].forEach(j => {
            if (!Array.isArray(graph2[j])) {
                graph2[j] = [];
            }
            graph2[j].push(i);
        });
    }


    visited = graph2.map(x => false);
    const ile = stack.length;
    let results =  [];
    for(let i = 0; i< ile; i++) {
        const s = stack.pop();

        if(!visited[s]) {
            DFSprint(i ,visited, graph2, results);
            results.push(null);
        }
    }


    for(let i = 0; i< ile; i++) {
        if(results.indexOf(i) < 0) {
            results.push(i);
            results.push(null);
        }
    }

    i = 0;

    results.forEach(r => {
        if(r !== null) {
        t[r] = i;
    } else {
        i++;
    }
});

    colors = d3.scaleLinear().domain([0,i])
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

    let macierz = [];

    for(let n = 0; n < i; n++) {
        macierz[n] = [];
        for(let m = 0; m < i; m++) {
            macierz[n][m] = 0;
        }
    }


    graph2.forEach((l,i) => {
        l.forEach(j => {
            if (t[i] !== t[j]) {
                macierz[t[i]][t[j]] = 1;
                macierz[t[j]][t[i]] = 1;
            }
         })
    });

    finalGroup = macierz.reduce((p,c) => {
        const ile = c.filter(x => x).length;
        if(p > ile) return ile;
        return p;
    }, 0);
};


const svg = d3.select("svg");
const width = 500;
const height = 500;

const simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force("link", d3.forceLink().id(function (d) {return d.id;}).distance(100).strength(0.5))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(function(d) { return d.r + 0.5; }).iterations(5))


svg.append('defs').append('marker')
    .attrs({'id':'arrowhead',
        'viewBox':'-0 -5 10 10',
        'refX':13,
        'refY':0,
        'orient':'auto',
        'markerWidth':13,
        'markerHeight':13,
        'xoverflow':'visible'})
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#000')
    .style('stroke','none');



const ticked = () => {
    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y );
    node.attr("transform", d => 'translate(' +d.x + ',' + d.y +')')
};


const dragstarted = d => {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
};

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}



window.add = function() {
    elements.push({
        id: n
    });
    graphToAlg[n] = [];
    n++;
    draw();
};

window.addRel = function(x, y) {
    links.push({
        source: x,
        target: y
    });
    graphToAlg[x].push(y);
    draw();
};


const draw = () => {
    printSCCs(graphToAlg);
    svg.selectAll("g").remove().exit();

    link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke", '#000')
        .attr("stroke-width", 2)
        .attr('marker-end','url(#arrowhead)');

    node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(elements)
        .enter().append("g")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));


    node.append("circle").attr('r', 20)
        .attr("fill", d => colors(t[d.id]))
    .attr("stroke-width", 5)
        .attr("stroke", d => t[d.id] === finalGroup ? '#000' : 'none' )
    .on("click", onClick);
    node.append("text")
        .attr('dy', 5)
        .attr('dx', 0)
        .attr('fill', '#000')
        .text(r => r.id)
    .on("click", onClick);

    simulation.nodes(elements).on("tick", ticked);
    simulation.force("link").links(links);
    simulation.force("center").x(250).y(250);
    simulation.alpha(0.3).restart();
};


svg.on('dblclick', add);
let transponowaneWyniki = [];
let colors = [];
let selected = [];
let elements = [];
let links = [];
let n  = 0;
let graphToAlg = [];
let isPrimary = [];

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
   visited[i] = true;
   results.push(i);

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

    // transpozycja grafu
    let graph2 = graph.map(x => []);
    for (let i = 0; i < graph.length; i++) {
        graph[i].forEach(j => graph2[j].push(i));
    }

    visited = graph.map(x => false);
    let results =  [];
    let tempResult = [];


    while(stack.length) {
        const s = stack.pop();

        if(!visited[s]) {
            DFSprint(s ,visited, graph2, tempResult);
            results.push(tempResult);
            tempResult = [];
        }
    }

    colors = d3.scaleLinear().domain([0,results.length])
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

    transponowaneWyniki = [];

    results.forEach((el, i) => {
        el.forEach(j => transponowaneWyniki[j] = i)
    });

    let macierz = [];
    let i = results.length;

    for(let n = 0; n < i; n++) {
        macierz[n] = [];
        for(let m = 0; m < i; m++) {
            macierz[n][m] = 0;
        }
    }

    graph2.forEach((l,i) => {
        l.forEach(j => {
            if (transponowaneWyniki[i] !== transponowaneWyniki[j]) {
                macierz[transponowaneWyniki[i]][transponowaneWyniki[j]] = 1;
                macierz[transponowaneWyniki[j]][transponowaneWyniki[i]] = 1;
            }
         })
    });

    let m = macierz.map(m => m.filter(x => x).length).reduce((p, c) => {
        if (c > p) {
            p = c;
        }
        return p;
    }, 0);

    isPrimary = macierz.map(row => row.filter(x => x).length === m);
};


const svg = d3.select("svg");
const width = 500;
const height = 500;

const simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('link', d3.forceLink().id(function (d) {return d.id;}).distance(100).strength(0.1))
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(function(d) { return d.r + 0.5; }).iterations(5))


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
    link.attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y );
    node.attr('transform', d => 'translate(' +d.x + ',' + d.y +')')
};


const dragstarted = d => {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
};

const dragged = d => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

const dragended = d => {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
};


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
    svg.selectAll('g').remove().exit();

    link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
        .attr('marker-end','url(#arrowhead)');

    node = svg.append('g')
        .attr("class", 'nodes')
        .selectAll('g')
        .data(elements)
        .enter().append('g')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));


    node.append('circle').attr('r', 20)
        .attr('fill', d => colors(transponowaneWyniki[d.id]))
    .attr('stroke-width', 5)
        .attr('stroke', d => isPrimary[transponowaneWyniki[d.id]] ? '#000' : 'none' )
    .on('click', onClick);
    node.append('text')
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


document.querySelector('#loadData').addEventListener('click', () => {
    add(); add(); add(); add();
    add(); add(); add(); add();

    addRel(0, 1);
    addRel(1, 2);
    addRel(1, 4);
    addRel(1, 6);
    addRel(2, 0);
    addRel(2, 3);
    addRel(3, 4);
    addRel(4, 5);
    addRel(5, 3);
    addRel(6, 7);
});





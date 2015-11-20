// SPH
// http://wonderfl.net/c/2pg0
// を、JavaScript化したもの

function whenClick(event) {
    clickControl(event);
}

function whenMove(event) {
    clickControl(event);
}

function clickControl(event) {

    mouseX = event.layerX;
    mouseY = event.layerY;
    if (event.buttons == 1 || event.buttons == 2)
        press = true;
    else
        press = false;

}
var pixelArray = [];
var RANGE2;
var w = $("body").width();
var h = $("body").height();
var SPH = {
    GRAVITY: 0.025,
    RANGE: 25,
    PRESSURE: 0.5,
    VISCOSITY: 0.05
};
$("body").keydown(function(event) {
    console.log(event.which);
    if (event.which == 38) {
        event.preventDefault();
        SPH.RANGE = SPH.RANGE + 1;
    }
    if (event.which == 40) {
        event.preventDefault();
        SPH.RANGE--;
    }
});
var mouseX = 0;
var mouseY = 0;
var press = false;
var initialize = (function() {
    var col = 0;
    $("#canvas").attr("width", $("body").width());
    $("#canvas").attr("height", $("body").height());
	RANGE2 = SPH.RANGE * SPH.RANGE;
    var DENSITY = 0.2;
    var NUM_GRIDSX = Math.floor(w / 70);
    var NUM_GRIDSY = Math.floor(h / 70);
    var INV_GRID_SIZEX = 1 / (w / NUM_GRIDSX);
    var INV_GRID_SIZEY = 1 / (h / NUM_GRIDSY);
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var particles = [];
    var numParticles = 0;
    var neighbors = [];
    var numNeighbors = 0;
    var count = 0;

    var grids = [];
    var delta = 0;

    function tick() {
        delta++;
    }

    function frame(e) {

        if (press)
            pour();

        var tempDelta = delta + 0;
        delta = 0;
        move(tempDelta);
        ctx.clearRect(0, 0, w, h);
        var d = draw();
        ctx.font = "30px Arial";
        ctx.fillText("" + SPH.RANGE, 10, 30);


    }

    function draw() {
        ctx.save();
        ctx.globalCompositeOperation = 'normal';
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size / 2);

            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, 2 * Math.PI, false);
            var color = HSVtoRGB(0.7, 1, 1.5 - Math.sqrt(p.density * 2));
            color = HSVtoRGB(Math.sqrt(p.density * 4), 1, 0.5);
            ctx.fillStyle = "hsl(" + Math.sqrt(p.density * 4) * 360 + ",100%,50%)";
            grd.addColorStop(0, "rgba(" + color.r + "," + color.g + "," + color.b + ",01)");
            grd.addColorStop(1, "rgba(" + color.r + "," + color.g + "," + color.b + ",0)");
            ctx.fillStyle = grd;
            ctx.fill();

        }
        ctx.globalCompositeOperation = 'hue';
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size / 2);

            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, 2 * Math.PI, false);
            var color = HSVtoRGB(0.7, 1, 1.5 - Math.sqrt(p.density * 2));
            //color=HSVtoRGB(0.6,1,p.size/50);
            color = HSVtoRGB(Math.sqrt(p.density * 4), 1, 0.5);
            ctx.fillStyle = "hsl(" + Math.sqrt(p.density * 4) * 360 + ",100%,50%)";
            grd.addColorStop(0, "rgba(" + color.r + "," + color.g + "," + color.b + ",01)");
            grd.addColorStop(1, "rgba(" + color.r + "," + color.g + "," + color.b + ",0)");
            ctx.fillStyle = grd;

            ctx.fill();

        }
        ctx.globalCompositeOperation = 'normal';
        ctx.restore();

    }

    function pour() {
        if (count % 5 == 0) {
            var p = new Particle(mouseX, mouseY);
            p.vy = 3;
            particles[numParticles++] = p;

        }
    }

    function calc() {
        updateGrids();
        findNeighbors();
        calcPressure();
        calcForce();
    }

    function move(d) {
        count++;
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            for (var j = 0; j < d; j++) {
                p.move();
            }
        }
    }

    function updateGrids() {
        var i;
        var j;
        for (i = 0; i < NUM_GRIDSX; i++)
            for (j = 0; j < NUM_GRIDSY; j++)
                grids[i][j].clear();
        for (i = 0; i < numParticles; i++) {
            var p = particles[i];
            p.fx = p.fy = p.density = 0;
            p.gx = Math.floor(p.x * INV_GRID_SIZEX);
            p.gy = Math.floor(p.y * INV_GRID_SIZEY);
            if (p.gx < 0)
                p.gx = 0;
            if (p.gy < 0)
                p.gy = 0;
            if (p.gx > NUM_GRIDSX - 1)
                p.gx = NUM_GRIDSX - 1;
            if (p.gy > NUM_GRIDSY - 1)
                p.gy = NUM_GRIDSY - 1;
            grids[p.gx][p.gy].add(p);
        }
    }

    function findNeighbors() {
        numNeighbors = 0;
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            var xMin = p.gx != 0;
            var xMax = p.gx != NUM_GRIDSX - 1;
            var yMin = p.gy != 0;
            var yMax = p.gy != NUM_GRIDSY - 1;
            findNeighborsInGrid(p, grids[p.gx][p.gy]);
            if (xMin) findNeighborsInGrid(p, grids[p.gx - 1][p.gy]);
            if (xMax) findNeighborsInGrid(p, grids[p.gx + 1][p.gy]);
            if (yMin) findNeighborsInGrid(p, grids[p.gx][p.gy - 1]);
            if (yMax) findNeighborsInGrid(p, grids[p.gx][p.gy + 1]);
            if (xMin && yMin) findNeighborsInGrid(p, grids[p.gx - 1][p.gy - 1]);
            if (xMin && yMax) findNeighborsInGrid(p, grids[p.gx - 1][p.gy + 1]);
            if (xMax && yMin) findNeighborsInGrid(p, grids[p.gx + 1][p.gy - 1]);
            if (xMax && yMax) findNeighborsInGrid(p, grids[p.gx + 1][p.gy + 1]);
        }
    }

    function findNeighborsInGrid(pi, g) {
        for (var j = 0; j < g.numParticles; j++) {
            var pj = g.particles[j];
            if (pi == pj)
                continue;
            var distance = (pi.x - pj.x) * (pi.x - pj.x) + (pi.y - pj.y) * (pi.y - pj.y);
            if (distance < (pi.size / 1.5 + pj.size / 1.5) * (pi.size / 1.5 + pj.size / 1.5)) {
                if (neighbors.length == numNeighbors)
                    neighbors[numNeighbors] = new Neighbor();
                neighbors[numNeighbors++].setParticle(pi, pj);
            }
        }
    }

    function calcPressure() {
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            if (p.density < DENSITY)
                p.density = DENSITY;
            p.pressure = p.density - DENSITY;
        }
    }

    function calcForce() {
        for (var i = 0; i < numNeighbors; i++) {
            var n = neighbors[i];
            n.calcForce();
        }
    }
    return function() {
        for (var i = 0; i < NUM_GRIDSX; i++) {
            grids[i] = new Array(NUM_GRIDSY);
            for (var j = 0; j < NUM_GRIDSY; j++)
                grids[i][j] = new Grid();
        }
        for (var x = 0; x < w; x++) {
            var col = [];
            for (var y = 0; y < h; y++) {
                col[y] = 0;
            }
            pixelArray[x] = col;
        }
        window.addEventListener('mouseup', function(e) {
            press = false;
        }, false);
        window.setInterval(frame, 0.01);
        window.setInterval(tick, 0.1);
        window.setInterval(calc, 1);
    };
})();

var Particle = function(x, y) {
    this.x = x;
    this.y = y;
    this.gx = 0;
    this.gy = 0;
    this.vx = 0;
    this.vy = 0;
    this.fx = 0;
    this.fy = 0;
    this.density = 0;
    this.pressure = 0;
    this.size = SPH.RANGE;

};
Particle.prototype = {
    move: function() {
        var _y1 = 0;
        var _x1 = 0;
        var _d = 0;
        
        _x1 = mouseX - this.x;
        _y1 = mouseY - this.y;
        _d = 0.5 / (_x1 * _x1 + _y1 * _y1);
        _x1 = w / 2 - this.x;
        _y1 = h / 2 - this.y;

        _d = 0.5 / (_x1 * _x1 + _y1 * _y1);
        this.vy += SPH.GRAVITY;
        this.vx += this.fx; 
        this.vy += this.fy; 
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 10)
            this.vx += (10 - this.x) * 0.5 - this.vx * 0.5;
        if (this.y < 10)
            this.vy += (10 - this.y) * 0.5 - this.vy * 0.5;
        if (this.x > w)
            this.vx += (w - this.x) * 0.5 - this.vx * 0.5;
        if (this.y > h)
            this.vy += (h - this.y) * 0.5 - this.vy * 0.5;
    }
};

var Neighbor = function() {
    this.p1 = null;
    this.p2 = null;
    this.distance = 0;
    this.nx = 0;
    this.ny = 0;
    this.weight = 0;
};
Neighbor.prototype = {
    setParticle: function(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.nx = p1.x - p2.x;
        this.ny = p1.y - p2.y;
        this.distance = Math.sqrt(this.nx * this.nx + this.ny * this.ny);
        this.weight = 1 - this.distance / (this.p1.size / 2 + this.p2.size / 2);
        var temp = this.weight * this.weight * this.weight;
        p1.density += temp;
        p2.density += temp;
        temp = 1 / this.distance;
        this.nx *= temp;
        this.ny *= temp;
    },
    calcForce: function() {

        var p1 = this.p1;
        var p2 = this.p2;
        if (this.distance < this.p1.size / 2 + this.p2.size / 2) {
            var pressureWeight = this.weight * (p1.pressure + p2.pressure) / (p1.density + p2.density) * SPH.PRESSURE;
            var viscosityWeight = this.weight / (p1.density + p2.density) * SPH.VISCOSITY;
            p1.fx += this.nx * pressureWeight;
            p1.fy += this.ny * pressureWeight;
            p2.fx -= this.nx * pressureWeight;
            p2.fy -= this.ny * pressureWeight;
            var rvx = p2.vx - p1.vx;
            var rvy = p2.vy - p1.vy;
            p1.fx += rvx * viscosityWeight;
            p1.fy += rvy * viscosityWeight;
            p2.fx -= rvx * viscosityWeight;
            p2.fy -= rvy * viscosityWeight;
        }
    },
};

var Grid = function() {
    this.particles = [];
    this.numParticles = 0;
};
Grid.prototype = {
    clear: function() {
        this.numParticles = 0;
    },
    add: function(p) {
        this.particles[this.numParticles++] = p;
    }
};

initialize();

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

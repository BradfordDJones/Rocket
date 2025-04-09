let idStyleWidth = document.getElementById("idStyleWidth");
let idStyleHeight = document.getElementById("idStyleHeight");

let idCanvasWidth = document.getElementById("idCanvasWidth");
let idCanvasHeight = document.getElementById("idCanvasHeight");

let idFPS = document.getElementById("idFPS");

let idCanvas = document.getElementById("idCanvas");
let ctx = idCanvas.getContext("2d");

let frameCount = 0;
let lastCalledTime;
let fps;

const targetFPS = 30;

document.body.onload = updateSizes;

document.body.onresize = updateSizes;

function updateSizes() {
	idStyleWidth.innerText = ctx.canvas.clientWidth;
	idStyleHeight.innerText = ctx.canvas.clientHeight;

	idCanvasWidth.innerText = idCanvas.width;
	idCanvasHeight.innerText = idCanvas.height;
}





/*
let canvas;
let ctx;

canvas = document.getElementById("_canvas");
position = document.getElementById("_position");
velocity = document.getElementById("_velocity");
info = document.getElementById("_info");
//ctx = canvas.getContext("2d");

class planet {
	constructor(_name, _fillStyle, _strokeStyle, _x, _y, _radius, _lineWidth, _mass, _velX, _velY) {
		this._name = _name;
		this.x = _x;
		this.y = _y;
		this.radius = _radius;
		this.lineWidth = _lineWidth;
		this.fillStyle = _fillStyle;
		this.strokeStyle = _strokeStyle;
		this.mass = _mass;

		this.velX = _velX;
		this.velY = _velY;
	}

	draw() {
		ctx.lineWidth = this.lineWidth;
		ctx.fillStyle = this.fillStyle;
		ctx.strokeStyle = this.strokeStyle;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.fill()

//		drawbackground(ctx);
	}



	move() {
			this.x += this.velX;
			this.y += this.velY;
	}

	update() {
		planets.forEach(e => this.physics(e));
	}

	physics(obj2) {
		if (this !== obj2) {
			if (this._name != "sun") {
				let d = this.getDistance(obj2);
				let f = (g * this.mass * obj2.mass) / Math.pow(d,2);
				let ang = this.getAngle(obj2);
				this.velX += Math.cos(ang*(Math.PI/180)) * f;
				this.velY += Math.sin(ang*(Math.PI/180)) * f;
			}
		}
	}

	getAngle(obj) {
		var dx = this.x - obj.x;
    	var dy = this.y - obj.y;

    	var theta = Math.atan2(-dy, -dx); // [0, Ⲡ] then [-Ⲡ, 0]; clockwise; 0° = east
    	var degree = theta * 180 / Math.PI; // [0, 180] then [-180, 0]; clockwise; 0° = east
    	if (degree < 0) degree += 360;      // [0, 360]; clockwise; 0° = east
    	return degree;
	}

	getDistance(obj2) {
		return Math.sqrt(Math.pow(this.x - obj2.x, 2) + Math.pow(this.y - obj2.y, 2));
	}
};

let g = 5.0e-5;

let planets = [
		new planet("ship", 	"#FFFF00", "#333300",	400, 100, 10, 2, 110,  0.7,  0.0),
		new planet("",		"#0000FF", "#111111",	700, 400, 10, 2, 120,  0.0,  0.6),
//		new planet("",		"#00FFFF", "#111111",	400, 700, 10, 2, 130, -0.7,  0.0),
		new planet("",		"#FF0000", "#111111",	100, 400, 10, 2, 140,  0.0, -0.8),
		new planet("sun",	"#FFFF00","#FF0000",	400, 400, 30, 2, 90000,  0.0,  0.0),
	]

*/

function step() {

// 	//ctx.clearRect(0, 0, canvas.width, canvas.height)
// //	planets.forEach(p => p.draw());
// //	planets.forEach(p => p.update());
// //	planets.forEach(p => p.move());

	calculateFPS();
	idFPS.innerText = fps.toFixed(2);



	setTimeout(() => {
		requestAnimationFrame(step);
	  }, 1000 / targetFPS);
}

lastCalledTime = Date.now();
step();

function calculateFPS() {
	// if (!lastCalledTime) {
	//   lastCalledTime = Date.now();
	//   fps = 0;
	//   return;
	// }
	var delta = (Date.now() - lastCalledTime) / 1000;
	lastCalledTime = Date.now();
	fps = 1 / delta;
  }

/*
function drawbackground(bkCtx) {
	bkCtx.beginPath();
	bkCtx.fillStyle="darkblue";
	bkCtx.rect(0,0,background.width,background.height);
	bkCtx.fill();
	bkCtx.beginPath();
	for(var n=0;n<100;n++){
		var x=parseInt(Math.random()*canvas.width);
		var y=parseInt(Math.random()*canvas.height);
		var radius=Math.random()*3;
		bkCtx.arc(x,y,radius,0,Math.PI*2,false);
		bkCtx.closePath();
	}
	bkCtx.fillStyle="white";
	bkCtx.fill();

	// create an new image using the starfield canvas
	var img=document.createElement("img");
	img.src=background.toDataURL();
}
*/
function log(o) {
    console.log(o);
}

function getMousePos(evt) {
    let rect = canvas.getBoundingClientRect();
    let x = Math.round((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    let y = Math.round((evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
    return new Vector(x, y);
}

function rect(position, size, color) {
    context.beginPath();
    context.fillStyle = color;
    context.rect(position.x, position.y, size.x, size.y);
    context.fill();
}

function createVector(x = 0, y = 0){
	return new Vector(x, y);
}

const GUI = class {

	el(id){
		return document.getElementById(id);
	}
	
	text(id, value){
		this.el(id).innerHTML = value;
		return this;
	}
	
	lives(value){
		return this.text('lives', value);
	}
	
	status(value){
		return this.text('status', value);
	}
	
	position(vector){
		return this.text('position', 'X: ' + vector.x + ', Y: ' + vector.y);
	}
	
}

const Vector = class {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    update(vector) {
        this.x = vector.x;
        this.y = vector.y;
		return this;
    }

    equals(vector) {
        return this.x === vector.x && this.y === vector.y;
    }
	
	greater(vector){
		return this.x > vector.x && this.y > vector.y;
	}

	lesser(vector){
		return this.x < vector.x && this.y < vector.y;
	}
	
	mult(vector){
		this.x *= vector.x;
		this.y *= vector.y;
		return this;
	}
	divide(vector){
		this.x /= vector.x;
		this.y /= vector.y;
		return this;
	}
	sum(vector){
		this.x += vector.x;
		this.y += vector.y;
		return this;
	}
	sub(vector){
		this.x -= vector.x;
		this.y -= vector.y;
		return this;
	}
};
const Drawable = class {
    constructor(position, w = 30, h = 30) {
        this.position = position;
        this.width = w;
        this.height = h;
        this.speed = 1;
		this.angle = 0;
		this.moveAngle = 1;
        this.color = "#ffffff";
        this.init();
    }

    init() {}

    draw() {
		 rect(this.position, this.size(), this.color);
	}

    move(position) {
	  this.position.update(position);
	}

    update(e) {}

    size() {
        return createVector(this.width, this.height);
    }

	
	edgeT(){
		return this.position.y;
	}
	
	edgeL(){
		return this.position.x;
	}
	
	edgeB(){
		return this.position.y + this.height;
	}
	
	edgeR(){
		return this.position.x + this.width;
	}
	
	
    collides(drawable) {
        return (this.edgeL() < drawable.edgeR()) 
			   && (this.edgeR() > drawable.edgeL())
			   && (this.edgeT() < drawable.edgeB())
			   && (this.edgeB() > drawable.edgeT());
		;
    }
};

const Player = class extends Drawable {
    init() {
        // Init
    }

    update() {
        this.move(game.cursor);
    }

};
//AI Shadow following
const Enemy = class extends Drawable {
    init() {
        this.color = "red";
        this.speed = 1;
		 this.bounce = 0.6;
		this.gravity = 0.1;
		this.gravitySpeed = 0;
    }

    update() {
        if (this.collides(player)) {
			this.bounce(player);
            return;
        }
		
	    this.goTo(player.position);	

    }
		
	goTo(position){
		if(position.x > this.edgeL()){
			this.position.x += this.speed;
		} else {
			this.position.x -= this.speed;
		}
		
		if(position.y > this.edgeT()){
			this.position.y += this.speed;
		} else {
			this.position.y -= this.speed;
		}
	}
	
	patrol(){
		this.angle += this.moveAngle * Math.PI / 180;
		this.position.x += this.speed * Math.sin(this.angle);
		this.position.y -= this.speed * Math.cos(this.angle);
	}
	
	//https://www.w3schools.com/graphics/game_bouncing.asp
	bounce(drawable){
		this.gravitySpeed += this.gravity;
		this.position.x += this.speed;
		this.position.y += this.speed + this.gravitySpeed;
		this.gravitySpeed = -(this.gravitySpeed * this.bounce);
 	}
};


const Game = class {
    constructor(lives, objects) {
		this.boundings = canvas.getBoundingClientRect();
		this.maxLives = lives;
        this.objects = objects;
		this.status = "Playing...";
        this.cursor = new Vector(0, 0);
		canvas.addEventListener('mousemove', this.setCursorPosition.bind(this));
    }

  
    reset() {
        this.lives = 3;
        return this;
    }

    // Things done on the start of the game. Initialization
    start() {
		this.keepAlive = true;
		this.lives = this.maxLives;
        this.updateLives();
		this.updateStatus();
        this.animate();
    }
	
	end(){
	 this.keepAlive = false;
	 this.updateStatus();
	}

    // This loops on every frame
    loop() {
		if(!this.keepAlive){
			return;
		}
        this.update();
        this.draw();
        this.animate();
    }
	
	updateLives(){
		gui.lives(this.lives);
		return this;
	}
	
    animate() {
        requestAnimationFrame(game.loop.bind(this), canvas);
    }
    // Player gets hit by the enemy, do some stuff
    hit() {
		if(this.lives <= 0){
			this.lose();
			this.end();
		} else {
		  alert("You got hit! :(");
		  this.lives -= 1;
		  this.updateLives();
		}
    }
		
	// TODO:: Win condition
	win(){
		this.status = "Hey, you've won!";
	}
	// TODO:: action to restart the game
	lose(){
		this.status = "You've lost! Better luck next time...";
	}
	
	updateStatus(){
		gui.status(this.status);
		return this;
	}
	
    // Update on frame
    update() {
		gui.position(this.cursor);
		this.eachObject(function(o){
			o.update();
		});
    
        if (player.collides(enemy)) {
            this.hit();
        }
    }

	setCursorPosition(evt){
    	let x = Math.round((evt.clientX - this.boundings.left) / (this.boundings.right - this.boundings.left) * canvas.width);
    	let y = Math.round((evt.clientY - this.boundings.top) / (this.boundings.bottom - this.boundings.top) * canvas.height);
    	this.cursor = new Vector(x, y);
	}
	
    // Draw after update
    draw() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.eachObject(function(o){
			o.draw();
		});
    }
	
	eachObject(callback){
		for (let i = 0; i < this.objects.length; i++) {
            callback(this.objects[i]);
        }
	}
};

const gui = new GUI();
const canvas = gui.el('canvas');
const context = canvas.getContext('2d');
const btnStart = gui.el('btnStart');
const size = createVector(30, 30);
let player = new Player(createVector(10, 10), size.x, size.y);
let enemy = new Enemy(createVector(300, 250), size.x, size.y);
const game = new Game(3, [player, enemy]);

btnStart.addEventListener('click', function(){
	player.color = gui.el('playerColor').value;
	enemy.color = gui.el('enemyColor').value;
	if(game.keepAlive){
		btnStart.innerHTML = 'Start';
		game.end();
	} else {
		btnStart.innerHTML = 'Stop';
		game.start();
	}
});



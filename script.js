
function log(o){ console.log(o); }
function getMousePos(evt) {
	var rect = canvas.getBoundingClientRect();
	var x  = Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width);
	 var y = Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);
	return new Vector2(x, y);
}
function rect(position, size, color){
	context.beginPath();
	context.fillStyle=color;
	context.rect(position.x, position.y,size.x, size.y);
	context.fill();
}

function clearRect(position, size){
	context.clearRect(position.x, position.y, size.x, size.y);
}


const Vector2 = class {
  constructor(x, y){
   this.x = x;
   this.y = y;
  }
  
  update(vector){
	  this.x = vector.x;
	  this.y = vector.y;
  }
  
  equals(vector){
	  return this.x === vector.x && this.y === vector.y;
  }
}

const Drawable = class {
	constructor	(position, w = 30, h = 30){
		this.position = position;
		this.width = w;
		this.height = h;
		this.speed = 0;
		this.color = "#ffffff";
		this.init();
	}
	init(){}
	draw(){}
	move(position){}
	clear(){
		clearRect(this.position, this.size());
	}
	update(e){}
	size(){
		return new Vector2(this.width, this.height);
	}
	collides(drawable){
	if (this.position.x < drawable.position.x + drawable.width  && this.position.x + this.width  > drawable.position.x &&
		this.position.y < drawable.position.y + drawable.height && this.position.y + this.height > drawable.position.y) {
			return true;
		}
		return false;
	}
}

const Player = class extends Drawable {
	init(){
	 // Init	
	}
	
	draw(){
	  rect(this.position, this.size(), this.color);
	}
	
	update(e){
		this.move(game.cursor);
	}
	
	move(position){
		this.clear();
		this.position.update(position);
	}
}

const Enemy = class extends Drawable {
	init(){
		this.color = "red";
		this.speed = 1;
	}
	
	draw(){
		rect(this.position, this.size(), this.color);
	}
	
	update(e){
		if(this.collides(player)){
			//console.log("Just there");
			return;
		}
		this.clear();
		const  x = (this.position.x - player.position.x) + this.speed;
		const  y = (this.position.y - player.position.y) + this.speed;
		this.move(new Vector2(x, y));
	}
	
	move(position){
		this.clear();
		this.position.update(position);
	}
}

const AI = class {
	constructor(speed = 1){
		this.speed = speed;
	}
	
	waypoint(character, position){
		if(character.position.equals(position)){
			console.log("Just there");
			return;
		}
		clearRect(character.position, character.size);
		const  x = (character.position.x + position.x) * this.speed;
		const  y = (character.position.y + position.y) * this.speed;
		character.move(new Vector2(x, y));
	}
	
}

const Game = class {
  
   constructor(lives, objects){
      this.lives = lives;
	   this.objects = objects;
	   this.cursor = new Vector2(0, 0);
   }
   
   isAlive(){
     return this.lives > 0;
   }
  
  reset(){
   this.lives = 3;
   return this;   
  }
  
  // Things done on the start of the game. Initialization
  start(){
	livesText.innerHTML = this.lives;
    this.animate();
  }
  
 // The loop on every frame
  loop(){
	  this.update();
	  this.draw();
	  this.animate();
  }
	
  animate(){
	  requestAnimationFrame(game.loop.bind(this), canvas);
  }
  
  hit(){
	  console.log('enemy hit');
  }
  
  // Update on frame
  update(e){
	  for(let i = 0; i < this.objects.length; i++){
		  this.objects[i].update();
	  }
	  
	  if(player.collides(enemy)){
		  this.hit();
	  }
	 
  }
  // Draw after update  
  draw(){
	  for(let i = 0; i < this.objects.length; i++){
		  this.objects[i].draw();
	  }
  }
}
//AI Shadow following
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
var posText = document.getElementById('position');
var livesText = document.getElementById('lives');

const size = new Vector2(30, 30);
let player = new Player(new Vector2(10, 10), size.x, size.y);
let enemy = new Enemy(new Vector2(50, 10), size.x, size.y);
const game = new Game(3, [player, enemy]);
canvas.addEventListener('mousemove', function(e){
	const pos = getMousePos(e);
	game.cursor = pos;
	posText.innerHTML = 'X: ' + pos.x + ', Y: ' + pos.y;
});

game.start();


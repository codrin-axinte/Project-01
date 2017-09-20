function log(o) {
    console.log(o);
}

function rect(position, size, color) {
    context.beginPath();
    context.fillStyle = color;
    context.rect(position.x, position.y, size.x, size.y);
    context.fill();
}

function createVector(x = 0, y = 0) {
    return new Vector(x, y);
}

const Utils = class {
    /**
     *  Gets a random color from the spectrum
     * @returns {string}
     */
    static randomColor() {
        return "hsl(" + (Math.floor(Math.random() * 360)) + ",100%,50%)"
    };

    /**
     *  Gets random number between two values
     * @param from
     * @param to
     * @returns {*}
     */
    static random(from, to) {
        return Math.floor(Math.random() * to) + from;
    }

    /**
     * Gets the distance between two vectors
     * @see https://stackoverflow.com/questions/20916953/get-distance-between-two-points-in-canvas
     * @param vector
     * @param vector2
     * @returns {number}
     */
    static distance(vector, vector2) {
        return Math.hypot(vector.x - vector2.x, vector.y - vector2.y);
    }

    static getCanvasPos(canvas) {
        let xPosition = 0;
        let yPosition = 0;
        while (canvas) {
            xPosition += (canvas.offsetLeft - canvas.scrollLeft + canvas.clientLeft);
            yPosition += (canvas.offsetTop - canvas.scrollTop + canvas.clientTop);
            canvas = canvas.offsetParent;
        }

        return {
            x: xPosition,
            y: yPosition
        }
    }

    static getCanvasCursorPos(e, canvas) {
        const canvasPos = Utils.getCanvasPos(canvas);
        return {
            x: e.clientX - canvasPos.x,
            y: e.clientY - canvasPos.y
        };
    }
};

const EventDispatcher = class {
    constructor() {
        this.dummy = document.createTextNode('');
        this.off = this.dummy.removeEventListener.bind(this.dummy);
        this.on = this.dummy.addEventListener.bind(this.dummy);
    }

    trigger(eventName, data = null) {
        if (!eventName) return;
        let e = new CustomEvent(eventName, {detail: data});
        this.dummy.dispatchEvent(e);
    }

};

const GUI = class {

    el(id) {
        return document.getElementById(id);
    }

    text(id, value) {
        this.el(id).innerHTML = value;
        return this;
    }

    lives(value) {
        return this.text('lives', value);
    }

    status(value) {
        return this.text('status', value);
    }

    position(vector) {
        return this.text('position', 'X: ' + vector.x + ', Y: ' + vector.y);
    }

};

const Vector = class {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    update(vector) {
        this.x = vector.x;
        this.y = vector.y;
        return this;
    }

    static out() {
        return new Vector(-1, -1);
    }

    static zero() {
        return new Vector(0, 0);
    }

    static random() {
        const x = Utils.random(1, boundings.width);
        const y = Utils.random(1, boundings.height);
        return new Vector(x, y);
    }
};

const Drawable = class {
    constructor(position, size) {
        this.position = position;
        this.width = size.x;
        this.height = size.y;
        this.speed = 1;
        this.setColor('#ffffff');
        this.type = 0;
        this.init();
    }

    isType(type) {
        return this.type === type;
    }

    isPlayer() {
        return this.type === 0;
    }


    init() {
    }

    draw() {
        rect(this.position, this.size(), this.color);
    }

    move(position) {
        this.position.update(position);
    }

    setColor(color) {
        this.color = color;
        return this;
    }

    update(e) {
    }

    size() {
        return createVector(this.width, this.height);
    }

    edgeT() {
        return this.position.y;
    }

    edgeL() {
        return this.position.x;
    }

    edgeB() {
        return this.position.y + this.height;
    }

    edgeR() {
        return this.position.x + this.width;
    }


    collides(drawable) {
        return (this.edgeL() < drawable.edgeR())
            && (this.edgeR() > drawable.edgeL())
            && (this.edgeT() < drawable.edgeB())
            && (this.edgeB() > drawable.edgeT());
    }
};

const Player = class extends Drawable {
    init() {
        this.type = 0;
    }

    update() {
        this.move(game.cursor);
    }

};
//AI Shadow following
/**
 * Modes: 0 - Follows the target, 1 - Patrol in a radius
 * @mode {Enemy}
 */
const Enemy = class extends Drawable {
    init() {
        this.proximityRange = 150;
        this.originalColor = this.color;
        this.type = 1;
        this.mode = 0;
        this.target = null;
        this.lastWaypoint = null;
    }

    setMode(type) {
        this.mode = type;
    }

    setTarget(target) {
        this.target = target;
    }

    update() {
        // If we don't have a target then we return, we can't do anything
        if (this.target === null) {
            return;
        }
        // If this object collides with it's target the we raise the 'hit' event
        if (this.collides(this.target)) {
            game.hit();
            return;
        }

        this.proximityDetection(this.target.position);

        // Check for the object mode to behave
        switch (this.mode) {
            case 0: // Follows/Attacks the target
                this.goTo(this.target.position);
                break;
            case 1: // Patrol in a area| Random movement
                this.patrol();
                break;
        }
    }

    setColor(color) {
        this.color = color;
        this.originalColor = this.color;
    }

    proximityDetection(position) {
        if (Utils.distance(this.position, position) <= this.proximityRange) {
            this.color = Utils.randomColor();
        } else {
            this.color = this.originalColor;
        }
    }

    goTo(position) {
        if (position.x > this.edgeL()) {
            this.position.x += this.speed;
        } else {
            this.position.x -= this.speed;
        }

        if (position.y > this.edgeT()) {
            this.position.y += this.speed;
        } else {
            this.position.y -= this.speed;
        }
    }

    patrol() {
        if (this.lastWaypoint === null) {
            this.lastWaypoint = Vector.random();
        }

        if (Utils.distance(this.position, this.lastWaypoint) <= 50) {
            this.lastWaypoint = Vector.random();
        }

        this.goTo(this.lastWaypoint);
    }

};

const Trap = class extends Drawable {
    init() {
        this.type = 2;
        this.target = null;
    }

    update() {
        if (this.target === null) {
            return;
        }

        if (this.collides(this.target)) {
            game.hit();
        }
    }

    setTarget(target) {
        this.target = target;
    }
};

const ObjectFactory = class {

    static trap(position, size) {
        return new Trap(position, size);
    }

    static enemy(size, mode = 0, position = null) {
        let enemy = new Enemy(position === null ? Vector.random() : position, size);
        enemy.setMode(mode);
        return enemy;
    }

    static chaser(size, position = null) {
        return ObjectFactory.enemy(size, 0, position);
    }

    static patrol(size, position = null) {
        return ObjectFactory.enemy(size, 1, position);
    }

    static generate(max, callback) {
        for (let i = 0; i < max; i++) {
            callback();
        }
    }
};

/**
 * TODO:: Win condition
 * @mode {Game}
 */
const Game = class {
    constructor(lives, objects) {
        this.lives = this.maxLives = lives;
        this.objects = objects;
        this.cursor = {x: 0, y: 0};
    }

    reset() {
        this.lives = 3;
        context.clearRect(0, 0, canvas.width, canvas.height);
        return this;
    }

    // Things done on the start of the game. Initialization
    start() {
        this.keepAlive = true;
        this.lives = this.maxLives;
        dispatcher.trigger('game.init', this);
        this.eachObject(function (o) {
            dispatcher.on('game.update', o.update.bind(o));
            dispatcher.on('game.draw', o.draw.bind(o));
            dispatcher.trigger('game.object.init', o);
        });
        this.animate();
    }

    end() {
        this.keepAlive = false;
        dispatcher.trigger('game.end', this);
    }

    // This loops on every frame
    loop(ms) {
        if (!this.keepAlive) {
            return;
        }
        this.update();
        this.draw();
        this.animate();
    }

    running() {
        return this.keepAlive;
    }

    animate() {
        requestAnimationFrame(game.loop.bind(this));
    }

    // Player gets hit by the enemy, do some stuff
    hit() {
        alert("You got hit! :(");
        if (this.lives <= 0) {
            gui.status("You've lost! Better luck next time.");
            this.end();
        } else {
            this.lives -= 1;
            gui.lives(this.lives);
            this.eachObject(function (o) {
                if (o.isPlayer()) {
                    o.move(createVector());
                } else {
                    o.move(Vector.random());
                }
            });
        }
    }

    // Update on frame
    update() {
        gui.position(this.cursor);
        dispatcher.trigger('game.update');
    }

    setCursorPosition(e) {
        this.cursor = Utils.getCanvasCursorPos(e, canvas);
    }

    // Draw after update
    draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        dispatcher.trigger('game.draw');
    }

    eachObject(callback) {
        for (let i = 0; i < this.objects.length; i++) {
            callback(this.objects[i]);
        }
    }
};

const gui = new GUI();
const canvas = gui.el('canvas');
const context = canvas.getContext('2d');
const boundings = canvas.getBoundingClientRect();
const dispatcher = new EventDispatcher;
const size = createVector(30, 30);
let player = new Player(Vector.out(), size);
const game = new Game(3, [player, ObjectFactory.chaser(size)]);
canvas.addEventListener('mousemove', game.setCursorPosition.bind(game));
ObjectFactory.generate(2, function () {
    game.objects.push(ObjectFactory.patrol(size));
});
ObjectFactory.generate(15, function () {
    game.objects.push(ObjectFactory.trap(Vector.random(), createVector(Utils.random(3, 20), Utils.random(3, 60))));
});
dispatcher.on('game.init', function (e) {
    const game = e.detail;
    gui.lives(game.lives);
    gui.status("Playing...");
    gui.el('hud').style.display = 'block';
});

dispatcher.on('game.object.init', function (e) {
    let o = e.detail;
    const enemyColor = gui.el('enemyColor').value;
    if (o.isPlayer()) {
        o.setColor(gui.el('playerColor').value);
    } else {
        if (o.isType(1)) {
            o.setColor(enemyColor);
        } else {
            o.setColor('#4e4e4e');
        }
        o.setTarget(player);
    }
});

const btnStart = gui.el('btnStart');
btnStart.addEventListener('click', function () {
    if (game.running()) {
        btnStart.innerHTML = 'Start';
        game.end();
    } else {
        btnStart.innerHTML = 'Stop';
        game.start();
    }
});



/**
 *
 * @param {Vector} position
 * @param {Vector} size
 * @param {string} color
 */
function rect(position, size, color) {
    context.beginPath();
    context.fillStyle = color;
    context.rect(position.x, position.y, size.x, size.y);
    context.fill();
}

/**
 *
 * @param {int} x
 * @param {int} y
 * @returns {Vector}
 */
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
     * @returns {number}
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

    /**
     *
     * @param canvas
     * @returns {{x: number, y: number}}
     */
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

    /**
     *
     * @param e
     * @param canvas
     * @returns {{x: number, y: number}}
     */
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

    /**
     * Creates and triggers a custom event
     * @param eventName
     * @param data
     */
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

    score(value) {
        return this.text('score', value);
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
        const x = Utils.random(30, boundings.width - 10);
        const y = Utils.random(30, boundings.height - 10);
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
        this.onInit();
    }

    isType(type) {
        return this.type === type;
    }

    isPlayer() {
        return this.type === 0;
    }

    isOther() {
        return this.type > 0;
    }

    onInit(e) {
    }


    move(position) {
        this.position.update(position);
    }

    setColor(color) {
        this.color = color;
        return this;
    }

    onReset(e) {
    }

    onUpdate(e) {
    }

    onDifficultyIncrease(e) {
    }

    onDraw(e) {
        rect(this.position, this.size(), this.color);
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
    onInit() {
        this.type = 0;
    }

    onUpdate() {
        this.move(game.cursor);
    }

};
//AI Shadow following
/**
 * Modes: 0 - Chaser, 1 - Patrol
 * @mode {Enemy}
 */
const Enemy = class extends Drawable {
    onInit() {
        this.type = 1;
        this.mode = 0;
        this.target = null;
        this.lastWaypoint = null;
        this.originalColor = this.color;
        this.proximityRange = 150;
        this.increaseSpeed = 0.001;
        this.increasePatrolAfter = 30; // seconds

    }

    setMode(type) {
        this.mode = type;
    }

    setTarget(target) {
        this.target = target;
    }

    isChaser() {
        return this.mode === 0;
    }

    isPatrol() {
        return this.mode === 1;
    }

    onReset(e) {
        this.speed = 1;
        this.lastWaypoint = null;
        log('Reset speed: ' + this.speed);
    }

    onDifficultyIncrease(e) {
        // We will increase the patrol speed only after player survives 30 seconds
        if (this.isPatrol() && e.detail.score <= this.increasePatrolAfter) {
            return;
        }
        // At this point we don't want to increase the speed more, it is already to challenging
        if (this.speed > 2) {
            return;
        }
        this.speed += this.increaseSpeed;
    }

    onUpdate() {
        // If we don't have a target then we return, we can't do anything
        if (this.target === null) {
            return;
        }
        // If this object collides with it's target the we raise the 'hit' event
        if (this.collides(this.target)) {
            game.hit();
            return;
        }

        const distance = Utils.distance(this.position, this.target.position);

        this.color = this.inRange(distance) ? Utils.randomColor() : this.originalColor;

        // Check for the object mode to behave
        switch (this.mode) {
            case 0: // Follows/Attacks the target
                this.goTo(this.target.position);
                break;
            case 1: // Patrol in a area| Random movement
                if (this.inRange(distance)) {
                    this.goTo(this.target.position);
                } else {
                    this.patrol();
                }
                break;
        }
    }

    setColor(color) {
        this.color = color;
        this.originalColor = this.color;
    }

    inRange(distance) {
        return distance <= this.proximityRange
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
    onInit() {
        this.type = 2;
        this.target = null;
    }

    onUpdate() {
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
        this.maxLives = lives;
        this.objects = objects;
        this.score = 0;
        this.elapsed = 0;
        this.reset();
    }

    reset() {
        this.lives = this.maxLives;
        this.elapsed = 0;
        this.score = 0;
        this.cursor = {x: -1, y: -1};
        context.clearRect(0, 0, canvas.width, canvas.height);
        dispatcher.trigger('game.reset', this);
        return this;
    }

    isDead() {
        return this.lives <= 0;
    }

    hasLives() {
        return this.lives > 0;
    }

    // Things done on the start of the game. Initialization
    start() {
        this.keepAlive = true;
        dispatcher.trigger('game.init', this);
        this.eachObject(function (o) {
            dispatcher.on('game.reset', o.onReset.bind(o));
            dispatcher.on('game.update', o.onUpdate.bind(o));
            dispatcher.on('game.draw', o.onDraw.bind(o));
            dispatcher.on('game.difficulty.increase', o.onDifficultyIncrease.bind(o));
            dispatcher.trigger('game.object.init', o);
        });
        if (this.isDead()) {
            this.reset();
        }
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
        this.elapsed = ms;
        this.score = Math.floor(this.elapsed / 1000);
        if (this.score > 10) {
            dispatcher.trigger('game.difficulty.increase', this);
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
        if (this.isDead()) {
            gui.status("You've lost! Better luck next time.");
            this.end();
            this.reset();
        } else {
            this.lives -= 1;
            gui.lives(this.lives);
            this.eachObject(function (o) {
                if (o.isPlayer()) {
                    o.move(Vector.out());
                } else {
                    o.move(Vector.random());
                }
            });
        }
    }

    // Update on frame
    update() {
        dispatcher.trigger('game.update', this);
    }

    setCursorPosition(e) {
        this.cursor = Utils.getCanvasCursorPos(e, canvas);
    }

    // Draw after onUpdate
    draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        dispatcher.trigger('game.draw', this);
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

dispatcher.on('game.update', function (e) {
    gui.position(e.detail.cursor);
    gui.score(e.detail.score);
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


dispatcher.on('game.reset', function (e) {
    gui.score(e.detail.score);
    btnStart.innerHTML = 'Start';
});
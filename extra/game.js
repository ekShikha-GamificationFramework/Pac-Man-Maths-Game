//create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

//backgroung image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function() {
    bgReady = true;
};
bgImage.src = "images/background.png";

var pacmanReady = false;
var pacmanImage = new Image();
pacmanImage.onload = function() {
    pacmanReady = true;
};
pacmanImage.src = "images/pacman.png";

var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function() {
    monsterReady = true;
};
monsterImage.src = "images/monster.png";

var coinImage = new Image();
var coinReady = false;
coinImage.src = "images/coin.png";
coinImage.onload = function() {
    coinReady = true;
};

function sprite(options) {
    var that = {},
        frameIndex = 0,
        tickCount = 0,
        ticksPerFrame = options.ticksPerFrame || 0,
        numberOfFrames = options.numberOfFrames || 1;

    that.context = options.context;
    that.width = options.width;
    that.height = options.height;
    that.image = options.image;
    that.loop = options.loop;

    that.render = function() {
        that.context.drawImage(
            that.image,
            frameIndex * (that.width / numberOfFrames),
            0,
            that.width / numberOfFrames,
            that.height,
            0,
            0,
            that.width / numberOfFrames,
            that.height
        );
    };

    that.update = function() {
        tickCount += 1;
        if(tickCount > ticksPerFrame) {
            tickCount = 0;
            //if the current frame index is in range
            if(frameIndex < numberOfFrames - 1) {
                //go to next frame
                frameIndex += 1;
                console.log(frameIndex);
            } else if(that.loop) {
                frameIndex = 0;
            }
        }
    };

    return that;
}
var coin = sprite({
    context: ctx,
    width: 440,
    height: 40,
    image: coinImage,
    loop: true,
    numberOfFrames: 10,
    ticksPerFrame: 4
});


//game objects
var pacman = {
    speed: 128, //movement in pixels per second
    x: 0,
    y: 0,
    dir: null,
    image: sprite({
            context: ctx,
            width: 577,
            height: 193,
            image: pacmanImage,
            loop: true,
            numberOfFrames: 3,
            ticksPerFrame: 10})
};
var monster = {
    x: 0,
    y: 0
};
var monstersCaught = 0;

//handle keyboard controls
addEventListener("keydown", function(e) {
    switch(e.keyCode) {
        case 37: pacman.dir = "left"; break;
        case 38: pacman.dir = "up"; break;
        case 39: pacman.dir = "right"; break;
        case 40: pacman.dir = "down"; break;
    }
}, false);

//game reset
var reset = function() {
    pacman.x = canvas.width / 2;
    pacman.y = canvas.height / 2;

    //place the monster somewhere randomly
    monster.x = 32 + (Math.random() * (canvas.width - 64));
    monster.y = 32 + (Math.random() * (canvas.height - 64));
}

//update game objects
var update = function(modifier) {

    //update pacman
    switch(pacman.dir) {
        case "up":
        pacman.y -= pacman.speed * modifier;
        break;
        case "down":
        pacman.y += pacman.speed * modifier;
        break;
        case "left":
        pacman.x -= pacman.speed * modifier;
        break;
        case "right":
        pacman.x += pacman.speed * modifier;
        break;
        default: break;
    }

    //collision
    if(
        pacman.x <= monster.x + 32
        && monster.x <= pacman.x + 32
        && pacman.y <= monster.y + 32
        && monster.y <= pacman.y + 32
    ) {
        ++monstersCaught;
        reset();
    }
    if(coinReady) {
        coin.update();
    }
    pacman.image.update();
};

//draw everything
var render = function() {
    if(bgReady) {
        ctx.drawImage(bgImage, 0, 0);
    }
    if(pacmanReady) {
        //ctx.drawImage(pacmanImage, pacman.x, pacman.y);
        pacman.image.render();
    }
    if(monsterReady) {
        ctx.drawImage(monsterImage, monster.x, monster.y);
    }

    if(coinReady) {
        coin.render();
    }

    //score
    ctx.fillStyle = "rgba(250, 250, 250)";
    ctx.font = "24px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Monsters Caught: " + monstersCaught, 32, 32);
};

//the main game loop
var main = function() {
    var now = Date.now();
    var delta = now - then;

    update(delta / 1000);
    render();

    then = now;

    //request to do this again
    requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

//lets play the game
var then = Date.now();
reset();
main();

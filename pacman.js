var SCORE;
var GAMEOVER;

window.onload = function () {

/*window.onblur = function() {
    paused = true;
}
window.onfocus = function() {
    paused = false;
}*/

var paused = true;
var lives = 5;
var blockWidth = 26.95, blockHeight = 23;//22.86;
var thinking;
var thinkingTimeStart;

var beepSound = new Audio('sounds/beep.wav');
var deadSound = new Audio('sounds/dead.wav');
var correctSound = new Audio('sounds/correct.mp3');
var wrongSound = new Audio('sounds/wrong.wav');

var canvas = document.getElementById("canvasHolder");
var ctx = canvas.getContext("2d");
//canvas.width = 512;
//canvas.height = 480;

var Qcanvas = document.getElementById("question");
var Qctx = Qcanvas.getContext("2d");
var number1, number2;
var answered = true;
var answerBalls = [];
var answerBallRadius = Math.min(blockWidth, blockHeight) - 15;

function sprite(options) {
    var that = {};
    that.frameIndexHorizontal = 0,
    that.frameIndexVertical = 0;
    that.tickCount = 0,
    that.ticksPerFrame = options.ticksPerFrame || 0,
    that.numberOfFramesHorizontal = options.numberOfFramesHorizontal || 1,
    that.numberOfFramesVertical = options.numberOfFramesVertical || 1;
    that.context = options.context;
    that.width = options.width;
    that.height = options.height;
    that.image = options.image;
    that.loop = options.loop;
    that.destWidth = options.destWidth || that.width / that.numberOfFramesHorizontal;
    that.destHeight = options.destHeight || that.height / that.numberOfFramesVertical;
    that.render = function(x, y) {
        that.context.drawImage(
            that.image,
            that.frameIndexHorizontal * (that.width / that.numberOfFramesHorizontal),
            that.frameIndexVertical * (that.height / that.numberOfFramesVertical),
            that.width / that.numberOfFramesHorizontal,
            that.height / that.numberOfFramesVertical,
            x,
            y,
            that.destWidth,
            that.destHeight
        );
    };
    that.update = function() {
        that.tickCount += 1;
        if(that.tickCount > that.ticksPerFrame) {
            that.tickCount = 0;
            //if the current frame index is in range
            if(that.frameIndexHorizontal < that.numberOfFramesHorizontal - 1) {
                //go to next frame
                that.frameIndexHorizontal += 1;
            } else if(that.loop) {
                that.frameIndexHorizontal = 0;
            }
        }
    };
    return that;
}

//pacman image and object
var pacImg = new Image();
pacImg.src = "images/pacman.png";
var pacReady = false;
pacImg.onload = function() {pacReady = true;};
var pacman = {
    dir: null,
    nextDir: null,
    x: 0,
    y: 0,
    i: 0,
    j: 0,
    target_i: 0,
    target_j: 0,
    targetReached: true,
    speed: 128,
    sprite: sprite({
        context: ctx,
        width: 48,
        height: 64,
        image: pacImg,
        loop: true,
        numberOfFramesHorizontal: 3,
        numberOfFramesVertical: 4,
        ticksPerFrame: 8
    })
};
pacman.update = function(delta) {
    this.sprite.update();
    //collision detection with ghosts
    for(var p = 0; p < 4; p++) {
        var distX = Math.abs(ghosts[p].x - this.x);
        var distY = Math.abs(ghosts[p].y - this.y);
	console.log("ghost = " + ghosts[p].i + ", " +ghosts[p].j);
	console.log("pacman = " + this.i + ", " +this.j);
        if(distX + distY < 20 || (ghosts[p].i == this.i && ghosts[p].j == this.j)) {
            //paused = true;
            decreaseLife();
            return;
        }
    }

    if(this.target_i == null && this.target_j == null && this.nextDir == null) return;
    var change = this.speed * delta;
    if(!this.targetReached) {   //target is not yet reached
        switch(this.dir) {
            case "right":
            if(this.target_i == 9 && this.target_j == 0) {  //handling special case of wrapping around
                this.x += change;
                if(this.x >= canvas.width) {
                    this.x -= canvas.width;
                }
                if(this.x >= this.target_j*blockWidth && this.x < canvas.width / 2) {  //pacman thoda aage aa gaya
                    change = this.x - this.target_j*blockWidth;
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    this.target_i = null;
                    this.target_j = null;
                }
            } else {
                if(change < this.target_j*blockWidth - this.x) {
                    this.x += change;
                } else {
                    change -= this.target_j*blockWidth - this.x;
                    this.x = this.target_j*blockWidth;
                    //target is reached with extra displacement stored in "change"
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    this.target_i = null;
                    this.target_j = null;
                }
            }
                break;
            case "left":
            if(this.target_i == 9 && this.target_j == 18) {  //handling special case of wrapping around
                this.x -= change;
                if(this.x < 0) {
                    this.x += canvas.width;
                }
                if(this.x <= this.target_j*blockWidth && this.x > canvas.width / 2) {  //pacman thoda aage aa gaya
                    change = this.target_j*blockWidth - this.x;
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    this.target_i = null;
                    this.target_j = null;
                }
            } else {
                if(change < this.x - this.target_j*blockWidth) {
                    this.x -= change;
                } else {
                    change -= this.x - this.target_j*blockWidth;
                    this.x = this.target_j*blockWidth;
                    //target is reached with extra displacement stored in "change"
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    this.target_i = null;
                    this.target_j = null;
                }
            }
                break;
            case "up":
                if(change < this.y - this.target_i*blockHeight) {
                    this.y -= change;
                } else {
                    change -= this.y - this.target_i*blockHeight;
                    this.y = this.target_i*blockHeight;
                    //target is reached with extra displacement stored in "change"
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    this.target_i = null;
                    this.target_j = null;
                }
                break;
            case "down":
                if(change < this.target_i*blockHeight - this.y) {
                    this.y += change;
                } else {
                    change -= this.target_i*blockHeight - this.y;
                    this.y = this.target_i*blockHeight;
                    //target is reached with extra displacement stored in "change"
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    this.target_i = null;
                    this.target_j = null;
                }
                break;
        }
    }
    if(this.targetReached) {
        if(this.nextDir != null) {
            //check if new dir move is possible, and change the dir accordingly
            if(this.i == 9 && this.j == 18) {  //handling special case of wrapping around
                this.dir = "right";
            } else {
            switch(this.nextDir) {
                case "right":
                    if(movable[this.i][this.j+1]) {
                        this.dir = this.nextDir;
                        this.nextDir = null;
                        this.sprite.frameIndexVertical = 0;
                    }
                    break;
                case "left":
                    if(movable[this.i][this.j-1]) {
                        this.dir = this.nextDir;
                        this.nextDir = null;
                        this.sprite.frameIndexVertical = 1;
                    }
                    break;
                case "up":
                    if(movable[this.i-1][this.j]) {
                        this.dir = this.nextDir;
                        this.nextDir = null;
                        this.sprite.frameIndexVertical = 2;
                    }
                    break;
                case "down":
                    if(movable[this.i+1][this.j]) {
                        this.dir = this.nextDir;
                        this.nextDir = null;
                        this.sprite.frameIndexVertical = 3;
                    }
                    break;
            }
        }
        }
        //update target based on dir
        switch (this.dir) {
            case "right":
            if(this.i == 9 && this.j == 18) {  //handling special case of wrapping around
                this.target_i = 9;
                this.target_j = 0;
                this.targetReached = false;
                this.x += change;
                this.x %= canvas.width;
            } else {
                if(movable[this.i][this.j+1]) {
                    this.target_i = this.i;
                    this.target_j = this.j+1;
                    //target reached is now false
                    this.targetReached = false;
                    this.x += change;
                }
            }
                break;
            case "left":
            if(this.i == 9 && this.j == 0) {  //handling special case of wrapping around
                this.target_i = 9;
                this.target_j = 18;
                this.targetReached = false;
                this.x -= change;
                //this.x %= canvas.width;
            } else {
                if(movable[this.i][this.j-1]) {
                    this.target_i = this.i;
                    this.target_j = this.j-1;
                    this.targetReached = false;
                    this.x -= change;
                }
            }
                break;
            case "up":
                if(movable[this.i-1][this.j]) {
                    this.target_i = this.i-1;
                    this.target_j = this.j;
                    this.targetReached = false;
                    this.y -= change;
                }
                break;
            case "down":
                if(movable[this.i+1][this.j]) {
                    this.target_i = this.i+1;
                    this.target_j = this.j;
                    this.targetReached = false;
                    this.y += change;
                }
                break;
            default:
        }
    }

    //collision detection with answer balls
    for(var p = 0; p < answerBalls.length; p++) {
        if(this.i == answerBalls[p].i && this.j == answerBalls[p].j) {
            //collision detected
            //TODO : check if answer is correct or not
            if(answerBalls[p].value == number1 + number2) {
                SCORE += 5;
                correctSound.play();
            } else {
                SCORE -= 1;
                wrongSound.play();
            }
            answered = true;
            break;
        }
    }
}
pacman.render = function() {
    this.sprite.render(this.x + 10, this.y + 10);
}
pacman.changeDirection = function(direction) {
    this.nextDir = direction;
}

//ghosts image and object
var ghostImg = new Image();
ghostImg.src = "images/complete.gif";
var ghostImageReady = false;
ghostImg.onload = function() {ghostImageReady = true;};
var ghosts = [];
for(var i = 0; i < 4; i++) { //4 ghosts
    ghosts[i] = {
        dir: null,
        x: 0,
        y: 0,
        i: 0,
        j: 0,
        target_i: null,
        target_j: null,
        targetReached: true,
        speed: 60 + 2*i,
        sprite: sprite({
            context: ctx,
            width: 192,
            height: 192,
            image: ghostImg,
            loop: true,
            numberOfFramesHorizontal: 8,
            numberOfFramesVertical: 8,
            ticksPerFrame: 15
        })
    };
    ghosts[i].sprite.frameIndexVertical = 2 + i;
    ghosts[i].render = function() {
        this.sprite.update();
        this.sprite.render(this.x + 5, this.y + 5);
    };
}
//pacman following ghosts
for(var p = 0; p < 4; p+=3) {
    ghosts[p].update = function(delta) {
        var change = this.speed * delta;
        if(!this.targetReached) {
            switch(this.dir) {
                case "right":
                    if(change < this.target_j*blockWidth - this.x) {
                        this.x += change;
                    } else {
                        change -= this.target_j*blockWidth - this.x;
                        this.x = this.target_j*blockWidth;
                        //target is reached with extra displacement stored in "change"
                        this.targetReached = true;
                        this.i = this.target_i;
                        this.j = this.target_j;
                    }
                    break;
                case "left":
                    if(change < this.x - this.target_j*blockWidth) {
                        this.x -= change;
                    } else {
                        change -= this.x - this.target_j*blockWidth;
                        this.x = this.target_j*blockWidth;
                        //target is reached with extra displacement stored in "change"
                        this.targetReached = true;
                        this.i = this.target_i;
                        this.j = this.target_j;
                    }
                    break;
                case "up":
                    if(change < this.y - this.target_i*blockHeight) {
                        this.y -= change;
                    } else {
                        change -= this.y - this.target_i*blockHeight;
                        this.y = this.target_i*blockHeight;
                        //target is reached with extra displacement stored in "change"
                        this.targetReached = true;
                        this.i = this.target_i;
                        this.j = this.target_j;
                    }
                    break;
                case "down":
                    if(change < this.target_i*blockHeight - this.y) {
                        this.y += change;
                    } else {
                        change -= this.target_i*blockHeight - this.y;
                        this.y = this.target_i*blockHeight;
                        //target is reached with extra displacement stored in "change"
                        this.targetReached = true;
                        this.i = this.target_i;
                        this.j = this.target_j;
                    }
                    break;
            }
        }
        if(this.targetReached) {
            //acquire a new target
            var target_i = pacman.target_i || pacman.i;
            var target_j = pacman.target_j || pacman.j;
            if(this.i == target_i && this.j == target_j) { return; }  //allready on target

            //apply shortest path - using bfs
            var q = [], cnt = 0;
            //up
            if(movable[this.i-1][this.j]) {
                q.push([this.i-1, this.j, this.i-1, this.j]);
            }
            //down
            if(movable[this.i+1][this.j]) {
                q.push([this.i+1, this.j, this.i+1, this.j]);
            }
            //left
            if(movable[this.i][this.j-1]) {
                q.push([this.i, this.j-1, this.i, this.j-1]);
            }
            //right
            if(movable[this.i][this.j+1]) {
                q.push([this.i, this.j+1, this.i, this.j+1]);
            }
            var found = false;
            while(!found) {
                var node = q[cnt];
                cnt++;
                if(node[0] == target_i && node[1] == target_j) {
                    //target found
                    found = true;
                    this.target_i = node[2];
                    this.target_j = node[3];
                } else {
                    if(movable[node[0]-1][node[1]] && notInArray(q, node[0]-1, node[1])) {  //up
                        q.push([node[0]-1, node[1], node[2], node[3]]);
                    }
                    if(movable[node[0]+1][node[1]] && notInArray(q, node[0]+1, node[1])) {  //down
                        q.push([node[0]+1, node[1], node[2], node[3]]);
                    }
                    if(movable[node[0]][node[1]-1] && notInArray(q, node[0], node[1]-1)) {  //left
                        q.push([node[0], node[1]-1, node[2], node[3]]);
                    }
                    if(movable[node[0]][node[1]+1] && notInArray(q, node[0], node[1]+1)) {  //right
                        q.push([node[0], node[1]+1, node[2], node[3]]);
                    }
                }
            }
            this.targetReached = false;
            if(this.i == this.target_i) {
                if(this.j < this.target_j) {
                    this.dir = "right";
                    this.x += change;
                } else {
                    this.dir = "left";
                    this.x -= change;
                }
            } else {
                if(this.i < this.target_i) {
                    this.dir = "down";
                    this.y += change;
                } else {
                    this.dir = "up";
                    this.y -= change;
                }
            }
        }
    };
}
function notInArray(arr, i, j) {
    for(var k = 0; k < arr.length; k++) {
        if(arr[k][0] == i && arr[k][1] == j)
            return false;
    }
    return true;
}
//randomly moving ghosts
for(var p = 1; p < 3; p++) {
    ghosts[p].update = function(delta) {
        var change = this.speed * delta;
        switch(this.dir) {
            case "right":
                if(change < this.target_j*blockWidth - this.x) {
                    this.x += change;
                } else {
                    change -= this.target_j*blockWidth - this.x;
                    this.x = this.target_j*blockWidth;
                    //target is reached with extra displacement stored in "change"
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    //acquire new target
                    this.dir = null;
                    while(this.dir == null) {
                        var p = Math.floor(Math.random()*3);
                        switch (p) {
                            case 0: //right
                                if(movable[this.i][this.j+1]) {
                                    this.dir = "right";
                                    this.target_i = this.i;
                                    this.target_j = this.j + 1;
                                    this.x += change;
                                }
                                break;
                            case 1: //up
                                if(movable[this.i-1][this.j]) {
                                    this.dir = "up";
                                    this.target_i = this.i - 1;
                                    this.target_j = this.j;
                                    this.y -= change;
                                }
                                break;
                            case 2: //down
                                if(movable[this.i+1][this.j]) {
                                    this.dir = "down";
                                    this.target_i = this.i + 1;
                                    this.target_j = this.j;
                                    this.y += change;
                                }
                                break;
                        }
                        //nothing possible except reversing
                        if(!(movable[this.i][this.j+1]) && !(movable[this.i-1][this.j]) && !(movable[this.i+1][this.j])) {
                            this.dir = "left";
                            this.x -= change;
                            this.target_i = this.i;
                            this.target_j = this.j - 1;
                        }
                    }
                }
                break;
            case "left":
                if(change < this.x - this.target_j*blockWidth) {
                    this.x -= change;
                } else {
                    change -= this.x - this.target_j*blockWidth;
                    this.x = this.target_j*blockWidth;
                    //target is reached with extra displacement stored in "change"
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    //acquire new target
                    this.dir = null;
                    while(this.dir == null) {
                        var p = Math.floor(Math.random()*3);
                        switch (p) {
                            case 0: //left
                                if(movable[this.i][this.j-1]) {
                                    this.dir = "left";
                                    this.target_i = this.i;
                                    this.target_j = this.j - 1;
                                    this.x -= change;
                                }
                                break;
                            case 1: //up
                                if(movable[this.i-1][this.j]) {
                                    this.dir = "up";
                                    this.target_i = this.i - 1;
                                    this.target_j = this.j;
                                    this.y -= change;
                                }
                                break;
                            case 2: //down
                                if(movable[this.i+1][this.j]) {
                                    this.dir = "down";
                                    this.target_i = this.i + 1;
                                    this.target_j = this.j;
                                    this.y += change;
                                }
                                break;
                        }
                        //nothing possible except reversing
                        if(!(movable[this.i][this.j-1]) && !(movable[this.i-1][this.j]) && !(movable[this.i+1][this.j])) {
                            this.dir = "right";
                            this.x += change;
                            this.target_i = this.i;
                            this.target_j = this.j + 1;
                        }
                    }
                }
                break;
            case "up":
                if(change < this.y - this.target_i*blockHeight) {
                    this.y -= change;
                } else {
                    change -= this.y - this.target_i*blockHeight;
                    this.y = this.target_i*blockHeight;
                    //target is reached with extra displacement stored in "change"
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    //acquire new target
                    this.dir = null;
                    while(this.dir == null) {
                        var p = Math.floor(Math.random()*3);
                        switch (p) {
                            case 0: //right
                                if(movable[this.i][this.j+1]) {
                                    this.dir = "right";
                                    this.target_i = this.i;
                                    this.target_j = this.j + 1;
                                    this.x += change;
                                }
                                break;
                            case 1: //up
                                if(movable[this.i-1][this.j]) {
                                    this.dir = "up";
                                    this.target_i = this.i - 1;
                                    this.target_j = this.j;
                                    this.y -= change;
                                }
                                break;
                            case 2: //left
                                if(movable[this.i][this.j-1]) {
                                    this.dir = "left";
                                    this.target_i = this.i;
                                    this.target_j = this.j - 1;
                                    this.x -= change;
                                }
                                break;
                        }
                        //nothing possible except reversing
                        if(!(movable[this.i][this.j+1]) && !(movable[this.i-1][this.j]) && !(movable[this.i][this.j-1])) {
                            this.dir = "down";
                            this.y += change;
                            this.target_i = this.i + 1;
                            this.target_j = this.j;
                        }
                    }
                }
                break;
            case "down":
                if(change < this.target_i*blockHeight - this.y) {
                    this.y += change;
                } else {
                    change -= this.target_i*blockHeight - this.y;
                    this.y = this.target_i*blockHeight;
                    //target is reached with extra displacement stored in "change"
                    this.targetReached = true;
                    this.i = this.target_i;
                    this.j = this.target_j;
                    //acquire new target
                    this.dir = null;
                    while(this.dir == null) {
                        var p = Math.floor(Math.random()*3);
                        switch (p) {
                            case 0: //right
                                if(movable[this.i][this.j+1]) {
                                    this.dir = "right";
                                    this.target_i = this.i;
                                    this.target_j = this.j + 1;
                                    this.x += change;
                                }
                                break;
                            case 1: //down
                                if(movable[this.i+1][this.j]) {
                                    this.dir = "down";
                                    this.target_i = this.i + 1;
                                    this.target_j = this.j;
                                    this.y += change;
                                }
                                break;
                            case 2: //left
                                if(movable[this.i][this.j-1]) {
                                    this.dir = "left";
                                    this.target_i = this.i;
                                    this.target_j = this.j - 1;
                                    this.x -= change;
                                }
                                break;
                        }
                        //nothing possible except reversing
                        if(!(movable[this.i][this.j+1]) && !(movable[this.i+1][this.j]) && !(movable[this.i][this.j-1])) {
                            this.dir = "up";
                            this.y -= change;
                            this.target_i = this.i - 1;
                            this.target_j = this.j;
                        }
                    }
                }
                break;
        }
    }
}

//backgroung image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function() {
    bgReady = true;
};
bgImage.src = "images/background.png";

//heart image ad object
var heartImg = new Image();
var heartReady = false;
heartImg.onload = function() { heartReady = true; };
heartImg.src = "images/heart.png";
var hearts = [];
for(var i = 0; i < lives; i++) {
    hearts.push(sprite({
        context: Qctx,
        width: 200,
        height: 32,
        image: heartImg,
        loop: true,
        numberOfFramesHorizontal: 6,
        numberOfFramesVertical: 1,
        ticksPerFrame: 8
    }));
}

var T = true, F = false;
//19 X 21
var movable = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
    [F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F],  //0
    [F, T, T, T, T, T, T, T, T, F, T, T, T, T, T, T, T, T, F],  //1
    [F, T, F, F, T, F, F, F, T, F, T, F, F, F, T, F, F, T, F],  //2
    [F, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, F],  //3
    [F, T, F, F, T, F, T, F, F, F, F, F, T, F, T, F, F, T, F],  //4
    [F, T, T, T, T, F, T, T, T, F, T, T, T, F, T, T, T, T, F],  //5
    [F, F, F, F, T, F, F, F, T, F, T, F, F, F, T, F, F, F, F],  //6
    [F, F, F, F, T, F, T, T, T, T, T, T, T, F, T, F, F, F, F],  //7
    [F, F, F, F, T, F, T, F, F, T, F, F, T, F, T, F, F, F, F],  //8
    [T, T, T, T, T, T, T, F, T, T, T, F, T, T, T, T, T, T, T],  //9
    [F, F, F, F, T, F, T, F, F, F, F, F, T, F, T, F, F, F, F],  //10
    [F, F, F, F, T, F, T, T, T, T, T, T, T, F, T, F, F, F, F],  //11
    [F, F, F, F, T, F, T, F, F, F, F, F, T, F, T, F, F, F, F],  //12
    [F, T, T, T, T, T, T, T, T, F, T, T, T, T, T, T, T, T, F],  //13
    [F, T, F, F, T, F, F, F, T, F, T, F, F, F, T, F, F, T, F],  //14
    [F, T, T, F, T, T, T, T, T, T, T, T, T, T, T, F, T, T, F],  //15
    [F, F, T, F, T, F, T, F, F, F, F, F, T, F, T, F, T, F, F],  //16
    [F, T, T, T, T, F, T, T, T, F, T, T, T, F, T, T, T, T, F],  //17
    [F, T, F, F, F, F, F, F, T, F, T, F, F, F, F, F, F, T, F],  //18
    [F, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, F],  //19
    [F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F]   //20
];

//handle keyboard controls
addEventListener("keydown", function(e) {
    switch(e.keyCode) {
        case 37: pacman.changeDirection("left"); break;
        case 38: pacman.changeDirection("up"); break;
        case 39: pacman.changeDirection("right"); break;
        case 40: pacman.changeDirection("down"); break;
    }
}, false);

var update = function(delta) {
    if(Date.now() - thinkingTimeStart >= 5000) {
        //thinking time is now over
        thinking = false;
    }
    if(!GAMEOVER && !paused && !thinking) {
        if(pacReady) {
            pacman.update(delta);
        }
        if(ghostImageReady) {
            for(var i = 0; i < 4; i++) {
                ghosts[i].update(delta);
            }
        }
    }
}

var render = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(bgReady) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }
    if(pacReady) {
        pacman.render();
    }
 /*
    ctx.fillStyle="#0000FF";
    for(var i = 0; i < movable.length; i++) {
        for(var j = 0; j < movable[0].length; j++) {
            if(!movable[i][j]) {
                ctx.fillRect(j*blockWidth, i*blockHeight, blockWidth, blockHeight);
            }
        }
    }*/
    if(ghostImageReady) {
        for(var i = 0; i < 4; i++) {
            ghosts[i].render();
        }
    }

    renderQ();
    //render answer balls
    ctx.font = "15px Calibri";
    for(var  i = 0; i < answerBalls.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = "rgb(200,0,0)";
        ctx.arc(answerBalls[i].j*blockWidth + blockWidth/2, answerBalls[i].i*blockHeight + blockHeight/2, answerBallRadius, 0, 2*Math.PI);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.textAlign = 'center';
        ctx.fillText(answerBalls[i].value, answerBalls[i].j*blockWidth  + blockWidth/2, answerBalls[i].i*blockHeight +blockHeight/2 + 5);
    }
    if(thinking) {
        ctx.font = '50px "TooneyNoodleNF"';
        var t = 5 - Math.floor((Date.now() - thinkingTimeStart)/1000);
        if(t != secondsLeft) {
            beepSound.play();
            secondsLeft = t;
        }
        ctx.fillText("Solve in:" + secondsLeft, canvas.width/2, canvas.height/2);
    }
}

var renderQ = function() {
    if(answered) {
        //generate new question
        number1 = Math.floor(Math.random()*10);
        number2 = Math.floor(Math.random()*10);
        generateNewAnswers();
        answered = false;
        thinking = true;
        thinkingTimeStart = Date.now();
        secondsLeft = 5;
        beepSound.play();
    }
    Qctx.fillStyle = "black";
    Qctx.fillRect(0, 0, Qcanvas.width, Qcanvas.height);
    Qctx.font = '30px "TooneyNoodleNF"';
    Qctx.textAlign = 'left';
    Qctx.fillStyle = 'aqua';
    Qctx.textBaseline = 'top';
    Qctx.fillText("LIVES: " + lives, 10, Qcanvas.height - 70);
    Qctx.fillText("SCORE: " + SCORE, Qcanvas.width - 200, Qcanvas.height - 70);
    Qctx.textAlign = 'center';
    Qctx.font = '60px "TooneyNoodleNF"';
    if(!GAMEOVER) {
        Qctx.fillText(number1 + " + " + number2 + " = ?", Qcanvas.width/2, 10);
    } else {
        Qctx.fillText("GAME OVER!!!", Qcanvas.width/2, 10);
    }
    if(heartReady) {
        for(var i = 0; i < lives; i++) {
            hearts[i].update();
            hearts[i].render(10 + 40*i, Qcanvas.height - 35);
        }
    }

}

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

var reset = function() {
    pacman.target_i = null;
    pacman.i = 11;
    pacman.target_j = null;
    pacman.j = 9;
    pacman.x = pacman.j * blockWidth;
    pacman.y = pacman.i * blockHeight;
    pacman.targetReached = true;
    pacman.dir = null;
    pacman.nextDir = null;
    pacman.sprite.frameIndexVertical = 0;

    for(var p = 0; p < 4; p++) {
        ghosts[p].i = 9;
        ghosts[p].j = 9;
        ghosts[p].x = 9 * blockWidth;
        ghosts[p].y = 9 * blockHeight;
        if(p == 1) {
            ghosts[p].dir = "right";
            ghosts[p].target_i = 9;
            ghosts[p].target_j = 10;
        }
        else if(p == 2) {
            ghosts[p].dir = "left"
            ghosts[p].target_i = 9;
            ghosts[p].target_j = 8;
        } else {
            ghosts[p].dir = null;
            ghosts[p].targetReached = true;
            ghosts[p].target_i = null;
            ghosts[p].target_j = null;

        }
    }

    answered = true;
};

var decreaseLife = function() {
    lives--;
    if(lives == 0) {
        deadSound.play();
        gameOver();
    }
    else {
        //wait for a second
        var t = Date.now();
        //ctx.font = '50px "TooneyNoodleNF"';
        //ctx.fillText("OUT!!!", canvas.width/2, canvas.height/2);
        while(Date.now() - t < 1500) {

        }
        reset();
    }
}

var gameOver = function() {
    paused = true;
    GAMEOVER = true;
	
	//sends score to the page this file will be embedded in - achie27
	window.parent.postMessage(SCORE, '*');
	//end
}

var generateNewAnswers = function() {
    answerBalls.length = 0;
    var positions = [];
    //pacman nearby positions
    positions.push([pacman.i, pacman.j]);
    positions.push([pacman.i-1, pacman.j]);
    positions.push([pacman.i+1, pacman.j]);
    positions.push([pacman.i, pacman.j-1]);
    positions.push([pacman.i, pacman.j+1]);
    //ghosts' house
    positions.push([9, 9]);
    positions.push([9, 8]);
    positions.push([9, 7]);
    positions.push([8, 9]);

    for(var i = 0; i < 4; i++) {
        answerBalls.push({
            value: number1 + number2,
            i: Math.floor(Math.random()*19),
            j: Math.floor(Math.random()*21)
        });
        while(answerBalls[i].value == number1 + number2) {
            answerBalls[i].value = Math.floor(Math.random()*40);
        }
        while(!movable[answerBalls[i].i][answerBalls[i].j] || !notInArray(positions, answerBalls[i].i, answerBalls[i].j)) {
            answerBalls[i].i = Math.floor(Math.random()*19);
            answerBalls[i].j = Math.floor(Math.random()*21);
        }
        positions.push([answerBalls[i].i, answerBalls[i].j]);
        positions.push([answerBalls[i].i-1, answerBalls[i].j]);
        positions.push([answerBalls[i].i+1, answerBalls[i].j]);
        positions.push([answerBalls[i].i, answerBalls[i].j-1]);
        positions.push([answerBalls[i].i, answerBalls[i].j+1]);
    }
    answerBalls.push({
        value: number1 + number2,
        i: Math.floor(Math.random()*19),
        j: Math.floor(Math.random()*21)
    });
    while(!movable[answerBalls[answerBalls.length-1].i][answerBalls[answerBalls.length-1].j] || !notInArray(positions, answerBalls[answerBalls.length-1].i, answerBalls[answerBalls.length-1].j)) {
        answerBalls[answerBalls.length-1].i = Math.floor(Math.random()*19);
        answerBalls[answerBalls.length-1].j = Math.floor(Math.random()*21);
    }
}

//lets play the game
var then = Date.now();
GAMEOVER = false;
SCORE = 0;
thinking = true;
paused = false;
reset();
main();


// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;
};

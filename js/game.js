var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");

var menuScreen = document.getElementById("menuScreen");
var winScreen = document.getElementById("winScreen");
var loseScreen = document.getElementById("loseScreen");
var enemyLoseScreen = document.getElementById("enemyLoseScreen");
var startButton = document.getElementById("startButton");
var restartButtons = document.getElementsByClassName("restartButton");

var gameState = "menu";
var keys = {};


var imgPlayer = new Image();
imgPlayer.src = "images/notmario.png";

var imgPlatform = new Image();
imgPlatform.src = "images/platform.png";

var imgHazard = new Image();
imgHazard.src = "images/hazard.png";

var imgGoal = new Image();
imgGoal.src = "images/goal.png";

var imgBackground = new Image();
imgBackground.src = "images/background.jpeg";

var imgEnemy = new Image();
imgEnemy.src = "images/enemy.png";


var gravity = 0.6;
var maxFallSpeed = 15;
var moveSpeed = 4;

var player = {
    x: 60,
    y: 280,
    w: 32,
    h: 48,
    vx: 0,
    vy: 0,
    onGround: false,
    jumpStrength: -12
};


var platforms = [
    { x: 0,   y: 400, w: 800, h: 50 },
    { x: 120, y: 340, w: 120, h: 20 },
    { x: 300, y: 300, w: 120, h: 20 },
    { x: 500, y: 260, w: 120, h: 20 },
    { x: 650, y: 320, w: 100, h: 20 }
];


var hazards = [
    { x: 260, y: 380, w: 40, h: 20 },
    { x: 440, y: 380, w: 40, h: 20 }
];


var goal = {
    x: 720,
    y: 260,
    w: 40,
    h: 60
};


var enemies = [
    {
        x: 380,
        y: 368,          
        w: 32,
        h: 32,
        vx: 1.5,
        patrolMinX: 360,
        patrolMaxX: 560,
        alive: true
    }
];

window.addEventListener("keydown", function(e) {
    keys[e.code] = true;

    if (e.code.indexOf("Arrow") === 0 || e.code === "Space") {
        e.preventDefault();
    }
});

window.addEventListener("keyup", function(e) {
    keys[e.code] = false;
});


function rectsIntersect(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}


function showScreen(screen) {
    menuScreen.classList.remove("active");
    winScreen.classList.remove("active");
    loseScreen.classList.remove("active");
    enemyLoseScreen.classList.remove("active");

    if (screen === "menu") {
        menuScreen.classList.add("active");
    } else if (screen === "win") {
        winScreen.classList.add("active");
    } else if (screen === "lose") {
        loseScreen.classList.add("active");
    } else if (screen === "enemylose") {
        enemyLoseScreen.classList.add("active");
    }
}

function resetPlayer() {
    player.x = 60;
    player.y = 280;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
}

function resetEnemies() {
    var i;
    for (i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        e.alive = true;
    }
}

function startGame() {
    resetPlayer();
    resetEnemies();
    gameState = "playing";
    showScreen(null);
}

function winGame() {
    gameState = "won";
    showScreen("win");
}

function loseGame() {
    gameState = "lost";
    showScreen("lose");
}

function enemyLoseGame() {
    gameState = "lost";
    showScreen("enemylose");
}

function restartGame() {
    resetPlayer();
    resetEnemies();
    gameState = "playing";
    showScreen(null);
}

function update() {
    if (gameState !== "playing") {
        return;
    }


    var moveLeft = keys["ArrowLeft"] || keys["KeyA"];
    var moveRight = keys["ArrowRight"] || keys["KeyD"];

    if (moveLeft && !moveRight) {
        player.vx = -moveSpeed;
    } else if (moveRight && !moveLeft) {
        player.vx = moveSpeed;
    } else {
        player.vx *= 0.8;
        if (Math.abs(player.vx) < 0.1) {
            player.vx = 0;
        }
    }


    var jumpPressed = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];
    if (jumpPressed && player.onGround) {
        player.vy = player.jumpStrength;
        player.onGround = false;
    }


    player.vy += gravity;
    if (player.vy > maxFallSpeed) {
        player.vy = maxFallSpeed;
    }


    player.x += player.vx;
    var i;
    for (i = 0; i < platforms.length; i++) {
        var p = platforms[i];
        if (rectsIntersect(player, p)) {
            if (player.vx > 0) {
                player.x = p.x - player.w;
            } else if (player.vx < 0) {
                player.x = p.x + p.w;
            }
            player.vx = 0;
        }
    }


    player.y += player.vy;
    player.onGround = false;

    for (i = 0; i < platforms.length; i++) {
        var p2 = platforms[i];
        if (rectsIntersect(player, p2)) {
            if (player.vy > 0) {
                player.y = p2.y - player.h;
                player.vy = 0;
                player.onGround = true;
            } else if (player.vy < 0) {
                player.y = p2.y + p2.h;
                player.vy = 0;
            }
        }
    }


    for (i = 0; i < enemies.length; i++) {
        var e = enemies[i];

        if (!e.alive) {
            continue;
        }

        e.x += e.vx;

        if (e.x < e.patrolMinX) {
            e.x = e.patrolMinX;
            e.vx *= -1;
        } else if (e.x + e.w > e.patrolMaxX) {
            e.x = e.patrolMaxX - e.w;
            e.vx *= -1;
        }

        if (rectsIntersect(player, e)) {
            var playerBottom = player.y + player.h;
            var enemyTop = e.y;

            if (player.vy > 0 && playerBottom <= enemyTop + e.h * 0.5) {
                e.alive = false;
                player.vy = player.jumpStrength * 0.5;
                player.onGround = false;
            } else {
                enemyLoseGame();
                return;
            }
        }
    }

    for (i = 0; i < hazards.length; i++) {
        if (rectsIntersect(player, hazards[i])) {
            loseGame();
            return;
        }
    }

    if (rectsIntersect(player, goal)) {
        winGame();
        return;
    }

    if (player.y > canvas.height + 100) {
        loseGame();
        return;
    }
}

function drawBackground() {
    if (imgBackground.complete && imgBackground.naturalWidth > 0) {
        ctx.drawImage(imgBackground, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#4c90ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawPlatforms() {
    var i;
    for (i = 0; i < platforms.length; i++) {
        var p = platforms[i];

        if (i === 0) {
            continue;
        }

        if (imgPlatform.complete && imgPlatform.naturalWidth > 0) {
            ctx.drawImage(imgPlatform, p.x, p.y, p.w, p.h);
        } else {
            ctx.fillStyle = "#4b3621";
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }
    }
}

function drawHazards() {
    var i;
    for (i = 0; i < hazards.length; i++) {
        var h = hazards[i];

        if (imgHazard.complete && imgHazard.naturalWidth > 0) {
            ctx.drawImage(imgHazard, h.x, h.y, h.w, h.h);
        } else {
            ctx.fillStyle = "#ff3333";
            ctx.fillRect(h.x, h.y, h.w, h.h);
        }
    }
}

function drawGoal() {
    if (imgGoal.complete && imgGoal.naturalWidth > 0) {
        ctx.drawImage(imgGoal, goal.x, goal.y, goal.w, goal.h);
    } else {
        ctx.fillStyle = "#00cc66";
        ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
    }
}

function drawEnemies() {
    var i;
    for (i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e.alive) {
            continue;
        }

        if (imgEnemy.complete && imgEnemy.naturalWidth > 0) {
            ctx.drawImage(imgEnemy, e.x, e.y, e.w, e.h);
        } else {
            ctx.fillStyle = "#cc9900";
            ctx.fillRect(e.x, e.y, e.w, e.h);
        }
    }
}

function drawPlayer() {
    if (imgPlayer.complete && imgPlayer.naturalWidth > 0) {
        ctx.drawImage(imgPlayer, player.x, player.y, player.w, player.h);
    } else {
        ctx.fillStyle = "#9933ff";
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawPlatforms();
    drawHazards();
    drawGoal();
    drawEnemies();
    drawPlayer();
}

function gameLoop() {
    update();
    drawGame();
    requestAnimationFrame(gameLoop);
}


startButton.addEventListener("click", function() {
    startGame();
});

var j;
for (j = 0; j < restartButtons.length; j++) {
    restartButtons[j].addEventListener("click", function() {
        restartGame();
    });
}

    //used to move the level. WORK IN PROGRESS
    // var offset = {x:imgPlayer.vx, y:imgPlayer.vy}

    // while(ground.isOverPoint(imgPlayer.bottom()))
    // {
    //     imgPlayer.vy = 0;
    //     imgPlayer.y--;
    //     offset.y--;
    //     imgPlayer.canJump = true;
    // }
    // while(platform.isOverPoint(imgPlayer.bottom()) && imgPlayer.vy >= 0)
    // {
    //     imgPlayer.vy = 0;
    //     imgPlayer.y--;
    //     offset.y--;
    //     imgPlayer.canJump = true;
    // }
    // while(wall.isOverPoint(imgPlayer.right()) && imgPlayer.vx >= 0)
    // {
    //     imgPlayer.vx = 0;
    //     imgPlayer.x--;
    //     offset.x--;
    // }

    /*-------Level movement threshold----*/
    //if(imgPlayer.x > 500 || imgPlayer.x < 300)
    //{
        //Level movement code
        //level.x -= offset.x;
        //imgPlayer.x -= offset.x;
        //level.y -= offset.y;
        //imgPlayer.y -= offset.y;
    //}

    /*----- Camera Code -----------
        var dx = c.width/2 - imgPlayer.x
        var dy = c.height/2 - imgPlayer.y
        
        level.x += dx*.05; 
        imgPlayer.x += dx*.05; 
        level.y += dy*.15; 
        imgPlayer.y += dy*.15; 
    //----------------------------*/
    

    // ground.render();
    // platform.render();
    // wall.render();
    // imgPlayer.render();

gameLoop();
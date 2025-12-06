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
var jumpKeyDown = false;

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

var gravity = 0.32;
var maxFallSpeed = 7;
var moveSpeed = 1.6;

var player = {
    x: 60,
    y: 280,
    w: 32,
    h: 48,
    vx: 0,
    vy: 0,
    onGround: false,
    jumpStrength: -10
};

var cameraX = 0;
var cameraY = 0;
var levelWidth = 1600;

var platforms = [
    { x: 0, y: 400, w: 1600, h: 50 },
    { x: 150, y: 330, w: 120, h: 20 },
    { x: 400, y: 310, w: 140, h: 20 },
    { x: 700, y: 280, w: 120, h: 20 },
    { x: 1000, y: 320, w: 120, h: 20 },
    { x: 1350, y: 320, w: 40, h: 80 }
];

var hazards = [
    { x: 290, y: 380, w: 40, h: 20 },
    { x: 560, y: 380, w: 40, h: 20 }
];

var goal = {
    x: 1500,
    y: 340,
    w: 40,
    h: 60
};

var enemies = [
    {
        x: 1280,
        y: 368,
        w: 32,
        h: 32,
        vx: 0.7,
        patrolMinX: 1200,
        patrolMaxX: 1450,
        alive: true
    }
];

window.addEventListener("keydown", function(e) {
    keys[e.code] = true;
    if (e.code.includes("Arrow") || e.code === "Space") e.preventDefault();
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
    if (enemyLoseScreen) enemyLoseScreen.classList.remove("active");

    if (screen === "menu") menuScreen.classList.add("active");
    else if (screen === "win") winScreen.classList.add("active");
    else if (screen === "lose") loseScreen.classList.add("active");
    else if (screen === "enemylose" && enemyLoseScreen) enemyLoseScreen.classList.add("active");
}

function resetPlayer() {
    player.x = 60;
    player.y = 280;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    cameraX = 0;
    cameraY = 0;
}

function resetEnemies() {
    enemies[0].alive = true;
    enemies[0].x = 1280;
    enemies[0].y = 368;
    enemies[0].vx = 0.7;
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
    if (gameState !== "playing") return;

    var moveLeft = keys["ArrowLeft"] || keys["KeyA"];
    var moveRight = keys["ArrowRight"] || keys["KeyD"];

    if (moveLeft && !moveRight) player.vx = -moveSpeed;
    else if (moveRight && !moveLeft) player.vx = moveSpeed;
    else {
        player.vx *= 0.8;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    var jumpPressed = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];

    if (jumpPressed && !jumpKeyDown && player.onGround) {
        player.vy = player.jumpStrength;
        player.onGround = false;
    }

    jumpKeyDown = jumpPressed;

    player.vy += gravity;
    if (player.vy > maxFallSpeed) player.vy = maxFallSpeed;

    player.x += player.vx;

    var i;
    for (i = 0; i < platforms.length; i++) {
        var p = platforms[i];
        var isOneWayPlatform = (i > 0 && i < 5);

        if (isOneWayPlatform) continue;

        if (rectsIntersect(player, p)) {
            if (player.vx > 0) player.x = p.x - player.w;
            else if (player.vx < 0) player.x = p.x + p.w;
            player.vx = 0;
        }
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.w > levelWidth) player.x = levelWidth - player.w;

    var prevY = player.y;
    var prevBottom = prevY + player.h;

    player.y += player.vy;
    player.onGround = false;

    var currBottom = player.y + player.h;

    for (i = 0; i < platforms.length; i++) {
        var p2 = platforms[i];
        if (!rectsIntersect(player, p2)) continue;

        if (player.vy > 0) {
            if (prevBottom <= p2.y && currBottom >= p2.y) {
                player.y = p2.y - player.h;
                player.vy = 0;
                player.onGround = true;
            }
        } else if (player.vy < 0) {
        }
    }

    for (i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e.alive) continue;

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
            if (player.vy > 0 && playerBottom <= e.y + e.h * 0.5) {
                e.alive = false;
                player.vy = player.jumpStrength * 0.5;
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

    var centerX = player.x + player.w / 2;
    var desiredCameraX = centerX - canvas.width / 2;

    if (desiredCameraX < 0) desiredCameraX = 0;
    if (desiredCameraX > levelWidth - canvas.width) desiredCameraX = levelWidth - canvas.width;

    cameraX += (desiredCameraX - cameraX) * 0.1;
}

function drawBackground() {
    if (imgBackground.complete && imgBackground.naturalWidth > 0)
        ctx.drawImage(imgBackground, 0, 0, canvas.width, canvas.height);
    else {
        ctx.fillStyle = "#4c90ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawPlatforms() {
    var i;
    for (i = 0; i < platforms.length; i++) {
        if (i === 0) continue;

        var p = platforms[i];
        var sx = p.x - cameraX;
        var sy = p.y - cameraY;

        if (i === 5) {
            ctx.fillStyle = "#777777";
            ctx.fillRect(sx, sy, p.w, p.h);
        } else {
            if (imgPlatform.complete && imgPlatform.naturalWidth > 0)
                ctx.drawImage(imgPlatform, sx, sy, p.w, p.h);
            else {
                ctx.fillStyle = "#4b3621";
                ctx.fillRect(sx, sy, p.w, p.h);
            }
        }
    }
}

function drawHazards() {
    var i;
    for (i = 0; i < hazards.length; i++) {
        var h = hazards[i];
        var sx = h.x - cameraX;
        var sy = h.y - cameraY;
        if (imgHazard.complete && imgHazard.naturalWidth > 0)
            ctx.drawImage(imgHazard, sx, sy, h.w, h.h);
        else {
            ctx.fillStyle = "#ff3333";
            ctx.fillRect(sx, sy, h.w, h.h);
        }
    }
}

function drawGoal() {
    var sx = goal.x - cameraX;
    var sy = goal.y - cameraY;
    if (imgGoal.complete && imgGoal.naturalWidth > 0)
        ctx.drawImage(imgGoal, sx, sy, goal.w, goal.h);
    else {
        ctx.fillStyle = "#00cc66";
        ctx.fillRect(sx, sy, goal.w, goal.h);
    }
}

function drawEnemies() {
    var i;
    for (i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e.alive) continue;
        var sx = e.x - cameraX;
        var sy = e.y - cameraY;
        if (imgEnemy.complete && imgEnemy.naturalWidth > 0)
            ctx.drawImage(imgEnemy, sx, sy, e.w, e.h);
        else {
            ctx.fillStyle = "#cc9900";
            ctx.fillRect(sx, sy, e.w, e.h);
        }
    }
}

function drawPlayer() {
    var sx = player.x - cameraX;
    var sy = player.y - cameraY;
    if (imgPlayer.complete && imgPlayer.naturalWidth > 0)
        ctx.drawImage(imgPlayer, sx, sy, player.w, player.h);
    else {
        ctx.fillStyle = "#9933ff";
        ctx.fillRect(sx, sy, player.w, player.h);
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

startButton.addEventListener("click", function () {
    startGame();
});

var j;
for (j = 0; j < restartButtons.length; j++) {
    restartButtons[j].addEventListener("click", function () {
        restartGame();
    });
}

gameLoop();

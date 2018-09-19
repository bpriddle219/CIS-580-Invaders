//classes
class Bullet {
  constructor(x, y, r, dir) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.dir = dir;
  }

  update(deltaTime) {
    if (this.dir == 0) {
      this.y -= .5 * deltaTime;
    }
    else {
      this.y += .4 * deltaTime;
    }
  }

  render(context) {
    context.beginPath();
    context.fillStyle = 'orange';
    context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    context.fill();
    context.strokeStyle = 'red';
    context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    context.stroke();
    context.closePath();
  }
}

class Player {
  constructor(x, y, lives, bullets) {
    this.x = x;
    this.y = y;
    this.lives = lives;
    this.bullets = bullets;
  }

  update(deltaTime) {
    for (var i = 0; i < this.bullets.length; i++) {
      this.bullets[i].update(deltaTime);
      if (this.bullets[i].y < 0 - this.bullets[i].r) {
        this.bullets.splice(i, 1);
      }
    }

    if (currentInput.space && !pastInput.space) {
      var bullet = new Bullet(this.x + 20, this.y-9 , 5, 0);
      this.bullets.push(bullet);
    }
    if (currentInput.left) {
      this.x -= 0.3 * deltaTime;
    }
    if (currentInput.right) {
      this.x += 0.3 * deltaTime;
    }
  }

  render(context) {
    context.beginPath();
    // context.fillStyle = '#000000';
    // context.fillRect(this.x, this.y, 40, 40);
    context.drawImage(playerImage, this.x, this.y);
    context.closePath();
    if (this.x < 0) this.x = 0;
    if (this.x > WIDTH - 40) this.x = WIDTH - 40;
    this.bullets.forEach(function(bullet) {
      bullet.render(context);
    });
  }
}

class Enemy {
  constructor(x, y, row, index) {
    this.x = x;
    this.y = y;
    this.row = row
    this.index = index;
  }

  update(deltaTime) {
    if (enemyMoveCount > 500) {
      if (this.row % 2 == 0) {
        this.x += 32;
        if (this.x > WIDTH - 32 - 10) {
          this.x = WIDTH - 32 - 10;
          this.y += 40;
          this.row++;
        }
      }
      else {
        this.x -= 32;
        if (this.x < 0) {
          this.x = 0 + 10;
          this.y += 40;
          this.row++;
        }
      }
    }
    var rand = Math.floor(Math.random() * 1500);
    if (rand == 0) {
      var bul = new Bullet(this.x + 16, this.y + 17, 5, 1);
      enemyBullets.push(bul);
    }
  }

  render(context) {
    context.beginPath();
    // context.fillStyle = 'blue';
    // context.fillRect(this.x, this.y, 32, 32);
    if (this.index == 1) {
      context.drawImage(alien1, this.x, this.y);
    }
    else if (this.index == 2) {
      context.drawImage(alien2, this.x, this.y);
    }
    else if (this.index == 3) {
      context.drawImage(alien3, this.x, this.y);
    }
    context.closePath();
  }
}

//game constants
const WIDTH = 500;
const HEIGHT = 600;
const START_LOCATION_X = 225;
const START_LOCATION_Y = 520;
const NUM_LIVES = 5;
const ROWS_OF_ENEMIES = 6;

//initialize screen and screen context screen context
var screen = document.createElement('canvas');
var screenCtx = screen.getContext('2d');
screen.width = WIDTH;
screen.height = HEIGHT;
document.body.appendChild(screen);

//initialize back buffer
var backBuffer = document.createElement('canvas');
var backBufferCtx = backBuffer.getContext('2d');
backBuffer.width = WIDTH;
backBuffer.height = HEIGHT;

//game variables
var b = []; //player bullet array
var p = null; //player variable
var enemies = [];
var enemyBullets = [];

var score = 0;
var numEnemies = 0;
var enemyMoveCount = 0; //timer for when the enemies move
var start = null;
var lose = 0; //has the game been lost

//all the images for various things
//also all created by me, so there's no copyright issues here
var background = new Image();
background.src = "space-background.png";
var playerImage = new Image();
playerImage.src = "player-spaceship.png";
var alien1 = new Image();
alien1.src = "alien-1.png";
var alien2 = new Image();
alien2.src = "alien-2.png";
var alien3 = new Image();
alien3.src = "alien-3.png";

//player input variables
var currentInput = {
  space: false,
  left: false,
  right: false,
}
var lastInput = {
  space: false,
  left: false,
  right: false,
}

/** @function handleKeyDown
  * Handles when keys are pressed
  * @param {KeyEvent} event the keydown event
  */
function handleKeyDown(event) {
  switch (event.key) {
    case ' ':
      currentInput.space = true;
      break;
    case 'ArrowLeft':
    case 'a':
      currentInput.left = true;
      break;
    case 'ArrowRight':
    case 'd':
      currentInput.right = true;
      break;
  }
}
window.addEventListener('keydown', handleKeyDown);

/** @function handleKeyUp
  * Handles when keys are released
  * @param {KeyEvent} event the keyup event
  */
function handleKeyUp(event) {
  switch (event.key) {
    case ' ':
      currentInput.space = false;
      break;
    case 'ArrowLeft':
    case 'a':
      currentInput.left = false;
      break;
    case 'ArrowRight':
    case 'd':
      currentInput.right = false;
      break;
  }
}
window.addEventListener('keyup', handleKeyUp);

/** @function copyInput
  * Transfers the current input into the last input
  */
function copyInput() {
  pastInput = JSON.parse(JSON.stringify(currentInput));
}

/** @function checkCollisions
  * Checks for collisions between enemies and player bullets
  * and between enemy bullets and the player
  */
function checkCollisions() {
  p.bullets.forEach(function(bullet, index) {
    enemies.forEach(function (enemy, ind) {
      //so Math.clamp wasn't defined so I had to improvise
      // var rx = Math.clamp(bullet.x, enemy.x, enemy.x + 16);
      var rx = Math.min(Math.max(bullet.x, enemy.x), enemy.x + 32);
      // var ry = Math.clamp(bullet.y, enemy.y, enemy.y + 16);
      var ry = Math.min(Math.max(bullet.y, enemy.y), enemy.y + 32);
      var distSquared = Math.pow(rx - bullet.x, 2) + Math.pow(ry - bullet.y, 2);
      // if ((bullet.x - bullet.r > enemy.x - 16 && bullet.x + bullet.r < enemy.x + 16) &&
      //       (bullet.y - bullet.r < enemy.y + 16)) {
      if (distSquared < Math.pow(bullet.r, 2)) {
        p.bullets.splice(index, 1);
        enemies.splice(ind, 1);
        score += 5;
        numEnemies--;
      }
    })
  });
  enemyBullets.forEach(function(b, index) {
    var rx = Math.min(Math.max(b.x, p.x), p.x + 40);
    var ry = Math.min(Math.max(b.y, p.y), p.y + 40);
    var distSquared = Math.pow(rx - b.x, 2) + Math.pow(ry - b.y, 2);
    // if ((b.x - b.r > p.x - 20 && b.x + b.r < p.x + 20) &&
    //       (b.y + b.r > p.y - 20)) {
    if (distSquared < Math.pow(b.r, 2)) {
      enemyBullets.splice(index, 1);
      p.lives--;
    }
  });
}

/** @function checkForLose
  * Checks to see if there is a situation that would result
  * in the loss of the game for the player
  * @param {Object} enemy the current enemy to check the location of
  */
function checkForLose(enemy) {
  if (enemy.y > 530) {
    lose = 1;
  }
  if (p.lives <= 0) {
    lose = 1;
  }
}

/** @function update
  * Handles updating the game logic and state
  * @param {double} deltaTime time between frames
  */
function update(deltaTime) {
  checkCollisions();
  p.update(deltaTime);
  enemyMoveCount += deltaTime;
  var lastEnemy = null;
  enemies.forEach(function(enemy) {
    enemy.update(deltaTime);
    checkForLose(enemy);
    lastEnemy = enemy;
  });
  //check if the last enemy is out of the way so more can be spawned
  if (lastEnemy.y > 45 || (lastEnemy.y > 0 && lastEnemy.x < 70)) {
    if (numEnemies < 23) {
      createEnemies(-32, 1);
    }
  }
  if (enemyMoveCount > 500) {
    enemyMoveCount = 0;
  }
  enemyBullets.forEach(function(bullet, index) {
    bullet.update(deltaTime);
    if (bullet.y > HEIGHT + bullet.r) enemyBullets.splice(index, 1);
  });
}

/** @function render
  * Handles drawing the canvas and everything on it
  * @param {CanvasContext} ctx the cntext to be rendered with
  */
function render(ctx) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.drawImage(background, 0, 0);
  p.render(ctx);
  enemies.forEach(function(enemy) {
    enemy.render(ctx);
  });
  enemyBullets.forEach(function(bullet) {
    bullet.render(ctx);
  });
  display(ctx);
}

/** @function loop
  * the main game loop
  * @param {DomHighResTimestamp} timestamp the current game time in millisecs
  */
function loop(timestamp) {
  if (!start) start = timestamp;
  var deltaTime = timestamp - start;
  start = timestamp;
  update(deltaTime);
  screenCtx.clearRect(0, 0, WIDTH, HEIGHT);
  render(backBufferCtx);
  screenCtx.drawImage(backBuffer,0,0);
  copyInput();
  if (!lose) {
    window.requestAnimationFrame(loop);
  }
}

/** @function display
  * Displays the winning or losing message as well as the
  * player's score and number of Lives
  * @param {CanvasContext} ctx the context to be rendered with
  */
function display(ctx) {
  if (lose) {
    ctx.font = "72px Arial";
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'white'
    ctx.fillStyle = 'hotpink';
    ctx.fillText('You lose!', 100, 200);
    ctx.strokeText('You lose!', 100, 200);
    ctx.font = '36px Arial';
    ctx.fillText('Click Start to play again!', 60, 250);
    ctx.strokeText('Click Start to play again!', 60, 250);
  }
  ctx.font = "24px Arial";
  ctx.fillStyle = 'pink';
  ctx.fillText('Score: ' + score, 10, 590);
  ctx.fillText('Lives: ' + p.lives, 410, 590);
}

/** @function createEnemies
  * Creates the rows of offset enemies at the top of the screen
  * @param {int} baseY the y value to start the row at
  * @param {int} numRows the number of rows of enemies to create
  */
function createEnemies(baseY, numRows) {
  for (var rows = 0; rows < numRows; rows++) {
    for (var i = 0; i < 8 - rows; i++) {
      var rand = Math.floor(Math.random() * 3) + 1;
      var enemy = new Enemy(10 + 32*(i + rows) + 32*i, baseY + 40*rows, rows, rand);
      enemies.push(enemy);
      numEnemies++;
    }
  }
}

/** @function startGame
  * Starts/resets the game
  */
function startGame() {
  lose = 0;
  enemies.length = 0;
  enemyBullets.length = 0;
  createEnemies(10, ROWS_OF_ENEMIES);
  score = 0;
  b.length = 0;
  p = new Player(START_LOCATION_X, START_LOCATION_Y, NUM_LIVES, b);
  //start the game loop
  window.requestAnimationFrame(loop);
}

//waits for a click on the appropriate button from the user
document.getElementById('start')
  .addEventListener('click', function(event) {
    event.preventDefault();
    startGame();
});

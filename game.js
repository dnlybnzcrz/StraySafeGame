const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player;
let foods;
let traps;
let cursors;
let score = 0;
let scoreText;
let lives = 3;
let livesText;
let gameOver = false;

function preload() {
  this.load.image('background', 'assets/park.jpg'); // City park bg
  this.load.image('dog', 'assets/cat.png'); // Dog sprite
  this.load.image('food', 'assets/food.png'); // Food (fish)
  this.load.image('trap', 'assets/flask.png'); // Trap (net)
}

function create() {
  this.add.image(400, 300, 'background').setScale(2);

  player = this.physics.add.sprite(400, 550, 'dog').setScale(0.5);
  player.setCollideWorldBounds(true);

  foods = this.physics.add.group();
  traps = this.physics.add.group();

  cursors = this.input.keyboard.createCursorKeys();

  scoreText = this.add.text(16, 16, 'Score: 0', { fontFamily: 'Arial', fontSize: '28px', fill: '#fff' });
  livesText = this.add.text(16, 50, 'Lives: 3', { fontFamily: 'Arial', fontSize: '28px', fill: '#fff' });

  this.time.addEvent({ delay: 800, callback: spawnItems, callbackScope: this, loop: true });

  this.physics.add.overlap(player, foods, catchFood, null, this);
  this.physics.add.overlap(player, traps, hitTrap, null, this);
}

function update() {
  if (gameOver) return;

  if (cursors.left.isDown) {
    player.setVelocityX(-300);
  } else if (cursors.right.isDown) {
    player.setVelocityX(300);
  } else {
    player.setVelocityX(0);
  }
}

function spawnItems() {
  if (gameOver) return;

  if (Math.random() < 0.7) {
    let food = foods.create(Phaser.Math.Between(50, 750), 0, 'food').setScale(0.5);
    food.setVelocityY(200 + score / 2); // Speed up as score increases
    // Reduce hitbox size for food based on scaled size
    const scale = 0.5;
    const hitboxFactor = 0.4;
    food.body.setSize(food.width * scale * hitboxFactor, food.height * scale * hitboxFactor);
    food.body.setOffset(food.width * scale * (1 - hitboxFactor) / 2, food.height * scale * (1 - hitboxFactor) / 2);
  } else {
    let trap = traps.create(Phaser.Math.Between(50, 750), 0, 'trap').setScale(0.5);
    trap.setVelocityY(250 + score / 2);
    // Reduce hitbox size for trap based on scaled size
    const scale = 0.5;
    const hitboxFactor = 0.4;
    trap.body.setSize(trap.width * scale * hitboxFactor, trap.height * scale * hitboxFactor);
    trap.body.setOffset(trap.width * scale * (1 - hitboxFactor) / 2, trap.height * scale * (1 - hitboxFactor) / 2);
  }
}

function catchFood(player, food) {
  food.destroy();
  score += 10;
  scoreText.setText('Score: ' + score);
}

function hitTrap(player, trap) {
  trap.destroy();
  lives -= 1;
  livesText.setText('Lives: ' + lives);

  if (lives <= 0) {
    this.physics.pause();
    player.setTint(0xff0000);
    gameOver = true;

    const gameOverText = this.add.text(400, 300, 'GAME OVER', { fontFamily: 'Arial', fontSize: '64px', fill: '#ff0000' });
    gameOverText.setOrigin(0.5);

    const restartText = this.add.text(400, 400, 'Press SPACE to Restart', { fontFamily: 'Arial', fontSize: '28px', fill: '#ffffff' });
    restartText.setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      lives = 3;
      score = 0;
      gameOver = false;
      this.scene.restart();
    });
  }
}

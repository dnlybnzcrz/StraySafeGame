const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 800,
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
let lives = 2;
let livesText;
let gameOver = false;
let gameStarted = false;
let startText;
let highScore = 0;
let highScoreText;

function preload() {
  this.load.image('background', 'assets/park.jpg'); // City park bg
  this.load.image('dog', 'assets/cat.png'); // Dog sprite
  this.load.image('food', 'assets/food.png'); // Food (fish)
  this.load.image('trap', 'assets/fish-bones.png'); // Trap (net)
}

function create() {
  // Adjust background to fill the entire game area with correct aspect ratio
  const bg = this.add.image(400, 350, 'background');
  bg.setDisplaySize(780, 1050);

  // Lower the player sprite closer to the bottom
  player = this.physics.add.sprite(400, 750, 'dog').setScale(0.5);
  player.setCollideWorldBounds(true);

  // Adjust player body size to allow better reach to sides
  player.body.setSize(player.width * 0.5, player.height * 0.8);
  player.body.setOffset(player.width * 0.25, player.height * 0.2);

  foods = this.physics.add.group();
  traps = this.physics.add.group();

  cursors = this.input.keyboard.createCursorKeys();

  scoreText = this.add.text(16, 16, 'Score: 0', { fontFamily: 'Arial', fontSize: '28px', fill: 'black' });
  livesText = this.add.text(16, 50, 'Lives: 2', { fontFamily: 'Arial', fontSize: '28px', fill: 'black' });
  highScoreText = this.add.text(600, 16, 'High Score: 0', { fontFamily: 'Arial', fontSize: '28px', fill: 'black' });

  // Create a modal background for the start menu
  const modalBg = this.add.rectangle(400, 400, 800, 800, 0x000000, 0.7);
  modalBg.setDepth(10);

  startText = this.add.text(400, 400, 'Press SPACE to Start\nUse arrow keys to move', { fontFamily: 'Arial', fontSize: '32px', fill: '#fff', align: 'center' });
  startText.setOrigin(0.5);
  startText.setDepth(11);

  this.input.keyboard.once('keydown-SPACE', () => {
    modalBg.destroy();
    startText.setVisible(false);
    gameStarted = true;
  });

  this.time.addEvent({ delay: 800, callback: spawnItems, callbackScope: this, loop: true });

  this.physics.add.overlap(player, foods, catchFood, null, this);
  this.physics.add.overlap(player, traps, hitTrap, null, this);
}

function update() {
  if (!gameStarted || gameOver) {
    player.setVelocityX(0);
    return;
  }

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

  // Increase difficulty by increasing falling speed and spawn rate as score increases
  const baseFoodSpeed = 200;
  const baseTrapSpeed = 250;
  const speedIncrease = Math.min(score / 2, 300); // Cap speed increase to avoid excessive speed
  const baseDelay = 800;
  const minDelay = 300;
  const delayDecrease = Math.min(score * 5, baseDelay - minDelay);

  if (Math.random() < 0.7) {
    let food = foods.create(Phaser.Math.Between(50, 750), 0, 'food').setScale(0.5);
    food.setVelocityY(baseFoodSpeed + speedIncrease);
    // Reduce hitbox size for food based on scaled size - make hitbox even smaller to reduce thickness
    const scale = 0.5;
    const hitboxFactor = 0.15;
    food.body.setSize(food.width * scale * hitboxFactor, food.height * scale * hitboxFactor);
    food.body.setOffset(food.width * scale * (1 - hitboxFactor) / 2, food.height * scale * (1 - hitboxFactor) / 2);
  } else {
    let trap = traps.create(Phaser.Math.Between(50, 750), 0, 'trap').setScale(0.5);
    trap.setVelocityY(baseTrapSpeed + speedIncrease);
    // Reduce hitbox size for trap based on scaled size - make hitbox even smaller to reduce thickness
    const scale = 0.5;
    const hitboxFactor = 0.15;
    trap.body.setSize(trap.width * scale * hitboxFactor, trap.height * scale * hitboxFactor);
    trap.body.setOffset(trap.width * scale * (1 - hitboxFactor) / 2, trap.height * scale * (1 - hitboxFactor) / 2);
  }

  // Adjust spawn rate dynamically
  this.time.removeAllEvents();
  this.time.addEvent({ delay: baseDelay - delayDecrease, callback: spawnItems, callbackScope: this, loop: true });
}

let lastSpinScore = 0;

function catchFood(player, food) {
  food.destroy();
  score += 10;
  scoreText.setText('Score: ' + score);
  if (score > highScore) {
    highScore = score;
    highScoreText.setText('High Score: ' + highScore);
  }

  // Spin the cat every 50 points, prevent repeated spins at same score
  if (score % 50 === 0 && score !== lastSpinScore) {
    lastSpinScore = score;
    // Spin the player by rotating 360 degrees multiple times
    const spinDuration = 400; // total duration in ms
    const spinCount = 4; // number of full rotations

    let elapsed = 0;
    const spinEvent = player.scene.time.addEvent({
      delay: 16, // approx 60fps
      loop: true,
      callback: () => {
        elapsed += 16;
        player.rotation = (elapsed / spinDuration) * spinCount * 2 * Math.PI;
        if (elapsed >= spinDuration) {
          player.rotation = 0; // reset rotation
          spinEvent.remove();
        }
      }
    });
  }
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
      lives = 2;
      score = 0;
      gameOver = false;
      this.scene.restart();
    });
  }
}

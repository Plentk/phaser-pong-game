import { Scene } from 'phaser';

const WIDTH = 1024;
const HEIGHT = 768;
const MAX_SPEED = 20;
const ACCELERATION = 0.5;
const DECELERATION = 2;
const MARGIN = 30;

export class Game extends Scene {
    constructor() {
        super('Game');

        // Initialise necessary variables
        this.ball = null;
        this.leftPaddle = null;
        this.rightPaddle = null;

        this.wasd = null;
        this.cursors = null;

        this.ballInMotion = false;

        // Independent paddle speeds
        this.leftPaddleSpeed = 0;
        this.rightPaddleSpeed = 0;

        this.leftScore = 0;
        this.rightScore = 0;
        this.leftScoreText = null;
        this.rightScoreText = null;
        
        this.rightPaddleEnlarged = false;
        this.leftPaddleEnlarged = false;

        this.timer = 0;
        this.timerText = null;
        this.timerStarted = false; // Add this flag

        this.turboMode = false;
        this.turboButton = null;

        // Store base speeds for toggling
        this.baseMaxSpeed = MAX_SPEED;
        this.baseAcceleration = ACCELERATION;
        this.baseBallVelocity = 150;
    }

    preload() {
        // Load necessary assets from the assets directory
        this.load.image('background', 'assets/background.png');
        this.load.image('ball', 'assets/ball.png');
        this.load.image('paddle', 'assets/paddle.png');
    }

    create() {
        // Add background, ball and paddles to scene
        this.add.image(WIDTH/2, HEIGHT/2, 'background').setScale(0.8, 0.8)

        this.ball = this.physics.add.image(WIDTH/2, HEIGHT/2, 'ball').setScale(0.05, 0.05).refreshBody();
        this.ball.setCollideWorldBounds(true);

        this.ball.setBounce(1, 1);
        
        this.leftPaddle = this.physics.add.image(50, 384, "paddle");
        this.leftPaddle.setImmovable(true);
        this.rightPaddle = this.physics.add.image(974, 384, "paddle");
        this.rightPaddle.setImmovable(true);

        this.physics.add.collider(this.ball, this.leftPaddle, this.hitPaddle, null, this);
        this.physics.add.collider(this.ball, this.rightPaddle, this.hitPaddle, null, this);

        this.leftScoreText = this.add.text(100, 50, '0', {fontSize: '50px'});
        this.rightScoreText = this.add.text(924, 50, '0', {fontSize: '50px'});

        // Add timer text at the top center
        this.timerText = this.add.text(WIDTH / 2, 20, '00:00', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Assigns U/D/L/R keys to the cursors variable
        this.cursors = this.input.keyboard.createCursorKeys();
        // Assigns W/S keys to the wasd variable
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S
        });
        
        // Add Turbo Mode button at the bottom center
        this.turboButton = this.add.text(WIDTH / 2, HEIGHT - 40, 'Turbo Mode', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive();

        this.turboButton.on('pointerdown', () => {
            this.toggleTurboMode();
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.startBall();
            this.timerStarted = true; // Start timer when space is pressed
        }, this);

        
    }

    update(time, delta) {
        // Game over condition
        if (
            (this.leftScore >= 20 && this.leftScore >= this.rightScore + 3) ||
            (this.rightScore >= 20 && this.rightScore >= this.leftScore + 3)
        ) {
            let winner = this.leftScore > this.rightScore ? 'Player 1' : 'Player 2';
            this.showGameOver(winner);
            return;
        }

        // Update timer only if started
        if (this.timerStarted) {
            this.timer += delta / 1000;
            const minutes = Math.floor(this.timer / 60);
            const seconds = Math.floor(this.timer % 60);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            this.timerText.setText(timeString); // Removed 'Time: '
        }

        // Left paddle movement (W/S)
        if (this.wasd.up.isDown && (this.leftPaddle.y - 60) > 0 && (this.leftPaddle.y + 60) < HEIGHT) {
            if (this.leftPaddleSpeed < window.MAX_SPEED) {
                this.leftPaddleSpeed = -window.MAX_SPEED;
            } else {
                this.leftPaddleSpeed -= window.ACCELERATION;
            };
            this.leftPaddle.y += this.leftPaddleSpeed;
        } else if (this.wasd.down.isDown && (this.leftPaddle.y - 60) > 0 && (this.leftPaddle.y + 60) < HEIGHT) {
            if (this.leftPaddleSpeed > window.MAX_SPEED) {
                this.leftPaddleSpeed = window.MAX_SPEED;
            } else {
                this.leftPaddleSpeed += window.ACCELERATION;
            };
            this.leftPaddle.y += this.leftPaddleSpeed;
        } else if (this.wasd.up.isDown && (this.leftPaddle.y - 60) > 0) {
            if (this.leftPaddleSpeed > 0) {
                this.leftPaddleSpeed = -(this.leftPaddleSpeed);
            };
            this.leftPaddle.y = HEIGHT - 60 + this.leftPaddleSpeed;
        } else if (this.wasd.down.isDown && (this.leftPaddle.y + 60) < HEIGHT) {
            if (this.leftPaddleSpeed < 0) {
                this.leftPaddleSpeed = -(this.leftPaddleSpeed);
            };
            this.leftPaddle.y = 60 + this.leftPaddleSpeed;
        } else {
            if (this.leftPaddleSpeed > DECELERATION) {
                this.leftPaddleSpeed -= DECELERATION;
                if (this.leftPaddle.y + this.leftPaddleSpeed < HEIGHT - 60) {
                    this.leftPaddle.y += this.leftPaddleSpeed;
                } else {
                    this.leftPaddle.y = HEIGHT - 60;
                }
            } else if (this.leftPaddleSpeed < -DECELERATION) {
                this.leftPaddleSpeed += DECELERATION;
                if (this.leftPaddle.y + this.leftPaddleSpeed > 60) {
                    this.leftPaddle.y += this.leftPaddleSpeed;
                } else {
                    this.leftPaddle.y = 60;
                }
            }
        }

        // Right paddle movement (Up/Down arrows)
        if (this.cursors.up.isDown && (this.rightPaddle.y - 60) > 0 && (this.rightPaddle.y + 60) < HEIGHT) {
            if (this.rightPaddleSpeed < window.MAX_SPEED) {
                this.rightPaddleSpeed = -window.MAX_SPEED;
            } else {
                this.rightPaddleSpeed -= window.ACCELERATION;
            };
            this.rightPaddle.y += this.rightPaddleSpeed;
        } else if (this.cursors.down.isDown && (this.rightPaddle.y - 60) > 0 && (this.rightPaddle.y + 60) < HEIGHT) {
            if (this.rightPaddleSpeed > window.MAX_SPEED) {
                this.rightPaddleSpeed = window.MAX_SPEED;
            } else {
                this.rightPaddleSpeed += window.ACCELERATION;
            };
            this.rightPaddle.y += this.rightPaddleSpeed;
        } else if (this.cursors.up.isDown && (this.rightPaddle.y - 60) > 0) {
            if (this.rightPaddleSpeed > 0) {
                this.rightPaddleSpeed = -(this.rightPaddleSpeed);
            };
            this.rightPaddle.y = HEIGHT - 60 + this.rightPaddleSpeed;
        } else if (this.cursors.down.isDown && (this.rightPaddle.y + 60) < HEIGHT) {
            if (this.rightPaddleSpeed < 0) {
                this.rightPaddleSpeed = -(this.rightPaddleSpeed);
            };
            this.rightPaddle.y = 60 + this.rightPaddleSpeed;
        } else {
            if (this.rightPaddleSpeed > DECELERATION) {
                this.rightPaddleSpeed -= DECELERATION;
                if (this.rightPaddle.y + this.rightPaddleSpeed < HEIGHT - 60) {
                    this.rightPaddle.y += this.rightPaddleSpeed;
                } else {
                    this.rightPaddle.y = HEIGHT - 60;
                }
            } else if (this.rightPaddleSpeed < -DECELERATION) {
                this.rightPaddleSpeed += DECELERATION;
                if (this.rightPaddle.y + this.rightPaddleSpeed > 60) {
                    this.rightPaddle.y += this.rightPaddleSpeed;
                } else {
                    this.rightPaddle.y = 60;
                }
            }
        }

        // Enlarge losing paddle permanently when score difference reaches 10
        if (!this.rightPaddleEnlarged && this.leftScore >= this.rightScore + 10) {
            this.rightPaddle.setScale(1, 2);
            this.rightPaddle.body.setSize(this.rightPaddle.width, this.rightPaddle.height * 2, true);
            this.rightPaddleEnlarged = true;
        }
        if (!this.leftPaddleEnlarged && this.rightScore >= this.leftScore + 10) {
            this.leftPaddle.setScale(1, 2);
            this.leftPaddle.body.setSize(this.leftPaddle.width, this.leftPaddle.height * 2, true);
            this.leftPaddleEnlarged = true;
        }

        // Check score difference and enlarge losing paddle if needed
        if (this.leftScore >= this.rightScore + 10) {
            // Left is winning, enlarge right paddle
            this.rightPaddle.setScale(1, 2);
            this.rightPaddle.body.setSize(this.rightPaddle.width, this.rightPaddle.height * 2, true);
        } else if (this.rightScore >= this.leftScore + 10) {
            // Right is winning, enlarge left paddle
            this.leftPaddle.setScale(1, 2);
            this.leftPaddle.body.setSize(this.leftPaddle.width, this.leftPaddle.height * 2, true);
        } else {
            // Reset paddles to normal size if difference is less than 10
            this.leftPaddle.setScale(1, 1);
            this.leftPaddle.body.setSize(this.leftPaddle.width, this.leftPaddle.height, true);
            this.rightPaddle.setScale(1, 1);
            this.rightPaddle.body.setSize(this.rightPaddle.width, this.rightPaddle.height, true);
        }

        if (this.ball.x < MARGIN) {
            this.rightScore += 1;
            this.rightScoreText.setText(this.rightScore);
            this.resetBall();
        } else if (this.ball.x > WIDTH - MARGIN) {
            this.leftScore += 1;
            this.leftScoreText.setText(this.leftScore);
            this.resetBall();
        }
        console.log(this.leftPaddle.y, this.rightPaddle.y, this.leftPaddleSpeed, this.rightPaddleSpeed);
    }

    toggleTurboMode() {
        this.turboMode = !this.turboMode;
        if (this.turboMode) {
            // Double speeds
            window.MAX_SPEED = this.baseMaxSpeed * 2;
            window.ACCELERATION = this.baseAcceleration * 2;
            this.ball.setVelocity(this.ball.body.velocity.x * 2, this.ball.body.velocity.y * 2);
            this.turboButton.setText('Turbo Mode: ON');
            this.turboButton.setBackgroundColor('#00ff00');
        } else {
            // Halve speeds (back to normal)
            window.MAX_SPEED = this.baseMaxSpeed;
            window.ACCELERATION = this.baseAcceleration;
            this.ball.setVelocity(this.ball.body.velocity.x / 2, this.ball.body.velocity.y / 2);
            this.turboButton.setText('Turbo Mode: OFF');
            this.turboButton.setBackgroundColor('#ff0000');
        }
    }

    startBall() {
        if (!this.ballInMotion) {
            let velocity = this.turboMode ? this.baseBallVelocity * 2 : this.baseBallVelocity;
            let initialVelocityX = (Phaser.Math.Between(0, 1) ? velocity + (Phaser.Math.Between(0, 100)) : -velocity - (Phaser.Math.Between(0, 100)) );
            let initialVelocityY = (Phaser.Math.Between(0, 1) ? velocity + (Phaser.Math.Between(0, 100)) : -velocity - (Phaser.Math.Between(0, 100)) );
            this.ball.setVelocity(initialVelocityX, initialVelocityY);
            this.ballInMotion = true;
        }
    }
    
    hitPaddle(ball, paddle) {
        // Calculate difference between ball and paddle center
        let diff = ball.y - paddle.y;

        // If ball hits top of paddle
        if (diff < 0) {
            ball.setVelocityY(ball.body.velocity.y - Math.abs(diff * 5));
        }
        // If ball hits bottom of paddle
        else if (diff > 0) {
            ball.setVelocityY(ball.body.velocity.y + Math.abs(diff * 5));
        }

        // Add some randomness to X velocity for challenge
        let velocityFactorX = 1.1 + (Phaser.Math.Between(-2, 2) / 10);
        ball.setVelocityX(ball.body.velocity.x * velocityFactorX);
    }

    resetBall() {
        this.ball.setPosition(WIDTH / 2, HEIGHT / 2);
        this.ball.setVelocity(0, 0);
        this.ballInMotion = false;
        this.startBall();
    }

    showGameOver(winner) {
        // Remove ball and paddles
        this.ball.setVisible(false);
        this.leftPaddle.setVisible(false);
        this.rightPaddle.setVisible(false);

        // Draw white rectangle background
        const boxWidth = 500;
        const boxHeight = 250;
        const boxX = WIDTH / 2 - boxWidth / 2;
        const boxY = HEIGHT / 2 - boxHeight / 2;
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Show game over text in red
        this.add.text(WIDTH / 2, HEIGHT / 2 - 70, 'Game Over', {
            fontSize: '64px',
            color: '#ff0000'
        }).setOrigin(0.5);

        // Show winner in red
        this.add.text(WIDTH / 2, HEIGHT / 2 - 10, `${winner} Wins!`, {
            fontSize: '48px',
            color: '#ff0000'
        }).setOrigin(0.5);

        // Show scores below winner
        this.add.text(WIDTH / 2, HEIGHT / 2 + 50, `Player 1: ${this.leftScore}\nPlayer 2: ${this.rightScore}`, {
            fontSize: '36px',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);

        this.scene.pause();
    }
}

const FPS = 60;
const SHIP_SIZE = 30;
const TURN_SPEED = 270;
const SHIP_THRUST = 5;
const FRICTION = 0.3;
const ASTEROID_NUM = 3;
const ASTEROID_SIZE = 100;
const ASTEROID_SPEED = 50;
const ASTEROID_VERTICES = 10;
let adjustedScore = 0;

const RESPAWN_EFFECT_DURATION = 60; 
const RESPAWN_RING_MAX_SIZE = 800; 

const BITCOIN_TOKEN_SIZE = 12;
const BITCOIN_TOKEN_ROTATION_SPEED = 0.02;
const BITCOIN_SPEED = ASTEROID_SPEED * 2;
const BITCOIN_MESSAGE_DURATION = 240; 
const BITCOIN_COLLECT_RADIUS = 30;
const MIN_BITCOIN_REWARD = 50000; 
const MAX_BITCOIN_REWARD = 250000; 

const BITCOIN_COLLECT_MESSAGE_DURATION = 240; 
const BITCOIN_MESSAGE_SCALE_START = 0.4;
const BITCOIN_MESSAGE_SCALE_END = 1.5;
const BITCOIN_MESSAGE_SCALE_SPEED = 0.6; 

const BITCOIN_SYMBOL_SEGMENTS = [
    [[0,0], [0,3]],
    [[0,0], [0.7,0], [1.2,0.3], [1.2,1.2], [0.7,1.5], [0,1.5]],
    [[0,1.5], [0.7,1.5], [1.2,1.8], [1.2,2.7], [0.7,3], [0,3]],
    [[0.3,0], [0.3,-0.2]],
    [[0.7,0], [0.7,-0.2]],
    [[0.3,3], [0.3,3.2]], 
    [[0.7,3], [0.7,3.2]] 
];

const MALFUNCTION_TYPES = {
    THRUST: { id: 'thrust', name: 'THRUST FUEL INJECTORS' },
    ROTATION: { id: 'rotation', name: 'DIRECTIONAL ROTATION CONTROLS' },
    FIRE: { id: 'fire', name: 'LASER COOLING SYSTEM' }
};

const SHIP_EXPLODE_DUR = 3.0;
const LASER_MAX = 10;
const LASER_SPEED = 500;
const LASER_DIST = 0.5;
const GAME_LIVES = 3;
const EXPLOSION_PARTICLES = 20;
const EXPLOSION_PIXELS = 120;
const STARS_NUM = 200; 
const STARS_SPEED_MULT = 0.3; 
const NEBULA_CLOUDS = 6; 
const NEBULA_SPEED_MULT = 0.1;
const TRAIL_MAX_POINTS = 600; 
const STARTING_ASTEROIDS = 3; 
const SCORE_LARGE_ASTEROID = 5000;
const SCORE_MEDIUM_ASTEROID = 10000; 
const SCORE_SMALL_ASTEROID = 15000;  
const DISTORTION_AMOUNT = 20; 
const PULSE_DURATION = 60; 
const PULSE_MAX_RADIUS = 300; 
const MALFUNCTION_BASE_CHANCE = 0.3;
const MALFUNCTION_MESSAGE_DURATION = 3; 
const REPAIR_TOKEN_SIZE = 20; 
const REPAIR_TOKEN_ROTATION_SPEED = 0.02; 
const REPAIR_TOKEN_SPEED = ASTEROID_SPEED * 2;
const REPAIR_MESSAGE_DURATION = 120; 
const REPAIR_COLLECT_RADIUS = 30; 
const SPECIAL_LEVEL_INTERVAL = 2; 
const SPECIAL_LEVEL_TYPES = ['MONSTER_ASTEROID', 'BLACK_HOLE', 'LASER_GRID'];
const MONSTER_ASTEROID_SIZE = ASTEROID_SIZE * 1.5;
const MONSTER_ASTEROID_HEALTH = 25;
const MONSTER_HEALTH_BAR_WIDTH = 100;
const MONSTER_HEALTH_BAR_HEIGHT = 10;
const SPECIAL_LEVEL_MESSAGE_DURATION = 180; 
const STAR_LAYERS = 3;
const STARS_PER_LAYER = 70;
const THRUSTER_FLICKER_SPEED = 0.3;
const ENEMY_SHIP_SIZE = 20; 
const ENEMY_SHIP_SPEED = 2;
const ENEMY_LASER_SPEED = 300;
const ENEMY_SHOOT_INTERVAL = 2; 
const ENEMY_POINTS = 20000; 
const ENEMY_ROTATION_SPEED = 0.02;
const MUTE_STORAGE_KEY = 'hashteroidsIsMuted';
const HIGH_SCORES_STORAGE_KEY = 'hashteroidsHighScores';

const THRUST_SOUND_FREQUENCY = 60;
const THRUST_SOUND_VARIATION = 10;

const STATS_STORAGE_KEY = 'hashteroidsStatsHidden';
const STATS_MARGIN = 10;
const STATS_LINE_HEIGHT = 22;
const SMALL_STATS_LINE_HEIGHT = 15;

let level = 1;
let score = 0;
let screenShake = 0;
let pulseEffects = [];
let distortionTime = 0;
let explosions = [];
let currentMalfunctions = new Set();
let malfunctionMessageTime = 0;
let lastShotTime = 0;
let repairToken = null;
let repairMessageTime = 0;
let repairedSystem = '';
let isSpecialLevel = false;
let specialLevelType = null;
let specialLevelMessageTime = 0;
let isTransitioningLevel = false;
let isWelcomeScreen = true;
let particles = [];
let welcomeAsteroids = [];
let enemyShip = null;
let extraLifeMessageTime = 0;
let bitcoinToken = null;
let bitcoinMessageTime = 0;
let bitcoinReward = 0;
let topScores = JSON.parse(localStorage.getItem(HIGH_SCORES_STORAGE_KEY)) || Array(10).fill(0);
let isMuted = localStorage.getItem(MUTE_STORAGE_KEY) === 'true';

const EXTRA_LIFE_MESSAGE_DURATION = 240; 

const ENEMY_SPAWN_MIN_DELAY = 2000; 
const ENEMY_SPAWN_MAX_DELAY = 20000;

const BLACK_HOLE_RADIUS = 20;
const BLACK_HOLE_FORCE = 0.15;
const BLACK_HOLE_PARTICLES = 50;
const BLACK_HOLE_PARTICLE_SPEED = 2;
const BLACK_HOLE_PULL_RADIUS = 500; 

const SPAWN_SAFE_DISTANCE = 300;
const SPAWN_PROTECTION_TIME = 2500;

const LASER_GRID_BEAMS = 4; 
const LASER_GRID_ROTATION_SPEED = 0.1; 
const LASER_GRID_DAMAGE = true; 
const LASER_BEAM_WIDTH = 2; 

let enemyShipSpawnTime = 0; 

let canv = document.getElementById("gameCanvas");
let ctx = canv.getContext("2d");
canv.width = 1500;
canv.height = 900;

let laserGrid = {
    angle: 0,
    beams: [],
    active: false
};

let starLayers = [];
for (let layer = 0; layer < STAR_LAYERS; layer++) {
    let stars = [];
    for (let i = 0; i < STARS_PER_LAYER; i++) {
        stars.push({
            x: Math.random() * canv.width,
            y: Math.random() * canv.height,
            size: Math.random() * (0.5 + layer * 0.5) + 0.5,
            twinkle: Math.random() * Math.PI,
            twinkleSpeed: 0.02 + Math.random() * 0.03
        });
    }
    starLayers.push(stars);
}

let nebulaClouds = [];
for (let i = 0; i < NEBULA_CLOUDS; i++) {
    nebulaClouds.push({
        x: Math.random() * canv.width,
        y: Math.random() * canv.height,
        radius: 300 + Math.random() * 400,
        hue: Math.random() * 360,
        alpha: 0.05 + Math.random() * 0.03,
        drift: Math.random() * Math.PI * 2
    });
}

const POWER_UP_TYPES = {
    REAR_LASER: { id: 'REAR_LASER', name: 'REAR LASER', duration: 15000 },
    SPREAD_SHOT: { id: 'SPREAD_SHOT', name: 'SPREAD SHOT', duration: 15000 },
    SHIELD: { id: 'SHIELD', name: 'SHIELD', duration: 12000 },
    LASER_BURST: { id: 'LASER_BURST', name: 'LASER BURST', duration: 12000 }
};
const POWER_UP_MESSAGE_DURATION = 180; 
const POWER_UP_SPAWN_CHANCE = 0.001; 
const POWER_UP_SIZE = 20;
const POWER_UP_SPEED = 50;
const POWER_UP_ROTATION_SPEED = 0.02;
const POWER_UP_COLLECT_RADIUS = 20;

let powerUpToken = null;

let ship = {
    x: canv.width / 2,
    y: canv.height / 2,
    radius: SHIP_SIZE / 2,
    angle: 90 / 180 * Math.PI,
    rotation: 0,
    thrusting: false,
    thrust: {
        x: 0,
        y: 0
    },
    explodeTime: 0,
    dead: false,
    lives: GAME_LIVES,
    particles: [],
    lasers: [],
    canShoot: true,
    trailPoints: [],
    distanceTravelled: 0,
    clockwiseRotations: 0,
    anticlockwiseRotations: 0,
    lastAngle: 90 / 180 * Math.PI,
    prevX: canv.width / 2,
    prevY: canv.height / 2,
    renderX: canv.width / 2,
    renderY: canv.height / 2,
    thrusterFlicker: 0,
    thrusterParticles: [],
    invincible: false,
    invincibleEndTime: 0,
    activePowerUps: new Map(), 
    powerUpMessageTime: 0,     
    lastPowerUp: null,     
    targetsHit: 0,
    bitcoinsCollected: 0,
    powerupsCollected: 0,
    faultsOccurred: 0,
    enemyShipsDestroyed: 0,    
    respawnEffect: 0,
    shotsFired: 0,
    repairsCollected: 0,
    highestVelocity: 0,
};

function createBitcoinToken() {
    bitcoinToken = {
        x: Math.random() * canv.width,
        y: Math.random() * canv.height,
        xv: Math.random() * BITCOIN_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * BITCOIN_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
        angle: 0,
        collected: false,
        spawnTime: Date.now(),
        duration: 20000 
    };
}

let asteroids = [];
createAsteroidBelt();

let lastTime = 0;
let accumulator = 0;
const timeStep = 1000 / FPS;

let isPaused = false;
let pauseOverlay = {
    alpha: 0,
    targetAlpha: 0.5
};

let levelMessageTime = 0;
const LEVEL_MESSAGE_DURATION = 360; 
let levelMessageScale = 1;
const LEVEL_MESSAGE_SEGMENTS = [
    // L
    [[0,0], [0,1], [0,2], [0,3], [1,3]],
    // E
    [[2,0], [2,3]], [[2,0], [3,0]], [[2,1.5], [3,1.5]], [[2,3], [3,3]],
    // V
    [[4,0], [4.5,1.5], [5,3], [5.5,1.5], [6,0]],
    // E
    [[7,0], [7,3]], [[7,0], [8,0]], [[7,1.5], [8,1.5]], [[7,3], [8,3]],
    // L
    [[9,0], [9,1], [9,2], [9,3], [10,3]]
];

const EXTRA_LIFE_SEGMENTS = [
    // E 
    [[0,0], [0,3]], [[0,0], [1,0]], [[0,1.5], [1,1.5]], [[0,3], [1,3]],
    // X
    [[2,0], [3,3]], [[3,0], [2,3]],
    // T
    [[4,0], [5,0]], [[4.5,0], [4.5,3]],
    // R 
    [[6,0], [6,3]], [[6,0], [7,0]], [[6,1.5], [7,1.5]], [[7,0], [7,1.5]], [[6,1.5], [7,3]],
    // A
    [[8,3], [8.5,0], [9,3]], [[8.3,2], [8.7,2]],
    
    // L
    [[11,0], [11,3], [12,3]],
    // I
    [[13,0], [13,3]],
    // F
    [[14,0], [14,3]], [[14,0], [15,0]], [[14,1.5], [15,1.5]],
    // E
    [[16,0], [16,3]], [[16,0], [17,0]], [[16,1.5], [17,1.5]], [[16,3], [17,3]]
];

let gameOverMessageTime = 0;
const GAME_OVER_MESSAGE_DURATION = 500; 

const GAME_OVER_SEGMENTS = [
    // G
    [[1,0], [0,0], [0,2.5], [1,2.5], [1,1.5], [0.5,1.5]],
    // A
    [[2,2.5], [2.5,0], [3,2.5]], [[2.3,1.5], [2.7,1.5]],
    // M
    [[4,2.5], [4,0], [4.5,1], [5,0], [5,2.5]],
    // E
    [[6,0], [6,2.5]], [[6,0], [7,0]], [[6,1.25], [7,1.25]], [[6,2.5], [7,2.5]],

    // O
    [[9,0], [10,0], [10,2.5], [9,2.5], [9,0]],
    // V
    [[11,0], [11.5,2.5], [12,0]],
    // E
    [[13,0], [13,2.5]], [[13,0], [14,0]], [[13,1.25], [14,1.25]], [[13,2.5], [14,2.5]],
    // R
    [[15,0], [15,2.5]], [[15,0], [16,0], [16,1.25], [15,1.25]], [[15,1.25], [16,2.5]]
];

let explosionPulses = [];
const MAX_PULSE_SIZE = Math.max(canv.width, canv.height); 

function gameLoop(currentTime) {
    if (isWelcomeScreen) {
        drawWelcomeScreen();
        drawMuteButton();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!isPaused) {
        if (lastTime === 0) lastTime = currentTime;
        let deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        if (deltaTime > 200) deltaTime = 200;
        accumulator += deltaTime;
        
        while (accumulator >= timeStep) {
            update();
            accumulator -= timeStep;
        }
    } else {
        drawPauseScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function newAsteroid(x, y, r) {
    let speedMultiplier = r === MONSTER_ASTEROID_SIZE ? 0.15 : 1;
    let vertexCount = r === MONSTER_ASTEROID_SIZE ? 
        ASTEROID_VERTICES * 2 : 
        Math.floor(Math.random() * (ASTEROID_VERTICES + 1) + ASTEROID_VERTICES / 2);
    
    let asteroid = {
        x: x,
        y: y,
        xv: Math.random() * ASTEROID_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1) * speedMultiplier,
        yv: Math.random() * ASTEROID_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1) * speedMultiplier,
        radius: r,
        angle: Math.random() * Math.PI * 2,
        vertices: vertexCount,
        offsets: [],
        rot: (Math.random() * 0.2 - 0.1) * Math.PI / FPS * (r === MONSTER_ASTEROID_SIZE ? 0.3 : 1), 
        health: r === MONSTER_ASTEROID_SIZE ? MONSTER_ASTEROID_HEALTH : undefined
    };

    for (let i = 0; i < asteroid.vertices; i++) {
        if (r === MONSTER_ASTEROID_SIZE) {
            asteroid.offsets.push(0.9 + Math.random() * 0.1); 
        } else {
            asteroid.offsets.push(Math.random() * 0.5 + 0.5);
        }
    }
    return asteroid;
}

function shootLaser() {
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
        createLaserSound();
        ship.shotsFired++;

        const now = Date.now();
        const hasRearLaser = ship.activePowerUps.get(POWER_UP_TYPES.REAR_LASER.id) > now;
        const hasSpreadShot = ship.activePowerUps.get(POWER_UP_TYPES.SPREAD_SHOT.id) > now;
        const hasLaserBurst = ship.activePowerUps.get(POWER_UP_TYPES.LASER_BURST.id) > now;

        const baseLaser = {
            x: ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
            y: ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle),
            xv: LASER_SPEED * Math.cos(ship.angle) / FPS,
            yv: -LASER_SPEED * Math.sin(ship.angle) / FPS,
            dist: 0,
            explodeTime: 0
        };

        ship.lasers.push({...baseLaser});

        if (hasRearLaser) {
            ship.lasers.push({
                x: ship.x - 4 / 3 * ship.radius * Math.cos(ship.angle),
                y: ship.y + 4 / 3 * ship.radius * Math.sin(ship.angle),
                xv: -LASER_SPEED * Math.cos(ship.angle) / FPS,
                yv: LASER_SPEED * Math.sin(ship.angle) / FPS,
                dist: 0,
                explodeTime: 0
            });
        }

        if (hasSpreadShot) {
            const spreadAngles = [-0.2, 0.2];
            spreadAngles.forEach(angleOffset => {
                ship.lasers.push({
                    ...baseLaser,
                    xv: LASER_SPEED * Math.cos(ship.angle + angleOffset) / FPS,
                    yv: -LASER_SPEED * Math.sin(ship.angle + angleOffset) / FPS
                });
            });
        }

        if (hasLaserBurst) {
            const BURST_COUNT = 64; 
            for (let i = 0; i < BURST_COUNT; i++) {
                const burstAngle = (i * Math.PI * 2) / BURST_COUNT;
                ship.lasers.push({
                    x: ship.x,
                    y: ship.y,
                    xv: LASER_SPEED * Math.cos(burstAngle) / FPS,
                    yv: -LASER_SPEED * Math.sin(burstAngle) / FPS,
                    dist: 200,
                    explodeTime: 0
                });
            }
        }

        ship.canShoot = false;
        setTimeout(() => {
            ship.canShoot = true;
        }, 25);
    }
}

function createExplosion(x, y, radius, color, velocity = { x: 0, y: 0 }) {
    createExplosionSound(radius);
    
    let particles = [];
    let isMonster = radius === MONSTER_ASTEROID_SIZE;
    let particleCount = isMonster ? EXPLOSION_PARTICLES * 4 : EXPLOSION_PARTICLES;
    let pixelCount = isMonster ? EXPLOSION_PIXELS * 4 : EXPLOSION_PIXELS;
    
    for (let i = 0; i < particleCount; i++) {
        let angle = (i * Math.PI * 2) / particleCount;
        particles.push({
            x: x,
            y: y,
            xv: (Math.random() * 2 - 1) * (velocity.x + 2),
            yv: (Math.random() * 2 - 1) * (velocity.y + 2),
            rot: Math.random() * Math.PI * 2,
            size: radius * (isMonster ? 0.15 : 0.3) * (Math.random() * 0.5 + 0.5),
            decay: isMonster ? 0.99 : 0.997,
            isPixel: false
        });
    }
    
    for (let i =0; i < pixelCount; i++) {
        let speed = Math.random() * (isMonster ? 3.5 : 2.5) + 0.3;
        let angle = Math.random() * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            xv: speed * Math.cos(angle),
            yv: speed * Math.sin(angle),
            rot: 0,
            size: 1,
            decay: 0.995,
            alpha: 1.0,
            isPixel: true
        });
    }
    
    return particles;
}

requestAnimationFrame(gameLoop);

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

function createEnemyShip() {
    let side = Math.floor(Math.random() * 4); 
    let x, y;
    
    switch(side) {
        case 0: // top
            x = Math.random() * canv.width;
            y = -ENEMY_SHIP_SIZE;
            break;
        case 1: // right
            x = canv.width + ENEMY_SHIP_SIZE;
            y = Math.random() * canv.height;
            break;
        case 2: // bottom
            x = Math.random() * canv.width;
            y = canv.height + ENEMY_SHIP_SIZE;
            break;
        default: // left
            x = -ENEMY_SHIP_SIZE;
            y = Math.random() * canv.height;
            break;
    }

    const enemyType = Math.random() < 0.5 ? 'classic' : 'saucer';

    enemyShip = {
        x: x,
        y: y,
        radius: ENEMY_SHIP_SIZE / 2,
        angle: Math.random() * Math.PI * 2,
        rotation: ENEMY_ROTATION_SPEED * (Math.random() < 0.5 ? 1 : -1),
        thrust: { x: 0, y: 0 }, 
        lasers: [],
        lastShotTime: Date.now(),
        dead: false,
        type: enemyType,
        oscillateOffset: 0,
        oscillateSpeed: 0.05
    };
}

function createAsteroidBelt() {
    if (level > 1) { 
        createLevelAnnouncementSound();
    }
    
    asteroids = [];
    isSpecialLevel = false;
    specialLevelType = null;
    
    laserGrid.active = false;
    laserGrid.beams = [];
    laserGrid.angle = 0;

    enemyShip = null; 

    ship.invincible = true;
    ship.invincibleEndTime = Date.now() + SPAWN_PROTECTION_TIME;

    if (level > 1) {
        let malfunctionRisk = MALFUNCTION_BASE_CHANCE + (0.01 * (level - 1));
        
        let roll = Math.random();
        
        if (roll < malfunctionRisk) {
            const malfunctionTypes = Object.values(MALFUNCTION_TYPES);
            const randomType = malfunctionTypes[Math.floor(Math.random() * malfunctionTypes.length)];
            currentMalfunctions.add(randomType.id);
            malfunctionMessageTime = MALFUNCTION_MESSAGE_DURATION * FPS;
            ship.faultsOccurred++;
        }
    }

    if (typeof level !== 'number' || level < 1) {
        level = 1;
    }

    let numAsteroids = level + 2; 

    if (level >= 2 && level % SPECIAL_LEVEL_INTERVAL === 0) {
        isSpecialLevel = true;
        specialLevelType = SPECIAL_LEVEL_TYPES[Math.floor(Math.random() * SPECIAL_LEVEL_TYPES.length)];
        specialLevelMessageTime = SPECIAL_LEVEL_MESSAGE_DURATION;

        if (specialLevelType === 'MONSTER_ASTEROID') {
            let x, y;
            let spawnAttempts = 0;
            const MAX_SPAWN_ATTEMPTS = 10;
            
            do {
                x = canv.width * (0.25 + Math.random() * 0.5);
                y = canv.height * (0.25 + Math.random() *0.5);
                spawnAttempts++;
                
                if (spawnAttempts >= MAX_SPAWN_ATTEMPTS) {
                    x = canv.width / 2;
                    y = canv.height /2;
                    break;
                }
            } while (distBetweenPoints(ship.x, ship.y, x, y) < MONSTER_ASTEROID_SIZE * 2);
            
            let monsterAsteroid = newAsteroid(x, y, MONSTER_ASTEROID_SIZE);
            if (!monsterAsteroid) {
                throw new Error('Monster asteroid creation failed');
            }
            
            monsterAsteroid.health = MONSTER_ASTEROID_HEALTH;
            if (!monsterAsteroid.offsets || monsterAsteroid.offsets.length === 0) {
                monsterAsteroid.offsets = Array(ASTEROID_VERTICES * 2).fill(0.95); 
            }
            
            asteroids.push(monsterAsteroid);

            for (let i = 0; i < numAsteroids; i++) {
                let asteroidX, asteroidY;
                spawnAttempts = 0;
                
                do {
                    asteroidX = Math.random() * canv.width;
                    asteroidY = Math.random() * canv.height;
                    spawnAttempts++;
                    
                    if (spawnAttempts >= MAX_SPAWN_ATTEMPTS) {
                        asteroidX = Math.random() < 0.5 ? ASTEROID_SIZE : canv.width - ASTEROID_SIZE;
                        asteroidY = Math.random() < 0.5 ? ASTEROID_SIZE : canv.height - ASTEROID_SIZE;
                        break;
                    }
                } while (
                    distBetweenPoints(ship.x, ship.y, asteroidX, asteroidY) < ASTEROID_SIZE * 2 ||
                    distBetweenPoints(x, y, asteroidX, asteroidY) < MONSTER_ASTEROID_SIZE * 1.5
                );
                
                asteroids.push(newAsteroid(asteroidX, asteroidY, Math.ceil(ASTEROID_SIZE / 2)));
            }
        } else if (specialLevelType === 'BLACK_HOLE') {
            let blackHole = {
                x: Math.random() * (canv.width - 200) + 100, 
                y: Math.random() * (canv.height - 200) + 100,
                particles: [],
                outerParticles: [],
                angle: 0,
                rotationSpeed: 0.001
            };

            for (let i = 0; i < BLACK_HOLE_PARTICLES; i++) {
                blackHole.particles.push({
                    distance: Math.random() * BLACK_HOLE_RADIUS * 2 + BLACK_HOLE_RADIUS,
                    angle: Math.random() * Math.PI * 2,
                    speed: Math.random() * BLACK_HOLE_PARTICLE_SPEED + 1,
                    size: Math.random() * 2 + 1
                });
            }

            const OUTER_PARTICLES = 200;
            for (let i = 0; i < OUTER_PARTICLES; i++) {
                blackHole.outerParticles.push({
                    distance: BLACK_HOLE_PULL_RADIUS * (0.3 + Math.random() * 0.7),
                    angle: Math.random() * Math.PI * 2,
                    baseSpeed: 0.02 + Math.random() * 0.04,
                    size: 1.5 + Math.random() * 2.5,
                    alpha: 0.4 + Math.random() * 0.4,
                    direction: Math.random() < 0.5 ? 1 : -1
                });
            }

            window.blackHole = blackHole;
            
            for (let i = 0; i < numAsteroids; i++) {
                let x, y;
                do {
                    x = Math.random() * canv.width;
                    y = Math.random() * canv.height;
                } while (distBetweenPoints(x, y, blackHole.x, blackHole.y) < BLACK_HOLE_RADIUS * 4);
                
                asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 2)));
            }
        } else if (specialLevelType === 'LASER_GRID') {
            laserGrid.active = true;
            laserGrid.angle = 0;
            laserGrid.beams = [];
            
            for (let i = 0; i < LASER_GRID_BEAMS; i++) {
                laserGrid.beams.push({
                    angle: (i * Math.PI * 2) / LASER_GRID_BEAMS
                });
            }
            
            for (let i = 0; i < numAsteroids; i++) {
                let x = Math.random() * canv.width;
                let y = Math.random() * canv.height;
                asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 2)));
            }
        } else {
            laserGrid.active = false;
        }
    } else {
        let createdAsteroids = 0;
        let attempts = 0;
        const MAX_ATTEMPTS = 20;

        while (createdAsteroids < numAsteroids && attempts < MAX_ATTEMPTS) {
            let x, y;
            do {
                x = Math.floor(Math.random() * canv.width);
                y = Math.floor(Math.random() * canv.height);
                attempts++;
            } while (distBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.radius && 
                    attempts < MAX_ATTEMPTS);

            let asteroid = newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 2));
            if (asteroid) {
                asteroids.push(asteroid);
                createdAsteroids++;
            }
        }
    }

    if (asteroids.length === 0) {
        level++;
        levelMessageTime = LEVEL_MESSAGE_DURATION;
        createAsteroidBelt();
    }

    if (level % 2 === 1) { 
        enemyShipSpawnTime = Date.now() + 
            ENEMY_SPAWN_MIN_DELAY + 
            Math.random() * (ENEMY_SPAWN_MAX_DELAY - ENEMY_SPAWN_MIN_DELAY);
    } else {
        enemyShipSpawnTime = 0; 
        enemyShip = null; 
    }

    if (Math.random() < 0.5) {
        createBitcoinToken();
    }
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function newAsteroid(x, y, r) {
    let speedMultiplier = r === MONSTER_ASTEROID_SIZE ? 0.15 : 1;
    let vertexCount = r === MONSTER_ASTEROID_SIZE ? 
        ASTEROID_VERTICES * 2 : 
        Math.floor(Math.random() * (ASTEROID_VERTICES + 1) + ASTEROID_VERTICES / 2);
    
    let asteroid = {
        x: x,
        y: y,
        xv: Math.random() * ASTEROID_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1) * speedMultiplier,
        yv: Math.random() * ASTEROID_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1) * speedMultiplier,
        radius: r,
        angle: Math.random() * Math.PI * 2,
        vertices: vertexCount,
        offsets: [],
        rot: (Math.random() * 0.2 - 0.1) * Math.PI / FPS * (r === MONSTER_ASTEROID_SIZE ? 0.3 : 1),
        health: r === MONSTER_ASTEROID_SIZE ? MONSTER_ASTEROID_HEALTH : undefined
    };

    for (let i = 0; i < asteroid.vertices; i++) {
        if (r === MONSTER_ASTEROID_SIZE) {
            asteroid.offsets.push(0.9 + Math.random() * 0.1); 
        } else {
            asteroid.offsets.push(Math.random() * 0.5 + 0.5);
        }
    }

    return asteroid;
}

function keyDown(ev) {
    if (ev.keyCode === 32) {
        ev.preventDefault();
    }

    if (gameOverMessageTime > 0) {
        return;
    }

    if (ev.keyCode === 80) { 
        isPaused = !isPaused;
        pauseOverlay.targetAlpha = isPaused ? 0.5 : 0;
        if (isPaused) {
            stopThrustSound();
        }
        return;
    }

    if (isPaused) {
        return;
    }

    if (ship.dead && ship.explodeTime === 0) {
        if (ev.keyCode === 32) { 
            level = 1;
            score = 0;
            currentMalfunctions.clear(); 
            ship = {
                x: canv.width / 2,
                y: canv.height / 2,
                radius: SHIP_SIZE / 2,
                angle: 90 / 180 * Math.PI,
                rotation: 0,
                thrusting: false,
                thrust: {
                    x: 0,
                    y: 0
                },
                explodeTime: 0,
                dead: false,
                lives: GAME_LIVES,
                particles: [],
                lasers: [],
                canShoot: true,
                trailPoints: [],
                distanceTravelled: 0,
                clockwiseRotations: 0,
                anticlockwiseRotations: 0,
                lastAngle: 90 / 180 * Math.PI,
                prevX: canv.width / 2,
                prevY: canv.height / 2,
                renderX: canv.width / 2,
                renderY: canv.height / 2,
                thrusterFlicker: 0,
                thrusterParticles: [],
                invincible: false,
                invincibleEndTime: 0,
                activePowerUps: new Map(), 
                powerUpMessageTime: 0,
                lastPowerUp: null,
                targetsHit: 0,
                bitcoinsCollected: 0,
                powerupsCollected: 0,
                faultsOccurred: 0,
                enemyShipsDestroyed: 0,
                respawnEffect: 0,
                shotsFired: 0,
                repairsCollected: 0,
                highestVelocity: 0,
            };
            createAsteroidBelt();
            return;
        }
    }

    if (ship.explodeTime > 0) {
        return;
    }

    switch(ev.keyCode) {
        case 32: 
            if (currentMalfunctions.has('fire')) {
                let currentTime = Date.now();
                if (currentTime - lastShotTime < 1000) {
                    return;
                }
                lastShotTime = currentTime;
            }
            shootLaser();
            break;
        case 37: 
            let rotationSpeed = TURN_SPEED;
            if (currentMalfunctions.has('control')) {
                rotationSpeed *= 0.5;
            }
            ship.rotation = rotationSpeed / 180 * Math.PI / FPS * 
                (currentMalfunctions.has('rotation') ? -1 : 1);
            break;
        case 38: 
            if (!isWelcomeScreen) {  
                if (!ship.thrusting) {
                    createThrustSound(); 
                    startThrustSound();  
                }
                ship.thrusting = true;
            }
            break;
        case 39: 
            let rotationSpeed2 = TURN_SPEED;
            if (currentMalfunctions.has('control')) {
                rotationSpeed2 *= 0.5;
            }
            ship.rotation = -rotationSpeed2 / 180 * Math.PI / FPS * 
                (currentMalfunctions.has('rotation') ? -1 : 1);
            break;
    }
}

function keyUp(ev) {
    if (ship.explodeTime > 0) {
        return;
    }

    switch(ev.keyCode) {
        case 32: // space bar 
            ship.canShoot = true;
            break;
        case 37: // left arrow
            ship.rotation = 0;
            break;
        case 38: // up arrow 
            ship.thrusting = false;
            stopThrustSound(); 
            break;
        case 39: // right arrow 
            ship.rotation = 0;
            break;
    }
}

function shootLaser() {
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
        createLaserSound();
        ship.shotsFired++;

        const now = Date.now();
        const hasRearLaser = ship.activePowerUps.get(POWER_UP_TYPES.REAR_LASER.id) > now;
        const hasSpreadShot = ship.activePowerUps.get(POWER_UP_TYPES.SPREAD_SHOT.id) > now;
        const hasLaserBurst = ship.activePowerUps.get(POWER_UP_TYPES.LASER_BURST.id) > now;

        const baseLaser = {
            x: ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
            y: ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle),
            xv: LASER_SPEED * Math.cos(ship.angle) / FPS,
            yv: -LASER_SPEED * Math.sin(ship.angle) / FPS,
            dist: 0,
            explodeTime: 0
        };

        ship.lasers.push({...baseLaser});

        if (hasRearLaser) {
            ship.lasers.push({
                x: ship.x - 4 / 3 * ship.radius * Math.cos(ship.angle),
                y: ship.y + 4 / 3 * ship.radius * Math.sin(ship.angle),
                xv: -LASER_SPEED * Math.cos(ship.angle) / FPS,
                yv: LASER_SPEED * Math.sin(ship.angle) / FPS,
                dist: 0,
                explodeTime: 0
            });
        }

        if (hasSpreadShot) {
            const spreadAngles = [-0.2, 0.2];
            spreadAngles.forEach(angleOffset => {
                ship.lasers.push({
                    ...baseLaser,
                    xv: LASER_SPEED * Math.cos(ship.angle + angleOffset) / FPS,
                    yv: -LASER_SPEED * Math.sin(ship.angle + angleOffset) / FPS
                });
            });
        }

        if (hasLaserBurst) {
            const BURST_COUNT = 64; 
            for (let i = 0; i < BURST_COUNT; i++) {
                const burstAngle = (i * Math.PI * 2) / BURST_COUNT;
                ship.lasers.push({
                    x: ship.x,
                    y: ship.y,
                    xv: LASER_SPEED * Math.cos(burstAngle) / FPS,
                    yv: -LASER_SPEED * Math.sin(burstAngle) / FPS,
                    dist: 200,
                    explodeTime: 0
                });
            }
        }

        ship.canShoot = false;
        setTimeout(() => {
            ship.canShoot = true;
        }, 25);
    }
}

function createExplosion(x, y, radius, color, velocity = { x: 0, y: 0 }) {
    createExplosionSound(radius);
    
    let particles = [];
    let isMonster = radius === MONSTER_ASTEROID_SIZE;
    let particleCount = isMonster ? EXPLOSION_PARTICLES * 4 : EXPLOSION_PARTICLES;
    let pixelCount = isMonster ? EXPLOSION_PIXELS * 4 : EXPLOSION_PIXELS;
    
    for (let i = 0; i < particleCount; i++) {
        let angle = (i * Math.PI * 2) / particleCount;
        particles.push({
            x: x,
            y: y,
            xv: (Math.random() * 2 - 1) * (velocity.x + 2),
            yv: (Math.random() * 2 - 1) * (velocity.y + 2),
            rot: Math.random() * Math.PI * 2,
            size: radius * (isMonster ? 0.15 : 0.3) * (Math.random() * 0.5 + 0.5),
            decay: isMonster ? 0.99 : 0.997,
            isPixel: false
        });
    }
    
    for (let i =0; i < pixelCount; i++) {
        let speed = Math.random() * (isMonster ? 3.5 : 2.5) + 0.3;
        let angle = Math.random() * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            xv: speed * Math.cos(angle),
            yv: speed * Math.sin(angle),
            rot: 0,
            size: 1,
            decay: 0.995,
            alpha: 1.0,
            isPixel: true
        });
    }
    
    return particles;
}

function update() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);

    if (screenShake > 0) {
        ctx.save(); 
        let shakeX = (Math.random() * screenShake * 2 - screenShake);
        let shakeY = (Math.random() * screenShake * 2 - screenShake);
        ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);

    nebulaClouds.forEach(cloud => {
        cloud.x -= ship.thrust.x * NEBULA_SPEED_MULT;
        cloud.y -= ship.thrust.y * NEBULA_SPEED_MULT;
        
        cloud.x += Math.cos(cloud.drift) * 0.2;
        cloud.y += Math.sin(cloud.drift) * 0.2;
        cloud.drift += 0.001;

        if (cloud.x + cloud.radius < 0) cloud.x = canv.width + cloud.radius;
        if (cloud.x - cloud.radius > canv.width) cloud.x = -cloud.radius;
        if (cloud.y + cloud.radius < 0) cloud.y = canv.height + cloud.radius;
        if (cloud.y - cloud.radius > canv.height) cloud.y = -cloud.radius;

        let gradient = ctx.createRadialGradient(
            cloud.x, cloud.y, 0,
            cloud.x, cloud.y, cloud.radius
        );
        
        gradient.addColorStop(0, `hsla(${cloud.hue}, 90%, 50%, ${cloud.alpha * 1.2})`);
        gradient.addColorStop(0.4, `hsla(${cloud.hue}, 80%, 40%, ${cloud.alpha})`); 
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); 

        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';

        cloud.hue = (cloud.hue + 0.2) % 360;
    });

    starLayers.forEach((layer, layerIndex) => {
        let parallaxSpeed = (layerIndex + 1) * STARS_SPEED_MULT;
        
        layer.forEach(star => {
            star.x -= ship.thrust.x * parallaxSpeed;
            star.y -= ship.thrust.y * parallaxSpeed;
            
            if (star.x < 0) star.x = canv.width;
            if (star.x > canv.width) star.x = 0;
            if (star.y < 0) star.y = canv.height;
            if (star.y > canv.height) star.y = 0;
            
            star.twinkle += star.twinkleSpeed;
            let twinkleFactor = (Math.sin(star.twinkle) + 1) * 0.5;
            
            ctx.globalAlpha = 0.5 + twinkleFactor * 0.5;
            ctx.fillStyle = `rgb(255, 255, ${255 - layerIndex * 30})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * (0.7 + twinkleFactor * 0.3), 0, Math.PI * 2);
            ctx.fill();
        });
    });
    
    ctx.globalAlpha = 1.0;

    if (ship.explodeTime > 0) {
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.lineWidth = 1;
        
        ship.particles.forEach(particle => {
            particle.x += particle.xv * 0.8;
            particle.y += particle.yv * 0.8;
            
            if (particle.isPixel) {
                if (particle.alpha > 0) {
                    ctx.globalAlpha = particle.alpha;
                    ctx.fillRect(particle.x, particle.y, 1, 1);
                    particle.alpha *= 0.997;
                }
            } else {
                ctx.globalAlpha = particle.size / (ship.radius * 0.5);
                ctx.beginPath();
                ctx.moveTo(
                    particle.x + particle.size * Math.cos(particle.rot),
                    particle.y + particle.size * Math.sin(particle.rot))
                ;
                ctx.lineTo(
                    particle.x - particle.size * Math.cos(particle.rot),
                    particle.y - particle.size * Math.sin(particle.rot))
                ;
                ctx.stroke();
            }
            
            particle.size *= particle.decay;
        });

        ctx.globalAlpha = 1.0;
        ship.explodeTime--;
    }

    if (ship.thrusting && !ship.dead) {
        let thrustPower = SHIP_THRUST;
        if (currentMalfunctions.has('thrust')) {
            thrustPower *= 0.5; 
        }
        ship.thrust.x += thrustPower * Math.cos(ship.angle) / FPS;
        ship.thrust.y -= thrustPower * Math.sin(ship.angle) / FPS;

        ship.thrusterFlicker += THRUSTER_FLICKER_SPEED;
        let flicker = 0.75 + 0.25 * Math.sin(ship.thrusterFlicker);
        let thrustLength = ship.radius * (2 + flicker);
        
        ctx.beginPath();
        ctx.fillStyle = `hsla(15, 100%, 50%, ${0.7 * flicker})`;
        ctx.strokeStyle = `hsla(45, 100%, 50%, ${0.9 * flicker})`;
        ctx.lineWidth = 2;
        
        ctx.moveTo(
            ship.x - ship.radius * (2/3 * Math.cos(ship.angle) + 0.5 * Math.sin(ship.angle)),
            ship.y + ship.radius * (2/3 * Math.sin(ship.angle) - 0.5 * Math.cos(ship.angle))
        );
        
        let middleX = ship.x - thrustLength * Math.cos(ship.angle) + (Math.random() - 0.5) * 8;
        let middleY = ship.y + thrustLength * Math.sin(ship.angle) + (Math.random() - 0.5) * 8;
        
        ctx.quadraticCurveTo(
            middleX,
            middleY,
            ship.x - ship.radius * (2/3 * Math.cos(ship.angle) - 0.5 * Math.sin(ship.angle)),
            ship.y + ship.radius * (2/3 * Math.sin(ship.angle) + 0.5 * Math.cos(ship.angle))
        );
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = `hsla(45, 100%, 60%, ${0.8 * flicker})`;
        let innerLength = thrustLength * 0.6;
        ctx.moveTo(
            ship.x - ship.radius * (2/3 * Math.cos(ship.angle) + 0.3 * Math.sin(ship.angle)),
            ship.y + ship.radius * (2/3 * Math.sin(ship.angle) - 0.3 * Math.cos(ship.angle))
        );
        ctx.quadraticCurveTo(
            ship.x - innerLength * Math.cos(ship.angle) + (Math.random() - 0.5) * 4,
            ship.y + innerLength * Math.sin(ship.angle) + (Math.random() - 0.5) * 4,
            ship.x - ship.radius * (2/3 * Math.cos(ship.angle) - 0.3 * Math.sin(ship.angle)),
            ship.y + ship.radius * (2/3 * Math.sin(ship.angle) + 0.3 * Math.cos(ship.angle))
        );
        ctx.closePath();
        ctx.fill();
    }

    ship.thrusterParticles = ship.thrusterParticles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        particle.life -= 0.02;
        
        if (particle.life > 0) {
            ctx.fillStyle = `hsla(${particle.hue}, 100%, 50%, ${particle.life})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.life * 2, 0, Math.PI * 2);
            ctx.fill();
            return true;
        }
        return false;
    });

    if (ship.thrusting && !ship.dead) {
        for (let i = 0; i < 6; i++) {
            let spread = 0.15;
            let baseAngle = ship.angle + (Math.random() * spread - spread/2);
            let speed = Math.random() * 1.5 + 0.5;
            
            let thrustX = ship.x - ship.radius * (2/3) * Math.cos(ship.angle);
            let thrustY = ship.y + ship.radius * (2/3) * Math.sin(ship.angle);
            
            ship.trailPoints.unshift({
                x: thrustX,
                y: thrustY,
                vx: -speed * Math.cos(baseAngle),
                vy: speed * Math.sin(baseAngle),
                alpha: 0.6,
                size: 1.2,
            });
        }
        
        while (ship.trailPoints.length > TRAIL_MAX_POINTS) {
            ship.trailPoints.pop();
        }
    }

    ship.trailPoints.forEach(point => {
        point.x += point.vx;
        point.y += point.vy;
        
        point.vx *= 0.995;
        point.vy *= 0.995;
        
        point.alpha *= 0.997;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${point.alpha * 0.1})`; 
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 255, 255, ${point.alpha * 0.7})`; 
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    });

    ship.trailPoints = ship.trailPoints.filter(point => point.alpha > 0.01);

    if (!ship.dead) {
        if (ship.explodeTime == 0) {
            if (ship.invincible) {
                ctx.globalAlpha = Math.sin(Date.now() / 50) * 0.5 + 0.5;
            }

            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(
                ship.renderX + 2 * ship.radius * Math.cos(ship.angle),
                ship.renderY - 2 * ship.radius * Math.sin(ship.angle)
            );
            ctx.lineTo(
                ship.renderX - ship.radius * (2/3 * Math.cos(ship.angle) + Math.sin(ship.angle)),
                ship.renderY + ship.radius * (2/3 * Math.sin(ship.angle) - Math.cos(ship.angle))
            );
            ctx.lineTo(
                ship.renderX - ship.radius * (2/3 * Math.cos(ship.angle) - Math.sin(ship.angle)),
                ship.renderY + ship.radius * (2/3 * Math.sin(ship.angle) + Math.cos(ship.angle))
            );
            ctx.closePath();
            ctx.stroke();

            ctx.globalAlpha = 1.0;

            if (ship.activePowerUps.has(POWER_UP_TYPES.SHIELD.id)) {
                drawShieldEffect();
            }
        } else {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 1.5;
            ship.particles.forEach(particle => {
                particle.x += particle.xv;
                particle.y += particle.yv;
                
                ctx.beginPath();
                ctx.moveTo(
                    particle.x + particle.size * Math.cos(particle.rot),
                    particle.y + particle.size * Math.sin(particle.rot))
                ;
                ctx.lineTo(
                    particle.x - particle.size * Math.cos(particle.rot),
                    particle.y - particle.size * Math.sin(particle.rot))
                ;
                ctx.stroke();

                particle.size *= particle.decay;
            });

            ship.explodeTime--;
            if (ship.explodeTime == 0) {
                respawnShip();
            }
        }
    }

    ship.prevX = ship.x;
    ship.prevY = ship.y;

    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    for (let i = ship.lasers.length - 1; i >= 0; i--) {
        let actualDist = Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
        ship.lasers[i].dist += actualDist;
        
        if (ship.lasers[i].dist > LASER_DIST * canv.width) {
            ship.lasers.splice(i, 1);
            continue;
        }

        ship.lasers[i].prevX = ship.lasers[i].x;
        ship.lasers[i].prevY = ship.lasers[i].y;
        
        ship.lasers[i].x += ship.lasers[i].xv;
        ship.lasers[i].y += ship.lasers[i].yv;

        if (ship.lasers[i].x < 0) {
            ship.lasers[i].x = canv.width;
            ship.lasers[i].prevX = canv.width;
        } else if (ship.lasers[i].x > canv.width) {
            ship.lasers[i].x = 0;
            ship.lasers[i].prevX = 0;
        }
        if (ship.lasers[i].y < 0) {
            ship.lasers[i].y = canv.height;
            ship.lasers[i].prevY = canv.height;
        } else if (ship.lasers[i].y > canv.height) {
            ship.lasers[i].y = 0;
            ship.lasers[i].prevY = 0;
        }
    }

    const now = performance.now();
    const alpha = (now % (1000/FPS)) / (1000/FPS);

    ship.renderX = ship.prevX + (ship.x - ship.prevX) * alpha;
    ship.renderY = ship.prevY + (ship.y - ship.prevY) * alpha;

    if (!ship.dead) {
        if (ship.explodeTime == 0) {
            if (ship.invincible) {
                ctx.globalAlpha = Math.sin(Date.now() / 50) * 0.5 + 0.5;
            }

            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(
                ship.renderX + 2 * ship.radius * Math.cos(ship.angle),
                ship.renderY - 2 * ship.radius * Math.sin(ship.angle)
            );
            ctx.lineTo(
                ship.renderX - ship.radius * (2/3 * Math.cos(ship.angle) + Math.sin(ship.angle)),
                ship.renderY + ship.radius * (2/3 * Math.sin(ship.angle) - Math.cos(ship.angle))
            );
            ctx.lineTo(
                ship.renderX - ship.radius * (2/3 * Math.cos(ship.angle) - Math.sin(ship.angle)),
                ship.renderY + ship.radius * (2/3 * Math.sin(ship.angle) + Math.cos(ship.angle))
            );
            ctx.closePath();
            ctx.stroke();

            ctx.globalAlpha = 1.0;
        }
    }

    ctx.fillStyle = "white";
    for (let i = 0; i < ship.lasers.length; i++) {
        let laser = ship.lasers[i];
        laser.renderX = laser.prevX + (laser.x - laser.prevX) * alpha;
        laser.renderY = laser.prevY + (laser.y - laser.prevY) * alpha;
        
        ctx.beginPath();
        ctx.arc(laser.renderX, laser.renderY, 2, 0, Math.PI * 2, false);
        ctx.fill();
    }

    if (!ship.dead) {
        if (!ship.thrusting) {
            ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
            ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
        }

        const dx = ship.x - ship.prevX;
        const dy = ship.y - ship.prevY;
        ship.distanceTravelled += Math.sqrt(dx * dx + dy * dy);
        
        ship.prevX = ship.x;
        ship.prevY = ship.y;
    }

    let angleDiff = ship.angle - ship.lastAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (angleDiff > 0) {
        ship.anticlockwiseRotations += angleDiff / (Math.PI * 2);
    } else {
        ship.clockwiseRotations += -angleDiff / (Math.PI * 2);
    }
    ship.lastAngle = ship.angle;

    if (ship.x < 0 - ship.radius) {
        ship.x = canv.width + ship.radius;
    } else if (ship.x > canv.width + ship.radius) {
        ship.x = 0 - ship.radius;
    }
    if (ship.y < 0 - ship.radius) {
        ship.y = canv.height + ship.radius;
    } else if (ship.y > canv.height + ship.radius) {
        ship.y = 0 - ship.radius;
    }

    ship.angle += ship.rotation;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    for (let i =0; i < asteroids.length; i++) {
        let asteroid = asteroids[i];

        asteroid.angle += asteroid.rot;

        ctx.beginPath();
        ctx.moveTo(
            asteroid.x + asteroid.radius * asteroid.offsets[0] * Math.cos(asteroid.angle),
            asteroid.y + asteroid.radius * asteroid.offsets[0] * Math.sin(asteroid.angle)
        );

        for (let j = 1; j < asteroid.vertices; j++) {
            ctx.lineTo(
                asteroid.x + asteroid.radius * asteroid.offsets[j] * Math.cos(asteroid.angle + j * Math.PI * 2 / asteroid.vertices),
                asteroid.y + asteroid.radius * asteroid.offsets[j] * Math.sin(asteroid.angle + j * Math.PI * 2 / asteroid.vertices)
            );
        }
        ctx.closePath();
        ctx.stroke();

        asteroid.x += asteroid.xv;
        asteroid.y += asteroid.yv;

        let avgOffset = asteroid.offsets.reduce((a, b) => a + b) / asteroid.offsets.length;
        let visualRadius = asteroid.radius * avgOffset;

        if (asteroid.x < -visualRadius) {
            asteroid.x = canv.width + visualRadius;
        } else if (asteroid.x > canv.width + visualRadius) {
            asteroid.x = -visualRadius;
        }
        
        if (asteroid.y < -visualRadius) {
            asteroid.y = canv.height + visualRadius;
        } else if (asteroid.y > canv.height + visualRadius) {
            asteroid.y = -visualRadius;
        }

        if (asteroid.health !== undefined) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(
                asteroid.x - MONSTER_HEALTH_BAR_WIDTH / 2,
                asteroid.y,
                MONSTER_HEALTH_BAR_WIDTH,
                MONSTER_HEALTH_BAR_HEIGHT
            );

            ctx.fillStyle = "rgba(0, 255, 0, 0.7)";
            ctx.fillRect(
                asteroid.x - MONSTER_HEALTH_BAR_WIDTH / 2,
                asteroid.y,
                (asteroid.health / MONSTER_ASTEROID_HEALTH) * MONSTER_HEALTH_BAR_WIDTH,
                MONSTER_HEALTH_BAR_HEIGHT
            );

            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
                `${asteroid.health}/${MONSTER_ASTEROID_HEALTH}`,
                asteroid.x,
                asteroid.y - 5
            );
        }

        if (asteroid.health !== undefined) {
            if (asteroid.x < 0 || asteroid.x > canv.width || 
                asteroid.y < 0 || asteroid.y > canv.height) {
                
                let indicatorX = Math.max(20, Math.min(canv.width - 20, asteroid.x));
                let indicatorY = Math.max(20, Math.min(canv.height - 20, asteroid.y));
                
                ctx.strokeStyle = "white";
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(indicatorX, indicatorY, 10, 0, Math.PI * 2);
                ctx.fill();
                
                let angle = Math.atan2(asteroid.y - indicatorY, asteroid.x - indicatorX);
                ctx.beginPath();
                ctx.moveTo(indicatorX, indicatorY);
                ctx.lineTo(
                    indicatorX + Math.cos(angle) * 20,
                    indicatorY + Math.sin(angle) * 20
                );
                ctx.stroke();
            }
        }
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        if (!ship.dead && !ship.explodeTime && !ship.invincible) {
            const hasShield = ship.activePowerUps.has(POWER_UP_TYPES.SHIELD.id);
            const collisionRadius = hasShield ? ship.radius * 1.5 : ship.radius * 0.8;

            let ax = asteroids[i].x;
            let ay = asteroids[i].y;
            let ar = asteroids[i].radius;

            if (distBetweenPoints(ship.x, ship.y, ax, ay) < collisionRadius + ar) {
                if (hasShield) {
                    if (asteroids[i].health !== undefined) {
                        asteroids[i].health--;
                        
                        if (asteroids[i].health <= 0) {
                            let numNewAsteroids = 6;
                            for (let k = 0; k < numNewAsteroids; k++) {
                                let angle = (k * Math.PI * 2) / numNewAsteroids;
                                let spreadDistance = ASTEROID_SIZE;
                                
                                let newX = asteroids[i].x + Math.cos(angle) * spreadDistance;
                                let newY = asteroids[i].y + Math.sin(angle) * spreadDistance;
                                
                                asteroids.push(newAsteroid(newX, newY, ASTEROID_SIZE / 2));
                            }
                            
                            let particles = createExplosion(
                                asteroids[i].x,
                                asteroids[i].y,
                                asteroids[i].radius,
                                'white',
                                { x: asteroids[i].xv, y: asteroids[i].yv }
                            );
                            explosions.push({
                                particles: particles,
                                radius: asteroids[i].radius
                            });
                            
                            score += SCORE_LARGE_ASTEROID;
                            asteroids.splice(i, 1);
                        }
                    } else {
                        let particles = createExplosion(
                            asteroids[i].x,
                            asteroids[i].y,
                            asteroids[i].radius,
                            'white',
                            { x: asteroids[i].xv, y: asteroids[i].yv }
                        );
                        explosions.push({
                            particles: particles,
                            radius: asteroids[i].radius
                        });

                        if (asteroids[i].radius > ASTEROID_SIZE / 7) {
                            let newRadius = asteroids[i].radius / 2;
                            asteroids.push(newAsteroid(asteroids[i].x, asteroids[i].y, newRadius));
                            asteroids.push(newAsteroid(asteroids[i].x, asteroids[i].y, newRadius));
                        }
                        
                        score += SCORE_SMALL_ASTEROID;
                        asteroids.splice(i, 1);
                    }
                } else {
                    destroyShip();
                }
                continue;
            }
        }
    }

    function pointToLineDistance(px, py, x1, y1, x2, y2) {
        let A = px - x1;
        let B = py - y1;
        let C = x2 - x1;
        let D = y2 - y1;

        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = -1;

        if (len_sq != 0) {
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        let dx = px - xx;
        let dy = py - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        for (let j = ship.lasers.length - 1; j >= 0; j--) {
            if (!ship.lasers[j]) continue;
            
            let asteroid = asteroids[i];
            let laser = ship.lasers[j];
            
            let collisionRadius = asteroid.radius;
            if (asteroid.radius === MONSTER_ASTEROID_SIZE) {
                let avgOffset = asteroid.offsets.reduce((a, b) => a + b) / asteroid.offsets.length;
                collisionRadius = asteroid.radius * avgOffset;
            }

            if (distBetweenPoints(laser.x, laser.y, asteroid.x, asteroid.y) < collisionRadius) {
                let destroyedAsteroid = asteroids[i];
                
                ship.lasers.splice(j, 1);
                createPulseEffect(destroyedAsteroid.x, destroyedAsteroid.y, destroyedAsteroid.radius);
                ship.targetsHit++;  
                if (destroyedAsteroid.health !== undefined) {
                    destroyedAsteroid.health--;
                    
                    if (destroyedAsteroid.health <= 0) {
                        score += SCORE_LARGE_ASTEROID; 

                        for (let i =0; i < 20; i++) { 
                            let offsetX = (Math.random() - 0.5) * destroyedAsteroid.radius * 0.8;
                            let offsetY = (Math.random() - 0.5) * destroyedAsteroid.radius * 0.8;
                            
                            let particles = [];
                            let pixelCount = EXPLOSION_PIXELS * 4; 
                            
                            for (let j =0; j < pixelCount; j++) {
                                let speed = Math.random() * 3.5 + 0.3;
                                let angle = Math.random() * Math.PI * 2;
                                particles.push({
                                    x: destroyedAsteroid.x + offsetX,
                                    y: destroyedAsteroid.y + offsetY,
                                    xv: speed * Math.cos(angle),
                                    yv: speed * Math.sin(angle),
                                    rot: 0,
                                    size: 1,
                                    decay: 0.995,
                                    alpha: 1.0,
                                    isPixel: true
                                });
                            }
                            
                            explosions.push({
                                particles: particles,
                                radius: destroyedAsteroid.radius
                            });
                        }

                        let numNewAsteroids = level + 4;
                        for (let k =0; k < numNewAsteroids; k++) {
                            let angle = (k * Math.PI * 2) / numNewAsteroids;
                            let spreadDistance = ASTEROID_SIZE;
                            
                            let newX = destroyedAsteroid.x + Math.cos(angle) * spreadDistance;
                            let newY = destroyedAsteroid.y + Math.sin(angle) * spreadDistance;
                            
                            asteroids.push(newAsteroid(newX, newY, ASTEROID_SIZE / 2));
                        }
                        
                        asteroids.splice(i, 1);
                    }
                } else {
                    let particles = createExplosion(
                        destroyedAsteroid.x,
                        destroyedAsteroid.y,
                        destroyedAsteroid.radius,
                        'white',
                        { x: destroyedAsteroid.xv, y: destroyedAsteroid.yv }
                    );
                    
                    explosions.push({
                        particles: particles,
                        radius: destroyedAsteroid.radius
                    });

                    score += SCORE_SMALL_ASTEROID; 

                    if (destroyedAsteroid.radius > ASTEROID_SIZE / 7) {
                        let newRadius = destroyedAsteroid.radius / 2;
                        asteroids.push(newAsteroid(destroyedAsteroid.x, destroyedAsteroid.y, newRadius));
                        asteroids.push(newAsteroid(destroyedAsteroid.x, destroyedAsteroid.y, newRadius));
                    }
                    
                    asteroids.splice(i, 1);
                }
                break; 
            }
        }
    }

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";


    ctx.fillStyle = "orange";
        ctx.fillText(`BASE SCORE: ${'\u20BF'}${formatScoreAsBTC(score)}`, STATS_MARGIN, STATS_LINE_HEIGHT);
        ctx.fillText(`LEVEL: ${level}`, STATS_MARGIN, STATS_LINE_HEIGHT * 2);

    if (!isStatsHidden) {
        const shipVelocity = Math.sqrt(Math.pow(ship.thrust.x, 2) + Math.pow(ship.thrust.y, 2)) * FPS;
        const shipAttitude = ((-ship.angle * 180 / Math.PI + 90) + 360) % 360;

        let malfunctionRisk = level > 1 ? 
            Math.min(Math.round((MALFUNCTION_BASE_CHANCE + (0.01 * (level - 1))) * 100), 90) : 
            0;
        const totalTargetsHit = ship.targetsHit + ship.enemyShipsDestroyed;
        const accuracyRate = ship.shotsFired > 0 ? (totalTargetsHit / ship.shotsFired * 100).toFixed(2) : 0;

        ctx.font = "12px Arial";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText(`CURRENT LEVEL:`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillText(`ASTEROIDS:`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 3);
        ctx.fillText(`├─ INITIAL DENSITY: ${STARTING_ASTEROIDS + level - 1}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 4);
        ctx.fillText(`└─ TARGETS REMAINING: ${asteroids.length}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 5);
        ctx.fillText(`RISK OF MALFUNCTION: ${malfunctionRisk}%`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 6);

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText(`PLAYER SHIP:`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 8);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillText(`VELOCITY: ${Math.round(shipVelocity)}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 9);
        ctx.fillText(`HIGHEST VELOCITY: ${Math.round(ship.highestVelocity)}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 10);
        ctx.fillText(`ATTITUDE: ${Math.round(shipAttitude)}°`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 11);
        ctx.fillText(`DISTANCE FLOWN: ${Math.round(ship.distanceTravelled)}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 12);
        ctx.fillText(`CW ROTATIONS: ${Math.floor(ship.clockwiseRotations)}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 13);
        ctx.fillText(`CCW ROTATIONS: ${Math.floor(ship.anticlockwiseRotations)}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 14);
        ctx.fillText(`MALFUNCTIONS OCCURRED: ${ship.faultsOccurred}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 15);

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText(`COLLECTIBLES:`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 17);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillText(`SEED PLATES COLLECTED: ${ship.bitcoinsCollected}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 18);
        ctx.fillText(`POWER-UPS COLLECTED: ${ship.powerupsCollected}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 19);
        ctx.fillText(`SPARE PARTS COLLECTED: ${ship.repairsCollected}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 20);

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText(`MISSION STATS:`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 22);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillText(`LEVELS COMPLETED: ${level - 1}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 23);                
        ctx.fillText(`SHOTS FIRED: ${ship.shotsFired}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 24);                
        ctx.fillText(`TOTAL TARGETS HIT: ${totalTargetsHit}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 25);   
        ctx.fillText(`├─ ASTEROIDS HIT: ${ship.targetsHit}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 26);
        ctx.fillText(`└─ ENEMY SHIPS DESTROYED: ${ship.enemyShipsDestroyed}`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 27);
        ctx.fillText(`ACCURACY RATE: ${accuracyRate}%`, STATS_MARGIN, STATS_MARGIN + STATS_LINE_HEIGHT * 2 + SMALL_STATS_LINE_HEIGHT * 28);
        
    }

    if (screenShake > 0) {
        ctx.restore(); 
        screenShake *= 0.9;
        if (screenShake < 0.5) {
            screenShake = 0;
        }
    }

    explosions = explosions.filter(explosion => {
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.lineWidth = 1;
        
        explosion.particles = explosion.particles.filter(particle => {
            particle.x += particle.xv * 0.8;
            particle.y += particle.yv * 0.8;
            
            if (particle.isPixel) {
                if (particle.alpha > 0) {
                    ctx.globalAlpha = particle.alpha;
                    ctx.fillRect(particle.x, particle.y, 1, 1);
                    particle.alpha *= 0.997;
                }
            } else {
                ctx.globalAlpha = particle.size / (explosion.radius * 0.5);
                ctx.beginPath();
                ctx.moveTo(
                    particle.x + particle.size * Math.cos(particle.rot),
                    particle.y + particle.size * Math.sin(particle.rot))
                ;
                ctx.lineTo(
                    particle.x - particle.size * Math.cos(particle.rot),
                    particle.y - particle.size * Math.sin(particle.rot))
                ;
                ctx.stroke();
            }
            
            particle.size *= particle.decay;
            
            return particle.isPixel ? particle.alpha > 0.01 : particle.size > 0.1;
        });

        return explosion.particles.length > 0;
    });

    ctx.globalAlpha = 1.0;

    if (malfunctionMessageTime > 0) {
        ctx.fillStyle = "magenta";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("MALFUNCTION!", canv.width / 2, canv.height / 2 - 50);
        
        const lastMalfunction = [...currentMalfunctions].pop();
        const malfunctionType = Object.values(MALFUNCTION_TYPES).find(type => type.id === lastMalfunction);
        ctx.fillText(malfunctionType ? malfunctionType.name : "UNKNOWN SYSTEM", 
                    canv.width / 2, canv.height / 2);
        malfunctionMessageTime--;
    }

    function drawMalfunctions() {
        if (currentMalfunctions.size > 0) {
            ctx.fillStyle = "magenta";
            ctx.font = "16px Arial";
            ctx.textAlign = "left";
            
            let y = canv.height - 20;
            currentMalfunctions.forEach(malfunctionId => {
                const malfunctionType = Object.values(MALFUNCTION_TYPES).find(type => type.id === malfunctionId);
                ctx.fillText(malfunctionType ? malfunctionType.name : "UNKNOWN SYSTEM", 20, y);
                y -= 20; 
            });
        }
    }

    drawMalfunctions();

    if (repairToken && !repairToken.collected) {
        let timeElapsed = Date.now() - repairToken.spawnTime;
        if (timeElapsed >= repairToken.duration) {
            let particles = createExplosion(
                repairToken.x,
                repairToken.y,
                REPAIR_TOKEN_SIZE,
                'white',
                { x: repairToken.xv, y: repairToken.yv }
            );
            explosions.push({
                particles: particles,
                radius: REPAIR_TOKEN_SIZE
            });
            
            repairToken.collected = true;
            return;
        }

        if (!ship.dead && !ship.explodeTime && 
            distBetweenPoints(ship.x, ship.y, repairToken.x, repairToken.y) < 
            (ship.radius + REPAIR_COLLECT_RADIUS)) {
            
            if (currentMalfunctions.size > 0) {
                let malfunctions = Array.from(currentMalfunctions);
                let removedMalfunction = malfunctions[Math.floor(Math.random() * malfunctions.length)];
                currentMalfunctions.delete(removedMalfunction);
                repairedSystem = Object.values(MALFUNCTION_TYPES).find(type => type.id === removedMalfunction).name;
                repairMessageTime = REPAIR_MESSAGE_DURATION;
                createRepairSound(); 
            }
            
            repairToken.collected = true;
            return;
        }

        repairToken.x += repairToken.xv;
        repairToken.y += repairToken.yv;

        if (repairToken.x < 0 - REPAIR_TOKEN_SIZE) {
            repairToken.x = canv.width + REPAIR_TOKEN_SIZE;
        } else if (repairToken.x > canv.width + REPAIR_TOKEN_SIZE) {
            repairToken.x = 0 - REPAIR_TOKEN_SIZE;
        }
        if (repairToken.y < 0 - REPAIR_TOKEN_SIZE) {
            repairToken.y = canv.height + REPAIR_TOKEN_SIZE;
        } else if (repairToken.y > canv.height + REPAIR_TOKEN_SIZE) {
            repairToken.y = 0 - REPAIR_TOKEN_SIZE;
        }

        ctx.save();
        ctx.translate(repairToken.x, repairToken.y);
        ctx.rotate(repairToken.angle);
        
        let progress = 1 - (timeElapsed / repairToken.duration);
        ctx.beginPath();
        ctx.arc(0, 0, REPAIR_TOKEN_SIZE / 2 + 3, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
        ctx.strokeStyle = "magenta";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = "magenta";
        ctx.beginPath();
        ctx.arc(0, 0, REPAIR_TOKEN_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "black";
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("S", 0, 0);
        
        ctx.restore();
        
        repairToken.angle += REPAIR_TOKEN_ROTATION_SPEED;
    }

    if (repairMessageTime > 0) {
        ctx.fillStyle = "magenta";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("SYSTEM REPAIRED:", canv.width / 2, canv.height / 2 - 20);
        ctx.fillText(repairedSystem, canv.width / 2, canv.height / 2 + 20);
        repairMessageTime--;
    }

    if (!ship.dead && !isTransitioningLevel && asteroids.length === 0) {
        isTransitioningLevel = true;

        setTimeout(() => {
            level++;
            levelMessageTime = LEVEL_MESSAGE_DURATION;
            
            if (level % 5 === 0) {
                ship.lives++;
                createExtraLifeSound();
                extraLifeMessageTime = EXTRA_LIFE_MESSAGE_DURATION;
            }
            
            try {
                createAsteroidBelt();
            } catch (error) {
                if (level % SPECIAL_LEVEL_INTERVAL === 0) {
                    isSpecialLevel = false;
                    specialLevelType = null;
                    createAsteroidBelt();
                }
            }
            
            isTransitioningLevel = false;
        }, 50);
    }

    if (specialLevelMessageTime > 0) {
        ctx.textAlign = "center";
        ctx.font = "16px Arial";
        ctx.fillStyle = "orange";
        let levelText = "WARNING: ";
        switch(specialLevelType) {
            case 'MONSTER_ASTEROID':
                levelText += "MEGA ASTEROID!";
                break;
            case 'BLACK_HOLE':
                levelText += "BLACK HOLE DETECTED!";
                break;
            case 'LASER_GRID':
                levelText += "LASERS!";
                break;
            default:
                levelText += "UNKNOWN TYPE";
        }
        ctx.fillText(levelText, canv.width / 2, canv.height * 0.25);
        specialLevelMessageTime--; 
    }

    if (currentMalfunctions.size > 0 && (!repairToken || repairToken.collected)) {
        if (Math.random() < 0.002) { 
            createRepairToken();
        }
    }

    if (!ship.thrusting) {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }

    function updateEnemyShip() {
        if (!enemyShip || enemyShip.dead) return;

        if (enemyShip.type === 'classic') {
            let dx = ship.x - enemyShip.x;
            let dy = ship.y - enemyShip.y;
            let angleToPlayer = Math.atan2(-dy, dx);
            
            let angleDiff = angleToPlayer - enemyShip.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            enemyShip.rotation = Math.sign(angleDiff) * ENEMY_ROTATION_SPEED * (0.5 + Math.random() * 0.5);
            enemyShip.angle += enemyShip.rotation;

            if (Math.random() < 0.95) {
                let thrustX = ENEMY_SHIP_SPEED * Math.cos(enemyShip.angle) / FPS;
                let thrustY = -ENEMY_SHIP_SPEED * Math.sin(enemyShip.angle) / FPS;
                
                if (!enemyShip.thrust) {
                    enemyShip.thrust = { x: 0, y: 0 };
                }
                
                enemyShip.thrust.x += thrustX * (0.8 + Math.random() * 0.4);
                enemyShip.thrust.y += thrustY * (0.8 + Math.random() * 0.4);
            }

            enemyShip.thrust.x *= 0.99;
            enemyShip.thrust.y *= 0.99;

            enemyShip.x += enemyShip.thrust.x;
            enemyShip.y += enemyShip.thrust.y;
        } else {
            let dx = ship.x - enemyShip.x;
            let dy = ship.y - enemyShip.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            enemyShip.x += (dx / dist) * ENEMY_SHIP_SPEED;
            enemyShip.y += (dy / dist) * ENEMY_SHIP_SPEED;
            
            enemyShip.angle += enemyShip.rotation;
            enemyShip.oscillateOffset += enemyShip.oscillateSpeed;
            enemyShip.y += Math.sin(enemyShip.oscillateOffset) * 0.5;
        }

        if (enemyShip.x < 0 - enemyShip.radius) {
            enemyShip.x = canv.width + enemyShip.radius;
        } else if (enemyShip.x > canv.width + enemyShip.radius) {
            enemyShip.x = 0 - enemyShip.radius;
        }
        if (enemyShip.y < 0 - enemyShip.radius) {
            enemyShip.y = canv.height + enemyShip.radius;
        } else if (enemyShip.y > canv.height + enemyShip.radius) {
            enemyShip.y = 0 - enemyShip.radius;
        }

        let now = Date.now();
        if (now - enemyShip.lastShotTime > ENEMY_SHOOT_INTERVAL * 1000) {
            let angleToPlayer = Math.atan2(-(ship.y - enemyShip.y), ship.x - enemyShip.x);
            
            let accuracy = 0.2;
            angleToPlayer += (Math.random() - 0.5) * accuracy;

            enemyShip.lasers.push({
                x: enemyShip.x,
                y: enemyShip.y,
                xv: ENEMY_LASER_SPEED * Math.cos(angleToPlayer) / FPS,
                yv: -ENEMY_LASER_SPEED * Math.sin(angleToPlayer) / FPS,
                dist: 0
            });
            
            createEnemyLaserSound();
            enemyShip.lastShotTime = now;
        }
    }

    if (enemyShip && !enemyShip.dead) {
        for (let j = ship.lasers.length - 1; j >=0; j--) {
            if (distBetweenPoints(ship.lasers[j].x, ship.lasers[j].y, 
                enemyShip.x, enemyShip.y) < enemyShip.radius) {
                let particles = createExplosion(
                    enemyShip.x,
                    enemyShip.y,
                    enemyShip.radius,
                    'red',
                    { x: 0, y: 0 }
                );
                explosions.push({
                    particles: particles,
                    radius: enemyShip.radius
                });

                ship.lasers.splice(j, 1);
                enemyShip.dead = true;
                ship.enemyShipsDestroyed++;
                score += ENEMY_POINTS;
                break;
            }
        }
    }

    updateEnemyShip();

    if (extraLifeMessageTime > 0) {
        ctx.save();
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        
        let baseScale = 15;
        let startScale = 1;
        let endScale = 15;
        let progress = (EXTRA_LIFE_MESSAGE_DURATION - extraLifeMessageTime) / EXTRA_LIFE_MESSAGE_DURATION;
        let scale = startScale + (endScale - startScale) * progress;
        
        ctx.globalAlpha = Math.max(0, 1 - (progress * 1.5));
        
        let centerX = canv.width / 2;
        let centerY = canv.height / 4;
        
        EXTRA_LIFE_SEGMENTS.forEach(segment => {
            segment.forEach((point, index) => {
                if (index === 0) {
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + (point[0] - 8.5) * baseScale * scale,
                        centerY + (point[1] - 1.5) * baseScale * scale
                    );
                } else {
                    ctx.lineTo(
                        centerX + (point[0] - 8.5) * baseScale * scale,
                        centerY + (point[1] - 1.5) * baseScale * scale
                    );
                }
            });
            ctx.stroke();
        });
        
        ctx.restore();
        extraLifeMessageTime--;
    }

    if (isSpecialLevel && specialLevelType === 'BLACK_HOLE' && window.blackHole) {
        let blackHole = window.blackHole;
        
        ctx.globalCompositeOperation = 'lighter';
        blackHole.outerParticles.forEach(particle => {
            let speedFactor = 1 - (particle.distance / BLACK_HOLE_PULL_RADIUS);
            particle.angle += (particle.baseSpeed * speedFactor * particle.direction) + blackHole.rotationSpeed;
            
            let x = blackHole.x + Math.cos(particle.angle) * particle.distance;
            let y = blackHole.y + Math.sin(particle.angle) * particle.distance;
            
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            let distanceFactor = 1 - (particle.distance / BLACK_HOLE_PULL_RADIUS);
            ctx.fillStyle = `rgba(200, 150, 255, ${particle.alpha * distanceFactor * distanceFactor})`;
            ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';

        let gradient = ctx.createRadialGradient(
            blackHole.x, blackHole.y, 0,
            blackHole.x, blackHole.y, BLACK_HOLE_RADIUS * 1.5
        );
        gradient.addColorStop(0, '#4a0099'); 
        gradient.addColorStop(0.4, '#2a0066');
        gradient.addColorStop(0.8, '#1a0033');
        gradient.addColorStop(1, 'rgba(26, 0, 51, 0)');
        
        ctx.beginPath();
        ctx.arc(blackHole.x, blackHole.y, BLACK_HOLE_RADIUS * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        blackHole.angle += blackHole.rotationSpeed;

        ctx.strokeStyle = '#6600cc';
        blackHole.particles.forEach(particle => {
            particle.angle += particle.speed / particle.distance;
            
            ctx.beginPath();
            let x = blackHole.x + Math.cos(particle.angle) * particle.distance;
            let y = blackHole.y + Math.sin(particle.angle) * particle.distance;
            let trailLength = Math.PI / 8;
            
            ctx.beginPath();
            ctx.arc(blackHole.x, blackHole.y, particle.distance, 
                particle.angle - trailLength, particle.angle, 
                false);
            ctx.strokeStyle = `rgba(102, 0, 204, ${1 - particle.distance / (BLACK_HOLE_RADIUS * 3)})`;
            ctx.lineWidth = particle.size;
            ctx.stroke();
            
            particle.distance *= 0.995;
            if (particle.distance < BLACK_HOLE_RADIUS) {
                particle.distance = BLACK_HOLE_RADIUS * 2 + BLACK_HOLE_RADIUS;
            }
        });

        if (!ship.dead && !ship.explodeTime) {
            const dx = blackHole.x - ship.x;
            const dy = blackHole.y - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > BLACK_HOLE_RADIUS && distance < BLACK_HOLE_PULL_RADIUS) {
                const force = BLACK_HOLE_FORCE * Math.pow(1 - distance / BLACK_HOLE_PULL_RADIUS, 2);
                ship.thrust.x += (dx / distance) * force;
                ship.thrust.y += (dy / distance) * force;
                
                if (distance < BLACK_HOLE_RADIUS * 1.5) {
                    destroyShip();
                }
            }
        }
    }

    if (ship.invincible) {
        if (Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        if (Date.now() > ship.invincibleEndTime) {
            ship.invincible = false;
            ctx.globalAlpha = 1.0;
        }
    }

    ctx.globalAlpha = 1.0;

    function updateLaserGrid() {
        if (!laserGrid.active) return;

        ctx.save();
        
        const centerX = canv.width / 2;
        const centerY = canv.height / 2;
        const diagonal = Math.sqrt(canv.width * canv.width + canv.height * canv.height);

        laserGrid.angle += LASER_GRID_ROTATION_SPEED * Math.PI / 180;
        
        const pulseIntensity = Math.sin(Date.now() / 500) * 0.2 + 0.8;
        
        ctx.globalCompositeOperation = 'lighter';
        
        const coreSize = 40 + Math.sin(Date.now() / 300) * 10;
        const rotationOffset = Date.now() / 1000;
        
        for (let i =0; i < 3; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 100, 100, ${0.3 * pulseIntensity})`;
            ctx.lineWidth = 2;
            ctx.arc(centerX, centerY, coreSize - i * 8, 
                   rotationOffset + i * Math.PI / 4, 
                   rotationOffset + Math.PI * 1.5 + i * Math.PI / 4);
            ctx.stroke();
        }
        
        for (let i =0; i < 4; i++) {
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, coreSize * (1 - i * 0.2)
            );
            gradient.addColorStop(0, `rgba(255, 200, 200, ${(0.4 - i * 0.1) * pulseIntensity})`);
            gradient.addColorStop(0.5, `rgba(255, 50, 50, ${(0.2 - i * 0.05) * pulseIntensity})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(centerX, centerY, coreSize * (1 - i * 0.2), 0, Math.PI * 2);
            ctx.fill();
        }
        
        const particleCount = 8;
        for (let i =0; i < particleCount; i++) {
            const angle = (Date.now() / 1000 + i * (Math.PI * 2 / particleCount));
            const orbitRadius = coreSize * 0.7;
            const x = centerX + Math.cos(angle) * orbitRadius;
            const y = centerY + Math.sin(angle) * orbitRadius;
            
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * pulseIntensity})`;
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.lineWidth = LASER_BEAM_WIDTH;
        laserGrid.beams.forEach(beam => {
            let angle = laserGrid.angle + beam.angle;
            
            let gradient = ctx.createLinearGradient(
                centerX, centerY,
                centerX + Math.cos(angle) * diagonal,
                centerY + Math.sin(angle) * diagonal
            );
            
            gradient.addColorStop(0, `rgba(255, 50, 50, ${0.9 * pulseIntensity})`);
            gradient.addColorStop(0.2, `rgba(255, 200, 200, ${0.8 * pulseIntensity})`);
            gradient.addColorStop(0.5, `rgba(255, 50, 50, ${0.6 * pulseIntensity})`);
            gradient.addColorStop(0.8, `rgba(255, 200, 200, ${0.8 * pulseIntensity})`);
            gradient.addColorStop(1, `rgba(255, 50, 50, ${0.9 * pulseIntensity})`);
            
            for (let i =0; i < 3; i++) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 0, 0, ${0.1 * pulseIntensity})`;
                ctx.lineWidth = LASER_BEAM_WIDTH * (4 - i);
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + Math.cos(angle) * diagonal,
                    centerY + Math.sin(angle) * diagonal
                );
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = LASER_BEAM_WIDTH;
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * diagonal,
                centerY + Math.sin(angle) * diagonal
            );
            ctx.stroke();

            const particleCount = 5;
            for (let i =0; i < particleCount; i++) {
                const distance = (Date.now() / 1000 + i / particleCount) % 1;
                const x = centerX + Math.cos(angle) * diagonal * distance;
                const y = centerY + Math.sin(angle) * diagonal * distance;
                
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * pulseIntensity})`;
                ctx.arc(x, y, LASER_BEAM_WIDTH * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            if (LASER_GRID_DAMAGE && !ship.dead && !ship.explodeTime && !ship.invincible) {
                let points = [
                    {
                        x: ship.x + 4/3 * ship.radius * Math.cos(ship.angle),
                        y: ship.y - 4/3 * ship.radius * Math.sin(ship.angle)
                    },
                    {
                        x: ship.x - ship.radius * (2/3 * Math.cos(ship.angle) + Math.sin(ship.angle)),
                        y: ship.y + ship.radius * (2/3 * Math.sin(ship.angle) - Math.cos(ship.angle))
                    },
                    {
                        x: ship.x - ship.radius * (2/3 * Math.cos(ship.angle) - Math.sin(ship.angle)),
                        y: ship.y + ship.radius * (2/3 * Math.sin(ship.angle) + Math.cos(ship.angle))
                    }
                ];

                for (let point of points) {
                    let pointAngle = Math.atan2(point.y - centerY, point.x - centerX);
                    let angleDiff = Math.abs(normalizeAngle(pointAngle - angle));
                    let distanceToCenter = Math.sqrt(
                        Math.pow(point.x - centerX, 2) + 
                        Math.pow(point.y - centerY, 2)
                    );
                    
                    let beamWidth = LASER_BEAM_WIDTH * (0.1 + distanceToCenter / diagonal * 0.9);
                    
                    let beamAngleWidth = Math.atan2(beamWidth, distanceToCenter);
                    
                    let collisionThreshold = beamAngleWidth * 0.8;  
                    
                    if (angleDiff < collisionThreshold && distanceToCenter > 40) { 
                        let beamEndX = centerX + Math.cos(angle) * diagonal;
                        let beamEndY = centerY + Math.sin(angle) * diagonal;
                        
                        if (pointToLineDistance(point.x, point.y, centerX, centerY, beamEndX, beamEndY) < beamWidth) {
                            destroyShip();
                            break;
                        }
                    }
                }
            }
        
        });

        ctx.restore();
    }

    function normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    updateLaserGrid();

    if (enemyShipSpawnTime >0 && Date.now() >= enemyShipSpawnTime && !enemyShip) {
        createEnemyShip();
        enemyShipSpawnTime = 0; 
    }

    if (levelMessageTime > 0) {
        ctx.save();
        ctx.strokeStyle = "darkorange";
        ctx.lineWidth = 2;
        
        let baseScale = 20;
        let startScale = 1;
        let endScale = 15;
        let progress = (LEVEL_MESSAGE_DURATION - levelMessageTime) / LEVEL_MESSAGE_DURATION;
        levelMessageScale = startScale + (endScale - startScale) * progress;
        
        ctx.globalAlpha = Math.max(0, 1 - (progress * 1.5));
        
        let centerX = canv.width / 2;
        let centerY = canv.height / 2;
        
        LEVEL_MESSAGE_SEGMENTS.forEach(letter => {
            letter.forEach((point, index) => {
                if (index === 0) {
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + (point[0] - 6) * baseScale * levelMessageScale,
                        centerY + (point[1] - 1.5) * baseScale * levelMessageScale
                    );
                } else {
                    ctx.lineTo(
                        centerX + (point[0] - 6) * baseScale * levelMessageScale,
                        centerY + (point[1] - 1.5) * baseScale * levelMessageScale
                    );
                }
            });
            ctx.stroke();
        });
        
        const levelStr = level.toString();
        const digitWidth = baseScale * 1.2; 
        const totalWidth = levelStr.length * digitWidth;
        const startX = centerX + 6 * baseScale * levelMessageScale; 

        levelStr.split('').forEach((digit, index) => {
            const numberSegments = getNumberSegments(parseInt(digit));
            numberSegments.forEach(segment => {
                segment.forEach((point, i) => {
                    if (i === 0) {
                        ctx.beginPath();
                        ctx.moveTo(
                            startX + index * digitWidth * levelMessageScale + point[0] * baseScale * levelMessageScale,
                            centerY + (point[1] - 1.5) * baseScale * levelMessageScale
                        );
                    } else {
                        ctx.lineTo(
                            startX + index * digitWidth * levelMessageScale + point[0] * baseScale * levelMessageScale,
                            centerY + (point[1] - 1.5) * baseScale * levelMessageScale
                        );
                    }
                });
                ctx.stroke();
            });
        });
        
        ctx.restore();
        levelMessageTime--;
    }

    if (gameOverMessageTime > 0) {
        if (gameOverMessageTime === GAME_OVER_MESSAGE_DURATION) { 
            createGameOverSound();  
        }
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 4;
        
        let baseScale = 20;
        let startScale = 1;
        let endScale = 15;
        let progress = (GAME_OVER_MESSAGE_DURATION - gameOverMessageTime) / GAME_OVER_MESSAGE_DURATION;
        let scale = startScale + (endScale - startScale) * progress;
        
        let gameOverAlpha = Math.max(0, 1 - (progress * 1.5));
        ctx.globalAlpha = gameOverAlpha;
        
        let centerX = canv.width / 2;
        let centerY = canv.height / 2;
        
        GAME_OVER_SEGMENTS.forEach(segment => {
            segment.forEach((point, index) => {
                if (index ===0) {
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + (point[0] - 8) * baseScale * scale,
                        centerY + (point[1] - 1.25) * baseScale * scale
                    );
                } else {
                    ctx.lineTo(
                        centerX + (point[0] - 8) * baseScale * scale,
                        centerY + (point[1] - 1.25) * baseScale * scale
                    );
                }
            });
            ctx.stroke();
        });
        

        
        ctx.restore();
    }

    if (ship.dead) {
        const centerX = canv.width / 2;
        const centerY = canv.height / 2;
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`BASE SCORE: ${'\u20BF'}${formatScoreAsBTC(score)}`, centerX, centerY + 20);
        ctx.fillText(` + DISTANCE BONUS: ${'\u20BF'}${formatScoreAsBTC(Math.round(ship.distanceTravelled))}`, centerX, centerY + 40);
        ctx.fillText(` + VELOCITY BONUS: ${'\u20BF'}${formatScoreAsBTC(Math.round(ship.highestVelocity))}`, centerX, centerY + 60);
        ctx.fillText(` + LEVEL COMPLETION BONUS: ${'\u20BF'}${formatScoreAsBTC(Math.round((level - 1) *1000))}`, centerX, centerY + 80);
        let scorePlusBonuses = score + Math.round(ship.distanceTravelled) + Math.round(ship.highestVelocity) + ((level - 1) * 1000);
        ctx.fillText(`TOTAL SCORE: ${'\u20BF'}${formatScoreAsBTC(scorePlusBonuses)}`, centerX, centerY + 100);
        const accuracyRate = ship.shotsFired > 0 ? (ship.targetsHit / ship.shotsFired) : 0;
        const accuracyMultiplier = 0.5 + accuracyRate;
        adjustedScore = Math.floor(scorePlusBonuses * accuracyMultiplier);

        ctx.fillText(`ACCURACY RATE: ${Math.round(accuracyRate * 100)}%`, centerX, centerY + 120);
        ctx.fillText(`ACCURACY MULTIPLIER (0.5x - 1.5x): ${accuracyRate.toFixed(2) * 100} / 100 + 0.5 = ${accuracyMultiplier.toFixed(2)}x`, centerX, centerY + 140);

        ctx.font = "30px Arial";
        ctx.fillStyle = `rgba(255, 165, 0, 0.5)`;
        ctx.fillText(`FINAL SCORE: ${'\u20BF'}${formatScoreAsBTC(adjustedScore)}`, centerX, centerY + 200);

        if (canRestartGame) {
            ctx.font = "14px Arial";
            ctx.fillStyle = `orange`;
            ctx.fillText("PRESS ANY KEY TO CONTINUE OR", centerX, centerY - 50);
            ctx.fillText("PRESS SPACE TO RESTART", centerX, centerY - 25);
        }
    }

    explosionPulses = explosionPulses.filter(pulse => {
        if (pulse.time <= 0) return false;
        
        let progress = (PULSE_DURATION - pulse.time) / PULSE_DURATION;
        let size = pulse.initialSize + (pulse.maxSize - pulse.initialSize) * progress;
        let alpha = 0.3 * (1 - progress);
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(pulse.x, pulse.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        pulse.time--;
        return true;
    });

    if (bitcoinToken && !bitcoinToken.collected) {
        bitcoinToken.x += bitcoinToken.xv;
        bitcoinToken.y += bitcoinToken.yv;
        bitcoinToken.angle += BITCOIN_TOKEN_ROTATION_SPEED;

        if (bitcoinToken.x < 0) bitcoinToken.x = canv.width;
        if (bitcoinToken.x > canv.width) bitcoinToken.x = 0;
        if (bitcoinToken.y < 0) bitcoinToken.y = canv.height;
        if (bitcoinToken.y > canv.height) bitcoinToken.y = 0;

        const timeElapsed = Date.now() - bitcoinToken.spawnTime;
        const timeRemaining = bitcoinToken.duration - timeElapsed;
        const timePercentage = timeRemaining / bitcoinToken.duration;

        ctx.save();
        ctx.translate(bitcoinToken.x, bitcoinToken.y);
        ctx.rotate(bitcoinToken.angle);

        ctx.beginPath();
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        ctx.arc(0, 0, REPAIR_TOKEN_SIZE - 3, 0, Math.PI * 2 * timePercentage);
        ctx.stroke();

        ctx.beginPath();
        for (let i =0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const x = (REPAIR_TOKEN_SIZE / 1.5) * Math.cos(angle);
            const y = (REPAIR_TOKEN_SIZE / 1.5)* Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = "orange";
        ctx.font = `14px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("₿", 0, 0);

        ctx.restore();

        if (!ship.dead && !ship.explodeTime && 
            distBetweenPoints(ship.x, ship.y, bitcoinToken.x, bitcoinToken.y) < BITCOIN_COLLECT_RADIUS) {
            ship.bitcoinsCollected++;
            createCoinSound();
            bitcoinToken.collected = true;
            bitcoinReward = Math.floor(Math.random() * (MAX_BITCOIN_REWARD - MIN_BITCOIN_REWARD + 1) + MIN_BITCOIN_REWARD);
            score += bitcoinReward;
            bitcoinMessageTime = BITCOIN_COLLECT_MESSAGE_DURATION;
            bitcoinMessageScale = BITCOIN_MESSAGE_SCALE_START;
        }

        if (timeRemaining <= 0) {
            let particles = createExplosion(
                bitcoinToken.x,
                bitcoinToken.y,
                REPAIR_TOKEN_SIZE,
                'orange', 
                { x: bitcoinToken.xv, y: bitcoinToken.yv }
            );
            explosions.push({
                particles: particles,
                radius: REPAIR_TOKEN_SIZE
            });
            
            bitcoinToken = null;
        }
    }

    if (bitcoinMessageTime > 0) {
        ctx.save();
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        
        let baseScale = 20;
        let progress = (BITCOIN_COLLECT_MESSAGE_DURATION - bitcoinMessageTime) / BITCOIN_COLLECT_MESSAGE_DURATION;
        let scale = BITCOIN_MESSAGE_SCALE_START + 
            (BITCOIN_MESSAGE_SCALE_END - BITCOIN_MESSAGE_SCALE_START) * 
            Math.pow(progress, BITCOIN_MESSAGE_SCALE_SPEED);
        
        ctx.globalAlpha = Math.max(0, 1 - (Math.pow(progress, 0.7) * 1.2));
        
        let centerX = canv.width / 2;
        let centerY = canv.height / 3;
        
        BITCOIN_SYMBOL_SEGMENTS.forEach(segment => {
            segment.forEach((point, index) => {
                if (index === 0) {
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + (point[0] - 10) * baseScale * scale, 
                        centerY + (point[1] - 1.5) * baseScale * scale
                    );
                } else {
                    ctx.lineTo(
                        centerX + (point[0] - 10) * baseScale * scale, 
                        centerY + (point[1] - 1.5) * baseScale * scale
                    );
                }
            });
            ctx.stroke();
        });
        
        let rewardDigits = formatScoreAsBTC(bitcoinReward).toString().split('');
        let totalWidth = rewardDigits.length * 1.5;
        
        rewardDigits.forEach((digit, index) => {
            let xOffset = index;
            let segments;
            
            if (digit === '.') {
                segments = getNumberSegments('.');
            } else {
                segments = getNumberSegments(parseInt(digit));
            }

            if (segments) {
                segments.forEach(segment => {
                    segment.forEach((point, segIndex) => {
                        if (segIndex === 0) {
                            ctx.beginPath();
                            ctx.moveTo(
                                centerX + (point[0] + xOffset * 1.5 - totalWidth/2) * baseScale * scale,
                                centerY + (point[1] - 1.5) * baseScale * scale
                            );
                        } else {
                            ctx.lineTo(
                                centerX + (point[0] + xOffset * 1.5 - totalWidth/2) * baseScale * scale,
                                centerY + (point[1] - 1.5) * baseScale * scale
                            );
                        }
                    });
                    ctx.stroke();
                });
            }
        });
        
        ctx.restore();
        bitcoinMessageTime--;
    }

    if (Math.random() < POWER_UP_SPAWN_CHANCE && (!powerUpToken || powerUpToken.collected)) {
        createPowerUpToken();
    }

    if (powerUpToken && !powerUpToken.collected) {
        let timeElapsed = Date.now() - powerUpToken.spawnTime;
        if (timeElapsed >= powerUpToken.duration) {
            let particles = createExplosion(
                powerUpToken.x,
                powerUpToken.y,
                POWER_UP_SIZE,
                'lime',
                { x: powerUpToken.xv, y: powerUpToken.yv }
            );
            explosions.push({
                particles: particles,
                radius: POWER_UP_SIZE
            });
            
            powerUpToken.collected = true;
            ship.powerupsCollected++;
            return;
        }

        if (!ship.dead && !ship.explodeTime && 
            distBetweenPoints(ship.x, ship.y, powerUpToken.x, powerUpToken.y) < 
            (ship.radius + POWER_UP_COLLECT_RADIUS)) {
            
            applyPowerUp(powerUpToken.type);
            
            powerUpToken.collected = true;
            ship.powerupsCollected++;
            return;
        }

        powerUpToken.x += powerUpToken.xv;
        powerUpToken.y += powerUpToken.yv;

        if (powerUpToken.x < 0 - POWER_UP_SIZE) {
            powerUpToken.x = canv.width + POWER_UP_SIZE;
        } else if (powerUpToken.x > canv.width + POWER_UP_SIZE) {
            powerUpToken.x =0 - POWER_UP_SIZE;
        }
        if (powerUpToken.y < 0 - POWER_UP_SIZE) {
            powerUpToken.y = canv.height + POWER_UP_SIZE;
        } else if (powerUpToken.y > canv.height + POWER_UP_SIZE) {
            powerUpToken.y = 0 - POWER_UP_SIZE;
        }

        ctx.save();
        ctx.translate(powerUpToken.x, powerUpToken.y);
        ctx.rotate(powerUpToken.angle);
        
        let progress = 1 - (timeElapsed / powerUpToken.duration);
        ctx.beginPath();
        ctx.arc(0, 0, POWER_UP_SIZE / 2 + 3, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = "lime";
        ctx.beginPath();
        ctx.arc(0, 0, POWER_UP_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "black";
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("P", 0, 0);
        
        ctx.restore();
        
        powerUpToken.angle += POWER_UP_ROTATION_SPEED;
    }

    function createPowerUpToken() {
        let x, y;
        let spawnAttempts = 0;
        const MAX_SPAWN_ATTEMPTS = 10;

        do {
            x = Math.floor(Math.random() * canv.width);
            y = Math.floor(Math.random() * canv.height);
            spawnAttempts++;
            
            if (spawnAttempts >= MAX_SPAWN_ATTEMPTS) {
                x = canv.width * 0.75;
                y = canv.height * 0.75;
                break;
            }
        } while (distBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2);

        const powerUpTypes = Object.values(POWER_UP_TYPES);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

        powerUpToken = {
            x: x,
            y: y,
            xv: Math.random() * POWER_UP_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
            yv: Math.random() * POWER_UP_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
            angle: 0,
            collected: false,
            spawnTime: Date.now(),
            duration: 20000, 
            type: randomType
        };
    }

    function applyPowerUp(powerUpType) {
        ship.activePowerUps.set(powerUpType.id, Date.now() + powerUpType.duration);
        ship.lastPowerUp = powerUpType.name;
        ship.powerUpMessageTime = POWER_UP_MESSAGE_DURATION;
        createPowerUpSound();

        if (powerUpType.id === POWER_UP_TYPES.SHIELD.id && !isMuted) {
            shieldSound = createShieldDroneSound();
            if (shieldSound) {  
                const duration = powerUpType.duration;
                shieldSound.oscillators.forEach(osc => {
                    osc.stop(audioContext.currentTime + duration/1000);
                });
            }
        }
    }

    if (ship.powerUpMessageTime > 0) {
        ctx.fillStyle = "lime";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("POWER UP:", canv.width / 2, canv.height / 2 - 20);
        ctx.fillText(ship.lastPowerUp, canv.width / 2, canv.height / 2 + 20);
        ship.powerUpMessageTime--;
    }

    if (ship.activePowerUps.size > 0) {
        ctx.fillStyle = "lime";
        ctx.font = "16px Arial";
        ctx.textAlign = "right";
        
        let y = canv.height - 20;
        const now = Date.now();
        
        ship.activePowerUps.forEach((endTime, powerUpId) => {
            if (endTime > now) {
                const powerUpType = Object.values(POWER_UP_TYPES).find(type => type.id === powerUpId);
                const timeLeft = Math.ceil((endTime - now) / 1000);
                ctx.fillText(`${powerUpType.name}: ${timeLeft}s`, canv.width - 20, y);
                y -= 20;
            } else {
                ship.activePowerUps.delete(powerUpId);
            }
        });
    }

    if (enemyShip && !enemyShip.dead) {
        for (let i = enemyShip.lasers.length - 1; i >= 0; i--) {
            let laser = enemyShip.lasers[i];
            
            laser.x += laser.xv;
            laser.y += laser.yv;

            if (!ship.dead && !ship.explodeTime && !ship.invincible) {
                if (distBetweenPoints(laser.x, laser.y, ship.x, ship.y) < ship.radius) {
                    const hasShield = ship.activePowerUps.get(POWER_UP_TYPES.SHIELD.id) > Date.now();
                    
                    if (!hasShield) {
                        destroyShip();
                    }
                    
                    enemyShip.lasers.splice(i, 1);
                    continue;
                }
            }

            if (laser.x < 0 || laser.x > canv.width || laser.y < 0 || laser.y > canv.height) {
                enemyShip.lasers.splice(i, 1);
                continue;
            }
        }
    }

    if (ship.respawnEffect > 0) {
        ctx.save();
        
        const progress = ship.respawnEffect / RESPAWN_EFFECT_DURATION;
        const size = progress * RESPAWN_RING_MAX_SIZE; 
        const alpha = progress * 0.8; 
        
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 1.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
        ship.respawnEffect--;
    }

    if (!ship.dead) {
    }

    if (enemyShip && !enemyShip.dead) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        if (enemyShip.type === 'classic') {
            ctx.moveTo(
                enemyShip.x + 1.5 * enemyShip.radius * Math.cos(enemyShip.angle),
                enemyShip.y - 1.5 * enemyShip.radius * Math.sin(enemyShip.angle)
            );
            ctx.lineTo(
                enemyShip.x - enemyShip.radius * (Math.cos(enemyShip.angle) + Math.sin(enemyShip.angle)),
                enemyShip.y + enemyShip.radius * (Math.sin(enemyShip.angle) - Math.cos(enemyShip.angle))
            );
            ctx.lineTo(
                enemyShip.x - enemyShip.radius * (Math.cos(enemyShip.angle) - Math.sin(enemyShip.angle)),
                enemyShip.y + enemyShip.radius * (Math.sin(enemyShip.angle) + Math.cos(enemyShip.angle))
            );
        } else {
            ctx.arc(enemyShip.x, enemyShip.y - enemyShip.radius * 0.3, 
                enemyShip.radius * 0.4, Math.PI, 0);
            
            ctx.moveTo(enemyShip.x - enemyShip.radius, enemyShip.y);
            ctx.quadraticCurveTo(
                enemyShip.x, enemyShip.y + enemyShip.radius * 0.3,
                enemyShip.x + enemyShip.radius, enemyShip.y
            );
            
            ctx.quadraticCurveTo(
                enemyShip.x, enemyShip.y - enemyShip.radius * 0.1,
                enemyShip.x - enemyShip.radius, enemyShip.y
            );

            enemyShip.oscillateOffset += enemyShip.oscillateSpeed;
            enemyShip.y += Math.sin(enemyShip.oscillateOffset) * 0.5;
        }

        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = "red";
        ctx.lineWidth = 1.5;
        enemyShip.lasers.forEach(laser => {
            ctx.beginPath();
            ctx.arc(laser.x, laser.y, 2, 0, Math.PI * 2, false);
            ctx.stroke();
        });
    }

    if (enemyShip && !enemyShip.dead && !ship.dead && !ship.explodeTime && !ship.invincible) {
        if (distBetweenPoints(ship.x, ship.y, enemyShip.x, enemyShip.y) < ship.radius + enemyShip.radius) {
            const hasShield = ship.activePowerUps.has(POWER_UP_TYPES.SHIELD.id);
            
            if (hasShield) {
                enemyShip.dead = true;
                ship.enemyShipsDestroyed++;
                score += ENEMY_POINTS; 
                
                let particles = createExplosion(
                    enemyShip.x,
                    enemyShip.y,
                    enemyShip.radius,
                    'red',
                    { x: enemyShip.thrust ? enemyShip.thrust.x : 0, y: enemyShip.thrust ? enemyShip.thrust.y : 0 }
                );
                explosions.push({
                    particles: particles,
                    radius: enemyShip.radius
                });
            } else {
                destroyShip();
                enemyShip.dead = true;
                ship.enemyShipsDestroyed++;
                let particles = createExplosion(
                    enemyShip.x,
                    enemyShip.y,
                    enemyShip.radius,
                    'red',
                    { x: enemyShip.thrust ? enemyShip.thrust.x : 0, y: enemyShip.thrust ? enemyShip.thrust.y : 0 }
                );
                explosions.push({
                    particles: particles,
                    radius: enemyShip.radius
                });
            }
        }
    }

    if (laserGrid.active && !ship.dead && !ship.explodeTime && !ship.invincible) {
        const hasShield = ship.activePowerUps.get(POWER_UP_TYPES.SHIELD.id) > Date.now();
        
        for (let beam of laserGrid.beams) {
            const startX = canv.width / 2;
            const startY = canv.height / 2;
            const angle = beam.angle + laserGrid.angle;
            
            const endX = startX + Math.cos(angle) * (Math.max(canv.width, canv.height) * 2);
            const endY = startY + Math.sin(angle) * (Math.max(canv.width, canv.height) * 2);
            
            const dx = endX - startX;
            const dy = endY - startY;
            const shipDx = ship.x - startX;
            const shipDy = ship.y - startY;
            
            const dot = shipDx * dx + shipDy * dy;
            const lenSq = dx * dx + dy * dy;
            const param = lenSq !== 0 ? dot / lenSq : -1;
            
            let closestX, closestY;
            
            if (param < 0) {
                closestX = startX;
                closestY = startY;
            } else if (param > 1) {
                closestX = endX;
                closestY = endY;
            } else {
                closestX = startX + param * dx;
                closestY = startY + param * dy;
            }
            
            const distance = distBetweenPoints(ship.x, ship.y, closestX, closestY);
            
            if (distance <= ship.radius) {
                if (!hasShield) {
                    destroyShip();
                }
                break;
            }
        }
    }

    if (powerUpToken && !powerUpToken.collected && 
        distBetweenPoints(ship.x, ship.y, powerUpToken.x, powerUpToken.y) < POWER_UP_COLLECT_RADIUS) {
        createPowerUpSound(); 
        powerUpToken.collected = true;
        ship.powerupsCollected++;
    }

    if (shieldSound && !ship.activePowerUps.has(POWER_UP_TYPES.SHIELD.id)) {
        shieldSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        shieldSound = null;
    }

    const LIFE_ICON_SIZE = 10;
    const LIFE_ICON_SPACING = 25;
    const LIFE_ICON_MARGIN = 20;
    
    for (let i = 0; i < ship.lives; i++) {
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        const x = canv.width - LIFE_ICON_MARGIN - (LIFE_ICON_SPACING * i);
        const y = LIFE_ICON_MARGIN;
        
        ctx.moveTo( 
            x,
            y - LIFE_ICON_SIZE
        );
        ctx.lineTo( 
            x - LIFE_ICON_SIZE * 0.8,
            y + LIFE_ICON_SIZE
        );
        ctx.lineTo( 
            x + LIFE_ICON_SIZE * 0.8,
            y + LIFE_ICON_SIZE
        );
        ctx.closePath();
        ctx.stroke();
    }

    if (ship.dead && !isWelcomeScreen) {
        const centerX = canv.width / 2;
        const centerY = canv.height / 2;

        if (gameOverMessageTime > 0) { 
            ctx.save();
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            
            let baseScale = 20;
            let startScale = 1;
            let endScale = 15;
            let progress = (GAME_OVER_MESSAGE_DURATION - gameOverMessageTime) / GAME_OVER_MESSAGE_DURATION;
            let scale = startScale + (endScale - startScale) * progress;
            
            let gameOverAlpha = Math.max(0, 1 - (progress * 1.5));
            ctx.globalAlpha = gameOverAlpha;
            
            GAME_OVER_SEGMENTS.forEach(segment => {
                segment.forEach((point, index) => {
                    if (index === 0) {
                        ctx.beginPath();
                        ctx.moveTo(
                            centerX + (point[0] - 8) * baseScale * scale,
                            centerY + (point[1] - 1.25) * baseScale * scale
                        );
                    } else {
                        ctx.lineTo(
                            centerX + (point[0] - 8) * baseScale * scale,
                            centerY + (point[1] - 1.25) * baseScale * scale
                        );
                    }
                });
                ctx.stroke();
            });
            
            ctx.restore();
            gameOverMessageTime--;
        }
    }

    const shipVelocity = Math.sqrt(Math.pow(ship.thrust.x, 2) + Math.pow(ship.thrust.y, 2)) * FPS;
    if (shipVelocity > ship.highestVelocity) {
        ship.highestVelocity = shipVelocity;
    }
}

function destroyShip() {
    ctx.globalCompositeOperation = 'source-over'; 
    
    ship.thrusting = false;
    ship.rotation = 0;  
    
    ship.particles = createExplosion(
        ship.x, 
        ship.y, 
        ship.radius,
        'white',
        { x: ship.thrust.x, y: ship.thrust.y }
    );
    
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
    ship.lives--;
    
    ship.activePowerUps.clear();
    
    if (ship.lives === 0) {
        ship.dead = true;
        ship.thrust.x = 0; 
        ship.thrust.y = 0;
        gameOverMessageTime = GAME_OVER_MESSAGE_DURATION;
        setTimeout(() => {
            canRestartGame = true; 
            updateHighScores(adjustedScore);
            topScores.sort((a, b) => b - a);
            topScores = topScores.slice(0, 10);
            while (topScores.length < 10) {
                topScores.push(0);
            }
        }, GAME_OVER_MESSAGE_DURATION * (1000/60));
    }
    stopThrustSound();
}

function respawnShip() {
    let safeSpawn = false;
    let attempts = 0;
    let newX, newY;
    const MAX_ATTEMPTS = 50;

    while (!safeSpawn && attempts < MAX_ATTEMPTS) {
        newX = Math.random() * (canv.width - 100) + 50;
        newY = Math.random() * (canv.height - 100) + 50;
        safeSpawn = true;

        for (let asteroid of asteroids) {
            if (distBetweenPoints(newX, newY, asteroid.x, asteroid.y) < SPAWN_SAFE_DISTANCE) {
                safeSpawn = false;
                break;
            }
        }

        if (safeSpawn && isSpecialLevel && specialLevelType === 'BLACK_HOLE' && window.blackHole) {
            if (distBetweenPoints(newX, newY, window.blackHole.x, window.blackHole.y) < SPAWN_SAFE_DISTANCE * 2) {
                safeSpawn = false;
            }
        }

        if (safeSpawn && enemyShip && !enemyShip.dead) {
            if (distBetweenPoints(newX, newY, enemyShip.x, enemyShip.y) < SPAWN_SAFE_DISTANCE) {
                safeSpawn = false;
            }
        }

        attempts++;
    }

    if (!safeSpawn) {
        newX = canv.width / 2;
        newY = canv.height /2;
    }

    ship.x = newX;
    ship.y = newY;
    ship.prevX = newX;
    ship.prevY = newY;
    ship.renderX = newX;
    ship.renderY = newY;
    ship.thrust.x = 0;
    ship.thrust.y = 0;
    ship.rotation = 0; 
    ship.explodeTime = 0;
    ship.dead = false;
    ship.invincible = true;
    ship.invincibleEndTime = Date.now() + SPAWN_PROTECTION_TIME;
    ship.respawnEffect = RESPAWN_EFFECT_DURATION;
}

function createPulseEffect(x, y, radius) {
    if (radius === MONSTER_ASTEROID_SIZE) {
        screenShake = 25;
        distortionTime = 60;
    } else if (radius >= ASTEROID_SIZE / 2) {
        screenShake = 10;
        distortionTime = 30;
    }
}

function checkForMalfunction(malfunctionChance) {
    if (Math.random() < malfunctionChance) {
        const malfunctionKeys = Object.values(MALFUNCTION_TYPES);
        return MALFUNCTION_TYPES[malfunctionKeys[Math.floor(Math.random() * malfunctionKeys.length)]];
    }
    return null;
}

function createRepairToken() {
    if (currentMalfunctions.size > 0) {
        let x, y;
        let spawnAttempts =0;
        const MAX_SPAWN_ATTEMPTS = 10;

        do {
            x = Math.floor(Math.random() * canv.width);
            y = Math.floor(Math.random() * canv.height);
            spawnAttempts++;
            
            if (spawnAttempts >= MAX_SPAWN_ATTEMPTS) {
                x = canv.width * 0.75;
                y = canv.height * 0.75;
                break;
            }
        } while (distBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2);

        repairToken = {
            x: x,
            y: y,
            xv: Math.random() * REPAIR_TOKEN_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
            yv: Math.random() * REPAIR_TOKEN_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
            angle: 0,
            collected: false,
            spawnTime: Date.now(),
            duration: 20000 
        };

    }
}

function createParticle() {
    return {
        x: Math.random() * canv.width, 
        y: Math.random() * canv.height,
        size: Math.random() * 5 + 2, 
        alpha: 1, 
        vx: (Math.random() - 0.5) * 2, 
        vy: (Math.random() - 0.5) * 2, 
        decay: Math.random() * 0.02 + 0.01
    };
}

function createExplosionParticles(x, y, count) {
    for (let i =0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 2 + 1; 
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed, 
            vy: Math.sin(angle) * speed, 
            size: 1, 
            alpha: 1,
            decay: Math.random() * 0.02 + 0.01 
        });
    }
}

function initializeWelcomeAsteroids(count) {
    for (let i =0; i < count; i++) {
        let asteroidX = Math.random() * canv.width; 
        let asteroidY = Math.random() * canv.height; 
        let asteroidSize = Math.ceil(ASTEROID_SIZE / 2);
        let asteroid = newAsteroid(asteroidX, asteroidY, asteroidSize); 
        
        asteroid.angleOfMovement = Math.random() * Math.PI * 2;
        asteroid.speed = Math.random() * 0.03 + 0.5;

        welcomeAsteroids.push(asteroid); 
    }
}

function drawWelcomeScreen() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);

    nebulaClouds.forEach(cloud => {
        cloud.x -= ship.thrust.x * NEBULA_SPEED_MULT;
        cloud.y -= ship.thrust.y * NEBULA_SPEED_MULT;

        cloud.x += Math.cos(cloud.drift) * 0.2;
        cloud.y += Math.sin(cloud.drift) * 0.2;
        cloud.drift += 0.001;

        if (cloud.x + cloud.radius < 0) cloud.x = canv.width + cloud.radius;
        if (cloud.x - cloud.radius > canv.width) cloud.x = -cloud.radius;
        if (cloud.y + cloud.radius < 0) cloud.y = canv.height + cloud.radius;
        if (cloud.y - cloud.radius > canv.height) cloud.y = -cloud.radius;

        let gradient = ctx.createRadialGradient(
            cloud.x, cloud.y, 0,
            cloud.x, cloud.y, cloud.radius
        );

        gradient.addColorStop(0, `hsla(${cloud.hue}, 90%, 50%, ${cloud.alpha * 1.2})`);
        gradient.addColorStop(0.4, `hsla(${cloud.hue}, 80%, 40%, ${cloud.alpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        cloud.hue = (cloud.hue + 0.2) % 360;
    });

    starLayers.forEach((layer, layerIndex) => {
        let parallaxSpeed = (layerIndex + 1) * STARS_SPEED_MULT;

        layer.forEach(star => {
            star.x -= parallaxSpeed;

            if (star.x < 0) star.x = canv.width; 

            ctx.globalAlpha = 0.5;
            ctx.fillStyle = `rgb(255, 255, ${255 - layerIndex * 30})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2); 
            ctx.fill();
        });
    });

    welcomeAsteroids.forEach(asteroid => {
        asteroid.x += Math.cos(asteroid.angleOfMovement) * asteroid.speed;
        asteroid.y += Math.sin(asteroid.angleOfMovement) * asteroid.speed;

        if (asteroid.x < -asteroid.radius) {
            asteroid.x = canv.width + asteroid.radius; 
        } else if (asteroid.x > canv.width + asteroid.radius) {
            asteroid.x = -asteroid.radius; 
        }
        if (asteroid.y < -asteroid.radius) {
            asteroid.y = canv.height + asteroid.radius; 
        } else if (asteroid.y > canv.height + asteroid.radius) {
            asteroid.y = -asteroid.radius; 
        }

        asteroid.angle += 0.001; 

        ctx.save();
        ctx.translate(asteroid.x, asteroid.y); 
        ctx.rotate(asteroid.angle); 
        ctx.strokeStyle = "white"; 
        ctx.lineWidth = 2;
        ctx.beginPath();

        ctx.moveTo(
            0 + asteroid.radius * asteroid.offsets[0] * Math.cos(asteroid.angle),
            0 + asteroid.radius * asteroid.offsets[0] * Math.sin(asteroid.angle)
        );

        for (let j =1; j < asteroid.vertices; j++) {
            ctx.lineTo(
                0 + asteroid.radius * asteroid.offsets[j] * Math.cos(asteroid.angle + j * Math.PI * 2 / asteroid.vertices),
                0 + asteroid.radius * asteroid.offsets[j] * Math.sin(asteroid.angle + j * Math.PI * 2 / asteroid.vertices)
            );
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    });

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, canv.height / 2 - 40, canv.width / 2, canv.height / 2 + 40);

    ctx.fillStyle = "orange";
    ctx.textAlign = "left";
    ctx.font = "14px Arial";
    ctx.fillText("CONTROLS:", canv.width / 1.55 + 50, canv.height / 2);
    ctx.fillStyle = "#FFFFFF";
    const placeholderText2 = "◀ - ROTATE SHIP LEFT\n▶ - ROTATE SHIP RIGHT\n▲ - THRUST\nSPACE - SHOOT";
    wrapText(ctx, placeholderText2, canv.width / 1.55 + 50, canv.height / 2 + 20, canv.width /2 - 160, 20);

    ctx.fillStyle = "orange";
    ctx.textAlign = "left";
    ctx.font = "14px Arial";
    ctx.fillText("OTHER CONTROLS:", canv.width / 1.55 + 50, canv.height / 2 + 120);
    ctx.fillStyle = "#FFFFFF";
    const placeholderText3 = "P - PAUSE ON / OFF\nF - FULLSCREEN ON / OFF\nS - STATS ON / OFF\n";
    wrapText(ctx, placeholderText3, canv.width / 1.55 + 50, canv.height / 2 + 140, canv.width /2 - 160, 20);

    ctx.fillStyle = "orange";
    ctx.fillText("HIGH SCORES:", canv.width / 1.2 + 40, canv.height / 2);
    ctx.fillStyle = "#FFFFFF";
    topScores.forEach((score, index) => {
        ctx.fillText(`${index + 1}. ₿${formatScoreAsBTC(score)}`, canv.width /1.2 + 40, canv.height / 2 + 20 + index * 20);
    });

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(canv.width /2, canv.height / 2 - 40, canv.width / 2, canv.height / 2 + 40);

    ctx.fillStyle = "rgba(255, 165, 0, 0.7)";
    ctx.textAlign = "left";
    ctx.fillText("TL;DR - SHOOT STUFF. EARN SATS. DON'T DIE.", canv.width /10 - 80, canv.height / 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const placeholderText = "IN THE YEAR 2148, HUMANITY'S RELATIONSHIP WITH RESOURCES HAS BEEN COMPLETELY TRANSFORMED. ONCE VALUABLE METALS, GEMS, AND RARE EARTH MINERALS NOW EXIST IN SUCH ABUNDANCE THAT THEIR VALUE HAS COLLAPSED. OFF-WORLD INDUSTRIAL-SCALE MINING HAS USHERED IN A NEW ERA WHERE THE ONLY TRUE SCARCITY IS DIGITAL. IN THIS AGE, BITCOIN REIGNS SUPREME AS THE ULTIMATE STORE OF VALUE.\n\nWITH EARTH'S RESOURCES MINISCULE IN COMPARISON, BITCOIN MINING HAS SHIFTED TO UNINHABITABLE PLANETS, WHERE MASSIVE ASIC FARMS COMPETE SOLELY FOR TRANSACTION FEES—THE BLOCK SUBSIDY'S FINAL SATOSHI WAS MINED EIGHT YEARS AGO. THESE PLANETS, RICH IN METHANE, GEOTHERMAL, AND OTHER RENEWABLE ENERGY SOURCES, POWER THE NETWORK BUT FACE RELENTLESS THREATS FROM ASTEROID IMPACTS.\n\nAS A PILOT FOR A SMALL MINING STARTUP ON A BLEAK MOON ORBITING A LIFELESS PLANET, YOUR MISSION IS TO DESTROY INCOMING ASTEROIDS AND PROTECT THE HASHRATE. THE RESOURCES IN THESE ASTEROIDS, ONCE PRICELESS, ARE NOW SACRIFICED TO DEFEND THE NETWORK AND PRESERVE THE HARDEST MONEY IN THE GALAXY.\n\nBUT THE THREATS DON'T END THERE. HASH PIRATES—ROGUE OPERATORS SEEKING TO HIJACK HASHRATE—AND FORKLINGS, MYSTERIOUS ENTITIES DRIVEN TO FRACTURE THE NETWORK, WILL RELENTLESSLY TEST YOUR RESOLVE, ALONG WITH OTHER DANGERS. COLLECT POWER-UPS FOR TEMPORARY ADVANTAGES, SALVAGE SPARE PARTS TO KEEP YOUR SHIP RUNNING, AND RECOVER SEED PLATES—INDESTRUCTIBLE KEYS TO LOST WALLETS LEFT BEHIND BY FALLEN PILOTS. WILL YOU RISE TO THE CHALLENGE AND DEFEND THE HASHRATE?";
    wrapText(ctx, placeholderText, canv.width /10 - 80, canv.height / 2 + 20, canv.width /2 + 80 , 20);

    const title = "HASHTEROIDS";
    const baseScale = 40;
    const letterSpacing = 1.5;
    const startX = canv.width / 2 - (title.length * letterSpacing * baseScale) / 2;
    const startY = canv.height / 6;
    
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 2;
    
    title.split('').forEach((letter, index) => {
        const time = Date.now() / 1000; 
        const offsetY = Math.sin(time * 2 + index * 0.3) * 10;
        const segments = TITLE_LETTERS[letter];
        
        if (segments) {
            segments.forEach(segment => {
                ctx.beginPath();
                segment.forEach((point, i) => {
                    const x = startX + (index * letterSpacing + point[0]) * baseScale;
                    const y = startY + point[1] * baseScale + offsetY;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                ctx.stroke();
            });
        }
    });

    ctx.font = "14px Arial";
    ctx.fillStyle = "darkgray";
    ctx.textAlign = "center";
    const bylineX = canv.width / 2;
    const bylineY = canv.height /2 - 120;
    ctx.fillText("BY BXL909 (BXL909.GITHUB.IO)", bylineX, bylineY);
    ctx.font = "14px Arial";
    ctx.fillStyle = "orange";
    ctx.textAlign = "center";
    ctx.fillText("PRESS SPACE TO START", bylineX, bylineY + 26);

    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(255, 165, 0, 0.7)";
    ctx.fillText("LEGEND:", canv.width / 1.55 + 50, canv.height / 2 + 220);

    ctx.save();
    ctx.translate(canv.width / 1.55 + 65, canv.height / 2 + 240);
    ctx.fillStyle = "lime";
    ctx.beginPath();
    ctx.arc(0, 0, POWER_UP_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("P", 0, 0);
    ctx.restore();
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.textAlign = "left";
    ctx.font = "14px Arial";
    ctx.fillText("RANDOM POWER UP", canv.width / 1.55 + 90, canv.height / 2 + 245);

    ctx.save();
    ctx.translate(canv.width / 1.55 + 65, canv.height / 2 + 270);
    ctx.fillStyle = "magenta";
    ctx.beginPath();
    ctx.arc(0, 0, POWER_UP_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S", 0, 0);
    ctx.restore();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "14px Arial";
    ctx.fillText("SPARE PARTS", canv.width / 1.55 + 90, canv.height / 2 + 275);

    ctx.save();
    ctx.translate(canv.width / 1.55 + 65, canv.height / 2 + 300);
    ctx.beginPath();
    for (let i =0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const x = (REPAIR_TOKEN_SIZE / 1.5) * Math.cos(angle);
        const y = (REPAIR_TOKEN_SIZE / 1.5) * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "orange";
    ctx.stroke();
    
    ctx.fillStyle = "orange";
    ctx.font = `14px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("₿", 0, 0);
    ctx.restore();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "14px Arial";
    ctx.fillText("LOST SEED PLATE", canv.width / 1.55 + 90, canv.height / 2 + 305);

    const legendShipSize = ENEMY_SHIP_SIZE * 0.45;
    let legendY = canv.height / 2 + 330;
    
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const classicX = canv.width / 1.55 + 65;
    ctx.moveTo(
        classicX + legendShipSize * Math.cos(0),
        legendY + legendShipSize * Math.sin(0)
    );
    ctx.lineTo(
        classicX - legendShipSize * (Math.cos(0) + Math.sin(0)),
        legendY + legendShipSize * (Math.sin(0) - Math.cos(0))
    );
    ctx.lineTo(
        classicX - legendShipSize * (Math.cos(0) - Math.sin(0)),
        legendY + legendShipSize * (Math.sin(0) + Math.cos(0))
    );
    ctx.closePath();
    ctx.stroke();
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.textAlign = "left";
    ctx.fillText("HASH PIRATES", canv.width / 1.55 + 90, legendY + 5);
    
    legendY += 30;
    const saucerX = canv.width / 1.55 + 65;
    
    ctx.beginPath();
    ctx.moveTo(saucerX - legendShipSize, legendY);
    ctx.quadraticCurveTo(
        saucerX, legendY + legendShipSize * 0.3,
        saucerX + legendShipSize, legendY
    );
    ctx.quadraticCurveTo(
        saucerX, legendY - legendShipSize * 0.1,
        saucerX - legendShipSize, legendY
    );
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(saucerX, legendY - legendShipSize * 0.3, 
        legendShipSize * 0.4, Math.PI, 0);
    ctx.stroke();
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("FORKLINGS", canv.width / 1.55 + 90, legendY + 5);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const lines = text.split('\n'); 
    lines.forEach(line => {
        const words = line.split(' ');
        let currentLine = '';
        for (let n =0; n < words.length; n++) {
            const testLine = currentLine + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n >0) {
                context.fillText(currentLine, x, y);
                currentLine = words[n] + ' ';
                y += lineHeight;
            } else {
                currentLine = testLine;
            }
        }
        context.fillText(currentLine, x, y);
        y += lineHeight; 
    });
}

initializeWelcomeAsteroids(0);

document.addEventListener("keydown", (ev) => {
    if (ev.keyCode === 32) { // spacebar
        ev.preventDefault();
    }

    if (isWelcomeScreen && ev.keyCode === 32) { 
        isWelcomeScreen = false;
        score = 0; 
        level = 1; 
        levelMessageTime = LEVEL_MESSAGE_DURATION;
        createLevelAnnouncementSound(); 
        currentMalfunctions.clear(); 
        ship.lives = GAME_LIVES; 
        ship.dead = false; 
        createAsteroidBelt();
        requestAnimationFrame(gameLoop);
    } else if (ev.key.toLowerCase() === 'f') {
        toggleFullscreen();
    } else if (ev.key.toLowerCase() === 's') {
        isStatsHidden = !isStatsHidden;
        localStorage.setItem(STATS_STORAGE_KEY, isStatsHidden);
    } else {
        keyDown(ev); 
    }
});

function drawPauseScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canv.width, canv.height);
    
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canv.width / 2, canv.height / 2 - 20);
    
    ctx.font = "20px Arial";
    ctx.fillText("Press P to Resume", canv.width / 2, canv.height / 2 + 20);
    
    drawMuteButton();
}

async function fetchBlockHeight() {
    try {
        const response = await fetch('https://mempool.space/api/blocks/tip/height');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const blockHeight = await response.text();
        document.getElementById('blockHeight').textContent = blockHeight;
    } catch (error) {
        console.error('Error fetching block height:', error);
    }
}

window.onload = fetchBlockHeight;

function getNumberSegments(num) {
    const NUMBERS = {
        0: [[[0,0], [1,0], [1,3], [0,3], [0,0]]],
        1: [[[0.5,0], [0.5,3]]],
        2: [[[0,0], [1,0], [1,1.5], [0,1.5], [0,3], [1,3]]],
        3: [[[0,0], [1,0], [1,1.5], [0,1.5], [1,1.5], [1,3], [0,3]]],
        4: [[[0,0], [0,1.5], [1,1.5], [1,0], [1,3]]],
        5: [[[1,0], [0,0], [0,1.5], [1,1.5], [1,3], [0,3]]],
        6: [[[1,0], [0,0], [0,3], [1,3], [1,1.5], [0,1.5]]],
        7: [[[0,0], [1,0], [1,3]]],
        8: [[[0,0], [1,0], [1,3], [0,3], [0,0], [0,1.5], [1,1.5]]],
        9: [[[0,0], [1,0], [1,3]], [[0,0], [0,1.5], [1,1.5]]],
        '.': [[[0.4,2.8], [0.4,3], [0.6,3], [0.6,2.8], [0.4,2.8]]],
    };
    
    if (num === '.') return NUMBERS['.'];
    return NUMBERS[num] || NUMBERS[0];
}

function createExplosionPulse(x, y, asteroidSize) {
    explosionPulses.push({
        x: x,
        y: y,
        size: asteroidSize,
        time: PULSE_DURATION,
        maxSize: MAX_PULSE_SIZE,
        initialSize: asteroidSize
    });
}

function formatScoreAsBTC(sats) {
    return (sats / 100000000).toFixed(8);
}

const TITLE_LETTERS = {
    'H': [[[0,0], [0,3]], [[0,1.5], [1,1.5]], [[1,0], [1,3]]],
    'A': [[[0,3], [0.5,0], [1,3]], [[0.2,2], [0.8,2]]],
    'S': [[[1,0], [0,0], [0,1.5], [1,1.5], [1,3], [0,3]]],
    'T': [[[0.5,0], [0.5,3]], [[0,0], [1,0]]],
    'E': [[[1,0], [0,0], [0,3], [1,3]], [[0,1.5], [0.8,1.5]]],
    'R': [[[0,3], [0,0], [1,0], [1,1.5], [0,1.5], [1,3]]],
    'O': [[[0,0], [1,0], [1,3], [0,3], [0,0]]],
    'I': [[[0,0], [1,0]], [[0.5,0], [0.5,3]], [[0,3], [1,3]]],
    'D': [[[0,0], [0.8,0], [1,0.5], [1,2.5], [0.8,3], [0,3], [0,0]]]
};

const ENEMY_LASER_HIT_RADIUS = 3;
const SHIP_COLLISION_RADIUS = ship.radius *0.9; 

if (enemyShip && !enemyShip.dead) {
    for (let i = enemyShip.lasers.length - 1; i >=0; i--) {
        let laser = enemyShip.lasers[i];
        
        let prevX = laser.x - laser.xv;
        let prevY = laser.y - laser.yv;
        
        laser.x += laser.xv;
        laser.y += laser.yv;

        if (!ship.dead && !ship.explodeTime && !ship.invincible) {
            let hitDist = distBetweenPoints(laser.x, laser.y, ship.x, ship.y);
            let lineHit = lineCircleCollision(
                prevX, prevY, 
                laser.x, laser.y, 
                ship.x, ship.y, 
                SHIP_COLLISION_RADIUS
            );

            if (hitDist < SHIP_COLLISION_RADIUS + ENEMY_LASER_HIT_RADIUS || lineHit) {
                const hasShield = ship.activePowerUps.get(POWER_UP_TYPES.SHIELD.id) > Date.now();
                
                if (!hasShield) {
                    destroyShip();
                }
                
                enemyShip.lasers.splice(i, 1);
                continue;
            }
        }

        if (laser.x < 0 || laser.x > canv.width || laser.y < 0 || laser.y > canv.height) {
            enemyShip.lasers.splice(i, 1);
            continue;
        }
    }
}

function lineCircleCollision(x1, y1, x2, y2, cx, cy, r) {
    let dx = cx - x1;
    let dy = cy - y1;
    
    let lineDx = x2 - x1;
    let lineDy = y2 - y1;
    
    let lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
    
    if (lineLength > 0) {
        lineDx /= lineLength;
        lineDy /= lineLength;
    }
    
    let projection = dx * lineDx + dy * lineDy;
    
    let closestX, closestY;
    
    if (projection < 0) {
        closestX = x1;
        closestY = y1;
    } else if (projection > lineLength) {
        closestX = x2;
        closestY = y2;
    } else {
        closestX = x1 + projection * lineDx;
        closestY = y1 + projection * lineDy;
    }
    
    return distBetweenPoints(closestX, closestY, cx, cy) <= r;
}

function drawShieldEffect() {
    if (!ship.activePowerUps.has(POWER_UP_TYPES.SHIELD.id)) return;
    
    const centerX = ship.renderX + ship.radius * 0.3 * Math.cos(ship.angle);
    const centerY = ship.renderY - ship.radius * 0.3 * Math.sin(ship.angle);
    
    const pulseTime = Date.now() / 200;
    const pulseOpacity = (Math.sin(pulseTime * 1.5) * 0.3 + 0.7);
    
    ctx.save(); 
    
    ctx.strokeStyle = `rgba(100, 200, 255, ${0.8 * pulseOpacity})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ship.radius * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    
    const gradient = ctx.createRadialGradient(
        centerX, centerY, ship.radius * 1.3,
        centerX, centerY, ship.radius * 2
    );
    gradient.addColorStop(0, "rgba(100, 200, 255, 0.1)");
    gradient.addColorStop(0.3, "rgba(150, 220, 255, 0.08)");
    gradient.addColorStop(0.6, "rgba(200, 240, 255, 0.05)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ship.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    const rippleCount = 3;
    for (let i =0; i < rippleCount; i++) {
        const rippleOffset = (Date.now() / 1000 + i / rippleCount) %1;
        const rippleRadius = ship.radius * (1.3 + rippleOffset * 0.7);
        const rippleOpacity = 0.3 * (1 - rippleOffset);
        
        ctx.strokeStyle = `rgba(150, 220, 255, ${rippleOpacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.restore();
}

const FULLSCREEN_PADDING = 20;
let isFullscreen = false;

function resizeCanvas() {
    if (isFullscreen) {
        canv.width = window.innerWidth - FULLSCREEN_PADDING;
        canv.height = window.innerHeight - FULLSCREEN_PADDING;
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        isFullscreen = false;
        canv.width = 1500;
        canv.height = 900;
    }
});

window.addEventListener('resize', () => {
    if (isFullscreen) {
        resizeCanvas();
    }
});

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        canv.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);}
        );
    } else {
        document.exitFullscreen().catch(err => {
            console.error('Error attempting to exit fullscreen:', err);
        });
    }
}

document.addEventListener("keydown", function(ev) {
    if (ev.key.toLowerCase() === 'p' && !isWelcomeScreen) {
        isPaused = !isPaused;
    }
});

let audioContext = null;

document.addEventListener('click', initAudio);
document.addEventListener('keydown', initAudio);

function createPowerUpSound() {
    if (!isMuted) {
        if (!audioContext) return;
        
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.type = 'triangle';
        oscillator2.type = 'triangle';
        
        const currentTime = audioContext.currentTime;
        
        oscillator1.frequency.setValueAtTime(220, currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(880, currentTime + 0.2);
        
        oscillator2.frequency.setValueAtTime(330, currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(1320, currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.05); 
        gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.2); 
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        
        oscillator1.start(currentTime);
        oscillator2.start(currentTime);
        oscillator1.stop(currentTime + 0.3);
        oscillator2.stop(currentTime + 0.3);
    }
}

function createLaserSound() {
    if (!isMuted) {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const currentTime = audioContext.currentTime;
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.1);
    }
}

function createCoinSound() {
    if (!isMuted) {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const currentTime = audioContext.currentTime;
        
        oscillator.type = 'sine';
        
        oscillator.frequency.setValueAtTime(987.77, currentTime);
        oscillator.frequency.setValueAtTime(1318.51, currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.3);
    }
}

function createExplosionSound(size) {
    if (!isMuted) {
        if (!audioContext) return;

        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        const currentTime = audioContext.currentTime;

        const bufferSize = audioContext.sampleRate * 0.5; 
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() *2 - 1) * (1 - i / bufferSize);
        }

        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        noiseSource.connect(gainNode);

        oscillator1.type = 'sawtooth';
        oscillator2.type = 'triangle';

        const baseFreq = size === MONSTER_ASTEROID_SIZE ? 40 : 80;
        oscillator1.frequency.setValueAtTime(baseFreq, currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(baseFreq / 3, currentTime + 1);

        oscillator2.frequency.setValueAtTime(baseFreq * 1.5, currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(baseFreq / 4, currentTime + 1.2);

        const volume = size === MONSTER_ASTEROID_SIZE ? 0.5 : 0.2;
        gainNode.gain.setValueAtTime(volume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.2);

        noiseSource.start(currentTime);
        oscillator1.start(currentTime);
        oscillator2.start(currentTime);

        noiseSource.stop(currentTime + 0.5);
        oscillator1.stop(currentTime + 1.2);
        oscillator2.stop(currentTime + 1.2);
    }
}

function createRepairSound() {
    ship.repairsCollected++;
    if (!isMuted) {
        if (!audioContext) return;
        
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        const currentTime = audioContext.currentTime;
        
        oscillator1.frequency.setValueAtTime(440, currentTime);
        oscillator1.frequency.linearRampToValueAtTime(880, currentTime + 0.15);
        oscillator1.frequency.linearRampToValueAtTime(440, currentTime + 0.3);
        
        oscillator2.frequency.setValueAtTime(554.37, currentTime);
        oscillator2.frequency.linearRampToValueAtTime(1108.74, currentTime + 0.15);
        oscillator2.frequency.linearRampToValueAtTime(554.37, currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.25);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.3);
        
        oscillator1.start(currentTime);
        oscillator2.start(currentTime);
        oscillator1.stop(currentTime + 0.3);
        oscillator2.stop(currentTime + 0.3);
    }
}

function createLevelAnnouncementSound() {
    if (!isMuted) {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error('Failed to create audio context:', e);
                return;
            }
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
            }).catch(e => {
                console.error('Failed to resume audio context:', e);
            });
        }
        
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        const currentTime = audioContext.currentTime;
        
        oscillator1.frequency.setValueAtTime(220, currentTime);
        oscillator1.frequency.linearRampToValueAtTime(330, currentTime + 0.3);
        
        oscillator2.frequency.setValueAtTime(165, currentTime);
        oscillator2.frequency.linearRampToValueAtTime(220, currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.5);
        
        oscillator1.start(currentTime);
        oscillator2.start(currentTime);
        oscillator1.stop(currentTime + 0.5);
        oscillator2.stop(currentTime + 0.5);
}
}


function createGameOverSound() {
    if (!isMuted) {
    if (!audioContext) return;
    
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const oscillator3 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    oscillator3.type = 'sine';
    
    const currentTime = audioContext.currentTime;
    
    oscillator1.frequency.setValueAtTime(440, currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(110, currentTime + 1.5);
    
    oscillator2.frequency.setValueAtTime(330, currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(55, currentTime + 0.8);
    
    oscillator3.frequency.setValueAtTime(220, currentTime);
    oscillator3.frequency.exponentialRampToValueAtTime(27.5, currentTime + 2);
    
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 2);
    
    oscillator1.start(currentTime);
    oscillator2.start(currentTime);
    oscillator3.start(currentTime);
    
    oscillator1.stop(currentTime + 2);
    oscillator2.stop(currentTime + 2);
    oscillator3.stop(currentTime + 2);
    }
}

function createEnemyLaserSound() {
    if (!isMuted) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
    }
}

function updateEnemyShip() {
    
    let now = Date.now();
    if (now - enemyShip.lastShotTime > ENEMY_SHOOT_INTERVAL *1000) {
        let angleToPlayer = Math.atan2(-(ship.y - enemyShip.y), ship.x - enemyShip.x);
        
        let accuracy = 0.2;
        angleToPlayer += (Math.random() - 0.5) * accuracy;

        enemyShip.lasers.push({
            x: enemyShip.x,
            y: enemyShip.y,
            xv: ENEMY_LASER_SPEED * Math.cos(angleToPlayer) / FPS,
            yv: -ENEMY_LASER_SPEED * Math.sin(angleToPlayer) / FPS,
            dist: 0
        });
        
        createEnemyLaserSound(); 
        enemyShip.lastShotTime = now;
    }
}

function createShieldDroneSound() {
    if (!isMuted) {
    if (!audioContext) return;
    
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    const currentTime = audioContext.currentTime;
    
    oscillator1.frequency.setValueAtTime(200, currentTime);
    oscillator2.frequency.setValueAtTime(203, currentTime); 
    
    gainNode.gain.setValueAtTime(0.4, currentTime);
    
    oscillator1.start(currentTime);
    oscillator2.start(currentTime);
    
    return { oscillators: [oscillator1, oscillator2], gainNode };
    }
}

let shieldSound = null;

function applyPowerUp(powerUpType) {
    ship.activePowerUps.set(powerUpType.id, Date.now() + powerUpType.duration);
    ship.lastPowerUp = powerUpType.name;
    ship.powerUpMessageTime = POWER_UP_MESSAGE_DURATION;
    createPowerUpSound();

    if (powerUpType.id === POWER_UP_TYPES.SHIELD.id && !isMuted) {
        shieldSound = createShieldDroneSound();
        if (shieldSound) { 
            const duration = powerUpType.duration;
            shieldSound.oscillators.forEach(osc => {
                osc.stop(audioContext.currentTime + duration/1000);
            });
        }
    }
}

if (ship.activePowerUps.size > 0) {
    if (shieldSound && !ship.activePowerUps.has(POWER_UP_TYPES.SHIELD.id)) {
        shieldSound.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        shieldSound = null;
    }
}

function createExtraLifeSound() {
    if (!audioContext) return;
    
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const oscillator3 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    oscillator3.type = 'sine';
    
    const currentTime = audioContext.currentTime;
    
    oscillator1.frequency.setValueAtTime(523.25, currentTime); 
    oscillator1.frequency.setValueAtTime(659.25, currentTime + 0.1);
    oscillator1.frequency.setValueAtTime(783.99, currentTime + 0.2);
    oscillator1.frequency.setValueAtTime(1046.50, currentTime + 0.3);
    
    oscillator2.frequency.setValueAtTime(415.30, currentTime); 
    oscillator2.frequency.setValueAtTime(523.25, currentTime + 0.1);
    oscillator2.frequency.setValueAtTime(622.25, currentTime + 0.2);
    oscillator2.frequency.setValueAtTime(830.61, currentTime + 0.3);
    
    oscillator3.frequency.setValueAtTime(261.63, currentTime);
    oscillator3.frequency.linearRampToValueAtTime(523.25, currentTime + 0.4); 
    
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.3, currentTime + 0.35);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.5);
    
    oscillator1.start(currentTime);
    oscillator2.start(currentTime);
    oscillator3.start(currentTime);
    
    oscillator1.stop(currentTime + 0.5);
    oscillator2.stop(currentTime + 0.5);
    oscillator3.stop(currentTime + 0.5);
}

const MUTE_BUTTON = {
    x: canv.width - 20,
    y: 20,
    radius: 13
};


canv.addEventListener('click', (event) => {
    const rect = canv.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
});

drawMuteButton();

function initAudio() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (isMuted) {
                audioContext.suspend();
            }
        }
    } catch (e) {
        console.error('Failed to initialize audio context:', e);
    }
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem(MUTE_STORAGE_KEY, isMuted);
}

function drawMuteButton() {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(isMuted ? '🔈' : '🔊', 1465, 25);
}

canv.addEventListener('click', function(event) {
    const rect = canv.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (x >= 1430 && x <= 1500 && y >= 5 && y <= 40) {
        toggleMute();
    }
});

let thrustSound = null;
let thrustOscillator = null;
let thrustGain = null;

function createThrustSound() {
    if (!thrustSound) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        thrustOscillator = audioCtx.createBufferSource();
        thrustOscillator.buffer = noiseBuffer;
        thrustOscillator.loop = true;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.2; 
        
        thrustGain = audioCtx.createGain();
        thrustGain.gain.value = 0;
        
        thrustOscillator.connect(filter);
        filter.connect(thrustGain);
        thrustGain.connect(audioCtx.destination);
        
        thrustOscillator.start();
        
        thrustSound = {
            context: audioCtx,
            oscillator: thrustOscillator,
            gain: thrustGain,
            filter: filter,
            playing: false
        };
    }
}

function startThrustSound() {
    if (!isMuted && thrustSound && !thrustSound.playing) {
        thrustSound.gain.gain.setTargetAtTime(0.2, thrustSound.context.currentTime, 0.1);
        thrustSound.playing = true;
        
        const variation = Math.random() * 200;
        thrustSound.filter.frequency.setValueAtTime(1000 + variation, thrustSound.context.currentTime);
    }
}

function stopThrustSound() {
    if (thrustSound && thrustSound.playing) {
        thrustSound.gain.gain.setTargetAtTime(0, thrustSound.context.currentTime, 0.1);
        thrustSound.playing = false;
    }
}

let isStatsHidden = localStorage.getItem(STATS_STORAGE_KEY) === 'true';

ctx.fillStyle = "white";
ctx.font = "16px Arial";
ctx.textAlign = "left";

if (!isStatsHidden) {
    const shipVelocity = Math.sqrt(Math.pow(ship.thrust.x, 2) + Math.pow(ship.thrust.y, 2)) * FPS;
    const shipAttitude = ((-ship.angle * 180 / Math.PI + 90) + 360) % 360;

    let malfunctionRisk = level > 1 ? 
        Math.min(Math.round((MALFUNCTION_BASE_CHANCE + (0.01 * (level - 1))) * 100), 90) : 
        0;

    ctx.fillStyle = "orange";
    ctx.fillText(`SCORE: ${'\u20BF'}${formatScoreAsBTC(score)}`, STATS_MARGIN, STATS_LINE_HEIGHT);
    ctx.fillText(`LEVEL: ${level}`, STATS_MARGIN, STATS_LINE_HEIGHT * 2);
}

function updateHighScores(newScore) {
    let currentScores = JSON.parse(localStorage.getItem(HIGH_SCORES_STORAGE_KEY)) || Array(10).fill(0);
    
    if (newScore > 0) {
        currentScores.push(newScore);
        currentScores.sort((a, b) => b - a);
        currentScores = currentScores.slice(0, 10);
        localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(currentScores));
        topScores = currentScores; 
    }
}

let canRestartGame = false; 

if (ship.lives === 0) {
    ship.dead = true;
    ship.thrust.x = 0; 
    ship.thrust.y = 0;
    gameOverMessageTime = GAME_OVER_MESSAGE_DURATION;
    setTimeout(() => {
        canRestartGame = true;
        updateHighScores(adjustedScore);
        topScores.sort((a, b) => b - a);
        topScores = topScores.slice(0, 10);
        while (topScores.length < 10) {
            topScores.push(0);
        }
    }, GAME_OVER_MESSAGE_DURATION * (1000/60));
}
stopThrustSound();

document.addEventListener('keydown', (event) => {
    if (canRestartGame && ship.dead) {
        isWelcomeScreen = true;
        canRestartGame = false; 
    }
});

if (ship.dead && !isWelcomeScreen) {  
    const centerX = canv.width / 2;
    const centerY = canv.height / 2;

    if (gameOverMessageTime > 0) {  
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 4;
        
        let baseScale = 20;
        let startScale = 1;
        let endScale = 15;
        let progress = (GAME_OVER_MESSAGE_DURATION - gameOverMessageTime) / GAME_OVER_MESSAGE_DURATION;
        let scale = startScale + (endScale - startScale) * progress;
        
        let gameOverAlpha = Math.max(0, 1 - (progress * 1.5));
        ctx.globalAlpha = gameOverAlpha;
        
        GAME_OVER_SEGMENTS.forEach(segment => {
            segment.forEach((point, index) => {
                if (index === 0) {
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + (point[0] - 8) * baseScale * scale,
                        centerY + (point[1] - 1.25) * baseScale * scale
                    );
                } else {
                    ctx.lineTo(
                        centerX + (point[0] - 8) * baseScale * scale,
                        centerY + (point[1] - 1.25) * baseScale * scale
                    );
                }
            });
            ctx.stroke();
        });
        
        ctx.restore();
        gameOverMessageTime--;
    }
}

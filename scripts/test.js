
class SkyEventManager {
    constructor(game) {  
        this.game = game;
        this.currentEvent = null;
        this.nextEvent = null; 
        this.eventTimer = 0;
        this.nextEventTimer = this.getRandomTime();
        this.transitionProgress = 0;  
        this.isTransitioningIn = false;
        this.isTransitioningOut = false;
        this.transitionDuration = 3; 
        this.warningTime = 5;  
    }

    getRandomTime() {
        return 30 + Math.random() * 60;
    }

    update(deltaTime) {
        if (this.currentEvent) {
            if (this.isTransitioningIn) {
                this.transitionProgress += deltaTime / this.transitionDuration;
                if (this.transitionProgress >= 1) {
                    this.transitionProgress = 1;
                    this.isTransitioningIn = false;
                }
            }

            if (!this.isTransitioningIn && !this.isTransitioningOut) {
                const altitude = this.game.getAltitude();
                const safeAltitude = 500; 
                
                if (altitude < safeAltitude) {
                    const damageMultiplier = 1 - (altitude / safeAltitude);
                    const damagePerSecond = this.currentEvent === 'solar_wind' ? 15 : 10;
                    const damage = damagePerSecond * damageMultiplier * deltaTime;
                    
                    this.game.lander.damage = Math.min(100, this.game.lander.damage + damage);
                    
                    if (this.game.lander.damage >= 100) {
                        this.game.gameState = 'crashed';
                        this.game.createExplosion(this.game.lander.pos.x, this.game.lander.pos.y);
                        this.game.showMessage('SHIP DESTROYED BY ' + 
                            (this.currentEvent === 'solar_wind' ? 'RADIATION' : 'TOXIC ATMOSPHERE'));
                    }
                }
            }

            this.eventTimer -= deltaTime;
            
            if (this.eventTimer <= this.transitionDuration && !this.isTransitioningOut) {
                this.isTransitioningOut = true;
                this.transitionProgress = 1;
                this.showEndingAlert();
            }
            
            if (this.isTransitioningOut) {
                this.transitionProgress -= deltaTime / this.transitionDuration;
                if (this.transitionProgress <= 0) {
                    this.transitionProgress = 0;
                    this.isTransitioningOut = false;
                    this.currentEvent = null;
                    this.nextEventTimer = this.getRandomTime();
                }
            }
        } else {
            this.nextEventTimer -= deltaTime;
            if (this.nextEventTimer <= this.warningTime && this.nextEventTimer > this.warningTime - deltaTime) {
                this.showWarningAlert();
            }
            if (this.nextEventTimer <= 0) {
                this.triggerRandomEvent();
            }
        }
    }

    triggerRandomEvent() {
        this.currentEvent = this.nextEvent; 
        this.eventTimer = 30;
        this.isTransitioningIn = true;
        this.transitionProgress = 0;
    }

    showWarningAlert() {
        const nextEvent = this.getNextEvent();
        if (nextEvent === 'solar_wind') {
            this.game.showMessage('WARNING: RADIATION STORM APPROACHING! MAINTAIN HIGH ALTITUDE!', 5000);
        } else {
            this.game.showMessage('WARNING: TOXIC GAS CLOUD APPROACHING! MAINTAIN HIGH ALTITUDE!', 5000);
        }
    }

    showEndingAlert() {
        const currentEvent = this.currentEvent;
        if (currentEvent === 'solar_wind') {
            this.game.showMessage('RADIATION LEVELS RETURNING TO NORMAL', 3000);
        } else {
            this.game.showMessage('ATMOSPHERIC CONDITIONS STABILIZING', 3000);
            
        }
    }

    getNextEvent() {
        const events = ['solar_wind', 'aurora'];
        this.nextEvent = events[Math.floor(Math.random() * events.length)];
        return this.nextEvent;
    }

    getCurrentGradient() {
        const defaultColors = {
            top: '#000000',
            middle: '#080c18',
            bottom: '#11172f'
        };

        if (!this.currentEvent || this.transitionProgress === 0) {
            return defaultColors;
        }

        const targetColors = this.currentEvent === 'solar_wind' 
            ? {
                top: '#000000',
                middle: '#181808',
                bottom: '#2f2f11'
            }
            : {
                top: '#000000',
                middle: '#081808',
                bottom: '#112f11'
            };

        return {
            top: this.lerpColor(defaultColors.top, targetColors.top, this.transitionProgress),
            middle: this.lerpColor(defaultColors.middle, targetColors.middle, this.transitionProgress),
            bottom: this.lerpColor(defaultColors.bottom, targetColors.bottom, this.transitionProgress)
        };
    }

    lerpColor(color1, color2, amount) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * amount);
        const g = Math.round(c1.g + (c2.g - c1.g) * amount);
        const b = Math.round(c1.b + (c2.b - c1.b) * amount);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.zoom = 1.0;
        this.isLanded = false;
    }

    follow(target, canvasWidth, canvasHeight, terrainWidth, terrain, gameState) {
        this.isLanded = gameState === 'landed';

        let targetX = target.pos.x - canvasWidth / 2;
        const directDist = targetX - this.x;
        const wrapLeftDist = targetX - (this.x + terrainWidth);
        const wrapRightDist = targetX - (this.x - terrainWidth);
        
        let dx = directDist;
        if (Math.abs(wrapLeftDist) < Math.abs(dx)) dx = wrapLeftDist;
        if (Math.abs(wrapRightDist) < Math.abs(dx)) dx = wrapRightDist;
        
        this.targetX = this.x + dx;
        this.targetY = target.pos.y - canvasHeight / 2;
        
        let targetZoom;

        if (this.isLanded) {
            targetZoom = 0.4;
        } else {
            const wrappedX = ((target.pos.x % terrainWidth) + terrainWidth) % terrainWidth;
            let nearestTerrainDistance = Infinity;
            
            for (let i = 0; i < terrain.points.length - 1; i++) {
                const p1 = terrain.points[i];
                const p2 = terrain.points[i + 1];
                
                const distance = this.pointToLineDistance(
                    wrappedX, target.pos.y,
                    p1.x, p1.y,
                    p2.x, p2.y
                );
                nearestTerrainDistance = Math.min(nearestTerrainDistance, distance);
            }

            let mothershipDistance = Infinity;
            if (target.pos.y < terrain.height - 9500) {
                const bayBottom = target.game.mothership.padY;
                const bayTop = target.game.mothership.y;
                const bayLeft = target.game.mothership.bayX;
                const bayRight = bayLeft + target.game.mothership.bayWidth;
                
                mothershipDistance = this.pointToRectDistance(
                    target.pos.x,
                    target.pos.y,
                    bayLeft,
                    bayTop,
                    target.game.mothership.bayWidth,
                    target.game.mothership.bayDepth
                );

                const hullDistance = this.pointToRectDistance(
                    target.pos.x,
                    target.pos.y,
                    target.game.mothership.x - target.game.mothership.width/2,
                    target.game.mothership.y,
                    target.game.mothership.width,
                    target.game.mothership.height
                );
                
                mothershipDistance = Math.min(mothershipDistance, hullDistance);
            }

            const nearestDistance = Math.min(nearestTerrainDistance, mothershipDistance);

            if (nearestDistance <= 100) {
                const zoomFactor = Math.max(0, (100 - nearestDistance) / 100);
                targetZoom = 2.0 + (zoomFactor * 10.0);
            } else {
                const baseZoom = 2.0 / (1 + nearestDistance / 500);
                const proximityZoom = Math.max(0, (200 - nearestDistance) / 200);
                targetZoom = baseZoom + proximityZoom;
            }
        }

        targetZoom = Math.max(0.2, targetZoom);

        const positionLerp = this.isLanded ? 0.1 : 0.1;
        const zoomLerp = this.isLanded ? 0.01 : 0.03;

        this.x += (this.targetX - this.x) * positionLerp;
        this.y += (this.targetY - this.y) * positionLerp;
        this.zoom += (targetZoom - this.zoom) * zoomLerp;

        this.x = ((this.x % terrainWidth) + terrainWidth) % terrainWidth;
    }

    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq != 0) param = dot / len_sq;

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

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    pointToRectDistance(px, py, rx, ry, rw, rh) {
        const dx = Math.max(rx - px, 0, px - (rx + rw));
        const dy = Math.max(ry - py, 0, py - (ry + rh));
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Stars {
    constructor(width, height, game) {  
        this.width = width * 6;
        this.height = height * 2;
        this.stars = [];
        this.generate();
        this.skyEventManager = new SkyEventManager(game); 
    }

    generate() {
        const numStars = 600;
        for (let i = 0; i < numStars; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random(),
                parallax: 0.25 + (Math.random() * 0.5) 
            });
        }
    }

    update(deltaTime) {
        this.skyEventManager.update(deltaTime);
    }

    draw(ctx, camera, terrain, offset = 0) {
        const colors = this.skyEventManager.getCurrentGradient();
        
        const gradient = ctx.createLinearGradient(
            0, 
            -camera.y / camera.zoom, 
            0, 
            (terrain.height - camera.y) / camera.zoom
        );
        
        gradient.addColorStop(0, colors.top);
        gradient.addColorStop(0.7, colors.middle);
        gradient.addColorStop(1, colors.bottom);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            -camera.x + offset, 
            -camera.y, 
            terrain.width, 
            terrain.height * 2
        );

        this.stars.forEach(star => {
            const parallaxX = camera.x * star.parallax;
            const parallaxY = camera.y * star.parallax;
            
            const screenX = (star.x + offset - parallaxX);
            const screenY = (star.y - parallaxY);
            
            const terrainY = terrain.points[0].y; 
            const relativeHeight = (terrainY - star.y) / (terrain.height * 0.5);
            const opacity = Math.min(1, Math.max(0, relativeHeight));
            
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

class Terrain {
    constructor(width, height, game) {  
        this.game = game;  
        this.width = width * 6; 
        this.height = height;
        this.points = [];
        this.landingPads = [];
        this.detailPoints = [];
        this.generate();
        this.cargoBoxes = 0; 
        this.deliveryTimer = 0; 
        this.deliveryRocket = null; 
        this.groundBoxes = []; 
    }

    generate() {
        const segmentSize = 30;
        const numPoints = Math.ceil(this.width / segmentSize);
        let basePoints = [];
        
        for (let i = 0; i < numPoints; i++) {
            const x = i * segmentSize;
            
            const noise1 = Math.sin(x * 0.0005) * this.height * 0.35; 
            const noise2 = Math.sin(x * 0.002) * this.height * 0.15;  
            const noise3 = Math.sin(x * 0.008) * this.height * 0.05;  
            
            const smoothRandom = (
                Math.sin(x * 0.015 + Math.PI/3) + 
                Math.sin(x * 0.023 + Math.PI/5) + 
                Math.sin(x * 0.031 + Math.PI/7)
            ) / 3 * this.height * 0.1;
            
            let y = this.height * 0.6 + noise1 + noise2 + noise3 + smoothRandom;
            
            if (Math.random() < 0.03) {
                const featureHeight = (Math.random() - 0.5) * this.height * 0.4;
                const featureWidth = Math.floor(Math.random() * 8) + 4;
                for (let j = Math.max(0, basePoints.length - featureWidth); j < basePoints.length; j++) {
                    const t = (j - (basePoints.length - featureWidth)) / featureWidth;
                    const smooth = this.smoothStep(t);
                    basePoints[j].y += featureHeight * smooth;
                }
                y += featureHeight * (1 - this.smoothStep(0));
            }
            
            basePoints.push({ x, y });
        }

        const smoothingPasses = 2;
        for (let pass = 0; pass < smoothingPasses; pass++) {
            for (let i = 1; i < basePoints.length - 1; i++) {
                const prev = basePoints[i - 1].y;
                const curr = basePoints[i].y;
                const next = basePoints[i + 1].y;
                basePoints[i].y = prev * 0.25 + curr * 0.5 + next * 0.25;
            }
        }

        const pointsToMatch = Math.floor(numPoints / 10); 
        for (let i = 0; i < pointsToMatch; i++) {
            basePoints[basePoints.length - 1 - i] = {
                x: basePoints[basePoints.length - 1 - i].x,
                y: basePoints[i].y
            };
        }

        const freightPadWidth = 300;  
        const freightBuildingWidth = 200; 
        const freightBuildingHeight = 80; 
        const buildingSpace = 20;
        const freightPadX = 350;  
        const freightPadY = this.height * 0.6; 
        
        const freightStartIndex = Math.floor(freightPadX / segmentSize);
        const freightEndIndex = Math.floor((freightPadX + freightPadWidth + buildingSpace + freightBuildingWidth) / segmentSize);
        
        for (let i = freightStartIndex; i <= freightEndIndex; i++) {
            if (i >= 0 && i < basePoints.length) {
                basePoints[i].y = freightPadY;
            }
        }
        
        const transitionLength = 8;
        for (let i = freightEndIndex + 1; i < freightEndIndex + transitionLength + 1; i++) {
            if (i >= 0 && i < basePoints.length) {
                const t = 1 - ((i - (freightEndIndex + 1)) / transitionLength);
                const smooth = this.smoothStep(t);
                basePoints[i].y = this.lerp(basePoints[i].y, freightPadY, smooth);
            }
        }
        
        this.landingPads.push({
            x: freightPadX,  
            y: freightPadY,
            width: freightPadWidth,
            number: 0, 
            buildingX: freightPadX + freightPadWidth + buildingSpace,
            buildingWidth: freightBuildingWidth,
            buildingHeight: freightBuildingHeight,
            isFreightPad: true 
        });

        let padCount = 1;
        const padPositions = [0.25, 0.5, 0.75];
        
        padPositions.forEach(relativePos => {
            const padX = this.width * relativePos;
            const padWidth = 120;
            const buildingWidth = 60;
            const buildingSpace = 20;
            const totalFlatWidth = padWidth + buildingSpace + buildingWidth;
            const padY = this.height * (0.5 + (Math.random() * 0.2));
            
            const isPadTwo = padCount === 2;
            
            const antennaWidth = isPadTwo ? 80 : 0;
            const antennaSpace = isPadTwo ? 20 : 0;
            
            const adjustedTotalWidth = totalFlatWidth + (isPadTwo ? antennaWidth + antennaSpace : 0);
            
            const buildingX = isPadTwo ? 
                (padX - buildingSpace - buildingWidth) : 
                (padX + padWidth + buildingSpace);
            
            const antennaX = isPadTwo ? 
                (padX + padWidth + antennaSpace) : 
                0;
            
            const startIndex = Math.floor(
                isPadTwo ? 
                (padX - buildingWidth - buildingSpace) / segmentSize :
                padX / segmentSize
            );
            const endIndex = Math.floor(
                isPadTwo ? 
                (padX + padWidth + antennaSpace + antennaWidth) / segmentSize :
                (padX + totalFlatWidth) / segmentSize
            );
            
            const transitionLength = 8;
            
            for (let i = startIndex - transitionLength; i < startIndex; i++) {
                if (i >= 0 && i < basePoints.length) {
                    const t = (i - (startIndex - transitionLength)) / transitionLength;
                    const smooth = this.smoothStep(t);
                    basePoints[i].y = this.lerp(basePoints[i].y, padY, smooth);
                }
            }
            
            for (let i = startIndex; i <= endIndex; i++) {
                if (i >= 0 && i < basePoints.length) {
                    basePoints[i].y = padY;
                }
            }
            
            for (let i = endIndex + 1; i < endIndex + transitionLength + 1; i++) {
                if (i >= 0 && i < basePoints.length) {
                    const t = 1 - ((i - (endIndex + 1)) / transitionLength);
                    const smooth = this.smoothStep(t);
                    basePoints[i].y = this.lerp(basePoints[i].y, padY, smooth);
                }
            }
            
            this.landingPads.push({
                x: padX,
                y: padY,
                width: padWidth,
                number: padCount++,
                buildingX: buildingX,
                buildingWidth: buildingWidth,
                buildingHeight: 120,
                antennaX: antennaX,
                antennaWidth: antennaWidth
            });
            
        });

        const pad3 = this.landingPads[3];
        const mastX = pad3.x - 200; 
        const mastWidth = 100;
        const mastHeight = 300;
        const platformWidth = 160;

        const platformStartIndex = Math.floor((mastX - platformWidth/2) / segmentSize);
        const platformEndIndex = Math.floor((mastX + platformWidth/2) / segmentSize);

        for (let i = platformStartIndex; i <= platformEndIndex; i++) {
            if (i >= 0 && i < basePoints.length) {
                basePoints[i].y = pad3.y; 
            }
        }

        this.antennaMast = {
            x: mastX,
            y: pad3.y,
            width: mastWidth,
            height: mastHeight
        };

        this.points = [];
        for (let i = 0; i < basePoints.length; i++) {
            this.points.push(basePoints[i]);
        }

        this.points.push({
            x: this.width,
            y: this.points[0].y
        });

        this.detailPoints = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            
            if (!this.isPartOfLandingPad(p1.x) && Math.random() < 0.3) { 
                const x = this.lerp(p1.x, p2.x, Math.random());
                const baseY = this.lerp(p1.y, p2.y, Math.random());
                const height = Math.random() * 8;
                this.detailPoints.push({
                    x: x,
                    y: baseY - height,
                    width: 2 + Math.random() * 4
                });
            }
        }

        const wrapZone = 100; 
        const startDetails = this.detailPoints.filter(d => d.x < wrapZone);
        const endDetails = startDetails.map(d => ({
            x: d.x + this.width,
            y: d.y,
            width: d.width
        }));
        this.detailPoints.push(...endDetails);

        if (this.deliveryTimer > 2 && !this.deliveryRocket) {  
            this.deliveryRocket = new DeliveryRocket(
                350,              
                this.landingPads[0].y,
                this.game  
            );
        }
    }

    draw(ctx, camera, offset = 0) {
        const gradient = ctx.createLinearGradient(
            0, 
            -camera.y / camera.zoom, 
            0, 
            (this.height - camera.y) / camera.zoom
        );
        gradient.addColorStop(0, '#1a1a1a');    
        gradient.addColorStop(1, '#0a0a0a');    
        
        ctx.beginPath();
        ctx.moveTo(
            this.points[0].x + offset - camera.x, 
            this.height * 2 - camera.y
        );
        
        let currentPoint = this.points[0];
        ctx.lineTo(currentPoint.x + offset - camera.x, currentPoint.y - camera.y);
        
        for (let i = 1; i < this.points.length; i++) {
            currentPoint = this.points[i];
            ctx.lineTo(currentPoint.x + offset - camera.x, currentPoint.y - camera.y);
        }
        
        ctx.lineTo(
            this.points[this.points.length-1].x + offset - camera.x, 
            this.height * 2 - camera.y
        );
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x + offset - camera.x, this.points[0].y - camera.y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x + offset - camera.x, this.points[i].y - camera.y);
        }
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        this.landingPads.forEach(pad => {
            ctx.beginPath();
            ctx.moveTo(pad.x + offset - camera.x, pad.y - camera.y);
            ctx.lineTo(pad.x + pad.width + offset - camera.x, pad.y - camera.y);
            ctx.strokeStyle = pad.isFreightPad ? '#7777ff' : '#0000ff';
            ctx.lineWidth = pad.isFreightPad ? 3 : 2;  
            ctx.stroke();

            if (pad.isFreightPad) {
                ctx.fillStyle = '#222';
                ctx.strokeStyle = '#333';
                ctx.beginPath();
                ctx.rect(
                    pad.buildingX + offset - camera.x,
                    pad.y - pad.buildingHeight - camera.y,
                    pad.buildingWidth,
                    pad.buildingHeight
                );
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#eeeeee'; 
                ctx.font = '16px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    'INTERPLANETARY FREIGHT',
                    pad.buildingX + (pad.buildingWidth / 2) + offset - camera.x,
                    pad.y - pad.buildingHeight + 15 - camera.y 
                );

                const windowRows = 2;
                const windowCols = 7;
                const windowSize = 15;
                const windowSpacing = 25;
                const windowStartX = pad.buildingX + 20;
                const windowStartY = pad.y - pad.buildingHeight + 30; 

                for (let row = 0; row < windowRows; row++) {
                    for (let col = 0; col < windowCols; col++) {
                        ctx.fillStyle = '#111111';
                        ctx.fillRect(
                            windowStartX + (col * windowSpacing) + offset - camera.x,
                            windowStartY + (row * windowSpacing) - camera.y,
                            windowSize,
                            windowSize
                        );
                    }
                }

const numLights = 10;  
const lightSpacing = pad.width / (numLights - 1);

for (let i = 0; i < numLights; i++) {
const lightX = pad.x + (i * lightSpacing);
const lightY = pad.y + 2;

ctx.beginPath();
ctx.moveTo(lightX + offset - camera.x, lightY - camera.y);
ctx.lineTo(lightX + offset - camera.x, lightY + 10 - camera.y);
ctx.strokeStyle = 'white';
ctx.lineWidth = 2;
ctx.stroke();

const gradient = ctx.createRadialGradient(
    lightX + offset - camera.x, lightY - camera.y, 0,
    lightX + offset - camera.x, lightY - camera.y, 10
);
gradient.addColorStop(0, 'rgba(255, 255, 100, 0.3)');
gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
ctx.fillStyle = gradient;
ctx.beginPath();
ctx.arc(lightX + offset - camera.x, lightY - camera.y, 10, 0, Math.PI * 2);
ctx.fill();
}

ctx.beginPath();
ctx.moveTo(pad.x + offset - camera.x, pad.y - camera.y - 40);
ctx.lineTo(pad.x + offset - camera.x, pad.y - camera.y);
ctx.moveTo(pad.x + pad.width + offset - camera.x, pad.y - camera.y - 40);
ctx.lineTo(pad.x + pad.width + offset - camera.x, pad.y - camera.y);
ctx.strokeStyle = '#ccc';
ctx.lineWidth = 0.5;
ctx.stroke();

const time = performance.now() / 1000;
const pulseIntensity = (Math.sin(time * 2) + 1) / 2;

const leftGradient = ctx.createRadialGradient(
pad.x + offset - camera.x, pad.y - camera.y - 40,
0,
pad.x + offset - camera.x, pad.y - camera.y - 40,
4
);
leftGradient.addColorStop(0, `rgba(255, 0, 0, ${0.8 * pulseIntensity})`);
leftGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

ctx.fillStyle = leftGradient;
ctx.beginPath();
ctx.arc(
pad.x + offset - camera.x,
pad.y - camera.y - 40,
4,
0,
Math.PI * 2
);
ctx.fill();

const rightGradient = ctx.createRadialGradient(
pad.x + pad.width + offset - camera.x, pad.y - camera.y - 40,
0,
pad.x + pad.width + offset - camera.x, pad.y - camera.y - 40,
4
);
rightGradient.addColorStop(0, `rgba(0, 255, 0, ${0.8 * pulseIntensity})`);
rightGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

ctx.fillStyle = rightGradient;
ctx.beginPath();
ctx.arc(
pad.x + pad.width + offset - camera.x,
pad.y - camera.y - 40,
4,
0,
Math.PI * 2
);
ctx.fill();

            }


ctx.font = '96px monospace';
ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

if (pad.isFreightPad) {
ctx.font = '72px monospace';
const centerX = pad.x + pad.width/2 + offset - camera.x;
const centerY = pad.y - 60 - camera.y;
ctx.fillText('FREIGHT', centerX, centerY);
}



            if (!pad.isFreightPad) {
                const buildingWidth = 60;
                const buildingHeight = 120;
                const buildingX = pad.buildingX;
                
                const billboardHeight = 10;  
                const billboardPoleWidth = 0.5;
                const billboardY = pad.y - buildingHeight - (billboardHeight + 5);
                
                ctx.beginPath();
                ctx.rect(
                    buildingX + 10 + offset - camera.x,
                    billboardY + billboardHeight - camera.y,
                    billboardPoleWidth,
                    5 
                );
                ctx.rect(
                    buildingX + buildingWidth - 10 - billboardPoleWidth + offset - camera.x,
                    billboardY + billboardHeight - camera.y,
                    billboardPoleWidth,
                    5 
                );
                ctx.fillStyle = '#ccc';
                ctx.fill();

                ctx.beginPath();
                ctx.rect(
                    buildingX + offset - camera.x,
                    billboardY - camera.y,
                    buildingWidth,
                    billboardHeight
                );
                ctx.fillStyle = '#111';
                ctx.fill();
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 0.5; 
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                ctx.font = '100 8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    'ACME MINING',
                    buildingX + buildingWidth/2 + offset - camera.x,
                    billboardY + billboardHeight/2 - camera.y
                );

                ctx.beginPath();
                ctx.rect(
                    buildingX + offset - camera.x,
                    pad.y - buildingHeight - camera.y,
                    buildingWidth,
                    buildingHeight
                );
                ctx.fillStyle = '#050505';
                ctx.fill();
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 0.5;
                ctx.stroke();

                const windowRows = 16;    
                const windowCols = 8;     
                const windowSize = 0.5;   
                const windowSpacing = (buildingHeight - windowSize * windowRows) / (windowRows + 1);
                const windowHorizSpacing = (buildingWidth - windowSize * windowCols) / (windowCols + 1);

                const strutCount = 13;
                for (let i = 1; i < strutCount; i++) {
                    const x = buildingX + (buildingWidth * i / strutCount);
                    ctx.beginPath();
                    ctx.moveTo(x + offset - camera.x, pad.y - buildingHeight - camera.y);
                    ctx.lineTo(x + offset - camera.x, pad.y - camera.y);
                    ctx.strokeStyle = '#444';
                    ctx.lineWidth = 0.3;
                    ctx.stroke();
                }

                const floorCount = 7;
                for (let i = 1; i < floorCount; i++) {
                    const y = pad.y - buildingHeight + (buildingHeight * i / floorCount);
                    ctx.beginPath();
                    ctx.moveTo(buildingX + offset - camera.x, y - camera.y);
                    ctx.lineTo(buildingX + buildingWidth + offset - camera.x, y - camera.y);
                    ctx.strokeStyle = '#444';
                    ctx.lineWidth = 0.3;
                    ctx.stroke();
                }

                for (let row = 0; row < windowRows; row++) {
                    for (let col = 0; col < windowCols; col++) {
                        const windowX = buildingX + windowHorizSpacing * (col + 1) + windowSize * col;
                        const windowY = pad.y - buildingHeight + windowSpacing * (row + 1) + windowSize * row;
                        ctx.fillStyle = Math.random() < 1 ? '#ffff44' : '#333333';
                        ctx.fillRect(
                            windowX + offset - camera.x,
                            windowY - camera.y,
                            windowSize,
                            windowSize
                        );
                    }
                }

                const numLights = 6;
                const lightSpacing = pad.width / (numLights - 1);
                
                for (let i = 0; i < numLights; i++) {
                    const lightX = pad.x + (i * lightSpacing);
                    const lightY = pad.y + 2;
                    
                    ctx.beginPath();
                    ctx.moveTo(lightX + offset - camera.x, lightY - camera.y);
                    ctx.lineTo(lightX + offset - camera.x, lightY + 10 - camera.y);
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    const gradient = ctx.createRadialGradient(
                        lightX + offset - camera.x, lightY - camera.y, 0,
                        lightX + offset - camera.x, lightY - camera.y, 10
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 100, 0.3)');
                    gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(lightX + offset - camera.x, lightY - camera.y, 10, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.font = '96px monospace';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (pad.isFreightPad) {
                    ctx.font = '72px monospace';
                    const centerX = pad.x + pad.width/2 + offset - camera.x;
                    const centerY = pad.y - 60 - camera.y;
                    ctx.fillText('FREIGHT', centerX, centerY);
                } else {
                    const centerX = pad.x + pad.width/2 + offset - camera.x;
                    const centerY = pad.y - 60 - camera.y;
                    ctx.fillText(pad.number.toString(), centerX, centerY);

                }
                
                ctx.beginPath();
                ctx.moveTo(pad.x + offset - camera.x, pad.y - camera.y - 40);
                ctx.lineTo(pad.x + offset - camera.x, pad.y - camera.y);
                ctx.moveTo(pad.x + pad.width + offset - camera.x, pad.y - camera.y - 40);
                ctx.lineTo(pad.x + pad.width + offset - camera.x, pad.y - camera.y);
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 0.5;
                ctx.stroke();

                const time = performance.now() / 1000;
                const pulseIntensity = (Math.sin(time * 2) + 1) / 2;
                
                const leftGradient = ctx.createRadialGradient(
                    pad.x + offset - camera.x, pad.y - camera.y - 40,
                    0,
                    pad.x + offset - camera.x, pad.y - camera.y - 40,
                    4
                );
                leftGradient.addColorStop(0, `rgba(255, 0, 0, ${0.8 * pulseIntensity})`);
                leftGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = leftGradient;
                ctx.beginPath();
                ctx.arc(
                    pad.x + offset - camera.x,
                    pad.y - camera.y - 40,
                    4,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                const rightGradient = ctx.createRadialGradient(
                    pad.x + pad.width + offset - camera.x, pad.y - camera.y - 40,
                    0,
                    pad.x + pad.width + offset - camera.x, pad.y - camera.y - 40,
                    4
                );
                rightGradient.addColorStop(0, `rgba(255, 0, 0, ${0.8 * pulseIntensity})`);
                rightGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = rightGradient;
                ctx.beginPath();
                ctx.arc(
                    pad.x + pad.width + offset - camera.x,
                    pad.y - camera.y - 40,
                    4,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                if (pad.number === 2) {
                    const antennaBaseX = pad.antennaX + pad.antennaWidth/2;
                    const antennaBaseY = pad.y;
                    const time = performance.now() / 1000;

                    ctx.beginPath();
                    ctx.moveTo(pad.antennaX + offset - camera.x, pad.y - camera.y);
                    ctx.lineTo(pad.antennaX + pad.antennaWidth + offset - camera.x, pad.y - camera.y);
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.rect(
                        antennaBaseX + offset - camera.x - 10,
                        antennaBaseY - camera.y - 30,
                        20,
                        30
                    );
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    ctx.save();
                    ctx.translate(
                        antennaBaseX + offset - camera.x,
                        antennaBaseY - camera.y - 30
                    );
                    ctx.rotate(time * 2);

                    ctx.beginPath();
                    ctx.arc(0, 0, 15, -Math.PI * 0.6, Math.PI * 0.6);
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(-2, 0);
                    ctx.lineTo(2, 0);
                    ctx.moveTo(0, -2);
                    ctx.lineTo(0, 2);
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    ctx.restore();

                    const lightCount = 3;
                    for (let i = 0; i < lightCount; i++) {
                        const blinkPhase = Math.sin(time * 3 + i * 2);
                        const alpha = (blinkPhase + 1) / 2;
                        
                        ctx.beginPath();
                        ctx.arc(
                            antennaBaseX + offset - camera.x - 5 + (i * 5),
                            antennaBaseY - camera.y - 10,
                            1,
                            0,
                            Math.PI * 2
                        );
                        ctx.fillStyle = `rgba(255, ${i * 100}, 0, ${alpha})`;
                        ctx.fill();
                    }

                    const satelliteX = antennaBaseX - 20;
                    const satelliteY = antennaBaseY - 50;
                    const tilt = Math.PI * 0.25;

                    ctx.save();
                    ctx.translate(
                        satelliteX + offset - camera.x,
                        satelliteY - camera.y
                    );
                    ctx.rotate(tilt);

                    ctx.beginPath();
                    ctx.arc(0, 0, 8, -Math.PI * 0.6, Math.PI * 0.6);
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, 15);
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    ctx.restore();

                    const pipeWidth = 12;
                    const shaftWidth = pipeWidth * 4;
                    const cavernDepth = 1000;
                    
                    const shaftX = pad.buildingX + pad.buildingWidth/2 - shaftWidth/2;
                    const shaftStartY = pad.y + 20;
                    const shaftEndY = pad.y + cavernDepth;
                    
                    ctx.beginPath();
                    ctx.moveTo(shaftX + offset - camera.x, shaftStartY - camera.y);
                    
                    for (let y = 0; y <= cavernDepth; y += 50) {
                        const variation = Math.sin(y * 0.01) * 5;
                        ctx.lineTo(
                            shaftX + variation + offset - camera.x,
                            shaftStartY + y - camera.y
                        );
                    }
                    
                    const chamberWidth = 400;
                    const chamberHeight = 200;
                    const chamberX = shaftX + shaftWidth/2 - chamberWidth/2;
                    
                    for (let y = cavernDepth; y >= 0; y -= 50) {
                        const variation = Math.sin(y * 0.01) * 5;
                        ctx.lineTo(
                            shaftX + shaftWidth + variation + offset - camera.x,
                            shaftStartY + y - camera.y
                        );
                    }
                    
                    ctx.closePath();
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fill();
                    ctx.strokeStyle = '#333';
                    ctx.stroke();
                    
                    const gasPoints = [];
                    const numPoints = 20;
                    const amplitude = 30;

                    for (let i = 0; i <= numPoints; i++) {
                        const x = chamberX + (i * chamberWidth / numPoints);
                        const waveOffset = Math.sin(i * 0.5 + time) * amplitude + 
                                          Math.sin(i * 0.3 - time * 0.7) * amplitude * 0.5;
                        gasPoints.push({
                            x: x,
                            y: shaftEndY - chamberHeight + waveOffset
                        });
                    }

                    for (let i = numPoints; i >= 0; i--) {
                        const x = chamberX + (i * chamberWidth / numPoints);
                        const waveOffset = Math.sin(i * 0.4 - time * 0.8) * amplitude * 0.7 + 
                                          Math.sin(i * 0.6 + time * 0.5) * amplitude * 0.3;
                        gasPoints.push({
                            x: x,
                            y: shaftEndY + waveOffset
                        });
                    }

                    ctx.beginPath();
                    ctx.moveTo(gasPoints[0].x + offset - camera.x, gasPoints[0].y - camera.y);
                    for (let i = 1; i < gasPoints.length; i++) {
                        ctx.lineTo(
                            gasPoints[i].x + offset - camera.x,
                            gasPoints[i].y - camera.y
                        );
                    }
                    ctx.closePath();

                    const gasGradient = ctx.createRadialGradient(
                        chamberX + chamberWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight/2 - camera.y,
                        0,
                        chamberX + chamberWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight/2 - camera.y,
                        chamberWidth/2
                    );
                    gasGradient.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
                    gasGradient.addColorStop(0.6, 'rgba(255, 50, 0, 0.1)');
                    gasGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

                    ctx.fillStyle = gasGradient;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(
                        shaftX + shaftWidth/2 + offset - camera.x,
                        pad.y - camera.y
                    );
                    ctx.lineTo(
                        shaftX + shaftWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight - camera.y
                    );
                    
                    ctx.strokeStyle = '#111';
                    ctx.lineWidth = pipeWidth;
                    ctx.stroke();

                    for (let y = pad.y; y <= shaftEndY - chamberHeight; y += 100) {
                        ctx.beginPath();
                        ctx.arc(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            pipeWidth/1.5,
                            0,
                            Math.PI * 2
                        );
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }

                    for (let i = 0; i < 20; i++) {
                        const t = ((time * 0.2 + i * 0.05) % 1);
                        const y = shaftEndY - chamberHeight + (pad.y - (shaftEndY - chamberHeight)) * t;
                        
                        const bubbleGradient = ctx.createRadialGradient(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            0,
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            5
                        );
                        bubbleGradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
                        bubbleGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                        
                        ctx.fillStyle = bubbleGradient;
                        ctx.beginPath();
                        ctx.arc(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            5,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }


                    const magmaPoints = [];
                    for (let i = 0; i <= numPoints; i++) {
                        const x = chamberX + (i * chamberWidth / numPoints);
                        const waveOffset = Math.sin(i * 0.5 + time) * amplitude + 
                                          Math.sin(i * 0.3 - time * 0.7) * amplitude * 0.5;
                        magmaPoints.push({
                            x: x,
                            y: shaftEndY - chamberHeight/2 + waveOffset 
                        });
                    }

                    ctx.beginPath();

                    ctx.moveTo(chamberX + offset - camera.x, magmaPoints[0].y - camera.y);

                    magmaPoints.forEach(point => {
                        ctx.lineTo(point.x + offset - camera.x, point.y - camera.y);
                    });

                    ctx.lineTo(chamberX + chamberWidth + offset - camera.x, shaftEndY - camera.y);

                    for (let i = numPoints; i >= 0; i--) {
                        const x = chamberX + (i * chamberWidth / numPoints);
                        const bottomWaveOffset = Math.sin(i * 0.3 + time * 0.5) * amplitude * 0.3 + 
                                               Math.sin(i * 0.5 - time * 0.3) * amplitude * 0.2;
                        ctx.lineTo(x + offset - camera.x, shaftEndY + bottomWaveOffset - camera.y);
                    }

                    ctx.lineTo(chamberX + offset - camera.x, magmaPoints[0].y - camera.y);

                    ctx.closePath();

                    const magmaGradient = ctx.createRadialGradient(
                        chamberX + chamberWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight/2 - camera.y,
                        0,
                        chamberX + chamberWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight/2 - camera.y,
                        chamberWidth/2
                    );
                    magmaGradient.addColorStop(0, '#ff4400');
                    magmaGradient.addColorStop(0.3, '#ff6600');
                    magmaGradient.addColorStop(0.7, '#ff8800');
                    magmaGradient.addColorStop(1, 'rgba(255, 136, 0, 0)'); 

                    ctx.fillStyle = magmaGradient;
                    ctx.fill();

                    for (let i = 0; i < 30; i++) {
                        const x = chamberX + Math.random() * chamberWidth;
                        const y = shaftEndY - chamberHeight/2 - Math.random() * chamberHeight/2;
                        const heatGradient = ctx.createRadialGradient(
                            x + offset - camera.x,
                            y - camera.y,
                            0,
                            x + offset - camera.x,
                            y - camera.y,
                            20
                        );
                        heatGradient.addColorStop(0, 'rgba(255, 100, 0, 0.1)');
                        heatGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
                        
                        ctx.fillStyle = heatGradient;
                        ctx.beginPath();
                        ctx.arc(x + offset - camera.x, y - camera.y, 20, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    for (let i = 0; i < 20; i++) {
                        const t = ((time * 0.2 + i * 0.05) % 1);
                        const y = shaftEndY - chamberHeight + (pad.y - (shaftEndY - chamberHeight)) * t;
                        
                        const steamGradient = ctx.createRadialGradient(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            0,
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            5
                        );
                        steamGradient.addColorStop(0, 'rgba(255, 150, 0, 0.4)');
                        steamGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
                        
                        ctx.fillStyle = steamGradient;
                        ctx.beginPath();
                        ctx.arc(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            5,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }

                if (pad.number === 1) {
                    const pipeWidth = 12;
                    const shaftWidth = pipeWidth * 4; 
                    const cavernDepth = 1200;
                    
                    const shaftX = pad.buildingX + pad.buildingWidth/2 - shaftWidth/2;
                    const shaftStartY = pad.y + 20;
                    const shaftEndY = pad.y + cavernDepth;
                    
                    ctx.beginPath();
                    ctx.moveTo(shaftX + offset - camera.x, shaftStartY - camera.y);
                    
                    for (let y = 0; y <= cavernDepth; y += 50) {
                        const variation = Math.sin(y * 0.01) * 5;
                        ctx.lineTo(
                            shaftX + variation + offset - camera.x,
                            shaftStartY + y - camera.y
                        );
                    }
                    
                    const chamberWidth = 600;
                    const chamberHeight = 300;
                    const chamberX = shaftX + shaftWidth/2 - chamberWidth/2; 
                    
                    
                    for (let y = cavernDepth; y >= 0; y -= 50) {
                        const variation = Math.sin(y * 0.01) * 5; 
                        ctx.lineTo(
                            shaftX + shaftWidth + variation + offset - camera.x,
                            shaftStartY + y - camera.y
                        );
                    }
                    
                    ctx.closePath();
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fill();
                    ctx.strokeStyle = '#333';
                    ctx.stroke();
                    
                    const time = Date.now() / 1000;
                    const gasPoints = [];
                    const numPoints = 20;
                    const amplitude = 30; 

                    for (let i = 0; i <= numPoints; i++) {
                        const x = chamberX + (i * chamberWidth / numPoints);
                        const waveOffset = Math.sin(i * 0.5 + time) * amplitude + 
                                          Math.sin(i * 0.3 - time * 0.7) * amplitude * 0.5;
                        gasPoints.push({
                            x: x,
                            y: shaftEndY - chamberHeight + waveOffset
                        });
                    }

                    for (let i = numPoints; i >= 0; i--) {
                        const x = chamberX + (i * chamberWidth / numPoints);
                        const waveOffset = Math.sin(i * 0.4 - time * 0.8) * amplitude * 0.7 + 
                                          Math.sin(i * 0.6 + time * 0.5) * amplitude * 0.3;
                        gasPoints.push({
                            x: x,
                            y: shaftEndY + waveOffset
                        });
                    }

                    ctx.beginPath();
                    ctx.moveTo(gasPoints[0].x + offset - camera.x, gasPoints[0].y - camera.y);
                    for (let i = 1; i < gasPoints.length; i++) {
                        ctx.lineTo(
                            gasPoints[i].x + offset - camera.x,
                            gasPoints[i].y - camera.y
                        );
                    }
                    ctx.closePath();

                    const gasGradient = ctx.createRadialGradient(
                        chamberX + chamberWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight/2 - camera.y,
                        0,
                        chamberX + chamberWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight/2 - camera.y,
                        chamberWidth/2
                    );
                    gasGradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
                    gasGradient.addColorStop(0.6, 'rgba(0, 255, 0, 0.1)');
                    gasGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

                    ctx.fillStyle = gasGradient;
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(
                        shaftX + shaftWidth/2 + offset - camera.x,
                        pad.y - camera.y 
                    );
                    ctx.lineTo(
                        shaftX + shaftWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight - camera.y 
                    );
                    
                    ctx.strokeStyle = '#111';
                    ctx.lineWidth = pipeWidth;
                    ctx.stroke();
                    
                    for (let y = pad.y; y <= shaftEndY - chamberHeight; y += 100) {
                        ctx.beginPath();
                        ctx.arc(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            pipeWidth/1.5,
                            0,
                            Math.PI * 2
                        );
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                    
                    for (let i = 0; i < 20; i++) {
                        const t = ((time * 0.2 + i * 0.05) % 1);
                        const y = shaftEndY - chamberHeight + (pad.y - (shaftEndY - chamberHeight)) * t;
                        
                        const bubbleGradient = ctx.createRadialGradient(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            0,
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            5
                        );
                        bubbleGradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
                        bubbleGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
                        
                        ctx.fillStyle = bubbleGradient;
                        ctx.beginPath();
                        ctx.arc(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            5,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                    

                }

                if (pad.number === 3) {
                    const pipeWidth = 12;
                    const shaftWidth = pipeWidth * 4;
                    const cavernDepth = 1100;
                    
                    const shaftX = pad.buildingX + pad.buildingWidth/2 - shaftWidth/2;
                    const shaftStartY = pad.y + 20;
                    const shaftEndY = pad.y + cavernDepth;
                    
                    ctx.beginPath();
                    ctx.moveTo(shaftX + offset - camera.x, shaftStartY - camera.y);
                    
                    for (let y = 0; y <= cavernDepth; y += 20) {
                        const variation = Math.sin(y * 0.01) * 5;
                        ctx.lineTo(
                            shaftX + variation + offset - camera.x,
                            shaftStartY + y - camera.y
                        );
                    }
                    
                    const chamberWidth = 400;  
                    const chamberHeight = 300; 
                    const chamberX = shaftX + shaftWidth/2 - chamberWidth/2;
                    
                    ctx.beginPath();
                    ctx.moveTo(shaftX + offset - camera.x, shaftStartY - camera.y);
                    
                    ctx.lineTo(shaftX + offset - camera.x, shaftEndY - chamberHeight - camera.y);
                    
                    ctx.lineTo(chamberX + offset - camera.x, shaftEndY - chamberHeight - camera.y); 
                    ctx.lineTo(chamberX + offset - camera.x, shaftEndY - camera.y);                 
                    ctx.lineTo(chamberX + chamberWidth + offset - camera.x, shaftEndY - camera.y);  
                    ctx.lineTo(chamberX + chamberWidth + offset - camera.x, shaftEndY - chamberHeight - camera.y); 
                    
                    ctx.lineTo(shaftX + shaftWidth + offset - camera.x, shaftEndY - chamberHeight - camera.y);
                    ctx.lineTo(shaftX + shaftWidth + offset - camera.x, shaftStartY - camera.y);
                    
                    ctx.closePath();
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fill();
                    ctx.strokeStyle = '#333';
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(
                        shaftX + shaftWidth/2 + offset - camera.x,
                        pad.y - camera.y
                    );
                    ctx.lineTo(
                        shaftX + shaftWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight - camera.y
                    );
                    
                    ctx.strokeStyle = '#111';
                    ctx.lineWidth = pipeWidth;
                    ctx.stroke();
                    
                    for (let y = pad.y; y <= shaftEndY - chamberHeight; y += 100) {
                        ctx.beginPath();
                        ctx.arc(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            pipeWidth/1.5,
                            0,
                            Math.PI * 2
                        );
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                    
                    const time = Date.now() / 1000;
                    for (let i = 0; i < 20; i++) {
                        const t = ((time * 0.2 + i * 0.05) % 1);
                        const y = shaftEndY - chamberHeight + (pad.y - (shaftEndY - chamberHeight)) * t;
                        
                        const bubbleGradient = ctx.createRadialGradient(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            0,
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            5
                        );
                        bubbleGradient.addColorStop(0, 'rgba(0, 100, 255, 0.9)');
                        bubbleGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
                        
                        ctx.fillStyle = bubbleGradient;
                        ctx.beginPath();
                        ctx.arc(
                            shaftX + shaftWidth/2 + offset - camera.x,
                            y - camera.y,
                            5,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }

                    const plantX = chamberX + chamberWidth/2;
                    const plantY = shaftEndY;
                    const domeRadius = 60;
                    ctx.beginPath();
                    ctx.arc(
                        plantX + offset - camera.x,
                        plantY - domeRadius - camera.y,
                        domeRadius,
                        Math.PI,
                        0
                    );
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    const strutCount = 8;
                    for (let i = 0; i <= strutCount; i++) {
                        const x = plantX - domeRadius + (i * (domeRadius * 2) / strutCount);
                        ctx.beginPath();
                        ctx.moveTo(x + offset - camera.x, plantY - camera.y);
                        ctx.lineTo(x + offset - camera.x, plantY - domeRadius * 2 - camera.y);
                        ctx.strokeStyle = '#666';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }

                    const towerPositions = [-80, 80]; 
                    towerPositions.forEach(xOffset => {
                        const towerX = plantX + xOffset;
                        const towerHeight = 100;
                        const towerBaseWidth = 40;
                        const towerTopWidth = 30;

                        ctx.beginPath();
                        ctx.moveTo(towerX - towerBaseWidth/2 + offset - camera.x, plantY - camera.y);
                        ctx.quadraticCurveTo(
                            towerX - towerTopWidth/2 + offset - camera.x,
                            plantY - towerHeight/2 - camera.y,
                            towerX - towerTopWidth/2 + offset - camera.x,
                            plantY - towerHeight - camera.y
                        );
                        ctx.lineTo(towerX + towerTopWidth/2 + offset - camera.x, plantY - towerHeight - camera.y);
                        ctx.quadraticCurveTo(
                            towerX + towerTopWidth/2 + offset - camera.x,
                            plantY - towerHeight/2 - camera.y,
                            towerX + towerBaseWidth/2 + offset - camera.x,
                            plantY - camera.y
                        );
                        ctx.strokeStyle = '#ccc';
                        ctx.lineWidth = 1;
                        ctx.stroke();

                        const steamParticles = 5;
                        for (let i = 0; i < steamParticles; i++) {
                            const particleOffset = Math.sin(time * 2 + i) * 10;
                            const alpha = Math.max(0, 1 - (i * 0.2));
                            ctx.beginPath();
                            ctx.arc(
                                towerX + particleOffset + offset - camera.x,
                                plantY - towerHeight - 20 - (i * 15) - camera.y,
                                10 + (i * 3),
                                0,
                                Math.PI * 2
                            );
                            ctx.fillStyle = `rgba(200, 200, 200, ${alpha * 0.3})`;
                            ctx.fill();
                        }
                    });

                    const lightCount = 3;
                    for (let i = 0; i < lightCount; i++) {
                        const blinkPhase = Math.sin(time * 2 + i * 2);
                        const alpha = (blinkPhase + 1) / 2;
                        
                        ctx.beginPath();
                        ctx.arc(
                            plantX - 20 + (i * 20) + offset - camera.x,
                            plantY - domeRadius * 2 - 10 - camera.y,
                            2,
                            0,
                            Math.PI * 2
                        );
                        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
                        ctx.fill();
                    }

                    const wallGap = pipeWidth * 1;  
                    const verticalGap = pipeWidth * 1; 
                    const bottomPipeOffset = pipeWidth * 1; 
                    const topPipeOffset = pipeWidth * 1;    

                    ctx.beginPath();
                    ctx.moveTo(
                        plantX + offset - camera.x,
                        shaftEndY - bottomPipeOffset - camera.y
                    );
                    ctx.lineTo(
                        chamberX + chamberWidth - wallGap + offset - camera.x,
                        shaftEndY - bottomPipeOffset - camera.y
                    );
                    ctx.lineTo(
                        chamberX + chamberWidth - verticalGap + offset - camera.x,
                        shaftEndY - chamberHeight + topPipeOffset - camera.y
                    );
                    ctx.lineTo(
                        shaftX + shaftWidth/2 + offset - camera.x,
                        shaftEndY - chamberHeight + topPipeOffset - camera.y
                    );
                    ctx.lineTo(
                        shaftX + shaftWidth/2 + offset - camera.x,
                        pad.y - camera.y
                    );

                    ctx.strokeStyle = '#111';
                    ctx.lineWidth = pipeWidth;
                    ctx.stroke();

                    const horizontalDist1 = chamberX + chamberWidth - (shaftX + shaftWidth/2);
                    const numJoints1 = Math.floor(horizontalDist1 / 100);
                    const horizontalDist2 = (chamberX + chamberWidth - wallGap) - plantX;
                    const numJoints2 = Math.floor(horizontalDist2 / 100);
                    for (let i = 1; i <= numJoints2; i++) {
                        const x = plantX + (i * horizontalDist2 / numJoints2);
                        ctx.beginPath();
                        ctx.arc(
                            x + offset - camera.x,
                            shaftEndY - bottomPipeOffset - camera.y,
                            pipeWidth/1.5,
                            0,
                            Math.PI * 2
                        );
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }

                    for (let i = 1; i < numJoints1; i++) {
                        const x = shaftX + shaftWidth/2 + (i * horizontalDist1 / numJoints1);
                        ctx.beginPath();
                        ctx.arc(
                            x + offset - camera.x,
                            shaftEndY - chamberHeight + topPipeOffset - camera.y,
                            pipeWidth/1.5,
                            0,
                            Math.PI * 2
                        );
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }

                    const verticalDist = (shaftEndY - bottomPipeOffset) - (shaftEndY - chamberHeight + topPipeOffset);
                    const numVerticalJoints = Math.floor(verticalDist / 100);
                    for (let i = 1; i < numVerticalJoints; i++) {
                        ctx.beginPath();
                        ctx.arc(
                            chamberX + chamberWidth - verticalGap + offset - camera.x,
                            shaftEndY - bottomPipeOffset - (i * verticalDist / numVerticalJoints) - camera.y,
                            pipeWidth/1.5,
                            0,
                            Math.PI * 2
                        );
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }

                    for (let i = 0; i < 20; i++) {
                        const t = ((time * 0.2 + i * 0.05) % 1);
                        
                        let x, y;
                        
                        if (t < 0.25) {
                            const horizontalT = t / 0.25;
                            x = plantX + horizontalT * (chamberX + chamberWidth - wallGap - plantX);
                            y = shaftEndY - bottomPipeOffset;
                        } else if (t < 0.5) {
                            const verticalT = (t - 0.25) / 0.25;
                            x = chamberX + chamberWidth - verticalGap;
                            y = shaftEndY - bottomPipeOffset - verticalT * ((shaftEndY - bottomPipeOffset) - (shaftEndY - chamberHeight + topPipeOffset));
                        } else if (t < 0.75) {
                            const horizontalT = (t - 0.5) / 0.25;
                            x = chamberX + chamberWidth - verticalGap - horizontalT * (chamberX + chamberWidth - verticalGap - (shaftX + shaftWidth/2));
                            y = shaftEndY - chamberHeight + topPipeOffset;
                        } else {
                            const verticalT = (t - 0.75) / 0.25;
                            x = shaftX + shaftWidth/2;
                            y = shaftEndY - chamberHeight + topPipeOffset - verticalT * (shaftEndY - chamberHeight + topPipeOffset - pad.y);
                        }
                        
                        const bubbleGradient = ctx.createRadialGradient(
                            x + offset - camera.x,
                            y - camera.y,
                            0,
                            x + offset - camera.x,
                            y - camera.y,
                            5
                        );
                        bubbleGradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
                        bubbleGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
                        
                        ctx.fillStyle = bubbleGradient;
                        ctx.beginPath();
                        ctx.arc(
                            x + offset - camera.x,
                            y - camera.y,
                            5,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }

                    const chamberLandingPadWidth = 120;
                    const chamberLandingPadX = chamberX + chamberWidth * 0.2; 

                }
            };

            if (this.antennaMast) {
                const mast = this.antennaMast;
                const time = performance.now() / 1000;

                ctx.beginPath();
                ctx.moveTo(mast.x - mast.width/2 + offset - camera.x, mast.y - camera.y);
                ctx.lineTo(mast.x + mast.width/2 + offset - camera.x, mast.y - camera.y);
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 1;
                ctx.stroke();

                const segments = 8;
                const segmentHeight = mast.height / segments;
                
                for (let i = 0; i < segments; i++) {
                    const y = mast.y - (i * segmentHeight);
                    
                    ctx.beginPath();
                    ctx.moveTo(mast.x - 15 + offset - camera.x, y - camera.y);
                    ctx.lineTo(mast.x + 15 + offset - camera.x, y - camera.y);
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    if (i === 0) {
                        ctx.beginPath();
                        ctx.moveTo(mast.x - 15 + offset - camera.x, mast.y - camera.y);
                        ctx.lineTo(mast.x - 15 + offset - camera.x, mast.y - mast.height - camera.y);
                        ctx.moveTo(mast.x + 15 + offset - camera.x, mast.y - camera.y);
                        ctx.lineTo(mast.x + 15 + offset - camera.x, mast.y - mast.height - camera.y);
                        ctx.strokeStyle = '#ccc';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }

                    ctx.beginPath();
                    ctx.moveTo(mast.x - 15 + offset - camera.x, y - camera.y);
                    ctx.lineTo(mast.x + 15 + offset - camera.x, y - segmentHeight - camera.y);
                    ctx.moveTo(mast.x + 15 + offset - camera.x, y - camera.y);
                    ctx.lineTo(mast.x - 15 + offset - camera.x, y - segmentHeight - camera.y);
                    ctx.strokeStyle = '#777';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }

                const antennaPositions = [0.3, 0.6, 0.9]; 
                antennaPositions.forEach((pos, index) => {
                    const y = mast.y - (mast.height * pos);
                    const direction = index % 2 === 0 ? 1 : -1; 
                    const x = mast.x + (direction * 20);

                    ctx.save();
                    ctx.translate(x + offset - camera.x, y - camera.y);
                    ctx.rotate(direction * Math.PI * 0.25 + Math.sin(time + index) * 0.1);
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, 12, -Math.PI * 0.6, Math.PI * 0.6);
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(-2, 0);
                    ctx.lineTo(2, 0);
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    ctx.restore();
                });

                const lightPositions = [0.2, 0.5, 0.8, 1.0];
                lightPositions.forEach((pos, index) => {
                    const y = mast.y - (mast.height * pos);
                    const pulseIntensity = (Math.sin(time * 2 + index) + 1) / 2;
                    
                    const gradient = ctx.createRadialGradient(
                        mast.x + offset - camera.x, y - camera.y, 0,
                        mast.x + offset - camera.x, y - camera.y, 4
                    );
                    gradient.addColorStop(0, `rgba(255, 0, 0, ${0.8 * pulseIntensity})`);
                    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(mast.x + offset - camera.x, y - camera.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        })


        if (this.deliveryRocket) {
            this.deliveryRocket.draw(ctx, camera, offset);
        }

        for (const box of this.groundBoxes) {
            ctx.fillStyle = box.color;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.fillRect(
                box.x + offset - camera.x - 8, 
                box.y - camera.y - 4,          
                16,                            
                8                              
            );
            ctx.strokeRect(
                box.x + offset - camera.x - 8,
                box.y - camera.y - 4,
                16,
                8
            );
        }
    }

    update(deltaTime) {
        if (this.deliveryRocket) {
            this.deliveryRocket.update();
            
            if (this.deliveryRocket.state === 'unloading' || this.deliveryRocket.state === 'departing') {
                for (const box of this.deliveryRocket.unloadedBoxes) {
                    if (!this.groundBoxes.includes(box)) {
                        this.groundBoxes.push(box);
                    }
                }
            }
            
            if (this.deliveryRocket.state === 'departing' && 
                this.deliveryRocket.pos.y < -500) {
                this.groundBoxes = [...this.deliveryRocket.unloadedBoxes];
                this.cargoBoxes = this.groundBoxes.length;
                this.deliveryRocket = null;
                this.deliveryTimer = 0;
            }
        } else {
            this.deliveryTimer += deltaTime;
            if (this.deliveryTimer > 2 && this.cargoBoxes === 0) { 
                const pad = this.landingPads[0]; 
                this.deliveryRocket = new DeliveryRocket(
                    pad.x + pad.width/2,
                    pad.y,
                    this.game  
                );
                
                this.deliveryRocket.onBoxUnloaded = (box) => {
                    if (!this.groundBoxes.includes(box)) {
                        this.groundBoxes.push(box);
                    }
                };
            }
        }
    }

    startDelivery() {
        const pad = this.landingPads[0];
        this.deliveryRocket = new DeliveryRocket(
            pad.x + pad.width/2,  
            pad.y,
            this.game 
        );
        this.deliveryTimer = 0;
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }w

    smoothStep(t) {
        return t * t * (3 - 2 * t);
    }

    isPartOfLandingPad(x) {
        return this.landingPads.some(pad => 
            x >= pad.x - 120 && x <= pad.x + pad.width + 120
        );
    }

    update(deltaTime) {
        if (this.deliveryRocket) {
            this.deliveryRocket.update();
            
            if (this.deliveryRocket.state === 'unloading') {
                this.cargoBoxes = this.deliveryRocket.boxesUnloaded;
            }
            
            if (this.deliveryRocket.state === 'departing' && 
                this.deliveryRocket.pos.y < -500) {
                this.deliveryRocket = null;
                this.deliveryTimer = 0;
            }
        } else {
            this.deliveryTimer += deltaTime;
            if (this.deliveryTimer > 2 && this.cargoBoxes === 0) {
                const pad = this.landingPads[0]; 
                this.deliveryRocket = new DeliveryRocket(
                    pad.x + pad.width/2, 
                    pad.y,
                    this.game  
                );
            }
        }
    }
}    

class Particle {
    constructor(x, y, angle, speed, life = 1, size = 0.5) {
        this.x = x;
        this.y = y;
        this.vel = {
            x: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
            y: Math.sin(angle) * speed + (Math.random() - 0.5) * 2
        };
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.gravity = 0; 
    }

    update() {
        this.x += this.vel.x;
        this.y += this.vel.y;
        this.vel.y += this.gravity;
        this.life -= 0.01;
        return this.life > 0;
    }

    draw(ctx, camera, offset = 0) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(
            this.x + offset - camera.x,
            this.y - camera.y,
            this.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

class Lander {
    constructor(x, y, game) {
        this.pos = { x, y };
        this.vel = { x: 0, y: 0 };
        this.angle = 0;
        this.angularVel = 0;
        this.mainThrust = 0;
        this.leftThrust = 0;
        this.rightThrust = 0;
        this.size = 20;
        this.fuel = 1000;
        this.particles = [];
        this.trajectoryPoints = [];
        this.previousTrajectoryPoints = [];
        this.trajectoryLerp = 1;
        this.terrain = null;
        this.rotationThrust = 0; 
        this.maxRotationThrust = 1.0; 
        this.rotationBuildupRate = 0.15; 
        this.rotationDecayRate = 0.01; 
        this.game = game;
        this.settling = false; 
        this.damage = 0;  
        this.lastLandingImpact = 0; 
        this.repairing = false;
        this.cargoBoxes = 0; 
        this.cargoColors = []; 
    }

    draw(ctx, camera, offset = 0) {
        if (this.trajectoryPoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(
                this.pos.x + offset - camera.x,
                this.pos.y - camera.y
            );
            
            const numPoints = Math.min(
                this.trajectoryPoints.length,
                this.previousTrajectoryPoints.length
            );
            
            const checkInterval = 3; 
            
            for (let i = 0; i < numPoints; i++) {
                const current = this.trajectoryPoints[i];
                const previous = this.previousTrajectoryPoints[i] || current;
                
                const x = previous.x + (current.x - previous.x) * this.trajectoryLerp;
                const y = previous.y + (current.y - previous.y) * this.trajectoryLerp;
                
                if (i % checkInterval === 0) {
                    const wrappedX = ((x % this.terrain.width) + this.terrain.width) % this.terrain.width;
                    const altitude = this.getTerrainHeight(wrappedX) - y;
                    if (altitude <= 0) {
                        ctx.lineTo(
                            x + offset - camera.x,
                            y - camera.y
                        );
                        break;
                    }
                }
                
                ctx.lineTo(
                    x + offset - camera.x,
                    y - camera.y
                );
            }
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        this.particles.forEach(p => p.draw(ctx, camera, offset));

        ctx.save();
        ctx.translate(this.pos.x + offset - camera.x, this.pos.y - camera.y);
        ctx.rotate(this.angle);
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        
        ctx.moveTo(0, -this.size * 1.5);
        ctx.lineTo(this.size/3, -this.size/2);  
        ctx.lineTo(this.size/3, this.size);     
        ctx.lineTo(-this.size/3, this.size);    
        ctx.lineTo(-this.size/3, -this.size/2); 
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-this.size/3, this.size);    
        ctx.lineTo(-this.size/1.2, this.size * 1.5);
        ctx.moveTo(this.size/3, this.size);     
        ctx.lineTo(this.size/1.2, this.size * 1.5); 
        ctx.stroke();

        if (this.mainThrust > 0) {
            this.drawThruster(ctx, 0, this.size, 0, this.size * 1.5);
        }
        if (this.leftThrust > 0) {
            this.drawThruster(ctx, this.size/3, 0, this.size/1.2, 0);  
        }
        if (this.rightThrust > 0) {
            this.drawThruster(ctx, -this.size/3, 0, -this.size/1.2, 0); 
        }
        
        ctx.restore();

        if (this.damage > 0) {
            ctx.save();
            ctx.translate(this.pos.x + offset - camera.x, this.pos.y - camera.y);
            
            if (this.repairing) {
                const time = Date.now() / 1000;
                const sparkCount = 25;
                for (let i = 0; i < sparkCount; i++) {
                    const angle = (time * 1.5 + (i * Math.PI * 2 / sparkCount)) % (Math.PI * 2);
                    const radius = this.size * 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#00aa00';
                    ctx.fill();
                }
            }

            const crackCount = Math.floor(this.damage / 20);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 0.5;
            
            for (let i = 0; i < crackCount; i++) {
                const angle = (Math.PI * 2 * i / crackCount) + this.angle;
                const length = this.size * (0.3 + Math.random() * 0.3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                ctx.stroke();
            }

            if (this.damage > 70 && Math.random() < 0.1) {
                this.particles.push(new Particle(
                    this.pos.x,
                    this.pos.y,
                    Math.PI * 1.5,
                    0.5,
                    2,
                    1
                ));
            }
            
            ctx.restore();
        }

    }

    drawThruster(ctx, x1, y1, x2, y2) {
        ctx.strokeStyle = 'white';
        for (let i = 0; i < 3; i++) {
            const spread = Math.random() * 5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2 + spread, y2 + Math.random() * 10);
            ctx.stroke();
        }
    }

    update(canvasWidth, canvasHeight) {
        const GRAVITY = 0.05;
        const THRUST_POWER = 0.07;
        const ROTATION_POWER = 0.0005;
        const ROTATION_DAMPING = 0.998;
        const MAX_ROTATION = 0.1;
        const DAMPING = 0.997;
        const SETTLING_SPEED = 0.05;

        this.particles = this.particles.filter(p => p.update());

        if (this.mainThrust > 0) {
            this.vel.x += Math.sin(this.angle) * THRUST_POWER;
            this.vel.y -= Math.cos(this.angle) * THRUST_POWER;
            this.emitParticles('main');
        }
        if (this.leftThrust > 0) {
            this.angularVel -= ROTATION_POWER;
            this.emitParticles('left');
        }
        if (this.rightThrust > 0) {
            this.angularVel += ROTATION_POWER;
            this.emitParticles('right');
        }

        if (this.game.gameState === 'landed') {
            if (Math.abs(this.angle) > 0.01) {
                this.settling = true;
                const rotationDir = this.angle > 0 ? -1 : 1;
                this.angle += rotationDir * SETTLING_SPEED;
                
                if (Math.abs(this.angle) < SETTLING_SPEED) {
                    this.angle = 0;
                    this.settling = false;
                }
            } else {
                this.angle = 0;
                this.angularVel = 0;
                this.settling = false;
            }

            if (!this.settling) {
                this.vel.x = 0;
                this.vel.y = 0;
            }
            return;
        }

        this.vel.y += GRAVITY;

        this.angularVel *= ROTATION_DAMPING;
        this.angle += this.angularVel;
        this.angle = this.angle % (Math.PI * 2);
        
        this.vel.x *= DAMPING;
        this.vel.y *= DAMPING;
        
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
    }

    getSpeed() {
        return Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y) * 10;
    }

    getAngle() {
        return ((this.angle % (Math.PI * 2)) * 180 / Math.PI).toFixed(0);
    }

    emitParticles(thrustType) {
        const mainParticleCount = 6;
        const sideParticleCount = 3;
        const mainSpeed = 2;
        const sideSpeed = 1;
        const mainLife = 1.5;
        const sideLife = 1.2;
        
        const rotatePoint = (x, y) => {
            const cos = Math.cos(this.angle);
            const sin = Math.sin(this.angle);
            return {
                x: this.pos.x + (x * cos - y * sin),
                y: this.pos.y + (x * sin + y * cos)
            };
        };
        
        switch(thrustType) {
            case 'main':
                for (let i = 0; i < mainParticleCount; i++) {
                    const emitPoint = rotatePoint(0, this.size);
                    const particleAngle = this.angle + Math.PI/2 + (Math.random() - 0.5) * 0.5;
                    this.particles.push(new Particle(
                        emitPoint.x,
                        emitPoint.y,
                        particleAngle,
                        mainSpeed + Math.random() * 2,
                        mainLife,
                        0.5
                    ));
                }
                break;
            case 'right':
                for (let i = 0; i < sideParticleCount; i++) {
                    const emitPoint = rotatePoint(-this.size/2, 0);
                    const particleAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.5;
                    this.particles.push(new Particle(
                        emitPoint.x,
                        emitPoint.y,
                        particleAngle,
                        sideSpeed + Math.random() * 1,
                        sideLife,
                        0.5
                    ));
                }
                break;
            case 'left':
                for (let i = 0; i < sideParticleCount; i++) {
                    const emitPoint = rotatePoint(this.size/2, 0);
                    const particleAngle = this.angle + 0 + (Math.random() - 0.5) * 0.5;
                    this.particles.push(new Particle(
                        emitPoint.x,
                        emitPoint.y,
                        particleAngle,
                        sideSpeed + Math.random() * 1,
                        sideLife,
                        0.5
                    ));
                }
                break;
        }
    }

    predictTrajectory() {
        const GRAVITY = 0.05;
        const PREDICTION_STEPS = 100;
        const STEP_SIZE = 2;
        
        this.previousTrajectoryPoints = this.trajectoryPoints;
        this.trajectoryPoints = [];
        this.trajectoryLerp = 0; 
        
        let simX = this.pos.x;
        let simY = this.pos.y;
        let simVelX = this.vel.x;
        let simVelY = this.vel.y;
        
        for (let i = 0; i < PREDICTION_STEPS; i++) {
            simVelY += GRAVITY * STEP_SIZE;
            simX += simVelX * STEP_SIZE;
            simY += simVelY * STEP_SIZE;
            this.trajectoryPoints.push({ x: simX, y: simY });
        }
    }

    getTerrainHeight(x) {
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            const p1 = this.terrain.points[i];
            const p2 = this.terrain.points[i + 1];
            
            if (x >= p1.x && x <= p2.x) {
                const t = (x - p1.x) / (p2.x - p1.x);
                return p1.y + (p2.y - p1.y) * t;
            }
        }
        return this.terrain.height;
    }


    handleLandingImpact(speed) {
        const angleImpact = Math.abs(this.angle % (Math.PI * 2));
        const speedImpact = speed / 12; 
        
        const totalImpact = (speedImpact * 0.7) + (angleImpact * 0.3);
        this.lastLandingImpact = totalImpact;

        if (totalImpact > 0.5) { 
            const newDamage = this.damage + (totalImpact - 0.5) * 40; 
            this.damage = Math.min(100, newDamage);
            
            if (this.damage >= 100) {
                this.game.gameState = 'crashed';
                this.game.createExplosion(this.pos.x, this.pos.y);
                return false;
            }
        }

        return this.damage < 100;
    }

    updateRepairs(deltaTime) {
        if (this.repairing && this.damage > 0) {
            this.damage = Math.max(0, this.damage - (deltaTime * 33.33)); 
            if (this.damage === 0) {
                this.repairing = false;
            }
        }
    }
}

class Game {
    constructor() {
        this.hudElements = [
            'hud',
            'hashrates',
            'max-stats',
            'orientation-indicator',
            'velocity-indicator',
            'mothership-indicator',
            'damage-indicator',
            'altitude-warning',
            'cargo-indicator',
            'cargo-sections'
        ];

        this.paused = false;

        this.setHUDVisibility(false);

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        document.getElementById('welcome-panel').style.display = 'block';
        
        this.welcomeTitle = 'ASIC LANDER';
        this.welcomeSubtitle = 'PRESS SPACE TO START';
        this.gameState = 'welcome';
        
        this.camera = new Camera();
        this.terrain = new Terrain(this.canvas.width, this.canvas.height, this);
        this.stars = new Stars(this.canvas.width, this.canvas.height, this);
        this.explosionParticles = [];
        this.mothership = new Mothership(this.canvas.width, this.canvas.height);
        
        this.setupInputs();
        this.gameLoop();
        this.terrain.mothership = this.mothership; 
        
        this.orientationCanvas = document.getElementById('orientation-indicator');
        this.orientationCanvas.width = 60;
        this.orientationCanvas.height = 60;
        this.orientationCtx = this.orientationCanvas.getContext('2d');
        
        this.mothershipIndicator = document.getElementById('mothership-indicator');
        this.mothershipIndicator.width = 60; 
        this.mothershipIndicator.height = 60;
        this.mothershipCtx = this.mothershipIndicator.getContext('2d');

        this.velocityCanvas = document.getElementById('velocity-indicator');
        this.velocityCtx = this.velocityCanvas.getContext('2d');
        this.velocityCanvas.width = 60;
        this.velocityCanvas.height = 60;

        this.distanceTraveled = 0; 

        this.damageIndicator = document.getElementById('damage-indicator');
        this.damageIndicator.width = 60;
        this.damageIndicator.height = 60;
        this.damageCtx = this.damageIndicator.getContext('2d');

        this.altitudeWarning = document.getElementById('altitude-warning');
        this.altitudeWarning.width = 60;
        this.altitudeWarning.height = 60;
        this.altitudeCtx = this.altitudeWarning.getContext('2d');

        this.maxSpeed = 0;
        this.maxHSpeed = 0;
        this.maxVSpeed = 0;
        this.maxRotSpeed = 0;
        this.maxAltitude = 0;

        this.cargoCanvas = document.getElementById('cargo-indicator');
        this.cargoCanvas.width = 40;
        this.cargoCanvas.height = 40;
        this.cargoCtx = this.cargoCanvas.getContext('2d');

        this.damageThresholds = {
            fifty: false,
            eighty: false,
            wasRepaired: false 
        };

        this.highScores = this.loadHighScores();
        this.updateHighScoresDisplay();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    reset() {
        this.terrain = new Terrain(this.canvas.width, this.canvas.height, this);
        this.stars = new Stars(this.canvas.width, this.canvas.height, this);
        this.lander = new Lander(this.canvas.width / 2, 100, this);
        this.lander.terrain = this.terrain;
        this.explosionParticles = [];
        this.gameState = 'playing'; 
        this.stateTimer = 0;
        this.mothership = new Mothership(this.canvas.width, this.canvas.height);
        this.terrain.mothership = this.mothership;
        this.distanceTraveled = 0;  

        document.querySelector('#hashrates .methane').textContent = '500 ZH/s';
        document.querySelector('#hashrates .geothermal').textContent = '1000 ZH/s';
        document.querySelector('#hashrates .nuclear').textContent = '1500 ZH/s';
        this.updateTotalHashrate();
        
        document.getElementById('welcome-panel').style.display = 'none';

        this.setHUDVisibility(true);

        this.paused = false;
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.textContent = 'âšâš';
        }
    }

    setupInputs() {
        this.keys = {};
        window.addEventListener('keydown', e => {
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
            }

            switch(e.key) {
                case 'w':
                case 'W':
                case 'ArrowUp':
                    this.keys.w = true;
                    break;
                case 'a':
                case 'A':
                case 'ArrowLeft':
                    this.keys.a = true;
                    break;
                case 'd':
                case 'D':
                case 'ArrowRight':
                    this.keys.d = true;
                    break;
            }

            if (e.key === ' ') {
                if (this.gameState === 'welcome') {
                    this.reset();
                } else if (this.gameState === 'crashed') {
                    this.gameState = 'welcome';
                    document.getElementById('welcome-panel').classList.remove('hud-hidden');
                    document.getElementById('message-display').style.opacity = '0';
                    document.querySelector('#hashrates .methane .value').textContent = '0 ZH/s';
                    document.querySelector('#hashrates .geothermal .value').textContent = '0 ZH/s';
                    document.querySelector('#hashrates .nuclear .value').textContent = '0 ZH/s';
                    document.querySelector('#hashrates .total .value').textContent = '0 ZH/s';
                }
            }
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });

        window.addEventListener('keyup', e => {
            switch(e.key) {
                case 'w':
                case 'W':
                case 'ArrowUp':
                    this.keys.w = false;
                    break;
                case 'a':
                case 'A':
                case 'ArrowLeft':
                    this.keys.a = false;
                    break;
                case 'd':
                case 'D':
                case 'ArrowRight':
                    this.keys.d = false;
                    break;
            }
        });
    }

    togglePause() {
        if (this.gameState === 'playing' || this.gameState === 'landed') {
            this.paused = !this.paused;
            if (this.paused) {
                this.showMessage('PAUSED - PRESS P TO RESUME', 999999);
            } else {
                document.getElementById('message-display').style.opacity = '0';
            }
        }
    }

    updateHUD() {
        document.getElementById('speed').textContent = 
            Math.abs(this.lander.getSpeed()).toFixed(0);
        document.getElementById('hspeed').textContent = 
            (this.lander.vel.x * 10).toFixed(0);
        document.getElementById('vspeed').textContent = 
            (this.lander.vel.y * 10).toFixed(0);
        document.getElementById('angle').textContent = 
            `${this.lander.getAngle()}Â°`;
        
        const groundAltitude = this.getTerrainDistance(this.lander.pos.x, this.lander.pos.y + this.lander.size * 1.5);
        document.getElementById('altitude').textContent = 
            Math.max(0, Math.floor(groundAltitude));

        const landerBottom = this.lander.pos.y + this.lander.size * 1.5;
        const distToHull = Math.min(
            Math.abs(this.mothership.y - landerBottom),
            Math.abs(this.mothership.padY - landerBottom) 
        );
        document.getElementById('mothership').textContent = 
            Math.max(0, Math.floor(distToHull));

        const damageElement = document.getElementById('damage');
        if (damageElement) {
            damageElement.textContent = Math.round(this.lander.damage) + '%';
        }
        
        this.orientationCtx.clearRect(0, 0, 60, 60);
        
        this.orientationCtx.save();
        this.orientationCtx.translate(30, 30);
        this.orientationCtx.rotate(this.lander.angle);
        this.orientationCtx.scale(1.5, 1.5);  
        
        this.orientationCtx.strokeStyle = 'white';
        this.orientationCtx.lineWidth = 0.8; 
        this.orientationCtx.beginPath();
        
        this.orientationCtx.moveTo(0, -12);
        this.orientationCtx.lineTo(4, -4);
        this.orientationCtx.lineTo(4, 8);
        this.orientationCtx.lineTo(-4, 8);
        this.orientationCtx.lineTo(-4, -4);
        this.orientationCtx.closePath();
        this.orientationCtx.stroke();
        
        this.orientationCtx.beginPath();
        this.orientationCtx.moveTo(-4, 8);
        this.orientationCtx.lineTo(-8, 12);
        this.orientationCtx.moveTo(4, 8);
        this.orientationCtx.lineTo(8, 12);
        this.orientationCtx.stroke();
        
        if (this.lander.mainThrust > 0) {
            this.orientationCtx.beginPath();
            this.orientationCtx.moveTo(0, 8);
            this.orientationCtx.lineTo(0, 14);
            this.orientationCtx.strokeStyle = '#ff9900';
            this.orientationCtx.stroke();
        }
        if (this.lander.leftThrust > 0) {
            this.orientationCtx.beginPath();
            this.orientationCtx.moveTo(4, 0);
            this.orientationCtx.lineTo(8, 0);
            this.orientationCtx.strokeStyle = '#ff9900';
            this.orientationCtx.stroke();
        }
        if (this.lander.rightThrust > 0) {
            this.orientationCtx.beginPath();
            this.orientationCtx.moveTo(-4, 0);
            this.orientationCtx.lineTo(-8, 0);
            this.orientationCtx.strokeStyle = '#ff9900';
            this.orientationCtx.stroke();
        }
        
        this.orientationCtx.restore();

        this.velocityCtx.clearRect(0, 0, 60, 60);
        this.velocityCtx.save();
        this.velocityCtx.translate(30, 30);

        const velocityAngle = Math.atan2(this.lander.vel.y, this.lander.vel.x);
        this.velocityCtx.rotate(velocityAngle + Math.PI/2);

        this.velocityCtx.strokeStyle = 'white';
        this.velocityCtx.lineWidth = 2;
        this.velocityCtx.beginPath();

        this.velocityCtx.moveTo(0, -12);
        this.velocityCtx.lineTo(8, 0);
        this.velocityCtx.lineTo(-8, 0);
        this.velocityCtx.closePath();

        this.velocityCtx.moveTo(0, 0);
        this.velocityCtx.lineTo(0, 12);

        this.velocityCtx.stroke();

        const speed = this.lander.getSpeed();
        const alpha = Math.min(1, speed / 12);
        this.velocityCtx.fillStyle = `white`;
        this.velocityCtx.fill();

        this.velocityCtx.restore();

        this.mothershipCtx.clearRect(0, 0, 60, 60);
        this.mothershipCtx.save();
        this.mothershipCtx.translate(30, 30);

        const dx = this.mothership.x - this.lander.pos.x;
        const dy = this.mothership.padY - this.lander.pos.y;
        const angleToMothership = Math.atan2(dy, dx);
        this.mothershipCtx.rotate(angleToMothership + Math.PI/2);

        this.mothershipCtx.strokeStyle = 'white';
        this.mothershipCtx.lineWidth = 2;
        this.mothershipCtx.beginPath();

        this.mothershipCtx.moveTo(0, -12);
        this.mothershipCtx.lineTo(8, 0);
        this.mothershipCtx.lineTo(-8, 0);
        this.mothershipCtx.closePath();

        this.mothershipCtx.moveTo(0, 0);
        this.mothershipCtx.lineTo(0, 12);

        this.mothershipCtx.stroke();

        const mothershipDist = Math.sqrt(dx * dx + dy * dy);
        const distanceAlpha = Math.min(1, 1000 / mothershipDist);
        this.mothershipCtx.fillStyle = `white`;
        this.mothershipCtx.fill();

        this.mothershipCtx.restore();

        const rotSpeed = (this.lander.angularVel * (180/Math.PI) * 60).toFixed(1);
        document.getElementById('rotspeed').textContent = `${rotSpeed}Â°/s`;

        if (this.gameState === 'playing') {
            const speed = Math.sqrt(this.lander.vel.x * this.lander.vel.x + this.lander.vel.y * this.lander.vel.y);
            this.distanceTraveled += speed;
        }
        document.getElementById('distance').textContent = Math.floor(this.distanceTraveled);

        let travelDirection = 0;
        if (Math.abs(this.lander.vel.x) > 0.01 || Math.abs(this.lander.vel.y) > 0.01) {
            travelDirection = Math.atan2(-this.lander.vel.y, this.lander.vel.x) * (180/Math.PI);
            travelDirection = ((90 - travelDirection) % 360 + 360) % 360;
            travelDirection = travelDirection.toFixed(1);
        }
        document.getElementById('traveldir').textContent = `${travelDirection}Â°`;

        this.damageCtx.clearRect(0, 0, 60, 60);
        
        this.damageCtx.fillStyle = '#000';
        this.damageCtx.fillRect(0, 0, 60, 60);
        
        const damage = this.lander.damage;
        const red = Math.floor((damage / 100) * 255);
        const green = Math.floor(((100 - damage) / 100) * 255);
        
        this.damageCtx.fillStyle = `rgba(${red}, ${green}, 0, 0.6)`;
        this.damageCtx.font = 'bold 36px monospace';
        this.damageCtx.textAlign = 'center';
        this.damageCtx.textBaseline = 'middle';
        this.damageCtx.fillText(Math.round(damage) , 30, 30);

        this.altitudeCtx.clearRect(0, 0, 60, 60);
        
        this.altitudeCtx.fillStyle = '#000';
        this.altitudeCtx.fillRect(0, 0, 60, 60);
        
        const altitude = this.getAltitude();
        
        const greenThreshold = 1000;  
        const yellowThreshold = 500;  
        const redThreshold = 100;     
        
        const barHeight = 50;
        let fillColor;
        let fillHeight;
        
        if (altitude > yellowThreshold) {
            fillColor = 'green';
            fillHeight = barHeight * ((altitude - yellowThreshold) / (greenThreshold - yellowThreshold));
            fillHeight = Math.min(barHeight, fillHeight);
        } else if (altitude > redThreshold) {
            fillColor = 'yellow';
            fillHeight = barHeight * ((altitude - redThreshold) / (yellowThreshold - redThreshold));
        } else {
            fillColor = 'red';
            fillHeight = barHeight * (altitude / redThreshold);
        }
        
        fillHeight = fillHeight > 0 ? Math.max(2, fillHeight) : 0;
        
        const barWidth = 8;
        const centerX = 30;
        const bottomY = 55;
        this.altitudeCtx.fillStyle = '#333';
        this.altitudeCtx.fillRect(centerX - barWidth/2, bottomY - barHeight, barWidth, barHeight);
        
        this.altitudeCtx.fillStyle = fillColor;
        this.altitudeCtx.fillRect(
            centerX - barWidth/2,
            bottomY - fillHeight,
            barWidth,
            fillHeight
        );
        
        const currentSpeed = this.lander.getSpeed();
        const currentHSpeed = Math.abs(this.lander.vel.x * 10);
        const currentVSpeed = Math.abs(this.lander.vel.y * 10);

        this.maxSpeed = Math.max(this.maxSpeed, currentSpeed);
        this.maxHSpeed = Math.max(this.maxHSpeed, currentHSpeed);
        this.maxVSpeed = Math.max(this.maxVSpeed, currentVSpeed);

        document.getElementById('max-speed').textContent = Math.floor(this.maxSpeed);
        document.getElementById('max-hspeed').textContent = Math.floor(this.maxHSpeed);
        document.getElementById('max-vspeed').textContent = Math.floor(this.maxVSpeed);

        const currentRotSpeed = Math.abs(parseFloat(document.getElementById('rotspeed').textContent));
        this.maxRotSpeed = Math.max(this.maxRotSpeed, currentRotSpeed);
        document.getElementById('max-rotspeed').textContent = Math.floor(this.maxRotSpeed) + 'Â°/s';
        const currentAltitude = this.getAltitude();

        this.maxAltitude = Math.max(this.maxAltitude, currentAltitude);
        document.getElementById('max-altitude').textContent = Math.floor(this.maxAltitude);

        const cargoElement = document.getElementById('cargo');
        if (this.lander.cargoBoxes > 0) {
            const colorNames = {
                '#00ff00': 'GREEN',
                '#ff0000': 'RED',
                '#ffff00': 'YELLOW'
            };
            const cargoList = this.lander.cargoColors.map(color => colorNames[color]).join(', ');
            cargoElement.textContent = cargoList;
        } else {
            cargoElement.textContent = 'EMPTY';
        }

        this.cargoCtx.clearRect(0, 0, this.cargoCanvas.width, this.cargoCanvas.height);

        const sectionHeight = this.cargoCanvas.height / 3;

        const colors = ['#00ff00', '#ff0000', '#ffff00'];  
        for (let i = 0; i < 3; i++) {
            this.cargoCtx.fillStyle = '#000';
            this.cargoCtx.fillRect(0, i * sectionHeight, this.cargoCanvas.width, sectionHeight);
            
            if (this.lander.cargoColors && this.lander.cargoColors.includes(colors[i])) {
                this.cargoCtx.fillStyle = colors[i].replace(')', ', 0.4)').replace('rgb', 'rgba');
                this.cargoCtx.fillRect(0, i * sectionHeight, this.cargoCanvas.width, sectionHeight);
            }
            
            this.cargoCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.cargoCtx.lineWidth = 1;
            this.cargoCtx.strokeRect(0, i * sectionHeight, this.cargoCanvas.width, sectionHeight);
        }

        if (damage < 100) {
            if (damage >= 80 && !this.damageThresholds.eighty) {
                this.damageThresholds.eighty = true;
                this.showMessage('CRITICAL WARNING: 80% DAMAGE. DOCK AT SPACE STATION IMMEDIATELY FOR REPAIRS.');
            } else if (damage >= 50 && !this.damageThresholds.fifty) {
                this.damageThresholds.fifty = true;
                this.showMessage('CAUTION: 50% DAMAGE. DOCK AT SPACE STATION FOR REPAIRS.');
            }
        }

        if (damage > 0) {
            this.damageThresholds.wasRepaired = true;
        }

        if (this.gameState === 'landed' && 
            this.lander.pos.y <= this.mothership.padY && 
            this.lander.pos.y >= this.mothership.y &&
            this.lander.pos.x >= this.mothership.padX && 
            this.lander.pos.x <= this.mothership.padX + this.mothership.padWidth) {
            
            if (damage === 0 && this.damageThresholds.wasRepaired) {
                this.showMessage('ALL SYSTEMS REPAIRED');
                this.damageThresholds.fifty = false;
                this.damageThresholds.eighty = false;
                this.damageThresholds.wasRepaired = false;
            }
        }

        if (damage < 50) {
            this.damageThresholds.fifty = false;
            this.damageThresholds.eighty = false;
        }
    }

    checkCollision() {
        const bounds = {
            bottom: this.lander.pos.y + this.lander.size * 1.5,
            left: this.lander.pos.x - this.lander.size,
            right: this.lander.pos.x + this.lander.size,
            top: this.lander.pos.y - this.lander.size * 1.5
        };

        const checkPoints = [
            { x: this.lander.pos.x, y: bounds.bottom }, 
            { x: bounds.left, y: bounds.bottom },       
            { x: bounds.right, y: bounds.bottom },      
            { x: bounds.left, y: bounds.top },          
            { x: bounds.right, y: bounds.top }     
        ];

        const checkRectCollision = (x, width, yTop, yBottom) => {
            const wrappedX = this.wrapCoordinate(x, this.terrain.width);
            for (const point of checkPoints) {
                const wrappedPointX = this.wrapCoordinate(point.x, this.terrain.width);
                if (wrappedPointX >= wrappedX && 
                    wrappedPointX <= wrappedX + width &&
                    point.y >= yBottom &&
                    point.y <= yTop) {
                    return true;
                }
            }
            return false;
        };

        for (const pad of this.terrain.landingPads) {
            if (checkRectCollision(
                pad.buildingX, 
                pad.buildingWidth, 
                pad.y, 
                pad.y - pad.buildingHeight
            )) {
                return 'crash';
            }

            if (pad.number === 2 && pad.antennaWidth > 0 && 
                checkRectCollision(
                    pad.antennaX,
                    pad.antennaWidth,
                    pad.y,
                    pad.y - 40
                )) {
                return 'crash';
            }
        }

        if (this.terrain.antennaMast) {
            const mast = this.terrain.antennaMast;
            if (checkRectCollision(
                mast.x - mast.width/2,
                mast.width,
                mast.y,
                mast.y - mast.height
            )) {
                return 'crash';
            }

            const platformWidth = 160;
            if (checkRectCollision(
                mast.x - platformWidth/2,
                platformWidth,
                mast.y,
                mast.y - 40
            )) {
                return 'crash';
            }
        }

        const wrappedLanderLeft = this.wrapCoordinate(bounds.left, this.terrain.width);
        const wrappedLanderRight = this.wrapCoordinate(bounds.right, this.terrain.width);
        const numPoints = 5;

        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            const p1 = this.terrain.points[i];
            const p2 = this.terrain.points[i + 1];
            
            for (let j = 0; j < numPoints; j++) {
                const t = j / (numPoints - 1);
                const checkX = this.wrapCoordinate(
                    bounds.left + (bounds.right - bounds.left) * t,
                    this.terrain.width
                );
                
                if (checkX >= p1.x && checkX <= p2.x) {
                    const terrainT = (checkX - p1.x) / (p2.x - p1.x);
                    const terrainY = p1.y + (p2.y - p1.y) * terrainT;
                    
                    if (bounds.bottom >= terrainY) {
                        const isLandingPad = this.terrain.landingPads.some(pad => {
                            const wrappedPadX = this.wrapCoordinate(pad.x, this.terrain.width);
                            return wrappedLanderRight >= wrappedPadX && 
                                   wrappedLanderLeft <= wrappedPadX + pad.width &&
                                   Math.abs(p1.y - p2.y) < 1;
                        });

                        if (isLandingPad) {
                            const speed = this.lander.getSpeed();
                            const angleOk = Math.abs(this.lander.angle % (Math.PI * 2)) < 0.3;
                            
                            if (speed < 12 && angleOk) {
                                if (this.lander.handleLandingImpact(speed)) {
                                    return 'landed';
                                } else {

                                    return this.crashWithDamage();
                                }
                            }
                            return this.crashWithDamage();
                        }
                        return this.crashWithDamage();
                    }
                }
            }
        }

        if (this.lander.pos.y < this.mothership.padY + 1000) {
            const bounds = {
                bottom: this.lander.pos.y + this.lander.size * 1.5,
                left: this.lander.pos.x - this.lander.size,
                right: this.lander.pos.x + this.lander.size,
                top: this.lander.pos.y - this.lander.size * 1.5
            };

            const wallTolerance = 5;
            
            if (bounds.right >= this.mothership.bayX &&
                bounds.left <= this.mothership.bayX + this.mothership.bayWidth &&
                bounds.bottom >= this.mothership.y &&
                bounds.top <= this.mothership.y + this.mothership.bayDepth) {
                
                if (bounds.bottom >= this.mothership.padY &&
                    bounds.bottom <= this.mothership.padY + 10 &&
                    bounds.right >= this.mothership.padX &&
                    bounds.left <= this.mothership.padX + this.mothership.padWidth) {
                    
                    const speed = this.lander.getSpeed();
                    const angleOk = Math.abs(this.lander.angle % (Math.PI * 2)) < 0.3;
                    
                    if (speed < 12 && angleOk) {
                        if (this.lander.handleLandingImpact(speed)) {
                            return 'landed';
                        }
                    }
                    return 'crash';
                }
                
                if (bounds.right > this.mothership.bayX + this.mothership.bayWidth - wallTolerance ||
                    bounds.left < this.mothership.bayX + wallTolerance) {
                    return 'crash';
                }
                
                return null;
            }

            if (bounds.bottom >= this.mothership.y &&
                bounds.top <= this.mothership.y + this.mothership.height) {
                
                if (bounds.right >= this.mothership.x - this.mothership.width/2 &&
                    bounds.left <= this.mothership.x + this.mothership.width/2 &&
                    !(bounds.right >= this.mothership.bayX + wallTolerance &&
                      bounds.left <= this.mothership.bayX + this.mothership.bayWidth - wallTolerance &&
                      bounds.top <= this.mothership.y + this.mothership.bayDepth)) {
                    return 'crash';
                }
            }

            const panelWidth = 360;
            const panelHeight = 120;
            const panelGap = 20;
            
            if (bounds.bottom >= this.mothership.y + 40 &&
                bounds.top <= this.mothership.y + 40 + panelHeight &&
                bounds.right >= this.mothership.x - this.mothership.width/2 - panelWidth - panelGap &&
                bounds.left <= this.mothership.x - this.mothership.width/2 - panelGap) {
                return 'crash';
            }
            
            if (bounds.bottom >= this.mothership.y + 40 &&
                bounds.top <= this.mothership.y + 40 + panelHeight &&
                bounds.right >= this.mothership.x + this.mothership.width/2 + panelGap &&
                bounds.left <= this.mothership.x + this.mothership.width/2 + panelGap + panelWidth) {
                return 'crash';
            }

            const strutCount = 5;
            for (let i = 0; i < strutCount; i++) {
                const y = this.mothership.y + 40 + i * (panelHeight / (strutCount - 1));
                
                if (bounds.bottom >= y - 2 &&
                    bounds.top <= y + 2 &&
                    bounds.right >= this.mothership.x - this.mothership.width/2 - panelGap &&
                    bounds.left <= this.mothership.x - this.mothership.width/2) {
                    return 'crash';
                }
                
                if (bounds.bottom >= y - 2 &&
                    bounds.top <= y + 2 &&
                    bounds.right >= this.mothership.x + this.mothership.width/2 &&
                    bounds.left <= this.mothership.x + this.mothership.width/2 + panelGap) {
                    return 'crash';
                }
            }
        }

        return null;
    }

    wrapCoordinate(x, width) {
        return ((x % width) + width) % width;
    }

    gameLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const deltaTime = 1/60;

        this.ctx.save();
        
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);

        for (let offset = -1; offset <= 1; offset++) {
            const worldOffset = offset * this.terrain.width;
            
            this.stars.draw(this.ctx, this.camera, this.terrain, worldOffset);
            this.terrain.draw(this.ctx, this.camera, worldOffset);
            
            this.mothership.drawMainHull(this.ctx, this.camera, worldOffset);
            
            this.mothership.drawLandingBay(this.ctx, this.camera, worldOffset);
            
            this.explosionParticles.forEach(p => p.draw(this.ctx, this.camera, worldOffset));
            
            if (this.gameState === 'playing' || this.gameState === 'landed') {
                const relativeX = this.wrapCoordinate(this.lander.pos.x - worldOffset, this.terrain.width);
                if (relativeX >= -this.canvas.width && relativeX <= this.terrain.width + this.canvas.width) {
                    this.lander.draw(this.ctx, this.camera, worldOffset);
                }
            }
        }

        this.ctx.restore();

        switch (this.gameState) {
            case 'welcome':
                this.drawWelcomeScreen();
                this.setHUDVisibility(false);
                this.camera.x += 0.5;
                this.camera.x = this.wrapCoordinate(this.camera.x, this.terrain.width);
                this.camera.y = this.terrain.height * 0.3;
                this.camera.zoom = 0.5;
                break;

            case 'playing':
            case 'landed':
                this.setHUDVisibility(true);
                if (!this.paused) { 
                    this.updateGame();
                }
                this.updateHUD();
                break;

            case 'crashed':
                this.explosionParticles = this.explosionParticles.filter(p => p.update());
                this.stateTimer += deltaTime;
                
                if (this.stateTimer > 2) {
                    const totalHashrate = parseInt(document.querySelector('#hashrates .total .value').textContent.replace(' ZH/s', ''));
                    this.saveHighScore(totalHashrate);
                    this.showMessage(`FINAL HASHRATE: <span style="color: rgba(255, 165, 0, 0.8)">${totalHashrate} ZH/s</span>\n\nPRESS SPACE TO CONTINUE`, 999999);
                }
                
                if (this.stateTimer > 2 && this.keys[' ']) {
                    this.gameState = 'welcome';
                    this.stateTimer = 0;
                    this.setHUDVisibility(false);
                    document.getElementById('message-display').style.opacity = '0';
                }
                break;
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    drawWelcomeScreen() {
        const welcomePanel = document.getElementById('welcome-panel');
        welcomePanel.style.display = this.gameState === 'welcome' ? 'block' : 'none';
    }

    updateGame() {
        this.explosionParticles = this.explosionParticles.filter(p => p.update());

        if (this.gameState === 'playing' || this.gameState === 'landed') {
            if (!(this.gameState === 'landed' && this.lander.settling)) {
                this.lander.mainThrust = this.keys['w'] ? 1 : 0;
                this.lander.leftThrust = this.keys['a'] ? 1 : 0;
                this.lander.rightThrust = this.keys['d'] ? 1 : 0;

                if (this.gameState === 'playing') {
                    this.lander.predictTrajectory();
                }

                if (this.gameState === 'landed' && !this.lander.settling && 
                    (this.lander.mainThrust > 0 || this.lander.leftThrust > 0 || this.lander.rightThrust > 0)) {
                    this.gameState = 'playing';
                    this.lander.vel.y = -0.5;
                }
            }

            this.lander.update(this.canvas.width, this.canvas.height);
            this.camera.follow(this.lander, this.canvas.width, this.canvas.height, this.terrain.width, this.terrain, this.gameState);

            this.lander.pos.x = this.wrapCoordinate(this.lander.pos.x, this.terrain.width);

            const collisionResult = this.checkCollision();
            if (collisionResult === 'crash') {
                this.lander.damage = 100;
                this.updateHUD();
                this.showMessage('SHIP DESTROYED');
                this.gameState = 'crashed';
                this.createExplosion(this.lander.pos.x, this.lander.pos.y);
            } else if (collisionResult === 'landed' && this.gameState === 'playing') {
                this.gameState = 'landed';
                const padY = this.getLandingPadY(this.lander.pos.x);
                if (padY !== null) {
                    this.lander.pos.y = padY - this.lander.size * 1.5;
                }
                
                this.checkLanding();
                
                if (this.lander.pos.y <= this.mothership.padY + 10 && 
                    this.lander.pos.x >= this.mothership.padX && 
                    this.lander.pos.x <= this.mothership.padX + this.mothership.padWidth) {
                    this.lander.repairing = true;
                }

                this.lander.vel.x *= 0.5;
                this.lander.vel.y = 0;
            }

            this.lander.updateRepairs(1/60);
        }

        if (this.gameState === 'landed') {
            const pad = this.terrain.landingPads[0]; 
            if (this.lander.pos.x >= pad.x && 
                this.lander.pos.x <= pad.x + pad.width) {
                if (this.terrain.deliveryRocket?.unloadedBoxes.length > 0 && this.lander.cargoBoxes === 0) {
                    this.lander.cargoBoxes = this.terrain.deliveryRocket.unloadedBoxes.length;
                    this.lander.cargoColors = this.terrain.deliveryRocket.unloadedBoxes.map(box => box.color);
                    this.terrain.deliveryRocket.unloadedBoxes = [];
                }
                else if (this.terrain.groundBoxes.length > 0 && this.lander.cargoBoxes === 0) {
                    this.lander.cargoBoxes = this.terrain.groundBoxes.length;
                    this.lander.cargoColors = this.terrain.groundBoxes.map(box => box.color);
                    this.terrain.groundBoxes = [];
                }
            }
        }

        this.terrain.update(1/60);
        
        this.stars.update(1/60); 
    }

    getLandingPadY(x) {
        const wrappedX = this.wrapCoordinate(x, this.terrain.width);
        for (const pad of this.terrain.landingPads) {
            const wrappedPadX = this.wrapCoordinate(pad.x, this.terrain.width);
            if (wrappedX >= wrappedPadX && wrappedX <= wrappedPadX + pad.width) {
                return pad.y;
            }
        }
        return null;
    }

    createExplosion(x, y) {
        const particleCount = 500;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;
            const particle = new Particle(
                x,
                y,
                angle,
                speed,
                1 + Math.random(),  
                0.5  
            );
            particle.gravity = 0.05;  
            this.explosionParticles.push(particle);
        }
    }

    getAltitude() {
        const landerBottom = this.lander.pos.y + this.lander.size * 1.5;
        
        if (this.lander.pos.y <= this.mothership.y + this.mothership.height) {
            return 1000;
        }
        
        return this.getTerrainDistance(this.lander.pos.x, landerBottom);
    }

    getTerrainDistance(x, y) {
        const wrappedX = this.wrapCoordinate(x, this.terrain.width);
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            const p1 = this.terrain.points[i];
            const p2 = this.terrain.points[i + 1];
            
            if (wrappedX >= p1.x && wrappedX <= p2.x) {
                const t = (wrappedX - p1.x) / (p2.x - p1.x);
                const terrainY = p1.y + (p2.y - p1.y) * t;
                return Math.max(0, terrainY - y);
            }
        }
        return 0;
    }

    crashWithDamage() {
        this.lander.damage = 100;
        return 'crash';
    }

    checkLanding() {
        const freightPad = this.terrain.landingPads[0];
        if (this.lander.pos.x >= freightPad.x && 
            this.lander.pos.x <= freightPad.x + freightPad.width) {
            
            if (this.terrain.groundBoxes.length > 0) {
                this.lander.cargoBoxes = this.terrain.groundBoxes.length;
                this.lander.cargoColors = [...this.terrain.groundBoxes.map(box => box.color)];
                this.terrain.groundBoxes = [];
                this.terrain.cargoBoxes = 0;
                this.showMessage('ASICS READY TO BE DELIVERED'); 
            } else if (this.terrain.deliveryRocket && 
                       this.terrain.deliveryRocket.unloadedBoxes.length > 0) {
                this.lander.cargoBoxes = this.terrain.deliveryRocket.unloadedBoxes.length;
                this.lander.cargoColors = [...this.terrain.deliveryRocket.unloadedBoxes.map(box => box.color)];
                this.terrain.deliveryRocket.collectBoxes();
                this.showMessage('CARGO LOADED: ASICS READY TO BE DELIVERED');  
            }
        }
        
        const pad1 = this.terrain.landingPads[1];
        if (this.lander.pos.x >= pad1.x && 
            this.lander.pos.x <= pad1.x + pad1.width &&
            this.lander.cargoColors.includes('#00ff00')) {
            
            const greenIndex = this.lander.cargoColors.indexOf('#00ff00');
            this.lander.cargoColors.splice(greenIndex, 1);
            this.lander.cargoBoxes--;
            
            const methaneElement = document.querySelector('#hashrates .methane');
            const currentRate = parseInt(methaneElement.textContent.match(/\d+/)[0]);
            methaneElement.textContent = `${currentRate + 20} ZH/s`;
            
            this.updateTotalHashrate();
            this.showMessage('ASICS DELIVERED TO METHANE MINE - HASHRATE INCREASED'); 
            this.checkForNewDelivery();
        }
        
        const pad2 = this.terrain.landingPads[2];
        if (this.lander.pos.x >= pad2.x && 
            this.lander.pos.x <= pad2.x + pad2.width &&
            this.lander.cargoColors.includes('#ff0000')) {
            
            const redIndex = this.lander.cargoColors.indexOf('#ff0000');
            this.lander.cargoColors.splice(redIndex, 1);
            this.lander.cargoBoxes--;
            
            const geothermalElement = document.querySelector('#hashrates .geothermal');
            const currentRate = parseInt(geothermalElement.textContent.match(/\d+/)[0]);
            geothermalElement.textContent = `${currentRate + 25} ZH/s`;
            
            this.updateTotalHashrate();
            this.showMessage('ASICS DELIVERED TO GEOTHERMAL MINE - HASHRATE INCREASED'); 
            this.checkForNewDelivery();
        }
        
        const pad3 = this.terrain.landingPads[3];
        if (this.lander.pos.x >= pad3.x && 
            this.lander.pos.x <= pad3.x + pad3.width &&
            this.lander.cargoColors.includes('#ffff00')) {
            
            const yellowIndex = this.lander.cargoColors.indexOf('#ffff00');
            this.lander.cargoColors.splice(yellowIndex, 1);
            this.lander.cargoBoxes--;
            
            const nuclearElement = document.querySelector('#hashrates .nuclear');
            const currentRate = parseInt(nuclearElement.textContent.match(/\d+/)[0]);
            nuclearElement.textContent = `${currentRate + 30} ZH/s`;
            
            this.updateTotalHashrate();
            this.showMessage('ASICS DELIVERED TO NUCLEAR MINE - HASHRATE INCREASED');
            this.checkForNewDelivery();
        }

        if (this.lander.cargoBoxes === 0 && 
            this.terrain.groundBoxes.length === 0 && 
            (!this.terrain.deliveryRocket || this.terrain.deliveryRocket.unloadedBoxes.length === 0)) {
            this.terrain.deliveryTimer = 0; 
        }
    }

    checkForNewDelivery() {
        if (this.lander.cargoBoxes === 0 && 
            this.terrain.groundBoxes.length === 0 && 
            (!this.terrain.deliveryRocket || 
             this.terrain.deliveryRocket.state === 'waiting')) {
            
            this.terrain.deliveryTimer = 0;
            setTimeout(() => this.terrain.startDelivery(), 3000);
        }
    }

    updateTotalHashrate() {
        const methaneRate = parseInt(document.querySelector('#hashrates .methane').textContent);
        const geothermalRate = parseInt(document.querySelector('#hashrates .geothermal').textContent);
        const nuclearRate = parseInt(document.querySelector('#hashrates .nuclear').textContent);
        const total = methaneRate + geothermalRate + nuclearRate;
        document.querySelector('#hashrates .total .value').textContent = `${total} ZH/s`;
    }

    showMessage(text, duration = 3000) {
        const messageDisplay = document.getElementById('message-display');
        messageDisplay.innerHTML = text;  
        messageDisplay.style.opacity = '1';
        
        setTimeout(() => {
            messageDisplay.style.opacity = '0';
        }, duration);
    }

    setHUDVisibility(visible) {
        if (!this.hudElements) return; 
        
        this.hudElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (visible) {
                    element.classList.remove('hud-hidden');
                } else {
                    element.classList.add('hud-hidden');
                }
            }
        });
    }

    loadHighScores() {
        const scores = localStorage.getItem('asicLanderHighScores');
        return scores ? JSON.parse(scores) : [];
    }

    saveHighScore(hashrate) {
        const score = parseInt(hashrate);
        
        const scores = this.loadHighScores();
        
        if (!scores.includes(score)) {
            scores.push(score);
        }
        
        scores.sort((a, b) => b - a);
        
        scores.splice(5);
        
        localStorage.setItem('asicLanderHighScores', JSON.stringify(scores));
        this.highScores = scores;
        this.updateHighScoresDisplay();
    }

    updateHighScoresDisplay() {
        const container = document.getElementById('high-scores-list');
        container.innerHTML = this.highScores.map((score, index) => `
            <div class="score">
                <span>${index + 1}. </span>
                <span class="hashrate">${score} ZH/s</span>
            </div>
        `).join('');

        while (container.children.length < 5) {
            const emptyScore = document.createElement('div');
            emptyScore.className = 'score';
            emptyScore.innerHTML = `
                <span>${container.children.length + 1}. </span>
                <span class="hashrate">---</span>
            `;
            container.appendChild(emptyScore);
        }
    }
}

class Mothership {
    constructor(width, height) {
        this.width = 400; 
        this.height = 200;
        this.x = width / 2; 
        this.y = height - 10500; 
        
        this.bayWidth = 160;  
        this.bayDepth = 60;   
        this.bayX = this.x - this.bayWidth/2; 
        this.padWidth = 120;
        this.padX = this.x - this.padWidth/2; 
        this.padY = this.y + this.bayDepth;   
    }

    draw(ctx, camera, offset = 0) {
        this.drawMainHull(ctx, camera, offset);
        this.drawLandingBay(ctx, camera, offset);
    }

    drawMainHull(ctx, camera, offset = 0) {
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.x - this.width/2 + offset - camera.x, this.y + this.height - camera.y);
        
        ctx.lineTo(this.x - this.width/2 + offset - camera.x, this.y + 50 - camera.y);
        
        ctx.quadraticCurveTo(
            this.x - this.width/2 + offset - camera.x, 
            this.y - camera.y,
            this.x + offset - camera.x, 
            this.y - camera.y
        );
        ctx.quadraticCurveTo(
            this.x + this.width/2 + offset - camera.x, 
            this.y - camera.y,
            this.x + this.width/2 + offset - camera.x, 
            this.y + 50 - camera.y
        );
        
        ctx.lineTo(this.x + this.width/2 + offset - camera.x, this.y + this.height - 50 - camera.y);
        
        ctx.quadraticCurveTo(
            this.x + this.width/2 + offset - camera.x,
            this.y + this.height - camera.y,
            this.x + offset - camera.x,
            this.y + this.height - camera.y
        );
        ctx.quadraticCurveTo(
            this.x - this.width/2 + offset - camera.x,
            this.y + this.height - camera.y,
            this.x - this.width/2 + offset - camera.x,
            this.y + this.height - 50 - camera.y
        );
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const panelWidth = 360;
        const panelHeight = 120;
        const panelGap = 20;
        
        ctx.fillStyle = '#111';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(
            this.x - this.width/2 - panelWidth - panelGap + offset - camera.x,
            this.y + 40 - camera.y,
            panelWidth,
            panelHeight
        );
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(
            this.x + this.width/2 + panelGap + offset - camera.x,
            this.y + 40 - camera.y,
            panelWidth,
            panelHeight
        );
        ctx.fill();
        ctx.stroke();

        const cellSize = 20;
        const drawPanelCells = (startX) => {
            for (let i = 0; i < panelWidth/cellSize; i++) {
                for (let j = 0; j < panelHeight/cellSize; j++) {
                    ctx.beginPath();
                    ctx.rect(
                        startX + i * cellSize + offset - camera.x,
                        this.y + 40 + j * cellSize - camera.y,
                        cellSize - 1,
                        cellSize - 1
                    );
                    ctx.fillStyle = '#000011';
                    ctx.fill();
                    ctx.strokeStyle = '#9999CC';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        };

        drawPanelCells(this.x - this.width/2 - panelWidth - panelGap);
        drawPanelCells(this.x + this.width/2 + panelGap);

        const strutCount = 5;  
        for (let i = 0; i < strutCount; i++) {
            const x = i * (panelHeight / (strutCount - 1));
            
            ctx.beginPath();
            ctx.moveTo(this.x - this.width/2 + offset - camera.x, this.y + 40 + x - camera.y);
            ctx.lineTo(this.x - this.width/2 - panelGap + offset - camera.x, this.y + 40 + x - camera.y);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2 + offset - camera.x, this.y + 40 + x - camera.y);
            ctx.lineTo(this.x + this.width/2 + panelGap + offset - camera.x, this.y + 40 + x - camera.y);
            ctx.stroke();
        }

        const windowSize = 15;
        const windowGap = 40;
        const windowY = this.y + 90;
        for (let i = 0; i < 7; i++) {
            ctx.fillStyle = '#88ffff';
            ctx.beginPath();
            ctx.arc(
                this.x - (this.width/2 - 80) + (i * windowGap) + offset - camera.x,
                windowY - camera.y,
                windowSize/2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        const hullStrutCount = 8;
        for (let i = 1; i < hullStrutCount; i++) {
            ctx.beginPath();
            ctx.moveTo(
                this.x - this.width/2 + (this.width * i/hullStrutCount) + offset - camera.x,
                this.y + 50 - camera.y
            );
            ctx.lineTo(
                this.x - this.width/2 + (this.width * i/hullStrutCount) + offset - camera.x,
                this.y + this.height - camera.y
            );
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        const time = Date.now() / 1000;
        const lightAlpha = (Math.sin(time * 2) + 1) / 2;
        
        ctx.fillStyle = `rgba(255, 0, 0, ${lightAlpha})`;
        ctx.beginPath();
        ctx.arc(
            this.x - this.width/2 + offset - camera.x,
            this.y + 30 - camera.y,
            5,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.fillStyle = `rgba(0, 255, 0, ${lightAlpha})`;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2 + offset - camera.x,
            this.y + 30 - camera.y,
            5,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    drawLandingBay(ctx, camera, offset = 0) {
        ctx.fillStyle = '#111';
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.rect(
            this.bayX + offset - camera.x,
            this.y - camera.y,
            this.bayWidth,
            this.bayDepth
        );
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.padX + offset - camera.x, this.padY - camera.y);
        ctx.lineTo(this.padX + this.padWidth + offset - camera.x, this.padY - camera.y);
        ctx.strokeStyle = '#0000ff'; 
        ctx.lineWidth = 3;
        ctx.stroke();

        const time = Date.now() / 1000;
        const lightAlpha = (Math.sin(time * 2) + 1) / 2;
        ctx.fillStyle = `rgba(255, 165, 0, ${lightAlpha})`;
        
        ctx.beginPath();
        ctx.arc(
            this.bayX + offset - camera.x,
            this.y - camera.y,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(
            this.bayX + this.bayWidth + offset - camera.x,
            this.y - camera.y,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

class DeliveryRocket {
    constructor(targetX, targetY, game) {  
        this.pos = { 
            x: 350 + 50,
            y: 0
        };
        this.target = { 
            x: 350 + 50,
            y: targetY
        };
        
        this.game = game;  
        this.vel = { x: 0, y: 0 };
        this.state = 'arriving';
        this.landingTimer = 0;
        this.boxesUnloaded = 0;
        this.nextBoxTime = 0;
        this.angle = 0;
        this.boxColors = ['#00ff00', '#ff0000', '#ffff00'];
        this.unloadedBoxes = [];
        this.boxWidth = 16;
        this.boxHeight = 8;
        this.opacity = 0;
        this.boxOpacity = 0;
        this.fadingBoxes = [];
    }

    update() {
        switch (this.state) {
            case 'arriving':
                this.opacity = Math.min(1, this.opacity + 0.01);
                
                const approachDy = this.target.y - this.pos.y;
                
                this.vel.y = Math.min(6, Math.max(2, Math.abs(approachDy) * 0.02));
                if (approachDy < this.vel.y) {
                    this.vel.y = approachDy;
                }
                this.pos.y += this.vel.y;
                
                this.pos.x = this.target.x;

                if (Math.abs(approachDy) < 0.1) { 
                    this.state = 'landed';
                    this.pos.y = this.target.y;  
                    this.vel.y = 0;
                }
                break;

            case 'departing':
                if (this.landingTimer < 1) {
                    this.landingTimer += 1/60;
                    return;
                }
                
                this.vel.y = -4;
                this.pos.y += this.vel.y;
                
                if (this.pos.y < 0) {
                    this.opacity = Math.max(0, this.opacity - 0.01);
                }

                if (this.opacity === 0) {
                    this.pos.y = 0;
                    this.state = 'waiting';
                }
                break;

            case 'landed':
                this.landingTimer += 1/60;
                if (this.landingTimer > 1) {
                    this.state = 'unloading';
                    this.nextBoxTime = 0;
                }
                break;

            case 'unloading':
                if (this.boxesUnloaded === 0) {
                    for (let i = 0; i < 3; i++) {
                        this.unloadedBoxes.push({
                            x: this.target.x + 20,
                            y: this.target.y - (i * this.boxHeight),
                            color: this.boxColors[i],
                            opacity: 0 
                        });
                    }
                    this.boxesUnloaded = 3;
                    this.game.showMessage('NEW ASICS HAVE ARRIVED, READY FOR COLLECTION.');
                }
                
                this.boxOpacity = Math.min(1, this.boxOpacity + 0.02);
                
                this.unloadedBoxes.forEach(box => {
                    box.opacity = this.boxOpacity;
                });
                
                if (this.boxOpacity >= 1) {
                    this.landingTimer = 0;
                    this.state = 'departing';
                }
                break;

            case 'waiting':
                break;
        }

        this.fadingBoxes = this.fadingBoxes.filter(box => {
            box.opacity -= 0.05;
            return box.opacity > 0;
        });
    }

    collectBoxes() {
        this.fadingBoxes.push(...this.unloadedBoxes.map(box => ({
            ...box,
            opacity: 1
        })));
        this.unloadedBoxes = [];
    }

    draw(ctx, camera, offset = 0) {
        if (this.unloadedBoxes.length > 0) {
            for (const box of this.unloadedBoxes) {
                this.drawBox(ctx, box, camera, offset);
            }
        }

        for (const box of this.fadingBoxes) {
            this.drawBox(ctx, box, camera, offset);
        }

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.pos.x + offset - camera.x, this.pos.y - camera.y);
        
        ctx.strokeStyle = 'white';
        ctx.fillStyle = '#444';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(8, 10);
        ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (this.state === 'arriving' || this.state === 'departing') {
            const flameSize = 1 + Math.random() * 0.5;
            ctx.beginPath();
            ctx.moveTo(-4, 10);
            ctx.lineTo(0, 20 * flameSize);
            ctx.lineTo(4, 10);
            ctx.fillStyle = '#ff3300';
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawBox(ctx, box, camera, offset) {
        ctx.save();
        ctx.globalAlpha = box.opacity;
        
        ctx.fillStyle = box.color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.fillRect(
            box.x + offset - camera.x - this.boxWidth/2,
            box.y - camera.y - this.boxHeight/2,
            this.boxWidth,
            this.boxHeight
        );
        ctx.strokeRect(
            box.x + offset - camera.x - this.boxWidth/2,
            box.y - camera.y - this.boxHeight/2,
            this.boxWidth,
            this.boxHeight
        );
        
        ctx.restore();
    }
}

new Game();

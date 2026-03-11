import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const outputDir = path.resolve('assets/pwa');
const iconJobs = [
    { filename: 'apple-touch-icon.png', size: 180, maskable: false },
    { filename: 'icon-192.png', size: 192, maskable: false },
    { filename: 'icon-512.png', size: 512, maskable: false },
    { filename: 'maskable-512.png', size: 512, maskable: true }
];

fs.mkdirSync(outputDir, { recursive: true });

for (const job of iconJobs) {
    const pngBuffer = createIcon(job.size, job.maskable);
    fs.writeFileSync(path.join(outputDir, job.filename), pngBuffer);
}

console.log(`Generated ${iconJobs.length} PWA icons in ${outputDir}`);

function createIcon(size, maskable) {
    const pixels = new Uint8Array(size * size * 4);
    const safeScale = maskable ? 0.8 : 0.9;

    paintBackground(pixels, size);
    drawGlow(pixels, size, size * 0.5, size * 0.35, size * 0.42, [255, 204, 66, 0.2]);
    drawGlow(pixels, size, size * 0.72, size * 0.2, size * 0.23, [52, 211, 153, 0.18]);

    const iconWidth = size * safeScale;
    const iconHeight = size * safeScale;
    const offsetX = (size - iconWidth) / 2;
    const offsetY = (size - iconHeight) / 2;

    drawRoad(pixels, size, offsetX, offsetY, iconWidth, iconHeight);
    drawBus(pixels, size, offsetX, offsetY, iconWidth, iconHeight);
    drawAccentRing(pixels, size, offsetX, offsetY, iconWidth, iconHeight);

    return encodePng(size, size, pixels);
}

function paintBackground(pixels, size) {
    const topLeft = [8, 14, 31];
    const bottomRight = [19, 77, 78];

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const diagonal = ((x / (size - 1)) * 0.38) + ((y / (size - 1)) * 0.62);
            const base = mixColor(topLeft, bottomRight, diagonal);
            const dx = (x / size) - 0.42;
            const dy = (y / size) - 0.3;
            const spotlight = Math.max(0, 1 - ((dx * dx) + (dy * dy)) * 4.2);
            const color = liftColor(base, spotlight * 0.18);
            setPixel(pixels, size, x, y, [...color, 255]);
        }
    }
}

function drawRoad(pixels, size, offsetX, offsetY, width, height) {
    const startY = offsetY + (height * 0.78);
    const roadHeight = height * 0.16;
    const roadColor = [11, 17, 26, 255];
    const shoulderColor = [255, 193, 7, 255];
    const laneColor = [255, 239, 192, 255];

    fillRoundedRect(
        pixels,
        size,
        offsetX + (width * 0.12),
        startY,
        width * 0.76,
        roadHeight,
        roadHeight * 0.45,
        roadColor
    );
    fillRect(pixels, size, offsetX + (width * 0.16), startY + 3, width * 0.68, 4, shoulderColor);
    fillRect(pixels, size, offsetX + (width * 0.16), startY + roadHeight - 7, width * 0.68, 4, shoulderColor);

    const dashWidth = width * 0.09;
    const dashGap = width * 0.055;
    for (let dashX = offsetX + (width * 0.23); dashX < offsetX + (width * 0.77); dashX += dashWidth + dashGap) {
        fillRoundedRect(
            pixels,
            size,
            dashX,
            startY + (roadHeight * 0.44),
            dashWidth,
            roadHeight * 0.14,
            roadHeight * 0.07,
            laneColor
        );
    }
}

function drawBus(pixels, size, offsetX, offsetY, width, height) {
    const busX = offsetX + (width * 0.16);
    const busY = offsetY + (height * 0.29);
    const busWidth = width * 0.68;
    const busHeight = height * 0.34;
    const busColor = [255, 180, 17, 255];
    const busShadow = [145, 91, 2, 255];
    const roofColor = [22, 32, 46, 255];
    const windowColor = [198, 242, 255, 255];
    const trimColor = [255, 246, 214, 255];

    fillRoundedRect(pixels, size, busX + (width * 0.015), busY + (height * 0.02), busWidth, busHeight, busHeight * 0.22, busShadow);
    fillRoundedRect(pixels, size, busX, busY, busWidth, busHeight, busHeight * 0.22, busColor);
    fillRoundedRect(pixels, size, busX + (busWidth * 0.08), busY - (busHeight * 0.12), busWidth * 0.68, busHeight * 0.2, busHeight * 0.1, roofColor);
    fillRect(pixels, size, busX + (busWidth * 0.08), busY + (busHeight * 0.62), busWidth * 0.72, busHeight * 0.06, busShadow);

    const windowY = busY + (busHeight * 0.18);
    const windowHeight = busHeight * 0.28;
    const gap = busWidth * 0.035;
    const firstWindowX = busX + (busWidth * 0.1);
    const windowWidth = busWidth * 0.17;

    for (let index = 0; index < 3; index += 1) {
        fillRoundedRect(
            pixels,
            size,
            firstWindowX + (index * (windowWidth + gap)),
            windowY,
            windowWidth,
            windowHeight,
            windowHeight * 0.18,
            windowColor
        );
    }

    fillRoundedRect(
        pixels,
        size,
        busX + (busWidth * 0.72),
        windowY + (busHeight * 0.03),
        busWidth * 0.12,
        busHeight * 0.46,
        busHeight * 0.08,
        trimColor
    );

    fillCircle(pixels, size, busX + (busWidth * 0.23), busY + busHeight, busHeight * 0.14, [10, 15, 22, 255]);
    fillCircle(pixels, size, busX + (busWidth * 0.74), busY + busHeight, busHeight * 0.14, [10, 15, 22, 255]);
    fillCircle(pixels, size, busX + (busWidth * 0.23), busY + busHeight, busHeight * 0.065, [107, 146, 157, 255]);
    fillCircle(pixels, size, busX + (busWidth * 0.74), busY + busHeight, busHeight * 0.065, [107, 146, 157, 255]);

    fillCircle(pixels, size, busX + (busWidth * 0.89), busY + (busHeight * 0.58), busHeight * 0.05, [255, 248, 185, 255]);
    fillCircle(pixels, size, busX + (busWidth * 0.92), busY + (busHeight * 0.54), busHeight * 0.038, [255, 110, 64, 255]);
    fillRect(pixels, size, busX + (busWidth * 0.05), busY + (busHeight * 0.78), busWidth * 0.22, busHeight * 0.05, trimColor);
}

function drawAccentRing(pixels, size, offsetX, offsetY, width, height) {
    const outerRadius = Math.min(width, height) * 0.51;
    const innerRadius = outerRadius - Math.max(6, size * 0.03);
    const centerX = offsetX + (width * 0.52);
    const centerY = offsetY + (height * 0.48);

    for (let y = Math.floor(centerY - outerRadius); y <= Math.ceil(centerY + outerRadius); y += 1) {
        for (let x = Math.floor(centerX - outerRadius); x <= Math.ceil(centerX + outerRadius); x += 1) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt((dx * dx) + (dy * dy));
            if (distance <= outerRadius && distance >= innerRadius) {
                const glow = distance > outerRadius - 2 ? 0.2 : 0;
                blendPixel(pixels, size, x, y, [255, 220, 110, 0.24 + glow]);
            }
        }
    }
}

function drawGlow(pixels, size, centerX, centerY, radius, color) {
    for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y += 1) {
        for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x += 1) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt((dx * dx) + (dy * dy));
            if (distance <= radius) {
                const alpha = (1 - (distance / radius)) * color[3];
                blendPixel(pixels, size, x, y, [color[0], color[1], color[2], alpha]);
            }
        }
    }
}

function fillRect(pixels, size, x, y, width, height, color) {
    const startX = Math.max(0, Math.floor(x));
    const startY = Math.max(0, Math.floor(y));
    const endX = Math.min(size, Math.ceil(x + width));
    const endY = Math.min(size, Math.ceil(y + height));

    for (let currentY = startY; currentY < endY; currentY += 1) {
        for (let currentX = startX; currentX < endX; currentX += 1) {
            setPixel(pixels, size, currentX, currentY, color);
        }
    }
}

function fillRoundedRect(pixels, size, x, y, width, height, radius, color) {
    const startX = Math.max(0, Math.floor(x));
    const startY = Math.max(0, Math.floor(y));
    const endX = Math.min(size, Math.ceil(x + width));
    const endY = Math.min(size, Math.ceil(y + height));
    const normalizedRadius = Math.max(0, radius);

    for (let currentY = startY; currentY < endY; currentY += 1) {
        for (let currentX = startX; currentX < endX; currentX += 1) {
            const localX = currentX - x;
            const localY = currentY - y;
            const insideCore = (
                (localX >= normalizedRadius && localX <= width - normalizedRadius) ||
                (localY >= normalizedRadius && localY <= height - normalizedRadius)
            );

            if (insideCore || insideRoundedCorner(localX, localY, width, height, normalizedRadius)) {
                setPixel(pixels, size, currentX, currentY, color);
            }
        }
    }
}

function fillCircle(pixels, size, centerX, centerY, radius, color) {
    const startX = Math.max(0, Math.floor(centerX - radius));
    const startY = Math.max(0, Math.floor(centerY - radius));
    const endX = Math.min(size, Math.ceil(centerX + radius));
    const endY = Math.min(size, Math.ceil(centerY + radius));

    for (let currentY = startY; currentY < endY; currentY += 1) {
        for (let currentX = startX; currentX < endX; currentX += 1) {
            const dx = currentX - centerX;
            const dy = currentY - centerY;
            if ((dx * dx) + (dy * dy) <= radius * radius) {
                setPixel(pixels, size, currentX, currentY, color);
            }
        }
    }
}

function insideRoundedCorner(localX, localY, width, height, radius) {
    if (radius === 0) return true;

    const cornerCenters = [
        [radius, radius],
        [width - radius, radius],
        [radius, height - radius],
        [width - radius, height - radius]
    ];

    for (const [centerX, centerY] of cornerCenters) {
        const inCornerX = Math.abs(localX - centerX) <= radius;
        const inCornerY = Math.abs(localY - centerY) <= radius;
        if (inCornerX && inCornerY) {
            const dx = localX - centerX;
            const dy = localY - centerY;
            return ((dx * dx) + (dy * dy)) <= radius * radius;
        }
    }

    return true;
}

function mixColor(start, end, amount) {
    return start.map((channel, index) => Math.round(channel + ((end[index] - channel) * amount)));
}

function liftColor(color, amount) {
    return color.map(channel => Math.round(channel + ((255 - channel) * amount)));
}

function setPixel(pixels, size, x, y, color) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const index = ((y * size) + x) * 4;
    pixels[index] = color[0];
    pixels[index + 1] = color[1];
    pixels[index + 2] = color[2];
    pixels[index + 3] = color[3];
}

function blendPixel(pixels, size, x, y, color) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const index = ((y * size) + x) * 4;
    const alpha = Math.max(0, Math.min(1, color[3]));
    const inverse = 1 - alpha;

    pixels[index] = Math.round((pixels[index] * inverse) + (color[0] * alpha));
    pixels[index + 1] = Math.round((pixels[index + 1] * inverse) + (color[1] * alpha));
    pixels[index + 2] = Math.round((pixels[index + 2] * inverse) + (color[2] * alpha));
    pixels[index + 3] = 255;
}

function encodePng(width, height, pixels) {
    const scanlines = Buffer.alloc((width * 4 + 1) * height);

    for (let y = 0; y < height; y += 1) {
        const rowStart = y * (width * 4 + 1);
        scanlines[rowStart] = 0;
        for (let x = 0; x < width; x += 1) {
            const sourceIndex = ((y * width) + x) * 4;
            const targetIndex = rowStart + 1 + (x * 4);
            scanlines[targetIndex] = pixels[sourceIndex];
            scanlines[targetIndex + 1] = pixels[sourceIndex + 1];
            scanlines[targetIndex + 2] = pixels[sourceIndex + 2];
            scanlines[targetIndex + 3] = pixels[sourceIndex + 3];
        }
    }

    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = 6;
    header[10] = 0;
    header[11] = 0;
    header[12] = 0;

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        createChunk('IHDR', header),
        createChunk('IDAT', zlib.deflateSync(scanlines)),
        createChunk('IEND', Buffer.alloc(0))
    ]);
}

function createChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const crcInput = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcInput), 0);

    return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

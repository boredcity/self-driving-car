class Sensor {
    #car;
    rayCount = 7;
    #rayLengthMultiplier = 3;
    #raySpread = Math.PI / 4;
    #rays = [];
    readings = [];

    constructor(car) {
        this.#car = car;
    }

    update({ roadBorders, traffic }) {
        this.#castRays();
        this.readings = [];
        for (const ray of this.#rays) {
            this.readings.push(this.#getReading(ray, roadBorders, traffic));
        }
    }

    draw(ctx) {
        ctx.save();
        roadCtx.globalAlpha = 0.5;
        for (let i = 0; i < this.rayCount; i++) {
            const [rayStart, rayEnd] = this.#rays[i];
            const rayReading = this.readings[i];
            const visibleEnd = rayReading ?? rayEnd;
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = rayReading ? COLOR.DANGER : COLOR.WARNING;
            ctx.moveTo(rayStart.x, rayStart.y);
            ctx.lineTo(visibleEnd.x, visibleEnd.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    #castRays() {
        this.#rays = [];
        const start = { x: this.#car.centerX, y: this.#car.centerY };
        const rayLength = this.#car.length * this.#rayLengthMultiplier;

        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle =
                lerp(
                    this.#raySpread / 2,
                    -this.#raySpread / 2,
                    this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1)
                ) + this.#car.angle;

            const end = {
                x: this.#car.centerX - Math.sin(rayAngle) * rayLength,
                y: this.#car.centerY - Math.cos(rayAngle) * rayLength
            };

            this.#rays.push([start, end]);
        }
    }

    #getReading([rayStart, rayEnd], roadBorders, traffic) {
        let touches = [];

        for (const [borderStart, borderEnd] of roadBorders) {
            const touch = getIntersection(
                rayStart,
                rayEnd,
                borderStart,
                borderEnd
            );
            if (touch) touches.push(touch);
        }

        for (const { polygon: trafficCarPolygon } of traffic) {
            for (let i = 0; i < trafficCarPolygon.length; i++) {
                const touch = getIntersection(
                    rayStart,
                    rayEnd,
                    trafficCarPolygon[i],
                    trafficCarPolygon[(i + 1) % trafficCarPolygon.length]
                );
                if (touch) touches.push(touch);
            }
        }

        if (touches.length === 0) return null;

        return touches.reduce((touch1, touch2) =>
            touch1.offset < touch2?.offset ?? Infinity ? touch1 : touch2
        );
    }
}

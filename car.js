class Car {
    #width;
    #height;
    centerX;
    centerY;
    #controls;
    #sensor;
    #useBrain = false;
    #speed = 2;
    #acceleration = 0.1;
    #maxForwardSpeed = 3;
    #maxReverseSpeed = 2;
    #friction = 0.03;
    angle = 0;
    #maxRotationSpeed = 0.03;
    hasCrashed = false;
    #color;
    avgSpeed = 3;
    #savedSpeeds = range(450).fill(this.avgSpeed);
    angleRepeats = 0;
    #prevAngle = this.angle;

    get length() {
        return this.#height;
    }

    constructor({
        centerX,
        centerY,
        color,
        width,
        height,
        controlsType,
        maxForwardSpeed = 2,
        maxReverseSpeed = (maxForwardSpeed * 2) / 3
    }) {
        this.#color = color;
        this.centerX = centerX;
        this.centerY = centerY;
        this.#maxForwardSpeed = maxForwardSpeed;
        this.#maxReverseSpeed = maxReverseSpeed;
        this.#width = width ?? (height * 3) / 5;
        this.#height = height ?? (width * 5) / 3;
        this.controlsType = controlsType;
        if (controlsType !== CONTROLS_TYPE.DUMMY) {
            if (controlsType === CONTROLS_TYPE.AI) {
                this.#useBrain = true;
            }
            this.#sensor = new Sensor(this);
            this.brain = new NeuralNetwork([this.#sensor.rayCount, 5, 4]);
        }
        this.#controls = new Controls(controlsType);
    }

    draw(ctx, drawSensor = false) {
        roundPolygonPath(ctx, this.polygon, 5);

        ctx.fillStyle = this.#color ?? COLOR.BLACK;
        ctx.fill();

        if (drawSensor) this.#sensor?.draw(ctx);
    }

    update({ roadBorders, traffic }) {
        if (!this.hasCrashed) {
            this.#move();
            this.polygon = this.#createPolygon();
            this.hasCrashed = this.#assessDamage(roadBorders, traffic);
            if (this.#sensor) {
                this.#sensor.update({ roadBorders, traffic });
                const offsets = this.#sensor?.readings.map(r =>
                    r === null ? 0 : 1 - r.offset
                );
                const outputs = NeuralNetwork.feedForward(offsets, this.brain);

                if (this.#useBrain) {
                    this.#controls.forward = outputs[0];
                    this.#controls.left = outputs[1];
                    this.#controls.right = outputs[2];
                    this.#controls.break = outputs[3];
                }
            }
            if (this.hasCrashed) this.#controls.removeKeyboardListeners();
        }
    }

    #assessDamage(roadBorders, traffic) {
        for (const border of roadBorders) {
            if (polysIntersect(this.polygon, border)) return true;
        }
        for (const { polygon: trafficCarPolygon } of traffic) {
            if (polysIntersect(this.polygon, trafficCarPolygon)) return true;
        }
        return false;
    }

    #createPolygon() {
        // ┌─────/B
        // │    /│
        // │  A/ │ height
        // │     │
        // └─────┘
        //  width
        // radius = AB
        // we need to account for car's angle

        const radius = Math.hypot(this.#width, this.#height) / 2; // hypotenuse
        const alpha = Math.atan2(this.#width, this.#height);
        return [alpha, -alpha, Math.PI + alpha, Math.PI + -alpha].map(
            adjustment => ({
                x: this.centerX - Math.sin(this.angle + adjustment) * radius,
                y: this.centerY - Math.cos(this.angle + adjustment) * radius
            })
        );
    }

    #move() {
        const speedDirectionMultiplier = this.#controls.forward ? 1 : -1;
        if (this.#controls.break) {
            // breaking
            this.#speed /= 1.05;
        } else if (this.#controls.forward !== this.#controls.reverse) {
            // acceleration / deceleration
            this.#speed += this.#acceleration * speedDirectionMultiplier;
            this.#speed = Math.min(
                Math.max(this.#speed, -this.#maxReverseSpeed),
                this.#maxForwardSpeed
            );
        }

        this.#savedSpeeds = this.#savedSpeeds.slice(1);
        this.#savedSpeeds.push(this.#speed);
        this.avgSpeed =
            this.#savedSpeeds.reduce((a, b) => a + b) /
            this.#savedSpeeds.length;

        if (this.angle !== this.#prevAngle) {
            this.angleRepeats = 0;
        } else {
            this.angleRepeats++;
        }
        this.#prevAngle = this.angle;

        if (Math.abs(this.#speed) < this.#friction) return;

        this.#speed += this.#speed > 0 ? -this.#friction : this.#friction;
        this.centerX -= Math.sin(this.angle) * this.#speed;
        this.centerY -= Math.cos(this.angle) * this.#speed;

        // rotation
        const flipMultiplier = this.#speed > 0 ? 1 : -1;
        const maxSpeed =
            this.#speed > 0 ? this.#maxForwardSpeed : this.#maxReverseSpeed;
        const rotationSpeed = Math.abs(
            (this.#maxRotationSpeed * this.#speed) / maxSpeed
        );
        if (this.#controls.left !== this.#controls.right) {
            const turnDirectionMultiplier = this.#controls.right ? -1 : 1;
            this.angle +=
                rotationSpeed * turnDirectionMultiplier * flipMultiplier;
        }
    }
}

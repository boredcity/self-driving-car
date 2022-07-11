class Road {
    #laneCount;
    #left;
    #right;
    #top = -1_000_000;
    #bottom = 1_000_000;
    #width;
    #lanesWidth;
    borders;
    constructor(centerX, width, laneCount) {
        this.#width = width;
        this.#lanesWidth = width * 0.9;
        this.#laneCount = laneCount;
        this.#left = centerX - this.#lanesWidth / 2;
        this.#right = centerX + this.#lanesWidth / 2;

        const topLeft = { x: this.#left, y: this.#top };
        const bottomLeft = { x: this.#left, y: this.#bottom };
        const topRight = { x: this.#right, y: this.#top };
        const bottomRight = { x: this.#right, y: this.#bottom };
        this.borders = [
            [topLeft, bottomLeft],
            [topRight, bottomRight],
        ];
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = COLOR.GREY;
        ctx.rect(this.#left - (this.#width - this.#lanesWidth) / 2, this.#top, this.#width, this.#bottom - this.#top);
        ctx.fill();
        ctx.restore();

        ctx.lineWidth = 10 / this.#laneCount;
        ctx.strokeStyle = 'white';

        const dashSegmentLength = 80 / this.#laneCount;
        for (let i = 1; i < this.#laneCount; i++) {
            const x = lerp(this.#left, this.#right, i / this.#laneCount);

            ctx.setLineDash([dashSegmentLength, dashSegmentLength]);
            ctx.beginPath();
            ctx.moveTo(x, this.#top);
            ctx.lineTo(x, this.#bottom);
            ctx.stroke();
        }

        ctx.setLineDash([]);
        for (const [start, end] of this.borders) {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }

    get laneWidth() {
        return this.#lanesWidth / this.#laneCount;
    }

    getLaneCenter(index) {
        if (index >= this.#laneCount || index < 0 || index % 1 !== 0) {
            throw new Error(
                `Cannot get center of lane #${index} of ${
                    this.#laneCount
                }: no such lane`
            );
        }
        return this.#left + this.laneWidth * (index + 1 / 2);
    }
}

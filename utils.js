const lerp = (A, B, t) => A + (B - A) * t;

const getIntersection = (A, B, C, D) => {
    // AB Intersects with CD if there is a point where:
    // A.x + (B.x - A.x)*t == C.x + (D.x - C.x)*u and
    // A.y + (B.y - A.y)*t == C.y + (D.y - C.y)*u

    // A.x + (B.x - A.x)*t == C.x + (D.x - C.x)*u | - C.x
    // (A.x - C.x) + (B.x - A.x)*t == (D.x - C.x)*u [remember]

    // A.y + (B.y - A.y)*t == C.y + (D.y - C.y)*u | - C.y
    // (A.y - C.y) + (B.y - A.y)*t == (D.y - C.y)*u | * (D.x - C.x)
    // (D.x - C.x)*(A.y - C.y) + (D.x - C.x)*(B.y - A.y)*t = (D.y - C.y)*(D.x - C.x)*u [ substitute]

    // (D.x - C.x)*(A.y - C.y) + (D.x - C.x)*(B.y - A.y)*t =
    // (D.y - C.y)*(A.x - C.x) + (D.y - C.y)*(B.x - A.x)*t | - (D.y - C.y)*(A.x - C.x)
    //                                                     | - (D.x - C.x)*(B.y - A.y)*t
    // (D.x - C.x)*(A.y - C.y) - (D.y - C.y)*(A.x - C.x) =
    // (D.y - C.y)*(B.x - A.x)*t - (D.x - C.x)*(B.y - A.y)*t

    const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
    const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
    const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
    if (bottom === 0) return null; // parallel
    const t = tTop / bottom;
    const u = uTop / bottom;
    if (t <= 0 || t > 1 || u <= 0 || u > 1) return null;
    return {
        x: lerp(A.x, B.x, t),
        y: lerp(A.y, B.y, t),
        offset: t
    };
};

const polysIntersect = (poly1, poly2) => {
    for (let i = 0; i < poly1.length; i++) {
        for (let j = 0; j < poly2.length; j++) {
            const firstPair = [poly1[i], poly1[(i + 1) % poly1.length]];
            const secondPair = [poly2[j], poly2[(j + 1) % poly2.length]];
            const doIntersect = getIntersection(...firstPair, ...secondPair);
            if (doIntersect) return true;
        }
    }
};

function getRGBA(value) {
    const alpha = Math.abs(value);
    const R = value < 0 ? 0 : 255;
    const G = R;
    const B = value > 0 ? 0 : 255;
    return 'rgba(' + R + ',' + G + ',' + B + ',' + alpha + ')';
}

function shuffle(arr) {
    return arr
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
}

function range(firstArg, secondArg) {
    let from = firstArg;
    let to = secondArg;
    if (secondArg === undefined) {
        from = 0;
        to = firstArg;
    }
    return Array.from({ length: to - from }).map((_, i) => i + from);
}

function roundPolygonPath(ctx, points, r) {
    ctx.beginPath();
    ctx.moveTo(
        (points[0].x + points[points.length - 1].x) / 2,
        (points[0].y + points[points.length - 1].y) / 2
    );
    for (let i = 0; i < points.length; i++) {
        if (i === points.length - 1) {
            ctx.arcTo(
                points[points.length - 1].x,
                points[points.length - 1].y,
                points[0].x,
                points[0].y, r);
        } else {
            ctx.arcTo(
                points[i].x,
                points[i].y,
                points[i + 1].x,
                points[i + 1].y,
                r
            );
        }
    }
    ctx.closePath();
}

function random(firstArg, secondArg) {
    let from = firstArg;
    let to = secondArg;

    if (secondArg === undefined) {
        from = 0;
        to = firstArg;
    }

    return Math.floor(from + Math.random() * (to - from));
}
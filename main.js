const roadCanvas = document.getElementById('roadCanvas');
const networkCanvas = document.getElementById('networkCanvas');
const currentInfoSpan = document.getElementById('currentInfo');
const nextAmountDiv = document.querySelector('#nextAmount');
const autosaveLeaderCheckbox = document.getElementById(
    'autosaveLeaderCheckbox'
);
const roadCtx = roadCanvas.getContext('2d');
const networkCtx = networkCanvas.getContext('2d');

// CONTROLS:
roadCanvas.width = 400;
networkCanvas.width = 500;
const defaultMutationAmount = 0.1;
const defaultShouldAutosaveLeader = true;

const eliminationDistance = 200;
const heroCarsCount = 250;
const laneCount = 4;
const trafficRowGap = 250;
const heroCarInitialCenterY = 300;

const road = new Road(roadCanvas.width / 2, roadCanvas.width / 2, laneCount);
const carWidth = road.laneWidth * 0.6;
const startingLane = Math.floor(laneCount / 2);
const difficultySublevels = 5;
const dummyCarForwardSpeed = 2;

const trafficGroups = [
    range(laneCount),
    ...range(2, laneCount)
        .flatMap(i =>
            shuffle(
                range(difficultySublevels).map(() =>
                    shuffle(range(laneCount)).slice(0, i)
                )
            )
        )
        .reverse(),
    [startingLane]
];

const playerCar = new Car({
    centerX: road.getLaneCenter(startingLane),
    maxForwardSpeed: 3.01,
    centerY: heroCarInitialCenterY,
    width: carWidth,
    color: COLOR.PLAYER_CAR,
    controlsType: CONTROLS_TYPE.ARROWS
});

// CHANGING:
let aiCars = generateCars(heroCarsCount);
let bestHeroCar = aiCars[0];
let prevCount = aiCars.length;

function generateCars(count) {
    const cars = [];
    while (count-- > 0) {
        cars.push(
            new Car({
                centerX: road.getLaneCenter(startingLane),
                maxForwardSpeed: 3,
                centerY: heroCarInitialCenterY,
                width: carWidth,
                controlsType: CONTROLS_TYPE.AI
            })
        );
    }
    return cars;
}

// LEADER AUTOSAVE:
let shouldAutosaveLeader =
    (localStorage.getItem(LS_KEY.LEADER_AUTOSAVE) ??
        defaultShouldAutosaveLeader.toString()) === 'true';
autosaveLeaderCheckbox.checked = shouldAutosaveLeader ? 'true' : '';
autosaveLeaderCheckbox.onchange = () => {
    shouldAutosaveLeader = !shouldAutosaveLeader;
    localStorage.setItem(LS_KEY.LEADER_AUTOSAVE, shouldAutosaveLeader);
    autosaveLeaderCheckbox.checked = shouldAutosaveLeader ? 'true' : '';
};

// MUTATION AMOUNT:
let mutationAmount = Number.parseFloat(
    localStorage.getItem(LS_KEY.MUTATION_AMOUNT) ?? defaultMutationAmount
);
nextAmountDiv.textContent = mutationAmount.toFixed(2);
function increaseAmount() {
    changeAmount(1.5);
}
function decreaseAmount() {
    changeAmount(0.75);
}
function changeAmount(change) {
    mutationAmount = Math.floor(mutationAmount * 100 * change) / 100;
    if (mutationAmount > 1) mutationAmount = 1;
    if (mutationAmount <= 0) mutationAmount = .01
    localStorage.setItem(LS_KEY.MUTATION_AMOUNT, mutationAmount);
    nextAmountDiv.textContent = mutationAmount.toFixed(2);
}

// BEST BRAIN:
let bestDistance = 0;
let bestSavedBrain = localStorage.getItem(LS_KEY.BEST_SAVED_BRAIN);
const hasRequestedDiscard = localStorage.getItem(LS_KEY.REQUESTED_DISCARD);
if (!bestSavedBrain && !hasRequestedDiscard) {
    bestSavedBrain = goodFourLaneBrain;
    localStorage.setItem(LS_KEY.BEST_SAVED_BRAIN, bestSavedBrain);
}
if (bestSavedBrain) {
    for (const heroCar of aiCars) {
        const {brain, distance} = JSON.parse(bestSavedBrain);
        heroCar.brain = brain;
        bestDistance = distance;
        if (heroCar !== bestHeroCar)
            NeuralNetwork.mutate(heroCar.brain, mutationAmount);
    }
}

function reloadPage() {
    window.location = self.location;
}

function save() {
    localStorage.setItem(
        LS_KEY.BEST_SAVED_BRAIN,
        JSON.stringify({
            brain: bestHeroCar.brain,
            distance: Math.abs(bestHeroCar.centerY)
        })
    );
    reloadPage()
}

function discard() {
    localStorage.setItem(LS_KEY.REQUESTED_DISCARD, true);
    localStorage.removeItem(LS_KEY.BEST_SAVED_BRAIN);
    reloadPage()
}

// TRAFFIC:
const createDummyCar = i =>
    new Car({
        centerX: road.getLaneCenter(i),
        centerY: 0,
        color: [COLOR.AQUA, COLOR.RED, COLOR.GREEN, COLOR.BROWN][
            random(4)
        ],
        maxForwardSpeed: dummyCarForwardSpeed,
        width: carWidth,
        controlsType: CONTROLS_TYPE.DUMMY
    });

const traffic = trafficGroups
    .map(row => row.map(createDummyCar))
    .reverse()
    .flatMap((arr, rowI) =>
        arr.map(c => {
            c.centerY = -trafficRowGap * rowI;
            return c;
        })
    );

animate();

function animate(time) {
    for (const car of traffic) {
        car.update({
            traffic: [],
            roadBorders: []
        });
    }
    for (const heroCar of aiCars) {
        heroCar.update({
            traffic,
            roadBorders: road.borders
        });
    }
    playerCar?.update({
        traffic,
        roadBorders: road.borders
    });
    roadCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    roadCtx.save();

    // ELIMINATION & LEADER DETECTION
    prevCount = aiCars.length;
    if (aiCars.length > 0) {
        const newAiCars = [];
        for (const car of aiCars) {
            if (!car.hasCrashed) {
                if (
                    car.centerY - bestHeroCar.centerY < eliminationDistance &&
                    car.avgSpeed >= dummyCarForwardSpeed &&
                    (car.angle === 0 || car.angleRepeats < 2000)
                ) {
                    newAiCars.push(car);
                    if (car.centerY < bestHeroCar.centerY) {
                        bestHeroCar = car;
                    }
                }
            }
        }
        aiCars = newAiCars;
    }

    if (shouldAutosaveLeader) {
        if (aiCars.length === 0) {
            if (-bestHeroCar.centerY > bestDistance) {
                save();
            }
            reloadPage()
            return;
        }
    }

    currentInfoSpan.textContent = `${
        aiCars.length
    } cars left out of ${heroCarsCount}.\nLeader speed: ${(
        bestHeroCar.avgSpeed / dummyCarForwardSpeed * 100
    ).toFixed(1)}% of traffic speed`;

    roadCtx.translate(0, -bestHeroCar.centerY + window.innerHeight * 0.7);

    // DRAWING ROAD
    road.draw(roadCtx);

    // DRAWING CARS
    if (bestHeroCar.avgSpeed <= dummyCarForwardSpeed || bestHeroCar.hasCrashed) {
        roadCtx.globalAlpha = 0.1;
    }
    bestHeroCar.draw(roadCtx, !bestHeroCar.hasCrashed);
    playerCar?.draw(roadCtx);

    roadCtx.globalAlpha = 0.1;
    for (const heroCar of aiCars) {
        if (heroCar === bestHeroCar) continue;
        heroCar.draw(roadCtx);
    }
    roadCtx.globalAlpha = 1;

    if (playerCar !== bestHeroCar) playerCar?.draw(roadCtx);

    // DRAWING TRAFFIC
    for (const car of traffic) car.draw(roadCtx);
    
    // DRAWING NETWORK
    networkCtx.lineDashOffset = time / -200;
    Visualizer.drawNetwork(networkCtx, bestHeroCar.brain);
    
    roadCtx.restore();
    requestAnimationFrame(animate);
}

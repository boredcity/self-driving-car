const CONTROLS_TYPE = {
    DUMMY: 'DUMMY',
    AI: 'AI',
    WASD: 'WASD',
    ARROWS: 'ARROWS'
};

const LS_KEY = {
    MUTATION_AMOUNT: 'MUTATION_AMOUNT',
    BEST_SAVED_BRAIN: 'BEST_SAVED_BRAIN',
    LEADER_AUTOSAVE: 'LEADER_AUTOSAVE',
    REQUESTED_DISCARD: 'REQUESTED_DISCARD'
};

const computedStyle = getComputedStyle(document.body);
const getCSSConstantValue = clr => computedStyle.getPropertyValue(clr);

const COLOR = {
    WARNING: getCSSConstantValue('--clr-warning'),
    DANGER: getCSSConstantValue('--clr-danger'),
    PLAYER_CAR: getCSSConstantValue('--clr-player-car'),
    BLACK: getCSSConstantValue('--clr-black'),
    GREY: getCSSConstantValue('--clr-grey'),
    AQUA: getCSSConstantValue('--clr-aqua'),
    RED: getCSSConstantValue('--clr-red'),
    GREEN: getCSSConstantValue('--clr-green'),
    BROWN: getCSSConstantValue('--clr-brown')
};
const Keyboard = require("../classes/Keyboard")
const Lang = require("../classes/Lang")
const inputs = document.querySelectorAll('input[type="text"]');

const welcomeBtn = document.getElementById("welcome-btn");
const welcomeContainer = document.getElementById("welcome");
const userInfoModal = document.getElementById("user-info-modal");
const userInfoBtn = document.getElementById("user-info-btn");
const spotifyModal = document.getElementById("spotify-modal");
const spotifyContinueBtn = document.getElementById("spotify-continue-btn");
const spotifyPassBtn = document.getElementById("spotify-pass-btn");
const dataModal = document.getElementById("data-modal");
const dataBtn = document.getElementById("data-btn");

let keyboard = new Keyboard()
let lang = new Lang()


/** @type {HTMLInputElement} */
let seletedInput = null;

let keyboardRendered = false;
let lastDistance = 0

inputs.forEach(input => {
    input.addEventListener('focus', () => {
        keyboard.show();
        keyboardRendered = true;
        seletedInput = input;
        let dist = getRealInputDistance(input, lastDistance);
        console.log(dist);
        setTimeout(() => {
            input.parentElement.style.transform = `translate(-50%, calc(-50% + ${dist}px))`;
        }, 10);
        lastDistance = dist;
    });
    input.addEventListener('blur', (e) => {
        setTimeout(() => {
            if (!document.activeElement || document.activeElement.tagName !== 'INPUT') {
                keyboard.hide();
                keyboardRendered = false;
                seletedInput = null;
                input.parentElement.style.transform = `translate(-50%, -50%)`;
                lastDistance = 0;
            }
            console.log(document.activeElement);
        }, 100);
    });
})

function handleMissClick() {
    if (seletedInput) {
        setTimeout(() => {
            seletedInput.focus();
        }, 5);
    }
}

function getInputDistance(input = seletedInput) {
    const rect = input.getBoundingClientRect();
    const inputTop = rect.top + rect.height / 2;
    const containerHeight = document.documentElement.clientHeight - 280;
    const inputContainerY = (containerHeight / 2) - inputTop;

    return inputContainerY
}

function getRealInputDistance(input = seletedInput, dist) {
    let el = input.parentElement;
    el.style.transition = 'none';
    el.style.transform = 'translate(-50%, -50%)';
    void el.offsetHeight;
    let realDist = getInputDistance(input);
    el.style.transform = `translate(-50%, calc(-50% + ${dist}px))`;
    setTimeout(() => {
        el.style.transition = '';
    }, 10);
    return realDist;
}

keyboard.keyboard.keyboardDOM.addEventListener("click", handleMissClick);
keyboard.keyboard.keyboardDOM.addEventListener("touchstart", handleMissClick);


keyboard.on("press", button => {
    if (seletedInput) {
        if (!button.startsWith("{")) {
            seletedInput.value += button;
            setTimeout(() => {
                seletedInput.focus();
            }, 5);
        } else if (button === "{bksp}") {
            seletedInput.value = seletedInput.value.slice(0, -1);
            setTimeout(() => {
                seletedInput.focus();
            }, 5);
        } else if (button === "{enter}") {
            seletedInput.blur();
        } else if (button === "{space}") {
            seletedInput.value += " ";
            setTimeout(() => {
                seletedInput.focus();
            }, 5);
        }
    }
})

welcomeBtn.addEventListener("click", () => {
    welcomeContainer.classList.add("hidden");
    userInfoModal.classList.remove("hidden");
});

userInfoBtn.addEventListener("click", () => {
    userInfoModal.classList.add("hidden");
    spotifyModal.classList.remove("hidden");
});

spotifyContinueBtn.addEventListener("click", () => {
    spotifyModal.classList.add("hidden");
    dataModal.classList.remove("hidden");
});

spotifyPassBtn.addEventListener("click", () => {
    spotifyModal.classList.add("hidden");
    dataModal.classList.remove("hidden");
});
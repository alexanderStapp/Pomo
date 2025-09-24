/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
// set some useful variables
const SECOND_IN_MILLISECONDS = 1000;
const MINUTE_IN_MILLISECONDS = SECOND_IN_MILLISECONDS * 60;
const HOUR_IN_MILLISECONDS = MINUTE_IN_MILLISECONDS * 60;
const DAY_IN_MILLISECONDS = HOUR_IN_MILLISECONDS * 24;

// get the element to render the countdown in
const countdownElement = document.querySelector('#countdown');

// let focusAudio = new Audio('./audio/focus.mp3')
// let breakAudio = new Audio('./audio/break.mp3')
const focusAudio = document.querySelector('#focusAudio');
const breakAudio = document.querySelector('#breakAudio');

const pinButton = document.getElementById('pin');
const minimizeButton = document.getElementById('min');
const closeButton = document.getElementById('close');

pinButton.addEventListener('click', event => {
	event.preventDefault();
	window.electronAPI.sendEvent('TITLE_BAR_ACTION', 'PIN_WINDOW');
});
window.electronAPI.receiveEvent((isPinned) => {
	if (isPinned) {
		pinButton.src = '/assets/icons/pin-true.svg';
	} else {
		pinButton.src = '/assets/icons/pin-false.svg';
	}
});
minimizeButton.addEventListener('click', event => {
	event.preventDefault();
	window.electronAPI.sendEvent('TITLE_BAR_ACTION', 'MINIMIZE_WINDOW');
});
closeButton.addEventListener('click', event => {
	event.preventDefault();
	window.electronAPI.sendEvent('TITLE_BAR_ACTION', 'CLOSE_APP');
});

let running = false;
let timer = 0;
let focusStage = true;

let focusCountdown = 0;
let breakCountdown = 0;
let cycles = 1;
let cyclesCompleted = 0;

let lastTime = Date.now();

/**
 * Version 3 - With request animation frame
 * Cons:
 * - can be manipulated by changing system clock (affects Date.now())
 */
export function countdown() {
	const now = Date.now();
	const delta = now - lastTime;
	lastTime = now;

	if (running) {
		document.getElementById('start-button').innerHTML = 'Stop';
		document.getElementById('cycles-remaining').innerHTML = `Cycles Remaining: ${cycles}`;
		document.getElementById('cycles-completed').innerHTML = `Cycles Completed: ${cyclesCompleted}`;
		if (timer <= 0 && focusStage) { // start break
			new window.Notification('start break', { body: 'you are break', silent: true });
			document.getElementById('status').innerHTML = 'Status: Break';
			breakAudio.play();
			focusStage = false;
			timer = breakCountdown;
		} else if (timer <= 0 && !focusStage) {
			// increments below are preformed here, as first focus is handled by click
			cycles -= 1;
			cyclesCompleted += 1;
			if (cycles == 0) { // done
				running = false;
				// document.getElementById('status').innerHTML = 'status: done!';
				new window.Notification('done!', { body: 'you are done', silent: true });
				breakAudio.play();
				cycles = 1;
			} else { // start focus
				document.getElementById('status').innerHTML = 'Status: Focus';
				new window.Notification('start focus', { body: 'you are focus', silent: true });
				focusAudio.play();
				focusStage = true;
				timer = focusCountdown;
			}
		}

		timer -= delta;

		const hoursLeft = Math.floor(
			(timer % DAY_IN_MILLISECONDS) / HOUR_IN_MILLISECONDS
		).toLocaleString('en-US', { minimumIntegerDigits: 2 });

		const minutesLeft = Math.floor(
			(timer % HOUR_IN_MILLISECONDS) / MINUTE_IN_MILLISECONDS
		).toLocaleString('en-US', { minimumIntegerDigits: 2 });

		const secondsLeft = Math.floor(
			(timer % MINUTE_IN_MILLISECONDS) / SECOND_IN_MILLISECONDS
		).toLocaleString('en-US', { minimumIntegerDigits: 2 });
		countdownElement.innerHTML = `${hoursLeft}:${minutesLeft}:${secondsLeft}`;
	} else if (!running) {
		document.getElementById('status').innerHTML = '';
		document.getElementById('cycles-remaining').innerHTML = '';
		document.getElementById('cycles-completed').innerHTML = '';
		document.getElementById('start-button').innerHTML = 'Start';
		countdownElement.innerHTML = '';
		cyclesCompleted = 0;
		focusStage = false;
	}

	requestAnimationFrame(countdown);
};

function startHandler() {
	focusCountdown = document.getElementById('focus').value * MINUTE_IN_MILLISECONDS;
	breakCountdown = document.getElementById('break').value * MINUTE_IN_MILLISECONDS;
	cycles = document.getElementById('cycles').value;
	document.getElementById('status').innerHTML = 'Status: Focus';
	countdownElement.innerHTML = '';
	focusAudio.play();
	timer = focusCountdown;
	running = !running;
	focusStage = true;
}

document.getElementById('start-button').addEventListener('click', () => {
	if (running) {
		running = !running;
	} else if (!running) {
		startHandler();
	}
});

countdown();

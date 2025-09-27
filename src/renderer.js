import './index.css';
// set some useful variables
const SECOND_IN_MILLISECONDS = 1000;
const MINUTE_IN_MILLISECONDS = SECOND_IN_MILLISECONDS * 60;
const HOUR_IN_MILLISECONDS = MINUTE_IN_MILLISECONDS * 60;
const DAY_IN_MILLISECONDS = HOUR_IN_MILLISECONDS * 24;

// get the element to render the countdown in
const countdownElement = document.querySelector('#countdown');

const pinButton = document.getElementById('pin');
const minimizeButton = document.getElementById('min');
const closeButton = document.getElementById('close');

const waitHoursElement = document.getElementById('hours');
const waitMinutesElement = document.getElementById('minutes');
const incrementHourButton = document.getElementById('increment-hour');
const decrementHourButton = document.getElementById('decrement-hour');
const incrementMinuteButton = document.getElementById('increment-minute');
const decrementMinuteButton = document.getElementById('decrement-minute');
const setCurrentTimeButton = document.getElementById('set-current-time');
const setWaitCheckbox = document.getElementById('set-wait-checkbox');
const waitTimeFieldset = document.getElementById('wait-time-fieldset');
const waitUntilTomorrow = document.getElementById('wait-until-tomorrow');

pinButton.addEventListener('click', event => {
	event.preventDefault();
	window.electronAPI.sendEvent('TITLE_BAR_ACTION', 'PIN_WINDOW');
});
window.electronAPI.receiveEvent((isPinned) => {
	if (isPinned) {
		pinButton.className = 'pin-true';
	} else {
		pinButton.className = 'pin-false';
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

setWaitCheckbox.addEventListener('change', () => {
	if (setWaitCheckbox.checked) {
		waitTimeFieldset.disabled = false;
		setCurrentTimeButton.disabled = false;
	} else {
		waitTimeFieldset.disabled = true;
		setCurrentTimeButton.disabled = true;
	}
});


function roundHour() {
	const now = new Date();
	now.setHours(now.getHours() + Math.ceil(now.getMinutes() / 60));
	now.setMinutes(0, 0, 0); // Resets also seconds and milliseconds

	waitHoursElement.innerHTML = now.getHours().toString().padStart(2, '0');
	waitMinutesElement.innerHTML = '00';
	waitUntilTomorrowCheck();
}

function waitUntilTomorrowCheck() {
	const checkTime = new Date();
	checkTime.setHours(parseInt(waitHoursElement.innerHTML), parseInt(waitMinutesElement.innerHTML), 0, 0);
	const now = Date.now();

	if (checkTime < now) {
		waitUntilTomorrow.hidden = false;
	} else {
		waitUntilTomorrow.hidden = true;
	}
}

incrementHourButton.addEventListener('click', event => {
	event.preventDefault();
	let hour = parseInt(waitHoursElement.innerHTML);
	if (hour == 23 || Number.isNaN(hour)) {
		hour = 0;
	} else if (hour !== 23) {
		hour += 1;
	}
	waitHoursElement.innerHTML = hour.toString().padStart(2, '0');
	waitUntilTomorrowCheck();
});
decrementHourButton.addEventListener('click', event => {
	event.preventDefault();
	let hour = parseInt(waitHoursElement.innerHTML);
	if (hour == 0 || Number.isNaN(hour)) {
		hour = 23;
	} else if (hour !== 0) {
		hour -= 1;
	}
	waitHoursElement.innerHTML = hour.toString().padStart(2, '0');
	waitUntilTomorrowCheck();
});
incrementMinuteButton.addEventListener('click', event => {
	event.preventDefault();
	let minute = parseInt(waitMinutesElement.innerHTML);
	if (minute == 45 || Number.isNaN(minute)) {
		minute = 0;
	} else if (minute !== 45) {
		minute += 15;
	}
	waitMinutesElement.innerHTML = minute.toString().padStart(2, '0');
	waitUntilTomorrowCheck();
});
decrementMinuteButton.addEventListener('click', event => {
	event.preventDefault();
	let minute = parseInt(waitMinutesElement.innerHTML);
	if (minute == 0 || Number.isNaN(minute)) {
		minute = 45;
	} else if (minute !== 0) {
		minute -= 15;
	}
	waitMinutesElement.innerHTML = minute.toString().padStart(2, '0');
	waitUntilTomorrowCheck();
});

setCurrentTimeButton.addEventListener('click', event => {
	event.preventDefault();
	roundHour();
});


let running = false;
let waiting = false;
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
			window.electronAPI.sendEvent('PLAY_SOUND', 'BREAK');
			focusStage = false;
			timer = breakCountdown;
		} else if (timer <= 0 && !focusStage) {
			// increments below are preformed here, as first focus is handled by click, or first cycle is technically waiting
			if (!waiting) {
				cycles -= 1;
				cyclesCompleted += 1;
			}
			if (cycles == 0) { // done
				running = false;
				// document.getElementById('status').innerHTML = 'status: done!';
				new window.Notification('done!', { body: 'you are done', silent: true });
				window.electronAPI.sendEvent('PLAY_SOUND', 'BREAK');
				cycles = 1;
			} else { // start focus
				document.getElementById('status').innerHTML = 'Status: Focus';
				new window.Notification('start focus', { body: 'you are focus', silent: true });
				window.electronAPI.sendEvent('PLAY_SOUND', 'FOCUS');
				waiting = false;
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
	} else if (!running && !waiting) {
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
	document.getElementById('status').innerHTML = 'Status: Focus';
	window.electronAPI.sendEvent('PLAY_SOUND', 'FOCUS');
	timer = focusCountdown;
	focusStage = true;
	waiting = false;
	running = true;
}

function waitHandler(hours, minutes) {
	document.getElementById('status').innerHTML = 'Status: Waiting...';
	const targetTime = new Date();
	targetTime.setHours(hours, minutes, 0, 0);
	const waitingNow = Date.now();

	if (targetTime < waitingNow) {
		targetTime.setDate(targetTime.getDate() + 1);
	}

	timer = targetTime - waitingNow;
	waiting = true;
	running = true;
}

document.getElementById('start-button').addEventListener('click', () => {
	if (running) {
		running = false;
		waiting = false;
	} else if (!running) {
		focusCountdown = document.getElementById('focus').value * MINUTE_IN_MILLISECONDS;
		breakCountdown = document.getElementById('break').value * MINUTE_IN_MILLISECONDS;
		cycles = document.getElementById('cycles').value;
		countdownElement.innerHTML = '';
		if (waitTimeFieldset.disabled) {
			startHandler();
		} else {
			const waitUntilHoursInput = document.getElementById('hours').innerHTML;
			const waitUntilMinutesInput = document.getElementById('minutes').innerHTML;
			waitHandler(waitUntilHoursInput, waitUntilMinutesInput);
		}
	}
});

countdown();
roundHour();
waitUntilTomorrowCheck();
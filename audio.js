(function() {
  'use strict';

  let audioContext = null;
  let noiseSource = null;
  let filterNode = null;
  let gainNode = null;
  let isStarted = false;
  let moveTimeout = null;
  const STILL_DELAY = 150;
  const FADE_TIME = 0.25;

  const smoothMouse = { x: 0.5, y: 0.5 };

  function createNoiseBuffer(ctx, duration) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    return buffer;
  }

  function initAudio() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const buffer = createNoiseBuffer(audioContext, 2);
    noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'bandpass';
    filterNode.frequency.value = 800;
    filterNode.Q.value = 2;

    gainNode = audioContext.createGain();
    gainNode.gain.value = 0;

    noiseSource.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    noiseSource.start(0);
    isStarted = true;
  }

  function setVolume(vol) {
    if (!gainNode || !audioContext) return;
    gainNode.gain.cancelScheduledValues(audioContext.currentTime);
    gainNode.gain.setValueAtTime(vol, audioContext.currentTime);
  }

  function fadeOut() {
    if (!gainNode || !audioContext) return;
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + FADE_TIME);
  }

  function scheduleSilence() {
    if (moveTimeout) clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => {
      fadeOut();
      moveTimeout = null;
    }, STILL_DELAY);
  }

  function cancelSilence() {
    if (moveTimeout) {
      clearTimeout(moveTimeout);
      moveTimeout = null;
    }
  }

  function onMouseMove(e) {
    if (!isStarted) initAudio();

    cancelSilence();

    const x = e.clientX / window.innerWidth;
    const y = 1 - e.clientY / window.innerHeight;

    smoothMouse.x += (x - smoothMouse.x) * 0.15;
    smoothMouse.y += (y - smoothMouse.y) * 0.15;

    filterNode.frequency.value = 200 + smoothMouse.x * 3000;
    filterNode.Q.value = 1 + smoothMouse.y * 4;
    setVolume(0.015 + smoothMouse.y * 0.05);

    scheduleSilence();
  }

  function onMouseOut() {
    cancelSilence();
    fadeOut();
  }

  function onFirstInteraction() {
    initAudio();
    document.removeEventListener('click', onFirstInteraction);
    document.removeEventListener('mousemove', onFirstInteraction);
    document.removeEventListener('touchstart', onFirstInteraction);
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseout', onMouseOut);
  document.addEventListener('mouseleave', onMouseOut);
  document.addEventListener('click', onFirstInteraction);
  document.addEventListener('touchstart', onFirstInteraction);
})();

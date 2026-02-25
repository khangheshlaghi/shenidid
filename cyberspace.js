(function() {
  'use strict';

  const canvas = document.getElementById('canvas-webgl');
  if (!canvas) return;

  try {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL not supported');
  } catch (e) {
    document.body.classList.add('no-webgl');
    return;
  }

  const resolution = { x: window.innerWidth, y: window.innerHeight };
  const mouse = { x: 0, y: 0 };
  const targetMouse = { x: 0, y: 0 };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);

  const camera = new THREE.PerspectiveCamera(60, resolution.x / resolution.y, 0.1, 50000);
  camera.position.set(0, 0, 1000);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(resolution.x, resolution.y);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const particleCount = Math.min(2000, Math.floor((resolution.x * resolution.y) / 800));

  // === 1. NOISE PARTICLES (ذرات نویز/صدا) ===
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  const phases = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2 - 1) * 0.9);
    const radius = 400 + Math.random() * 2000;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi) - 1200;
    speeds[i] = (Math.random() * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
    phases[i] = Math.random() * Math.PI * 2;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
  particlesGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0x88aaff,
    size: 1.2,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  // === 2. SOUND WAVES (امواج صوتی - سینوسی) ===
  const waveGroup = new THREE.Group();
  const waveMaterial = new THREE.LineBasicMaterial({
    color: 0x5599ff,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending
  });

  const waveCount = 5;
  const wavePoints = 80;

  for (let w = 0; w < waveCount; w++) {
    const points = [];
    for (let i = 0; i <= wavePoints; i++) {
      const x = (i / wavePoints - 0.5) * 6000;
      const z = -800 - w * 300;
      const y = Math.sin((i / wavePoints) * Math.PI * 4 + w) * 150;
      points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const wave = new THREE.Line(geometry, waveMaterial.clone());
    wave.userData.offset = w * 0.7;
    waveGroup.add(wave);
  }
  scene.add(waveGroup);

  // === 3. SOUND RIPPLES (امواج دایره‌ای - مثل انتشار صدا) ===
  const rippleGroup = new THREE.Group();
  const rippleMaterial = new THREE.LineBasicMaterial({
    color: 0x4488dd,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending
  });

  const rippleCount = 8;
  const rippleSegments = 64;

  for (let r = 0; r < rippleCount; r++) {
    const radius = 800 + r * 400;
    const points = [];
    for (let i = 0; i <= rippleSegments; i++) {
      const angle = (i / rippleSegments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -1200 - r * 100
      ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const ripple = new THREE.Line(geometry, rippleMaterial.clone());
    ripple.userData.radius = radius;
    ripple.userData.index = r;
    rippleGroup.add(ripple);
  }
  scene.add(rippleGroup);

  // === 4. EQUALIZER BARS (میله‌های اکولایزر) ===
  const eqGroup = new THREE.Group();
  const eqBarCount = 24;
  const eqBars = [];

  for (let i = 0; i < eqBarCount; i++) {
    const baseHeight = 80 + Math.random() * 120;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -baseHeight, 0),
      new THREE.Vector3(0, baseHeight, 0)
    ]);
    const material = new THREE.LineBasicMaterial({
      color: 0x66aaff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const bar = new THREE.Line(geometry, material);
    bar.position.x = (i - eqBarCount / 2) * 120;
    bar.position.z = -600;
    bar.userData.baseHeight = baseHeight;
    bar.userData.phase = Math.random() * Math.PI * 2;
    bar.userData.freq = 2 + Math.random() * 4;
    eqBars.push(bar);
    eqGroup.add(bar);
  }
  scene.add(eqGroup);

  // === 5. FREQUENCY SPECTRUM LINES (خطوط طیف فرکانس) ===
  const spectrumPoints = [];
  const spectrumSegments = 40;

  for (let i = 0; i < spectrumSegments; i++) {
    const x = (i / spectrumSegments - 0.5) * 5000;
    const y = (Math.random() - 0.5) * 400;
    spectrumPoints.push(
      new THREE.Vector3(x, -200, -1400),
      new THREE.Vector3(x, y, -1400)
    );
  }

  const spectrumGeometry = new THREE.BufferGeometry().setFromPoints(spectrumPoints);
  const spectrumMaterial = new THREE.LineBasicMaterial({
    color: 0x3377bb,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending
  });
  const spectrumLines = new THREE.LineSegments(spectrumGeometry, spectrumMaterial);
  scene.add(spectrumLines);

  // === 6. CENTER RING (حلقه مرکزی - مثل دیافراگم بلندگو) ===
  const ringGeometry = new THREE.RingGeometry(1200, 1400, 48, 2, 0, Math.PI * 2);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x5599ff,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.z = -1000;
  scene.add(ring);

  // Animation
  const clock = new THREE.Clock();

  function animate() {
    const time = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // 1. Noise particles - حرکت عمودی + لرزش نویز
    const posAttr = particlesGeometry.attributes.position;
    const phaseAttr = particlesGeometry.attributes.phase;
    for (let i = 0; i < particleCount; i++) {
      posAttr.array[i * 3 + 1] += speeds[i] * 25 * time;
      posAttr.array[i * 3] += Math.sin(elapsed * 3 + phases[i]) * 2 * time;
      posAttr.array[i * 3 + 2] += Math.cos(elapsed * 2.5 + phases[i] * 1.3) * 1.5 * time;
      if (posAttr.array[i * 3 + 1] > 2500) posAttr.array[i * 3 + 1] = -2500;
      if (posAttr.array[i * 3 + 1] < -2500) posAttr.array[i * 3 + 1] = 2500;
    }
    posAttr.needsUpdate = true;

    // 2. Sound waves - موج‌دار شدن
    waveGroup.children.forEach((wave, i) => {
      const pos = wave.geometry.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const x = (j / (pos.count - 1) - 0.5) * 6000;
        pos.array[j * 3 + 1] = Math.sin((j / (pos.count - 1)) * Math.PI * 4 + elapsed * 2 + wave.userData.offset) * 180;
      }
      pos.needsUpdate = true;
    });

    // 3. Ripples - پالس شدن مثل امواج صوتی
    rippleGroup.children.forEach((ripple, i) => {
      const scale = 0.9 + 0.15 * Math.sin(elapsed * 1.5 + ripple.userData.index * 0.5);
      ripple.scale.set(scale, scale, 1);
      ripple.material.opacity = 0.08 + 0.06 * Math.sin(elapsed + i * 0.3);
    });

    // 4. Equalizer bars - نوسان ارتفاع (بالا و پایین)
    eqBars.forEach(bar => {
      const height = bar.userData.baseHeight * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(elapsed * bar.userData.freq + bar.userData.phase)));
      bar.geometry.attributes.position.array[1] = -height;
      bar.geometry.attributes.position.array[4] = height;
      bar.geometry.attributes.position.needsUpdate = true;
    });

    // 5. Spectrum lines - تغییر ارتفاع
    const specPos = spectrumLines.geometry.attributes.position;
    for (let i = 0; i < spectrumSegments; i++) {
      const y = (Math.sin(elapsed * 3 + i * 0.5) * 0.5 + 0.5) * 400 - 200;
      specPos.array[i * 6 + 4] = y;
      specPos.array[i * 6 + 5] = -1400;
    }
    specPos.needsUpdate = true;

    // 6. Ring - چرخش آرام
    ring.rotation.z += 0.015 * time;
    ring.material.opacity = 0.25 + 0.1 * Math.sin(elapsed * 0.8);

    // Mouse parallax
    targetMouse.x = (mouse.x / resolution.x) * 2 - 1;
    targetMouse.y = -(mouse.y / resolution.y) * 2 + 1;
    camera.position.x += (targetMouse.x * 80 - camera.position.x) * 0.05;
    camera.position.y += (targetMouse.y * 80 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function onMouseOut() {
    targetMouse.x = 0;
    targetMouse.y = 0;
  }

  function onResize() {
    resolution.x = window.innerWidth;
    resolution.y = window.innerHeight;
    camera.aspect = resolution.x / resolution.y;
    camera.updateProjectionMatrix();
    renderer.setSize(resolution.x, resolution.y);
    const pr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pr);
    if (particlesMaterial.uniforms) particlesMaterial.uniforms.uPixelRatio.value = pr;
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseout', onMouseOut);
  window.addEventListener('resize', onResize);

  clock.start();
  animate();
})();

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Complete type cycle with natural wrapping and no fixed-width clipping.
const typedText = document.querySelector('.typed-text');
if (typedText) {
  const items = JSON.parse(typedText.dataset.typedItems || '[]');
  let word = 0, char = 0, deleting = false;
  const tick = () => {
    const value = items[word] || '';
    char += deleting ? -1 : 1;
    typedText.textContent = value.slice(0, char);
    let delay = deleting ? 34 : 72;
    if (!deleting && char >= value.length) { deleting = true; delay = 1250; }
    else if (deleting && char <= 0) { deleting = false; word = (word + 1) % items.length; delay = 260; }
    window.setTimeout(tick, delay);
  };
  if (items.length && !prefersReduced) tick();
  else if (items.length) typedText.textContent = items[0];
}

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  }), { threshold: 0.08 });
  revealElements.forEach(el => revealObserver.observe(el));
} else revealElements.forEach(el => el.classList.add('visible'));

// Mobile navigation stays keyboard-accessible and closes after choosing a destination.
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navLinks?.classList.toggle('open', open);
  menuToggle.textContent = open ? '×' : '☰';
});
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open navigation');
  menuToggle && (menuToggle.textContent = '☰');
  navLinks.classList.remove('open');
}));

const signalDetails = document.querySelector('.signal-details');
const artifactSection = document.querySelector('.signal-artifacts');
if (signalDetails && artifactSection) {
  const artifactStatus = artifactSection.querySelector('.artifact-status');
  const chartGrid = artifactSection.querySelector('.artifact-chart-grid');
  let artifactLoad;

  signalDetails.addEventListener('toggle', () => {
    if (!signalDetails.open || artifactLoad || !artifactStatus || !chartGrid) return;
    artifactLoad = loadSignalArtifacts();
  });

  async function loadSignalArtifacts() {
    const manifestUrl = new URL(artifactSection.dataset.artifactManifest, document.baseURI);
    if (window.location.protocol === 'file:') {
      artifactStatus.textContent = 'Saved evaluation charts can be checked when the portfolio is served with its project artifacts.';
      return;
    }
    try {
      const response = await fetch(manifestUrl);
      if (response.status === 404) {
        artifactStatus.textContent = 'No saved evaluation charts are bundled with this portfolio copy.';
        return;
      }
      if (!response.ok) throw new Error(`Artifact manifest request failed with ${response.status}.`);

      const manifest = await response.json();
      if (!manifest || !Array.isArray(manifest.charts)) {
        throw new Error('Artifact manifest must contain a charts array.');
      }

      const artifactDirectory = new URL('.', manifestUrl);
      const chartFigures = await Promise.all(manifest.charts.map(async chart => {
        if (typeof chart?.title !== 'string' || typeof chart?.src !== 'string' || typeof chart?.alt !== 'string') return null;
        const chartUrl = new URL(chart.src, manifestUrl);
        if (
          chartUrl.origin !== manifestUrl.origin ||
          !chartUrl.pathname.startsWith(artifactDirectory.pathname) ||
          !/\.(png|jpe?g|svg|webp)$/i.test(chartUrl.pathname)
        ) return null;

        const image = new Image();
        image.alt = chart.alt;
        image.decoding = 'async';
        image.src = chartUrl.href;
        try {
          await image.decode();
        } catch (error) {
          console.error(`Unable to load saved chart "${chart.title}".`, error);
          return null;
        }

        const figure = document.createElement('figure');
        const caption = document.createElement('figcaption');
        caption.textContent = chart.title;
        figure.append(image, caption);
        return figure;
      }));

      const loadedCharts = chartFigures.filter(Boolean);
      if (!loadedCharts.length) {
        artifactStatus.textContent = 'No usable saved evaluation charts are available.';
        return;
      }

      chartGrid.replaceChildren(...loadedCharts);
      chartGrid.hidden = false;
      artifactStatus.hidden = loadedCharts.length === manifest.charts.length;
      if (!artifactStatus.hidden) artifactStatus.textContent = 'Some saved charts could not be loaded.';
    } catch (error) {
      console.error('Unable to load Signal & Stay evaluation artifacts.', error);
      artifactStatus.textContent = 'Saved evaluation charts could not be loaded.';
    }
  }
}

const technology = {
  programming: { title: 'Programming', description: 'Languages used to build and connect interactive software systems.', projects: 'ReCode · Signal & Stay · ECHOEVER', nodes: ['Python', 'C++', 'JavaScript', 'TypeScript', 'SQL'] },
  ml: { title: 'Machine Learning', description: 'Data analysis, predictive modeling, and evaluation workflows.', projects: 'Signal & Stay · Deepfake Detection', nodes: ['Scikit-learn', 'Pandas', 'NumPy', 'XGBoost', 'EDA', 'Model Evaluation'] },
  ai: { title: 'AI', description: 'Applied AI concepts, computer vision, and local language model integrations.', projects: 'ECHOEVER · Deepfake Detection', nodes: ['Deep Learning', 'Computer Vision', 'Ollama', 'Gemma', 'Image Classification'] },
  apps: { title: 'Application Development', description: 'Interfaces, APIs, and data layers for practical software products.', projects: 'Signal & Stay · ECHOEVER · ReCode', nodes: ['React', 'FastAPI', 'SQLAlchemy', 'REST APIs', 'SQLite', 'PostgreSQL'] },
  tools: { title: 'Developer Tools', description: 'Tools used to explore, develop, and maintain projects.', projects: 'Across project work', nodes: ['Git', 'GitHub', 'Jupyter Notebook', 'VS Code', 'Streamlit'] }
};
function renderTechnology(key) {
  const data = technology[key]; if (!data) return;
  document.querySelectorAll('.ecosystem-tab').forEach(tab => {
    const active = tab.dataset.category === key;
    tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active));
  });
  const orbit = document.querySelector('.tech-orbit');
  if (orbit) orbit.innerHTML = data.nodes.map((name, i) => `<span class="tech-node ${i === 0 ? 'featured' : ''}">${name}</span>`).join('');
  const title = document.querySelector('.tech-description h3');
  const paragraphs = document.querySelectorAll('.tech-description p');
  if (title) title.textContent = data.title;
  if (paragraphs[0]) paragraphs[0].textContent = data.description;
  if (paragraphs[1]) paragraphs[1].textContent = data.projects;
}
document.querySelectorAll('.ecosystem-tab').forEach(tab => tab.addEventListener('click', () => renderTechnology(tab.dataset.category)));
renderTechnology('programming');

// Official achievement artwork opens in a native, dismissible full-screen dialog.
const imageDialog = document.querySelector('.image-dialog');
const dialogImage = imageDialog?.querySelector('img');
const imageZoom = imageDialog?.querySelector('.image-zoom');
const resetImageZoom = () => {
  imageDialog?.classList.remove('zoomed');
  imageZoom?.setAttribute('aria-pressed', 'false');
  if (imageZoom) imageZoom.textContent = 'View at 1:1';
};
document.querySelectorAll('.certificate-preview').forEach(button => button.addEventListener('click', () => {
  const source = button.querySelector('img');
  if (!source || !imageDialog || !dialogImage) return;
  dialogImage.src = source.src; dialogImage.alt = source.alt;
  resetImageZoom();
  imageDialog.showModal();
}));
imageDialog?.querySelector('.dialog-close')?.addEventListener('click', () => imageDialog.close());
imageDialog?.addEventListener('click', event => { if (event.target === imageDialog) imageDialog.close(); });
imageDialog?.addEventListener('keydown', event => {
  if (event.key === 'Escape' && imageDialog.open) {
    event.preventDefault();
    imageDialog.close();
  }
});
imageZoom?.addEventListener('click', () => {
  const zoomed = imageDialog?.classList.toggle('zoomed') || false;
  imageZoom.setAttribute('aria-pressed', String(zoomed));
  imageZoom.textContent = zoomed ? 'Fit to screen' : 'View at 1:1';
});
imageDialog?.addEventListener('close', resetImageZoom);

// Lightweight projected data-universe fallback when WebGL is unavailable.
function startFallback(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const palette = ['#54dce7', '#5b8dff', '#d274ec', '#ff789f', '#ffb56f'];
  const random = (() => {
    let seed = 41;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();
  const clusters = [
    { center: [-140, 82, 5], spread: [25, 30, 42], color: palette[0], count: 72 },
    { center: [-132, -76, -6], spread: [31, 24, 35], color: palette[1], count: 68 },
    { center: [-75, 4, 25], spread: [27, 35, 29], color: palette[2], count: 65 },
    { center: [-28, 99, -25], spread: [22, 24, 34], color: palette[3], count: 54 },
    { center: [-24, -98, 20], spread: [27, 22, 35], color: palette[4], count: 52 }
  ];
  const points = clusters.flatMap(cluster => Array.from({ length: cluster.count }, () => {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random());
    const depth = (random() - .5) * 2;
    return {
      x: cluster.center[0] + Math.cos(angle) * radius * cluster.spread[0],
      y: cluster.center[1] + Math.sin(angle) * radius * cluster.spread[1],
      z: cluster.center[2] + depth * cluster.spread[2],
      phase: random() * Math.PI * 2,
      color: cluster.color
    };
  }));
  const layerSizes = [4, 6, 6, 4];
  const nodes = layerSizes.flatMap((count, layer) => Array.from({ length: count }, (_, index) => ({
    x: -1 + layer * 62,
    y: (index / Math.max(1, count - 1) - .5) * 178,
    z: Math.sin(index * 2 + layer) * 30 + (random() - .5) * 18,
    layer,
    color: palette[Math.min(layer, palette.length - 1)]
  })));
  const layers = layerSizes.map((_, layer) => nodes.filter(node => node.layer === layer));
  const edges = [];
  layers.slice(0, -1).forEach((layer, index) => {
    layer.forEach(source => layers[index + 1].forEach(target => edges.push({ source, target })));
  });
  const boundaries = [
    { x: -55, y: 58, width: 76, height: 62, color: 'rgba(77,211,228,.22)' },
    { x: -58, y: -59, width: 72, height: 58, color: 'rgba(206,111,236,.2)' }
  ];
  let width = 0, height = 0, frame = 0, pointerX = 0, pointerY = 0, active = true;
  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1 : 1.3);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const project = (point, time) => {
    const rotation = (reducedMotion ? 0 : time * .00008) + pointerX * .12;
    const x = point.x * Math.cos(rotation) - point.z * Math.sin(rotation);
    const z = point.x * Math.sin(rotation) + point.z * Math.cos(rotation);
    const y = point.y + pointerY * -9;
    const scale = 560 / (560 + z);
    return { x: width * .53 + x * scale, y: height * .5 + y * scale, scale };
  };
  const draw = time => {
    frame = 0;
    if (!active) return;
    context.clearRect(0, 0, width, height);
    boundaries.forEach(boundary => {
      context.beginPath();
      for (let index = 0; index <= 36; index += 1) {
        const x = boundary.x - boundary.width / 2 + index / 36 * boundary.width;
        const y = boundary.y + Math.sin(index / 36 * Math.PI * 2 + time * .0003) * boundary.height * .18;
        const point = project({ x, y, z: Math.cos(index / 36 * Math.PI * 4 + time * .0002) * 9 }, time);
        if (!index) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      }
      context.strokeStyle = boundary.color;
      context.lineWidth = 20;
      context.stroke();
    });
    edges.forEach(({ source, target }) => {
      const start = project(source, time);
      const end = project(target, time);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.strokeStyle = 'rgba(126,167,229,.18)';
      context.lineWidth = .7;
      context.stroke();
    });
    points.forEach(point => {
      const drift = reducedMotion ? 0 : Math.sin(time * .0008 + point.phase) * 2;
      const position = project({ ...point, x: point.x + drift, y: point.y + drift * .55 }, time);
      context.beginPath();
      context.arc(position.x, position.y, Math.max(1.1, 2 * position.scale), 0, Math.PI * 2);
      context.fillStyle = point.color;
      context.globalAlpha = .76;
      context.fill();
    });
    context.globalAlpha = 1;
    nodes.forEach((node, index) => {
      const position = project(node, time);
      const pulse = reducedMotion ? 0 : (Math.sin(time * .002 + index) + 1) * .5;
      context.beginPath();
      context.arc(position.x, position.y, 3.2 + pulse * 1.2, 0, Math.PI * 2);
      context.fillStyle = node.color;
      context.fill();
    });
    edges.slice(0, 20).forEach((edge, index) => {
      const phase = reducedMotion ? index / 20 : (time * .00016 + index / 20) % 1;
      const start = project(edge.source, time);
      const end = project(edge.target, time);
      context.beginPath();
      context.arc(start.x + (end.x - start.x) * phase, start.y + (end.y - start.y) * phase, 2, 0, Math.PI * 2);
      context.fillStyle = palette[index % palette.length];
      context.fill();
    });
    if (!reducedMotion) frame = requestAnimationFrame(draw);
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    active = entries.some(entry => entry.isIntersecting);
    if (active && !frame && !reducedMotion) frame = requestAnimationFrame(draw);
    if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: '100px' }) : null;
  const onPointerMove = event => {
    const rect = canvas.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / Math.max(1, rect.width) - .5;
    pointerY = (event.clientY - rect.top) / Math.max(1, rect.height) - .5;
    if (reducedMotion && active) draw(0);
  };
  resize();
  draw(0);
  observer?.observe(canvas);
  window.addEventListener('resize', resize);
  canvas.parentElement.addEventListener('pointermove', onPointerMove);
  return () => {
    cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener('resize', resize);
    canvas.parentElement.removeEventListener('pointermove', onPointerMove);
  };
}

// Load the interactive machine-learning data universe only when the hero enters view.
const canvas = document.getElementById('portfolio-canvas');
if (canvas && 'IntersectionObserver' in window) {
  let started = false, disposed = false, idleHandle = 0, fallbackCleanup;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting) || started) return;
    started = true;
    observer.disconnect();
    idleHandle = 'requestIdleCallback' in window
      ? requestIdleCallback(() => { idleHandle = 0; boot(); }, { timeout: 1200 })
      : window.setTimeout(() => { idleHandle = 0; boot(); }, 100);
  }, { rootMargin: '100px' });
  observer.observe(canvas);
  async function boot() {
    try {
      const THREE = await import('three');
      if (disposed || !canvas.isConnected) return;

      const renderer = new THREE.WebGLRenderer({
        canvas, alpha: true, antialias: innerWidth > 700, powerPreference: 'low-power'
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1 : 1.35));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, .1, 1200);
      camera.position.set(0, 0, 600);
      scene.add(new THREE.HemisphereLight(0xb6d5ff, 0x29214e, 1.55));
      const keyLight = new THREE.DirectionalLight(0xc0e6ff, 1.25);
      keyLight.position.set(-170, 210, 300);
      scene.add(keyLight);
      const cyanLight = new THREE.PointLight(0x41d8f3, 150, 500);
      cyanLight.position.set(-100, 100, 130);
      scene.add(cyanLight);
      const violetLight = new THREE.PointLight(0x8b62ff, 125, 480);
      violetLight.position.set(155, -80, 120);
      scene.add(violetLight);

      const universe = new THREE.Group();
      scene.add(universe);
      const palette = ['#52dce7', '#5686ff', '#bd79e8', '#ff719f', '#ffad69'];
      const clusterSpecs = [
        { center: [-140, 80, 0], spread: [25, 30, 42], count: 92 },
        { center: [-132, -76, -6], spread: [31, 24, 35], count: 86 },
        { center: [-78, 4, 25], spread: [27, 35, 29], count: 82 },
        { center: [-30, 99, -25], spread: [22, 24, 34], count: 72 },
        { center: [-24, -98, 20], spread: [27, 22, 35], count: 66 }
      ];
      const random = (() => {
        let seed = 41;
        return () => {
          seed = (seed * 16807) % 2147483647;
          return (seed - 1) / 2147483646;
        };
      })();
      const clusterCounts = clusterSpecs.map(cluster => innerWidth < 700 ? Math.round(cluster.count * .7) : cluster.count);
      const particleCount = clusterCounts.reduce((sum, count) => sum + count, 0);
      const pointPositions = new Float32Array(particleCount * 3);
      const pointColors = new Float32Array(particleCount * 3);
      const pointMotion = [];
      const clusterCenters = [];
      let particleIndex = 0;
      clusterSpecs.forEach((cluster, clusterIndex) => {
        const center = new THREE.Vector3(...cluster.center);
        clusterCenters.push(center);
        const count = clusterCounts[clusterIndex];
        const color = new THREE.Color(palette[clusterIndex]);
        for (let index = 0; index < count; index += 1) {
          const angle = random() * Math.PI * 2;
          const radius = Math.sqrt(random());
          const depth = (random() - .5) * 2;
          const point = new THREE.Vector3(
            cluster.center[0] + Math.cos(angle) * radius * cluster.spread[0],
            cluster.center[1] + Math.sin(angle) * radius * cluster.spread[1],
            cluster.center[2] + depth * cluster.spread[2]
          );
          point.toArray(pointPositions, particleIndex * 3);
          color.toArray(pointColors, particleIndex * 3);
          pointMotion.push({
            phase: random() * Math.PI * 2,
            driftX: 1 + random() * 2.2,
            driftY: 1 + random() * 2
          });
          particleIndex += 1;
        }
      });
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3).setUsage(THREE.DynamicDrawUsage));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));
      const particleMaterial = new THREE.PointsMaterial({
        size: innerWidth < 700 ? 4.1 : 4.6,
        vertexColors: true,
        transparent: true,
        opacity: .88,
        depthWrite: false,
        sizeAttenuation: true
      });
      const dataParticles = new THREE.Points(particleGeometry, particleMaterial);
      universe.add(dataParticles);

      const layerSizes = [4, 6, 6, 4];
      const layers = layerSizes.map((count, layer) => Array.from({ length: count }, (_, index) => new THREE.Vector3(
        -3 + layer * 61,
        (index / Math.max(1, count - 1) - .5) * 178,
        Math.sin(index * 2 + layer) * 30 + (random() - .5) * 18
      )));
      const nodes = layers.flat();
      const nodeColors = layers.flatMap((layer, layerIndex) => layer.map(() => new THREE.Color(palette[layerIndex])));
      const nodeGeometry = new THREE.SphereGeometry(5.2, 10, 8);
      const nodeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: .74,
        metalness: 0,
        emissive: 0x10213e,
        emissiveIntensity: .36
      });
      const nodeInstances = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodes.length);
      const nodeMatrix = new THREE.Matrix4();
      const nodeScale = new THREE.Vector3();
      nodes.forEach((position, index) => {
        nodeMatrix.makeTranslation(position.x, position.y, position.z);
        nodeInstances.setMatrixAt(index, nodeMatrix);
        nodeInstances.setColorAt(index, nodeColors[index]);
      });
      nodeInstances.instanceMatrix.needsUpdate = true;
      if (nodeInstances.instanceColor) nodeInstances.instanceColor.needsUpdate = true;
      universe.add(nodeInstances);

      const edges = [];
      for (let layer = 0; layer < layers.length - 1; layer += 1) {
        layers[layer].forEach((source, sourceIndex) => {
          layers[layer + 1].forEach((target, targetIndex) => {
            edges.push({
              source,
              target,
              sourceIndex: nodes.indexOf(source),
              targetIndex: nodes.indexOf(target),
              paletteIndex: (sourceIndex + targetIndex + layer) % palette.length
            });
          });
        });
      }
      layers[0].forEach((node, nodeIndex) => {
        clusterCenters.forEach((center, clusterIndex) => {
          if (nodeIndex % 2 === clusterIndex % 2) {
            edges.push({
              source: center,
              target: node,
              sourceIndex: -1,
              targetIndex: nodeIndex,
              paletteIndex: clusterIndex
            });
          }
        });
      });
      const connectionPositions = new Float32Array(edges.length * 6);
      const connectionColors = new Float32Array(edges.length * 6);
      const baseConnectionColors = [];
      edges.forEach((edge, index) => {
        edge.source.toArray(connectionPositions, index * 6);
        edge.target.toArray(connectionPositions, index * 6 + 3);
        const color = new THREE.Color('#5574ab').lerp(new THREE.Color(palette[edge.paletteIndex]), .28);
        baseConnectionColors.push(color);
        color.toArray(connectionColors, index * 6);
        color.toArray(connectionColors, index * 6 + 3);
      });
      const connectionGeometry = new THREE.BufferGeometry();
      connectionGeometry.setAttribute('position', new THREE.BufferAttribute(connectionPositions, 3));
      connectionGeometry.setAttribute('color', new THREE.BufferAttribute(connectionColors, 3).setUsage(THREE.DynamicDrawUsage));
      const connectionMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: .48,
        depthWrite: false
      });
      universe.add(new THREE.LineSegments(connectionGeometry, connectionMaterial));

      const flowCount = innerWidth < 700 ? 18 : 28;
      const flows = Array.from({ length: flowCount }, (_, index) => ({
        edgeIndex: (index * 17) % edges.length,
        phase: index / flowCount,
        speed: .075 + random() * .035
      }));
      const flowPositions = new Float32Array(flowCount * 3);
      const flowColors = new Float32Array(flowCount * 3);
      flows.forEach((flow, index) => {
        new THREE.Color(palette[edges[flow.edgeIndex].paletteIndex]).toArray(flowColors, index * 3);
      });
      const flowGeometry = new THREE.BufferGeometry();
      flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3).setUsage(THREE.DynamicDrawUsage));
      flowGeometry.setAttribute('color', new THREE.BufferAttribute(flowColors, 3));
      const flowMaterial = new THREE.PointsMaterial({
        size: 5.2,
        vertexColors: true,
        transparent: true,
        opacity: .98,
        depthWrite: false,
        sizeAttenuation: true
      });
      universe.add(new THREE.Points(flowGeometry, flowMaterial));

      const surfaces = [
        { x: -83, y: 58, width: 84, height: 74, colors: ['#39d8e6', '#6586f3'] },
        { x: -82, y: -59, width: 80, height: 68, colors: ['#9477ea', '#f06eae'] }
      ].map(spec => {
        const geometry = new THREE.PlaneGeometry(spec.width, spec.height, 18, 18);
        const positions = geometry.attributes.position;
        const originalPositions = positions.array.slice();
        const colors = [];
        const firstColor = new THREE.Color(spec.colors[0]);
        const secondColor = new THREE.Color(spec.colors[1]);
        for (let index = 0; index < positions.count; index += 1) {
          const mix = (positions.getY(index) / spec.height) + .5;
          firstColor.clone().lerp(secondColor, mix).toArray(colors, index * 3);
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const material = new THREE.MeshBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: .19,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(spec.x, spec.y, 0);
        universe.add(mesh);
        return { geometry, originalPositions, positions, phase: random() * Math.PI * 2 };
      });

      let active = true, frameId = 0, lastTime = 0, sceneDisposed = false;
      const pointerTarget = new THREE.Vector2();
      const pointerCurrent = new THREE.Vector2();
      const resize = () => {
        const { width, height } = canvas.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        const fovRadians = THREE.MathUtils.degToRad(camera.fov);
        camera.position.z = Math.max(535, 410 / (2 * Math.tan(fovRadians / 2) * camera.aspect));
        camera.updateProjectionMatrix();
      };
      const pointer = event => {
        const rect = canvas.getBoundingClientRect();
        pointerTarget.set(
          ((event.clientX - rect.left) / rect.width - .5) * 2,
          ((event.clientY - rect.top) / rect.height - .5) * 2
        );
      };
      const setActive = () => {
        const rect = canvas.getBoundingClientRect();
        active = !disposed && document.visibilityState === 'visible' &&
          rect.bottom > -100 && rect.top < innerHeight + 100;
        if (active && !frameId) frameId = requestAnimationFrame(render);
        if (!active && frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
      };
      const sceneObserver = new IntersectionObserver(setActive, { rootMargin: '100px' });
      sceneObserver.observe(canvas);
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      canvas.parentElement.addEventListener('pointermove', pointer);
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', setActive);
      resize();

      function render(time) {
        frameId = 0;
        if (!active || disposed || !canvas.isConnected) return;
        if (time - lastTime < 30 && !prefersReduced) {
          frameId = requestAnimationFrame(render);
          return;
        }
        lastTime = time;
        const t = prefersReduced ? 0 : time * .001;
        if (!prefersReduced) {
          pointerCurrent.lerp(pointerTarget, .035);
          universe.rotation.y += (pointerCurrent.x * .13 + Math.sin(t * .16) * .035 - universe.rotation.y) * .035;
          universe.rotation.x += (pointerCurrent.y * .09 + Math.sin(t * .12) * .025 - universe.rotation.x) * .035;

          const positionAttribute = particleGeometry.attributes.position;
          pointMotion.forEach((motion, index) => {
            const offset = index * 3;
            positionAttribute.array[offset] = pointPositions[offset] + Math.sin(t * .55 + motion.phase) * motion.driftX;
            positionAttribute.array[offset + 1] = pointPositions[offset + 1] + Math.cos(t * .46 + motion.phase) * motion.driftY;
            positionAttribute.array[offset + 2] = pointPositions[offset + 2] + Math.sin(t * .38 + motion.phase) * 2;
          });
          positionAttribute.needsUpdate = true;

          const nodeTime = t * 1.7;
          nodes.forEach((position, index) => {
            const pulse = .96 + (Math.sin(nodeTime + index * .83) + 1) * .07;
            nodeScale.setScalar(pulse);
            nodeMatrix.compose(position, new THREE.Quaternion(), nodeScale);
            nodeInstances.setMatrixAt(index, nodeMatrix);
          });
          nodeInstances.instanceMatrix.needsUpdate = true;

          flows.forEach((flow, index) => {
            const phase = (flow.phase + t * flow.speed) % 1;
            const edge = edges[flow.edgeIndex];
            const pulse = Math.max(0, 1 - Math.abs(phase - .52) * 3.2);
            const position = edge.source.clone().lerp(edge.target, phase);
            position.toArray(flowPositions, index * 3);
            const color = new THREE.Color(palette[edge.paletteIndex]).multiplyScalar(.72 + pulse * .55);
            color.toArray(flowColors, index * 3);

            const colorAttribute = connectionGeometry.attributes.color;
            const lineColor = baseConnectionColors[flow.edgeIndex].clone().lerp(color, pulse * .9);
            lineColor.toArray(colorAttribute.array, flow.edgeIndex * 6);
            lineColor.toArray(colorAttribute.array, flow.edgeIndex * 6 + 3);
          });
          flowGeometry.attributes.position.needsUpdate = true;
          flowGeometry.attributes.color.needsUpdate = true;
          connectionGeometry.attributes.color.needsUpdate = true;

          surfaces.forEach(surface => {
            const array = surface.positions.array;
            const original = surface.originalPositions;
            for (let index = 0; index < surface.positions.count; index += 1) {
              const x = original[index * 3];
              const y = original[index * 3 + 1];
              array[index * 3 + 2] = original[index * 3 + 2] +
                Math.sin(x * .045 + t * .65 + surface.phase) * 5 +
                Math.cos(y * .035 + t * .5 + surface.phase) * 4;
            }
            surface.positions.needsUpdate = true;
            surface.geometry.computeVertexNormals();
          });
          cyanLight.position.x = -100 + Math.sin(t * .28) * 25;
          violetLight.position.y = -80 + Math.cos(t * .22) * 30;
        }
        renderer.render(scene, camera);
        if (!prefersReduced) frameId = requestAnimationFrame(render);
      }
      frameId = requestAnimationFrame(render);

      const cleanup = () => {
        if (sceneDisposed) return;
        sceneDisposed = true;
        disposed = true;
        active = false;
        cancelAnimationFrame(frameId);
        sceneObserver.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', setActive);
        canvas.parentElement.removeEventListener('pointermove', pointer);
        scene.traverse(object => {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
          else object.material?.dispose();
        });
        renderer.dispose();
        renderer.forceContextLoss();
      };
      window.addEventListener('pagehide', cleanup, { once: true });
    } catch (error) {
      console.error('Unable to initialize the 3D machine-learning visual.', error);
      if (!disposed && canvas.isConnected) {
        const fallback = canvas.cloneNode(false);
        canvas.replaceWith(fallback);
        fallbackCleanup = startFallback(fallback);
      }
    }
  }
  window.addEventListener('pagehide', () => {
    disposed = true;
    observer.disconnect();
    if (idleHandle) {
      if ('cancelIdleCallback' in window) cancelIdleCallback(idleHandle);
      else clearTimeout(idleHandle);
    }
    fallbackCleanup?.();
  }, { once: true });
} else if (canvas) startFallback(canvas);

const achievementCount = document.querySelector('.achievement-count');
if (achievementCount) {
  const target = Number(achievementCount.dataset.count);
  let counted = false;
  const showCount = () => {
    if (counted) return;
    counted = true;
    if (prefersReduced) return;
    const startedAt = performance.now();
    const duration = 1100;
    const animateCount = now => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 4;
      achievementCount.textContent = `${Math.round(target * eased)}${progress === 1 ? '+' : ''}`;
      if (progress < 1) requestAnimationFrame(animateCount);
    };
    requestAnimationFrame(animateCount);
  };
  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        showCount();
        countObserver.disconnect();
      }
    }, { threshold: .35 });
    countObserver.observe(achievementCount);
  } else showCount();
}

if ('IntersectionObserver' in window) {
  const galleryObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      galleryObserver.unobserve(entry.target);
    }
  }), { threshold: .12 });
  document.querySelectorAll('.gallery-reveal').forEach(element => galleryObserver.observe(element));
} else document.querySelectorAll('.gallery-reveal').forEach(element => element.classList.add('visible'));

const interactiveMotion = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches;
if (interactiveMotion) {
  document.querySelectorAll('.certificate-preview').forEach(frame => {
    frame.addEventListener('pointermove', event => {
      const bounds = frame.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      frame.style.setProperty('--certificate-rotate-y', `${x * 3.2}deg`);
      frame.style.setProperty('--certificate-rotate-x', `${-y * 2.4}deg`);
    });
    frame.addEventListener('pointerleave', () => {
      frame.style.removeProperty('--certificate-rotate-x');
      frame.style.removeProperty('--certificate-rotate-y');
    });
  });

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      card.style.setProperty('--card-rotate-y', `${x * 2.4}deg`);
      card.style.setProperty('--card-rotate-x', `${-y * 1.8}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--card-rotate-x');
      card.style.removeProperty('--card-rotate-y');
    });
  });

  document.querySelectorAll('.hero-actions a').forEach(button => {
    button.addEventListener('pointermove', event => {
      const bounds = button.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;
      button.style.setProperty('--magnetic-x', `${x * .08}px`);
      button.style.setProperty('--magnetic-y', `${y * .08}px`);
    });
    button.addEventListener('pointerleave', () => {
      button.style.removeProperty('--magnetic-x');
      button.style.removeProperty('--magnetic-y');
    });
  });
}

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
  if (items.length) tick();
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

// Pipeline descriptions and hover/focus support.
const pipelineDetail = document.querySelector('.pipeline-detail');
document.querySelectorAll('.pipeline-step').forEach(button => {
  const activate = () => {
    document.querySelectorAll('.pipeline-step').forEach(item => item.classList.toggle('active', item === button));
    if (pipelineDetail) pipelineDetail.textContent = button.dataset.detail;
  };
  button.addEventListener('mouseenter', activate);
  button.addEventListener('focus', activate);
  button.addEventListener('click', activate);
});

// Accessible confusion-matrix explanations.
const matrixDetail = document.querySelector('.matrix-detail');
document.querySelectorAll('.matrix-grid button').forEach(cell => {
  const explain = () => { if (matrixDetail) matrixDetail.textContent = cell.dataset.explain; };
  cell.addEventListener('mouseenter', explain);
  cell.addEventListener('focus', explain);
  cell.addEventListener('click', explain);
});

// Model names change the selected view, while metric fields remain honestly empty.
document.querySelectorAll('.model-choice').forEach(choice => choice.addEventListener('click', () => {
  document.querySelectorAll('.model-choice').forEach(item => item.classList.toggle('selected', item === choice));
}));

// Small feed-forward diagram, with real SVG edges and selectable neuron activation.
const networkMap = document.querySelector('.network-map');
const wireSvg = document.querySelector('.network-wires');
const layersRoot = document.querySelector('.network-layers');
if (networkMap && wireSvg && layersRoot) {
  const sizes = [4, 6, 5, 2];
  const neuronNodes = [];
  sizes.forEach((count, layer) => {
    const column = document.createElement('div');
    column.className = 'neuron-column';
    for (let index = 0; index < count; index += 1) {
      const button = document.createElement('button');
      button.className = 'neuron'; button.type = 'button';
      button.setAttribute('aria-label', `Activate neuron ${index + 1} in layer ${layer + 1}`);
      button.dataset.layer = layer; button.dataset.index = index;
      column.append(button); neuronNodes.push(button);
    }
    layersRoot.append(column);
  });
  const drawEdges = () => {
    const rect = networkMap.getBoundingClientRect();
    wireSvg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    wireSvg.replaceChildren();
    const positions = neuronNodes.map(node => {
      const box = node.getBoundingClientRect();
      return { node, x: box.left - rect.left + box.width / 2, y: box.top - rect.top + box.height / 2 };
    });
    for (let layer = 0; layer < sizes.length - 1; layer += 1) {
      const left = positions.filter(p => Number(p.node.dataset.layer) === layer);
      const right = positions.filter(p => Number(p.node.dataset.layer) === layer + 1);
      left.forEach(a => right.forEach(b => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', a.x); line.setAttribute('y1', a.y); line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
        line.dataset.from = `${layer}-${a.node.dataset.index}`; line.dataset.to = `${layer + 1}-${b.node.dataset.index}`;
        wireSvg.append(line);
      }));
    }
  };
  const activateNeuron = node => {
    const layer = Number(node.dataset.layer), index = Number(node.dataset.index);
    neuronNodes.forEach(n => n.classList.remove('active'));
    node.classList.add('active');
    const active = new Set([`${layer}-${index}`]);
    for (let next = layer + 1; next < sizes.length; next += 1) {
      for (let i = 0; i < sizes[next]; i += 1) active.add(`${next}-${i}`);
    }
    wireSvg.querySelectorAll('line').forEach(line => line.classList.toggle('active', active.has(line.dataset.from) && active.has(line.dataset.to)));
    neuronNodes.forEach(n => { if (active.has(`${n.dataset.layer}-${n.dataset.index}`)) n.classList.add('active'); });
  };
  neuronNodes.forEach(node => node.addEventListener('click', () => activateNeuron(node)));
  requestAnimationFrame(drawEdges);
  window.addEventListener('resize', drawEdges);
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
document.querySelectorAll('.certificate-preview').forEach(button => button.addEventListener('click', () => {
  const source = button.querySelector('img');
  if (!source || !imageDialog || !dialogImage) return;
  dialogImage.src = source.src; dialogImage.alt = source.alt;
  imageDialog.showModal();
}));
imageDialog?.querySelector('.dialog-close')?.addEventListener('click', () => imageDialog.close());
imageDialog?.addEventListener('click', event => { if (event.target === imageDialog) imageDialog.close(); });

// Lightweight 2D fallback if Three.js/WebGL is unavailable.
function startFallback(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let width = 0, height = 0, frame = 0, pointer = { x: 0, y: 0 }, running = true, visible = true;
  const count = window.innerWidth < 600 ? 56 : 100;
  const points = Array.from({ length: count }, (_, i) => {
    const z = Math.random() * 2 - 1, angle = Math.random() * Math.PI * 2, radius = 100 + Math.random() * 110;
    return { x: Math.cos(angle) * radius * Math.sqrt(1 - z * z), y: Math.sin(angle) * radius * Math.sqrt(1 - z * z), z: z * radius, phase: Math.random() * 7 };
  });
  const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 1.5); width = canvas.clientWidth; height = canvas.clientHeight; canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const draw = time => {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    const angle = prefersReduced ? .1 : time * .00015;
    const projected = points.map(p => {
      const x = p.x * Math.cos(angle) - p.z * Math.sin(angle), z = p.x * Math.sin(angle) + p.z * Math.cos(angle);
      const scale = 310 / (310 + z);
      return { x: width / 2 + (x + pointer.x * 15) * scale, y: height / 2 + (p.y + pointer.y * 10) * scale, scale, z };
    });
    projected.forEach((p, i) => {
      for (let j = i + 1; j < projected.length; j += 1) {
        const q = projected[j], dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist < 38) { ctx.strokeStyle = `rgba(115,220,226,${(1 - dist / 38) * .42})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke(); }
      }
      const pulse = 1 + Math.sin(time * .002 + points[i].phase) * .25;
      ctx.fillStyle = '#8cebf0'; ctx.shadowColor = '#59d9df'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(1,p.scale * pulse * 2.2),0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
    });
    if (!prefersReduced) frame = requestAnimationFrame(draw);
  };
  resize(); frame = requestAnimationFrame(draw);
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible && !prefersReduced && !frame) frame = requestAnimationFrame(draw);
    if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
  }) : null;
  observer?.observe(canvas);
  window.addEventListener('resize', resize);
  canvas.parentElement.addEventListener('pointermove', e => { const rect = canvas.getBoundingClientRect(); pointer.x = (e.clientX - rect.left) / rect.width - .5; pointer.y = (e.clientY - rect.top) / rect.height - .5; });
  return () => { running = false; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', resize); };
}

// Load Three.js only when the hero enters view; pause rendering offscreen and on hidden tabs.
const canvas = document.getElementById('neural-canvas');
if (canvas && 'IntersectionObserver' in window) {
  let started = false;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting) || started) return;
    started = true; observer.disconnect();
    const boot = async () => {
      try {
        const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
        if (!canvas.isConnected) return;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: window.innerWidth > 700, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.7));
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(43, 1, .1, 1200); camera.position.z = 540;
        const sphere = new THREE.Group(); scene.add(sphere);
        const nodeCount = window.innerWidth < 600 ? 120 : 245;
        const vectors = [];
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < nodeCount; i += 1) {
          const y = 1 - (i / (nodeCount - 1)) * 2, radius = Math.sqrt(1 - y * y), theta = golden * i;
          vectors.push(new THREE.Vector3(Math.cos(theta) * radius * 195, y * 195, Math.sin(theta) * radius * 195));
        }
        const nodeGeometry = new THREE.SphereGeometry(1.7, 7, 6);
        const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x9df4f1 });
        const instances = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodeCount);
        const matrix = new THREE.Matrix4();
        vectors.forEach((v, i) => { matrix.makeTranslation(v.x, v.y, v.z); instances.setMatrixAt(i, matrix); });
        instances.instanceMatrix.needsUpdate = true; sphere.add(instances);
        const linePositions = [];
        const edges = [];
        for (let i = 0; i < nodeCount; i += 1) {
          const nearest = vectors.map((v, j) => ({ j, d: vectors[i].distanceTo(v) })).filter(v => v.j !== i && v.d < 62).sort((a,b) => a.d-b.d).slice(0,4);
          nearest.forEach(({ j }) => { if (j <= i) return; edges.push([i,j]); linePositions.push(...vectors[i].toArray(), ...vectors[j].toArray()); });
        }
        const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions,3));
        sphere.add(new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({ color:0x57cad4, transparent:true, opacity:.24 })));
        const particlePositions = new Float32Array(24 * 3);
        const particleGeo = new THREE.BufferGeometry(); particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
        const particles = new THREE.Points(particleGeo,new THREE.PointsMaterial({ color:0xe5ffff,size:4,transparent:true,opacity:.9,sizeAttenuation:true })); sphere.add(particles);
        const flows = Array.from({ length: 24 }, (_,i) => ({ edge: edges[(i * 47) % edges.length], phase: Math.random(), speed: .0014 + Math.random() * .002 }));
        let targetX=0,targetY=0,active=true,frameId=0,lastTime=0;
        const resize=()=>{const box=canvas.getBoundingClientRect();renderer.setSize(box.width,box.height,false);camera.aspect=box.width/Math.max(box.height,1);camera.updateProjectionMatrix();};
        const pointer=e=>{const r=canvas.getBoundingClientRect();targetY=((e.clientX-r.left)/r.width-.5)*.42;targetX=((e.clientY-r.top)/r.height-.5)*.34;};
        canvas.parentElement.addEventListener('pointermove',pointer); window.addEventListener('resize',resize); resize();
        const setActive=()=>{active=document.visibilityState==='visible'&&canvas.getBoundingClientRect().bottom>0&&canvas.getBoundingClientRect().top<innerHeight;if(active&&!frameId)frameId=requestAnimationFrame(render);if(!active&&frameId){cancelAnimationFrame(frameId);frameId=0;}};
        const sceneObserver=new IntersectionObserver(setActive,{rootMargin:'100px'});sceneObserver.observe(canvas);
        const visibility=()=>setActive();
        document.addEventListener('visibilitychange',visibility);
        const proximity=e=>{const r=canvas.getBoundingClientRect();const mx=((e.clientX-r.left)/r.width-.5)*390,my=-((e.clientY-r.top)/r.height-.5)*390;let closest=0,best=Infinity;vectors.forEach((v,i)=>{const d=(v.x-mx)**2+(v.y-my)**2;if(d<best){best=d;closest=i;}});const color=new THREE.Color(0x9df4f1);const hot=new THREE.Color(0xff8ce1);for(let i=0;i<nodeCount;i++){const d=Math.sqrt(vectors[i].distanceToSquared(vectors[closest]));const f=Math.max(0,1-d/86);instances.setColorAt(i,color.clone().lerp(hot,f));}instances.instanceColor.needsUpdate=true;};
        canvas.parentElement.addEventListener('pointermove',proximity);
        function render(time){frameId=0;if(!active||!canvas.isConnected)return;if(!prefersReduced&&time-lastTime>14){lastTime=time;sphere.rotation.y+=(targetY-sphere.rotation.y)*.025;sphere.rotation.x+=(targetX-sphere.rotation.x)*.025;sphere.rotation.y+=.0009;flows.forEach((flow,i)=>{flow.phase=(flow.phase+flow.speed)%1;const [a,b]=flow.edge;const point=vectors[a].clone().lerp(vectors[b],flow.phase);particlePositions[i*3]=point.x;particlePositions[i*3+1]=point.y;particlePositions[i*3+2]=point.z;});particleGeo.attributes.position.needsUpdate=true;}renderer.render(scene,camera);if(!prefersReduced)frameId=requestAnimationFrame(render);}
        frameId=requestAnimationFrame(render);
        const cleanup=()=>{active=false;cancelAnimationFrame(frameId);sceneObserver.disconnect();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);canvas.parentElement.removeEventListener('pointermove',pointer);canvas.parentElement.removeEventListener('pointermove',proximity);renderer.dispose();nodeGeometry.dispose();nodeMaterial.dispose();lineGeo.dispose();particleGeo.dispose();};
        window.addEventListener('pagehide',cleanup,{once:true});
      } catch (error) { const fallback = canvas.cloneNode(false); canvas.replaceWith(fallback); startFallback(fallback); }
    };
    if ('requestIdleCallback' in window) requestIdleCallback(() => boot(), { timeout: 1200 }); else setTimeout(boot, 100);
  }, { rootMargin: '100px' });
  observer.observe(canvas);
} else if (canvas) startFallback(canvas);

/*
  Mauri Jocou Constructora — visor del gemelo digital 3D (dúplex en pozo, Fernández Oro).

  Criterio de peso: al abrir la página solo se muestra una imagen fija (poster).
  El motor 3D (three.js desde jsdelivr) y el modelo (images/duplex-oro-3d.glb, 5 MB con Draco)
  se descargan recién cuando la persona toca "Explorar el modelo 3D".

  Plantas: los materiales del modelo llevan el sufijo __PA (planta alta) o __TECHO.
  "Planta alta" oculta el techo; "Planta baja" oculta techo y planta alta. Ambas vistas van desde arriba.
*/
const RAIZ = document.querySelector('.visor-3d');
if (RAIZ) {
  const q = s => RAIZ.querySelector(s);
  const cont = q('.visor-lienzo'), poster = q('.visor-poster'), abrir = q('.visor-abrir'), cargando = q('.visor-cargando');
  const botones = [...RAIZ.querySelectorAll('.visor-niveles button')];
  const MODELO = RAIZ.dataset.modelo || 'images/duplex-oro-3d.glb';
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/';
  const OCULTAR = { completa: [], PA: ['__TECHO'], PB: ['__PA', '__TECHO'] };
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // En pantallas táctiles la ayuda habla de dedos; con mouse, de la rueda.
  if (matchMedia('(pointer: coarse)').matches) {
    q('.visor-ayuda').textContent = 'Arrastrá con un dedo para girar. Separá dos dedos para acercarte.';
  }

  let THREE, renderer, scene, camera, controls, modelo, radio = 10, anim = null;
  const VISTA = {
    completa: () => [-120, 72],
    PA: () => [camera.aspect >= 1 ? 0 : -90, 4],
    PB: () => [camera.aspect >= 1 ? 0 : -90, 4]
  };

  const evento = n => { try { if (typeof window.gtag === 'function') window.gtag('event', n); } catch (e) {} };
  const estado = t => { cargando.hidden = !t; if (t) cargando.textContent = t; };

  function vistaDesde(az, el) {
    const s = new THREE.Spherical(radio, THREE.MathUtils.degToRad(el), THREE.MathUtils.degToRad(az));
    return new THREE.Vector3().setFromSpherical(s).add(controls.target);
  }
  function pintar() { renderer.render(scene, camera); }
  function moverCamara(az, el) {
    const destino = vistaDesde(az, el);
    if (reducir) { camera.position.copy(destino); controls.update(); pintar(); return; }
    const desde = camera.position.clone(), t0 = performance.now(), dur = 700;
    cancelAnimationFrame(anim);
    const paso = t => {
      const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(desde, destino, e); controls.update(); pintar();
      if (k < 1) anim = requestAnimationFrame(paso);
    };
    anim = requestAnimationFrame(paso);
  }

  function montar(gltf, OrbitControls, RoomEnvironment) {
    scene = new THREE.Scene(); scene.background = new THREE.Color(0xE3DBC5);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(cont.clientWidth, cont.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    cont.appendChild(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.3;
    scene.add(new THREE.HemisphereLight(0xdbe8f5, 0xc9b98f, 0.4));

    modelo = gltf.scene; scene.add(modelo);
    const caja = new THREE.Box3().setFromObject(modelo), centro = caja.getCenter(new THREE.Vector3()), tam = caja.getSize(new THREE.Vector3());
    modelo.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    // Sol cálido para marcar volúmenes y dar sombra al suelo.
    const sol = new THREE.DirectionalLight(0xffe6c4, 3.4);
    sol.position.set(centro.x - tam.x, caja.max.y + tam.y * 2, centro.z + tam.z * 1.2);
    sol.target.position.copy(centro); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
    const m = Math.max(tam.x, tam.z) * 0.9;
    Object.assign(sol.shadow.camera, { left: -m, right: m, top: m, bottom: -m, near: 0.5, far: tam.y * 8 + m * 4 });
    sol.shadow.bias = -0.0005;
    scene.add(sol, sol.target);
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(m * 6, m * 6), new THREE.ShadowMaterial({ opacity: 0.18 }));
    piso.rotation.x = -Math.PI / 2; piso.position.set(centro.x, caja.min.y - 0.01, centro.z); piso.receiveShadow = true; scene.add(piso);

    camera = new THREE.PerspectiveCamera(32, cont.clientWidth / cont.clientHeight, 0.05, 500);
    // Distancia para que la casa entre completa en el lado más angosto de la pantalla.
    const R = tam.length() / 2, vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    radio = R / Math.sin(Math.min(vf, hf) / 2) * 0.92;
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(centro); controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
    controls.minDistance = tam.length() * 0.25; controls.maxDistance = radio * 1.8;
    controls.addEventListener('change', pintar);
    camera.position.copy(vistaDesde(...VISTA.completa())); controls.update();

    const bucle = () => { if (controls.update()) pintar(); requestAnimationFrame(bucle); }; bucle();
    new ResizeObserver(() => {
      const w = cont.clientWidth, h = cont.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); pintar();
    }).observe(cont);
    pintar();
  }

  function verNivel(nivel) {
    const lista = OCULTAR[nivel];
    modelo.traverse(o => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.visible = !mats.some(mt => lista.some(s => (mt.name || '').endsWith(s)));
    });
    moverCamara(...VISTA[nivel]());
    botones.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.nivel === nivel)));
    evento('modelo3d_' + nivel.toLowerCase());
  }

  abrir.addEventListener('click', async () => {
    abrir.disabled = true; estado('Cargando el motor 3D…'); evento('modelo3d_abrir');
    try {
      THREE = await import(THREE_URL + 'build/three.module.js');
      const [{ GLTFLoader }, { DRACOLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
        import(THREE_URL + 'examples/jsm/loaders/GLTFLoader.js'),
        import(THREE_URL + 'examples/jsm/loaders/DRACOLoader.js'),
        import(THREE_URL + 'examples/jsm/controls/OrbitControls.js'),
        import(THREE_URL + 'examples/jsm/environments/RoomEnvironment.js')
      ]);
      const draco = new DRACOLoader().setDecoderPath('assets/js/draco/');
      const loader = new GLTFLoader().setDRACOLoader(draco);
      const gltf = await loader.loadAsync(MODELO, e => {
        if (e.total) estado('Descargando modelo… ' + Math.min(99, Math.round(e.loaded / e.total * 100)) + ' %');
        else estado('Descargando modelo… ' + (e.loaded / 1e6).toFixed(1) + ' MB');
      });
      estado('Preparando el modelo…');
      montar(gltf, OrbitControls, RoomEnvironment);
      poster.hidden = true; estado(''); botones.forEach(b => (b.disabled = false));
    } catch (e) {
      console.error('[visor 3D]', e);
      abrir.disabled = false; estado('No se pudo cargar el modelo. Tocá el botón para intentarlo de nuevo.');
    }
  });
  botones.forEach(b => b.addEventListener('click', () => verNivel(b.dataset.nivel)));
}

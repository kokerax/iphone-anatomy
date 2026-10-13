// iPhone 16 Pro — 3D CAD Exploded Anatomy Engine (Three.js)
// Inspired by @quantapar industrial hardware anatomyexploded-view videos

(function () {
  const PHONE_W = 3.55;   // Width (71.5 mm scaled)
  const PHONE_L = 7.35;   // Length (149.6 mm scaled)
  const CORNER_R = 0.58;  // Corner radius
  const TOTAL_DURATION = 17.0; // 0:00 / 0:17 video timeline

  const viewport = document.getElementById('canvas-holder');
  const scene = new THREE.Scene();

  // Camera: Low-FOV perspective for crisp CAD isometric look without distortion
  const camera = new THREE.PerspectiveCamera(24, 16 / 10, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  viewport.appendChild(renderer.domElement);

  // ==================== LIGHTING (CLEAN CAD STUDIO) ====================
  const ambLight = new THREE.AmbientLight(0xffffff, 1.65);
  scene.add(ambLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.85);
  hemiLight.position.set(0, 30, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(14, 28, 18);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 5;
  keyLight.shadow.camera.far = 60;
  const d = 9.5;
  keyLight.shadow.camera.left = -d;
  keyLight.shadow.camera.right = d;
  keyLight.shadow.camera.top = d;
  keyLight.shadow.camera.bottom = -d;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xf1f5f9, 1.6);
  fillLight.position.set(-18, 14, 12);
  scene.add(fillLight);

  const backRimLight = new THREE.DirectionalLight(0xe2e8f0, 1.4);
  backRimLight.position.set(6, 12, -20);
  scene.add(backRimLight);

  // Soft studio shadow catcher plane below bottom layer
  const shadowPlaneGeo = new THREE.PlaneGeometry(34, 34);
  const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.11 });
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -4.15;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // ==================== GEOMETRY HELPERS ====================
  function makeRoundedRectShape(w, l, r) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -l / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + l - r);
    s.quadraticCurveTo(x + w, y + l, x + w - r, y + l);
    s.lineTo(x + r, y + l);
    s.quadraticCurveTo(x, y + l, x, y + l - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function makeRectHolePath(cx, cy, w, l, r) {
    const p = new THREE.Path();
    const x = cx - w / 2;
    const y = cy - l / 2;
    p.moveTo(x + r, y);
    p.lineTo(x + w - r, y);
    p.quadraticCurveTo(x + w, y, x + w, y + r);
    p.lineTo(x + w, y + l - r);
    p.quadraticCurveTo(x + w, y + l, x + w - r, y + l);
    p.lineTo(x + r, y + l);
    p.quadraticCurveTo(x, y + l, x, y + l - r);
    p.lineTo(x, y + r);
    p.quadraticCurveTo(x, y, x + r, y);
    return p;
  }

  function extrudeFlat(shape, depth, bevel = 0.015) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 24
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -depth / 2, 0);
    return geo;
  }

  function addCadEdges(mesh, color = 0x1e2229, opacity = 0.34) {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 20);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    mesh.add(line);
    return mesh;
  }

  function enableShadows(obj) {
    obj.traverse((child) => {
      if (child.isMesh && !child.userData.noShadow) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  // ==================== PROCEDURAL HIGH-RES TEXTURES ====================
  function createBatteryTexture() {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 1024;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#22262e';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle brushed foil grain
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i < 350; i++) {
      ctx.beginPath();
      const y = Math.random() * 1024;
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(241, 245, 249, 0.78)';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Li-ion Polymer Battery', 110, 235);
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, monospace';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.fillText('3.89V ━━━ 13.94Wh ━━━ 3582mAh', 110, 292);
    ctx.fillText('APN: 616-00759  •  100% Recycled Cobalt', 110, 342);

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(110, 395, 640, 145);
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText('⚠ WARNING / AVERTISSEMENT', 135, 442);
    ctx.font = '21px sans-serif';
    ctx.fillText('Potential for fire or burning. Do not disassemble,', 135, 480);
    ctx.fillText('puncture, crush, heat, or burn. Authorized service only.', 135, 514);

    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('CE   UL   ♻   Li-ion 20', 110, 640);

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  function createDisplayTexture() {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 2048;
    const ctx = c.getContext('2d');

    // Outer ultra-thin titanium/ceramic bezel
    ctx.fillStyle = '#181c23';
    ctx.fillRect(0, 0, 1024, 2048);

    // Sleek architectural CAD OLED glass surface with subtle sheen
    const grad = ctx.createLinearGradient(0, 0, 1024, 2048);
    grad.addColorStop(0.0, '#2b3340');
    grad.addColorStop(0.32, '#3b4656');
    grad.addColorStop(0.55, '#252c37');
    grad.addColorStop(1.0, '#1b2029');
    ctx.fillStyle = grad;
    ctx.fillRect(32, 32, 1024 - 64, 2048 - 64);

    // Bright glass reflection band across screen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.moveTo(32, 280);
    ctx.lineTo(992, 740);
    ctx.lineTo(992, 1080);
    ctx.lineTo(32, 620);
    ctx.closePath();
    ctx.fill();

    // Subtle CAD pixel calibration grid on OLED glass
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.11)';
    ctx.lineWidth = 2;
    for (let x = 128; x < 1024; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, 36); ctx.lineTo(x, 2012); ctx.stroke();
    }
    for (let y = 128; y < 2048; y += 128) {
      ctx.beginPath(); ctx.moveTo(36, y); ctx.lineTo(988, y); ctx.stroke();
    }

    // Dynamic Island pill cutout at top
    ctx.fillStyle = '#07090d';
    ctx.beginPath();
    ctx.roundRect(342, 78, 340, 92, 46);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // TrueDepth lenses inside Dynamic Island
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(622, 124, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(615, 118, 8, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#312e81';
    ctx.beginPath(); ctx.arc(412, 124, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath(); ctx.arc(408, 120, 6, 0, Math.PI * 2); ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  // ==================== MATERIALS (TUNED FOR STUDIO CLARITY) ====================
  const matTitanium = new THREE.MeshStandardMaterial({
    color: 0xe2e5ec,
    metalness: 0.28,
    roughness: 0.34
  });

  const matDarkTitanium = new THREE.MeshStandardMaterial({
    color: 0xaeb4c0,
    metalness: 0.32,
    roughness: 0.36
  });

  const matSteel = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.35,
    roughness: 0.26
  });

  const matPcbBlack = new THREE.MeshStandardMaterial({
    color: 0x1e222a,
    metalness: 0.15,
    roughness: 0.52
  });

  const matSiliconChip = new THREE.MeshStandardMaterial({
    color: 0x333944,
    metalness: 0.25,
    roughness: 0.35
  });

  const matGold = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.42,
    roughness: 0.25
  });

  const matCopper = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    metalness: 0.38,
    roughness: 0.28
  });

  const matGraphite = new THREE.MeshStandardMaterial({
    color: 0x3b404b,
    metalness: 0.22,
    roughness: 0.48
  });

  const matGasket = new THREE.MeshStandardMaterial({
    color: 0x262a32,
    metalness: 0.08,
    roughness: 0.68
  });

  const matFrostedGlass = new THREE.MeshStandardMaterial({
    color: 0xdfe3ea,
    metalness: 0.12,
    roughness: 0.28,
    transparent: true,
    opacity: 0.94
  });

  const matBattery = new THREE.MeshStandardMaterial({
    map: createBatteryTexture(),
    metalness: 0.18,
    roughness: 0.42
  });

  const matDisplayTop = new THREE.MeshStandardMaterial({
    map: createDisplayTexture(),
    metalness: 0.18,
    roughness: 0.22
  });

  // ==================== ROOT GROUP & ANATOMY LAYERS ====================
  const phoneRoot = new THREE.Group();
  scene.add(phoneRoot);

  const layers = [];

  // -------------------------------------------------------------------------
  // LAYER 1 (Bottom): Frosted Matte Back Glass & Camera Plateau Bezel
  // -------------------------------------------------------------------------
  const layer1 = new THREE.Group();
  layer1.userData = {
    name: 'Matte Back Glass & Sapphire Plateau',
    trName: '1. Dokulu Mat Arka Cam & Kamera Platosu',
    assembledY: -0.22,
    explodedY: -3.65,
    order: 0
  };
  {
    const backShape = makeRoundedRectShape(PHONE_W - 0.08, PHONE_L - 0.08, CORNER_R - 0.04);
    const backGeo = extrudeFlat(backShape, 0.06, 0.01);
    const backMesh = addCadEdges(new THREE.Mesh(backGeo, matFrostedGlass), 0x475569, 0.25);
    layer1.add(backMesh);

    // Camera bump housing on back glass (top-left corner in rear/internal coords)
    const plateauShape = makeRoundedRectShape(1.55, 1.62, 0.32);
    const plateauGeo = extrudeFlat(plateauShape, 0.12, 0.015);
    const plateauMesh = addCadEdges(new THREE.Mesh(plateauGeo, matTitanium), 0x1e293b, 0.32);
    plateauMesh.position.set(-0.82, -0.06, -2.55);
    layer1.add(plateauMesh);

    // 3 exterior camera trim rings protruding slightly downward
    const lensCoords = [
      [-1.18, -2.92],
      [-1.18, -2.18],
      [-0.46, -2.55]
    ];
    lensCoords.forEach(([lx, lz]) => {
      const ringGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.16, 32);
      const ringMesh = addCadEdges(new THREE.Mesh(ringGeo, matDarkTitanium), 0x0f172a, 0.35);
      ringMesh.position.set(lx, -0.1, lz);
      layer1.add(ringMesh);
    });
  }
  phoneRoot.add(layer1);
  layers.push(layer1);

  // -------------------------------------------------------------------------
  // LAYER 2: Grade 5 Titanium Structural Unibody Chassis (Ti-6Al-4V)
  // -------------------------------------------------------------------------
  const layer2 = new THREE.Group();
  layer2.userData = {
    name: 'Grade 5 Titanium Unibody Frame',
    trName: '2. 5. Sınıf Titanyum Gövde & Anten Şeritleri',
    assembledY: -0.10,
    explodedY: -2.55,
    order: 1
  };
  {
    // Outer Titanium perimeter with milled internal cavity
    const outer = makeRoundedRectShape(PHONE_W, PHONE_L, CORNER_R);
    outer.holes.push(makeRectHolePath(0, 0, PHONE_W - 0.28, PHONE_L - 0.28, CORNER_R - 0.12));
    const frameGeo = extrudeFlat(outer, 0.34, 0.025);
    const frameMesh = addCadEdges(new THREE.Mesh(frameGeo, matTitanium), 0x1e293b, 0.35);
    layer2.add(frameMesh);

    // Internal CNC structural floor web with weight-saving cutouts
    const webShape = makeRoundedRectShape(PHONE_W - 0.24, PHONE_L - 0.24, CORNER_R - 0.1);
    webShape.holes.push(makeRectHolePath(-0.35, 0.45, 1.95, 3.65, 0.16)); // Battery bay cutout
    webShape.holes.push(makeRectHolePath(0.88, -1.25, 1.12, 3.1, 0.14));  // MLB bay cutout
    webShape.holes.push(makeRectHolePath(-0.82, -2.52, 1.48, 1.48, 0.2)); // Camera bay cutout
    const webGeo = extrudeFlat(webShape, 0.06, 0.008);
    const webMesh = addCadEdges(new THREE.Mesh(webGeo, matDarkTitanium), 0x1e293b, 0.3);
    webMesh.position.y = -0.11;
    layer2.add(webMesh);

    // Side physical buttons (Action Button, Volume Up/Down on left; Power & Camera Control on right)
    const btnPositions = [
      [-PHONE_W / 2 - 0.03, -2.1, 0.06, 0.32],
      [-PHONE_W / 2 - 0.03, -1.45, 0.06, 0.56],
      [-PHONE_W / 2 - 0.03, -0.72, 0.06, 0.56],
      [PHONE_W / 2 + 0.03, -1.35, 0.06, 0.82],
      [PHONE_W / 2 + 0.02, 1.45, 0.05, 0.72] // Camera Control capacitive sapphire button
    ];
    btnPositions.forEach(([bx, bz, bw, bl]) => {
      const bGeo = new THREE.BoxGeometry(bw, 0.11, bl);
      const bMesh = addCadEdges(new THREE.Mesh(bGeo, matSteel), 0x0f172a, 0.4);
      bMesh.position.set(bx, 0, bz);
      layer2.add(bMesh);
    });

    // 12 Internal threaded standoff bosses around the titanium perimeter
    const bossCoords = [
      [-1.52, -3.2], [1.52, -3.2], [-1.52, -1.6], [1.52, -1.6],
      [-1.52, 0.0], [1.52, 0.0], [-1.52, 1.6], [1.52, 1.6],
      [-1.52, 3.2], [1.52, 3.2], [-0.5, 3.42], [0.5, 3.42]
    ];
    bossCoords.forEach(([sx, sz]) => {
      const bossGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 12);
      const boss = new THREE.Mesh(bossGeo, matSteel);
      boss.position.set(sx, 0.02, sz);
      layer2.add(boss);
    });
  }
  phoneRoot.add(layer2);
  layers.push(layer2);

  // -------------------------------------------------------------------------
  // LAYER 3: MagSafe Copper Induction Coil, 36 Neodymium Magnets & NFC Array
  // -------------------------------------------------------------------------
  const layer3 = new THREE.Group();
  layer3.userData = {
    name: 'MagSafe Copper Coil & Magnet Array',
    trName: '3. MagSafe Bakır Bobin & 36 Neodimyum Mıknatıs',
    assembledY: -0.05,
    explodedY: -1.55,
    order: 2
  };
  {
    // Thin dark carrier film sheet
    const carrierShape = makeRoundedRectShape(2.95, 4.45, 0.28);
    const carrierGeo = extrudeFlat(carrierShape, 0.03, 0.005);
    const carrierMesh = addCadEdges(new THREE.Mesh(carrierGeo, matGraphite), 0x0f172a, 0.3);
    carrierMesh.position.set(0, 0, 0.35);
    layer3.add(carrierMesh);

    // Concentric Copper Wireless Charging Coil Rings
    for (let r = 0.52; r <= 1.02; r += 0.085) {
      const coilGeo = new THREE.RingGeometry(r, r + 0.055, 48);
      coilGeo.rotateX(-Math.PI / 2);
      const coilMesh = new THREE.Mesh(coilGeo, matCopper);
      coilMesh.position.set(0, 0.022, 0.25);
      layer3.add(coilMesh);
    }

    // 36 segmented Neodymium magnet blocks arranged in the outer MagSafe ring
    const numMagnets = 36;
    for (let i = 0; i < numMagnets; i++) {
      if (i === 9) continue; // Small bottom gap in MagSafe ring
      const angle = (i / numMagnets) * Math.PI * 2;
      const mGeo = new THREE.BoxGeometry(0.11, 0.045, 0.16);
      const mMesh = addCadEdges(new THREE.Mesh(mGeo, matSteel), 0x1e293b, 0.35);
      const rad = 1.22;
      mMesh.position.set(Math.cos(angle) * rad, 0.025, 0.25 + Math.sin(angle) * rad);
      mMesh.rotation.y = -angle + Math.PI / 2;
      layer3.add(mMesh);
    }

    // Vertical MagSafe alignment magnet bar below ring
    const alignGeo = new THREE.BoxGeometry(0.18, 0.045, 0.68);
    const alignMesh = addCadEdges(new THREE.Mesh(alignGeo, matSteel), 0x1e293b, 0.35);
    alignMesh.position.set(0, 0.025, 1.95);
    layer3.add(alignMesh);

    // Gold flex ribbon connecting coil to Logic Board
    const flexGeo = new THREE.BoxGeometry(0.42, 0.02, 1.15);
    const flexMesh = addCadEdges(new THREE.Mesh(flexGeo, matCopper), 0x1e293b, 0.3);
    flexMesh.position.set(0.65, 0.02, -0.65);
    layer3.add(flexMesh);
  }
  phoneRoot.add(layer3);
  layers.push(layer3);

  // -------------------------------------------------------------------------
  // LAYER 4: Graphite & Copper Thermal Dissipation Substructure Sheet
  // -------------------------------------------------------------------------
  const layer4 = new THREE.Group();
  layer4.userData = {
    name: 'Graphite-Copper Thermal Subsystem',
    trName: '4. Grafit & Bakır Termal Dağıtım Katmanı',
    assembledY: -0.01,
    explodedY: -0.65,
    order: 3
  };
  {
    const thShape = makeRoundedRectShape(PHONE_W - 0.34, PHONE_L - 0.34, CORNER_R - 0.14);
    thShape.holes.push(makeRectHolePath(-0.78, -2.45, 1.45, 1.45, 0.18)); // Camera cutout
    thShape.holes.push(makeRectHolePath(0.0, 0.25, 1.65, 1.65, 0.82));    // Central MagSafe aperture
    thShape.holes.push(makeRectHolePath(-0.65, 2.85, 1.45, 0.65, 0.1));   // Taptic window
    const thGeo = extrudeFlat(thShape, 0.035, 0.005);
    const thMesh = addCadEdges(new THREE.Mesh(thGeo, matGraphite), 0x0f172a, 0.35);
    layer4.add(thMesh);

    // Copper vapor-chamber heat spreader patch over A18 Pro zone
    const vcGeo = new THREE.BoxGeometry(0.95, 0.042, 2.25);
    const vcMesh = addCadEdges(new THREE.Mesh(vcGeo, matCopper), 0x451a03, 0.35);
    vcMesh.position.set(0.88, 0.005, -1.15);
    layer4.add(vcMesh);
  }
  phoneRoot.add(layer4);
  layers.push(layer4);

  // -------------------------------------------------------------------------
  // LAYER 5: Core Internal Hardware (L-Battery + A18 Pro MLB + Taptic + USB-C)
  // -------------------------------------------------------------------------
  const layer5 = new THREE.Group();
  layer5.userData = {
    name: 'A18 Pro MLB, L-Shaped Battery & Taptic Engine',
    trName: '5. A18 Pro Anakart, L-Batarya & Taptic Engine',
    assembledY: 0.04,
    explodedY: 0.35,
    order: 4
  };
  {
    // 5A. Iconic Apple L-Shaped Lithium-Ion Battery
    const batShape = new THREE.Shape();
    // L-polygon in (x, y) where y maps to -z after rotateX
    batShape.moveTo(-1.48, -2.35);
    batShape.lineTo(0.28, -2.35);
    batShape.lineTo(0.28, 0.55);
    batShape.lineTo(-0.42, 0.55);
    batShape.lineTo(-0.42, 1.42);
    batShape.lineTo(-1.48, 1.42);
    batShape.closePath();

    const batGeo = extrudeFlat(batShape, 0.19, 0.025);
    // Normalize UVs so battery label texture maps cleanly
    const pos = batGeo.attributes.position;
    const uvs = batGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      uvs.setXY(i, (vx + 1.55) / 2.2, (vz + 1.5) / 4.0);
    }
    const batMesh = addCadEdges(new THREE.Mesh(batGeo, matBattery), 0x0f172a, 0.35);
    layer5.add(batMesh);

    // 5B. Stacked Main Logic Board (MLB) on the right side
    const mlbShape = new THREE.Shape();
    mlbShape.moveTo(0.42, -2.15);
    mlbShape.lineTo(1.52, -2.15);
    mlbShape.lineTo(1.52, 2.35);
    mlbShape.lineTo(0.42, 2.35);
    mlbShape.closePath();
    const mlbGeo = extrudeFlat(mlbShape, 0.14, 0.012);
    const mlbMesh = addCadEdges(new THREE.Mesh(mlbGeo, matPcbBlack), 0x000000, 0.45);
    layer5.add(mlbMesh);

    // A18 Pro SoC Silicon Package on Logic Board (Centerpiece!)
    const a18Geo = new THREE.BoxGeometry(0.76, 0.06, 0.82);
    const a18Mesh = addCadEdges(new THREE.Mesh(a18Geo, matSiliconChip), 0x94a3b8, 0.45);
    a18Mesh.position.set(0.96, 0.09, -0.65);
    layer5.add(a18Mesh);

    // Gold laser-etched frame on A18 Pro chip
    const a18RingGeo = new THREE.BoxGeometry(0.62, 0.065, 0.68);
    const a18Ring = addCadEdges(new THREE.Mesh(a18RingGeo, matSteel), 0x1e293b, 0.4);
    a18Ring.position.set(0.96, 0.092, -0.65);
    layer5.add(a18Ring);

    // NAND Flash & 5G Modem packages + EMI cans on MLB
    const chips = [
      [0.96, -1.62, 0.72, 0.88, matSteel],       // Upper EMI shield
      [0.96, 0.25, 0.68, 0.72, matSiliconChip],  // 5G Modem package
      [0.96, 1.12, 0.74, 0.78, matSteel],        // Lower RF shield
      [0.62, 1.82, 0.28, 0.52, matGold],         // Gold BTB connector 1
      [1.02, 1.82, 0.28, 0.52, matGold],         // Gold BTB connector 2
      [1.34, 1.82, 0.22, 0.48, matGold]          // Gold BTB connector 3
    ];
    chips.forEach(([cx, cz, cw, cl, mat]) => {
      const cGeo = new THREE.BoxGeometry(cw, 0.055, cl);
      const cMesh = addCadEdges(new THREE.Mesh(cGeo, mat), 0x0f172a, 0.4);
      cMesh.position.set(cx, 0.09, cz);
      layer5.add(cMesh);
    });

    // Dozens of tiny gold SMD pads & micro-capacitors along the PCB
    for (let row = 0; row < 14; row++) {
      const padGeo = new THREE.BoxGeometry(0.08, 0.03, 0.05);
      const pad1 = new THREE.Mesh(padGeo, matGold);
      pad1.position.set(0.51, 0.08, -2.0 + row * 0.28);
      layer5.add(pad1);

      const pad2 = new THREE.Mesh(padGeo, matGold);
      pad2.position.set(1.42, 0.08, -2.0 + row * 0.28);
      layer5.add(pad2);
    }

    // 5C. Taptic Engine (Bottom Left Haptic Linear Actuator)
    const tapGeo = new THREE.BoxGeometry(1.46, 0.17, 0.68);
    const tapMesh = addCadEdges(new THREE.Mesh(tapGeo, matSteel), 0x1e293b, 0.4);
    tapMesh.position.set(-0.72, 0.0, 2.82);
    layer5.add(tapMesh);

    // Copper electromagnetic coils inside Taptic Engine detail
    for (let i = -1; i <= 1; i++) {
      const tCoilGeo = new THREE.BoxGeometry(0.32, 0.18, 0.46);
      const tCoil = addCadEdges(new THREE.Mesh(tCoilGeo, matCopper), 0x451a03, 0.35);
      tCoil.position.set(-0.72 + i * 0.4, 0.005, 2.82);
      layer5.add(tCoil);
    }

    // 5D. Lower Stereo Acoustic Speaker Module (Bottom Right)
    const spkGeo = new THREE.BoxGeometry(1.18, 0.17, 0.72);
    const spkMesh = addCadEdges(new THREE.Mesh(spkGeo, matPcbBlack), 0x0f172a, 0.4);
    spkMesh.position.set(0.86, 0.0, 2.82);
    layer5.add(spkMesh);

    // 5E. USB-C 3.2 Gen 2 Port Assembly (Bottom Center)
    const usbGeo = new THREE.BoxGeometry(0.46, 0.14, 0.48);
    const usbMesh = addCadEdges(new THREE.Mesh(usbGeo, matSteel), 0x0f172a, 0.45);
    usbMesh.position.set(0.05, -0.01, 3.32);
    layer5.add(usbMesh);
  }
  phoneRoot.add(layer5);
  layers.push(layer5);

  // -------------------------------------------------------------------------
  // LAYER 6: Triple Pro Camera System + TrueDepth FaceID Array
  // -------------------------------------------------------------------------
  const layer6 = new THREE.Group();
  layer6.userData = {
    name: 'Pro Camera System & TrueDepth Array',
    trName: '6. 48MP Üçlü Pro Kamera & TrueDepth FaceID Modülü',
    assembledY: 0.09,
    explodedY: 1.35,
    order: 5
  };
  {
    // Machined aluminum camera cage block (top-left)
    const camBoxShape = makeRoundedRectShape(1.52, 1.56, 0.24);
    const camBoxGeo = extrudeFlat(camBoxShape, 0.22, 0.02);
    const camBox = addCadEdges(new THREE.Mesh(camBoxGeo, matPcbBlack), 0x0f172a, 0.45);
    camBox.position.set(-0.78, 0, -2.52);
    layer6.add(camBox);

    // 3 Optical Sensor-Shift Lens Assemblies (Main 48MP, Ultra Wide 48MP, 5x Tetraprism)
    const lenses = [
      [-1.14, -2.88, 0.31],
      [-1.14, -2.14, 0.31],
      [-0.42, -2.51, 0.29]
    ];
    const matLensGlass = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.85,
      roughness: 0.12
    });
    lenses.forEach(([lx, lz, lr]) => {
      const barrelGeo = new THREE.CylinderGeometry(lr, lr * 1.05, 0.28, 32);
      const barrel = addCadEdges(new THREE.Mesh(barrelGeo, matSteel), 0x0f172a, 0.4);
      barrel.position.set(lx, 0.02, lz);
      layer6.add(barrel);

      const glassGeo = new THREE.CylinderGeometry(lr * 0.72, lr * 0.72, 0.30, 24);
      const glass = new THREE.Mesh(glassGeo, matLensGlass);
      glass.position.set(lx, 0.02, lz);
      layer6.add(glass);
    });

    // LiDAR Scanner & Adaptive True Tone Flash
    const lidarGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 24);
    const lidar = new THREE.Mesh(lidarGeo, matGraphite);
    lidar.position.set(-0.42, 0.01, -2.98);
    layer6.add(lidar);

    const flashGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.25, 24);
    const flash = new THREE.Mesh(flashGeo, matGold);
    flash.position.set(-0.42, 0.01, -2.04);
    layer6.add(flash);

    // 3 Copper/Gold Camera BTB Flex Ribbons extending to MLB
    for (let i = 0; i < 3; i++) {
      const cFlexGeo = new THREE.BoxGeometry(0.65, 0.03, 0.22);
      const cFlex = addCadEdges(new THREE.Mesh(cFlexGeo, matGold), 0x1e293b, 0.35);
      cFlex.position.set(0.15, -0.02, -2.85 + i * 0.34);
      layer6.add(cFlex);
    }

    // TrueDepth Front Camera & Infrared Dot Projector Module (Top Center-Right)
    const tdGeo = new THREE.BoxGeometry(1.12, 0.16, 0.38);
    const tdMesh = addCadEdges(new THREE.Mesh(tdGeo, matPcbBlack), 0x0f172a, 0.45);
    tdMesh.position.set(0.32, 0.0, -3.12);
    layer6.add(tdMesh);

    const irLensGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.19, 20);
    const ir1 = new THREE.Mesh(irLensGeo, matLensGlass);
    ir1.position.set(0.05, 0.01, -3.12);
    layer6.add(ir1);

    const ir2 = new THREE.Mesh(irLensGeo, matCopper);
    ir2.position.set(0.56, 0.01, -3.12);
    layer6.add(ir2);
  }
  phoneRoot.add(layer6);
  layers.push(layer6);

  // -------------------------------------------------------------------------
  // LAYER 7: CNC Internal Structural Mid-Plate, EMI Cowlings & IP68 Gasket
  // -------------------------------------------------------------------------
  const layer7 = new THREE.Group();
  layer7.userData = {
    name: 'Structural Mid-Plate, EMI Shields & IP68 Gasket',
    trName: '7. Çelik İç Plaka, EMI Kalkanları & IP68 Conta',
    assembledY: 0.13,
    explodedY: 2.25,
    order: 6
  };
  {
    // Perforated CAD Mid-Plate / Gasket Frame (gives that multi-layer keyboard plate vibe!)
    const plateShape = makeRoundedRectShape(PHONE_W - 0.18, PHONE_L - 0.18, CORNER_R - 0.08);
    plateShape.holes.push(makeRectHolePath(-0.78, -2.52, 1.56, 1.58, 0.2));
    plateShape.holes.push(makeRectHolePath(-0.62, 0.22, 1.62, 3.25, 0.16));
    plateShape.holes.push(makeRectHolePath(0.88, -0.45, 1.05, 3.15, 0.12));
    plateShape.holes.push(makeRectHolePath(-0.68, 2.82, 1.42, 0.72, 0.1));
    plateShape.holes.push(makeRectHolePath(0.82, 2.82, 1.15, 0.72, 0.1));
    const plateGeo = extrudeFlat(plateShape, 0.04, 0.006);
    const plateMesh = addCadEdges(new THREE.Mesh(plateGeo, matSteel), 0x1e293b, 0.38);
    layer7.add(plateMesh);

    // Stamped Stainless Steel BTB Cowling Brackets
    const cowling1 = addCadEdges(new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.05, 0.65), matTitanium), 0x0f172a, 0.4);
    cowling1.position.set(0.92, 0.04, -1.85);
    layer7.add(cowling1);

    const cowling2 = addCadEdges(new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.85), matTitanium), 0x0f172a, 0.4);
    cowling2.position.set(0.92, 0.04, 0.55);
    layer7.add(cowling2);

    // Waterproof IP68 Perimeter Elastomer Gasket slightly above plate
    const gShape = makeRoundedRectShape(PHONE_W - 0.12, PHONE_L - 0.12, CORNER_R - 0.05);
    gShape.holes.push(makeRectHolePath(0, 0, PHONE_W - 0.28, PHONE_L - 0.28, CORNER_R - 0.12));
    const gGeo = extrudeFlat(gShape, 0.025, 0.003);
    const gMesh = addCadEdges(new THREE.Mesh(gGeo, matGasket), 0x000000, 0.35);
    gMesh.position.y = 0.09;
    layer7.add(gMesh);
  }
  phoneRoot.add(layer7);
  layers.push(layer7);

  // -------------------------------------------------------------------------
  // LAYER 8: 16 Floating Pentalobe & Tri-Point Micro-Screws
  // -------------------------------------------------------------------------
  const layer8 = new THREE.Group();
  layer8.userData = {
    name: '16x Precision Micro-Screws (Y000 & Pentalobe)',
    trName: '8. 16 Adet Hassas Mikro Vida (Y000 & Pentalobe)',
    assembledY: 0.15,
    explodedY: 2.95,
    order: 7
  };
  const screwMeshes = [];
  {
    const screwPositions = [
      [-1.52, -3.2], [1.52, -3.2],
      [-1.52, -1.6], [1.52, -1.6],
      [-1.52, 0.0],  [1.52, 0.0],
      [-1.52, 1.6],  [1.52, 1.6],
      [-1.52, 3.2],  [1.52, 3.2],
      [0.45, -2.1],  [1.38, -2.1],
      [0.45, 0.2],   [1.38, 0.2],
      [-0.28, 3.55], [0.38, 3.55] // Bottom Pentalobe screws
    ];

    screwPositions.forEach(([sx, sz], idx) => {
      const sGroup = new THREE.Group();
      // Screw head
      const headGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.035, 16);
      const head = addCadEdges(new THREE.Mesh(headGeo, matSteel), 0x0f172a, 0.45);
      head.position.y = 0.08;
      sGroup.add(head);

      // Threaded shaft
      const shaftGeo = new THREE.CylinderGeometry(0.032, 0.028, 0.16, 12);
      const shaft = new THREE.Mesh(shaftGeo, matDarkTitanium);
      shaft.position.y = 0.0;
      sGroup.add(shaft);

      // Cross slot on head
      const slotGeo = new THREE.BoxGeometry(0.08, 0.01, 0.016);
      const slot = new THREE.Mesh(slotGeo, matPcbBlack);
      slot.position.y = 0.098;
      sGroup.add(slot);

      sGroup.position.set(sx, (idx % 3) * 0.08, sz);
      sGroup.userData = { baseY: (idx % 3) * 0.08 };
      layer8.add(sGroup);
      screwMeshes.push(sGroup);
    });
  }
  phoneRoot.add(layer8);
  layers.push(layer8);

  // -------------------------------------------------------------------------
  // LAYER 9 (Top): Ceramic Shield & Super Retina XDR OLED Display Assembly
  // -------------------------------------------------------------------------
  const layer9 = new THREE.Group();
  layer9.userData = {
    name: 'Ceramic Shield & Super Retina XDR OLED Display',
    trName: '9. Ceramic Shield & Super Retina XDR OLED Ekran',
    assembledY: 0.21,
    explodedY: 3.35,
    order: 8
  };
  {
    // Metallic backing frame of OLED panel
    const dispFrameShape = makeRoundedRectShape(PHONE_W - 0.06, PHONE_L - 0.06, CORNER_R - 0.03);
    const dispFrameGeo = extrudeFlat(dispFrameShape, 0.055, 0.012);
    const dispFrame = addCadEdges(new THREE.Mesh(dispFrameGeo, matTitanium), 0x0f172a, 0.38);
    dispFrame.userData.noShadow = true;
    layer9.add(dispFrame);

    // Top textured OLED glass surface
    const screenPlaneGeo = new THREE.PlaneGeometry(PHONE_W - 0.18, PHONE_L - 0.18);
    screenPlaneGeo.rotateX(-Math.PI / 2);
    const screenPlane = new THREE.Mesh(screenPlaneGeo, matDisplayTop);
    screenPlane.position.y = 0.042;
    screenPlane.userData.noShadow = true;
    layer9.add(screenPlane);

    // Display Touch & Power Flex Cable hanging underneath screen
    const dFlexGeo = new THREE.BoxGeometry(0.55, 0.02, 1.35);
    const dFlex = addCadEdges(new THREE.Mesh(dFlexGeo, matPcbBlack), 0x000000, 0.4);
    dFlex.position.set(0.78, -0.05, 0.45);
    dFlex.userData.noShadow = true;
    layer9.add(dFlex);

    const dConnGeo = new THREE.BoxGeometry(0.48, 0.035, 0.26);
    const dConn = new THREE.Mesh(dConnGeo, matGold);
    dConn.position.set(0.78, -0.06, 1.02);
    dConn.userData.noShadow = true;
    layer9.add(dConn);
  }
  phoneRoot.add(layer9);
  layers.push(layer9);

  enableShadows(phoneRoot);

  // ==================== CAMERA ORBIT & INTERACTION ====================
  let isPlaying = true;
  let currentTime = 5.0; // Start right at 0:05 / 0:17 exploded hero frame like the screenshot!
  let userDragging = false;
  let dragStart = { x: 0, y: 0 };
  let userYawOffset = 0;
  let userPitchOffset = 0;
  let zoomDist = 25.2;
  let showLabels = false;

  const canvasEl = renderer.domElement;
  canvasEl.addEventListener('pointerdown', (e) => {
    userDragging = true;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (!userDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    userYawOffset += dx * 0.007;
    userPitchOffset = Math.max(-0.45, Math.min(0.55, userPitchOffset + dy * 0.005));
  });
  window.addEventListener('pointerup', () => {
    userDragging = false;
  });
  canvasEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomDist = Math.max(14, Math.min(36, zoomDist + e.deltaY * 0.01));
  }, { passive: false });

  // ==================== TIMELINE EASE FUNCTIONS ====================
  function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function getExplosionFactor(t, layerOrder) {
    // Staggered explosion from t=1.2s to t=5.0s, hold exploded until t=12.8s, reassemble 12.8s..15.6s
    const stagger = (8 - layerOrder) * 0.14;
    const openProgress = smoothstep(1.1 + stagger, 4.4 + stagger * 0.6, t);
    const closeProgress = smoothstep(12.6 + layerOrder * 0.12, 15.5 + layerOrder * 0.08, t);
    return Math.max(0, openProgress - closeProgress);
  }

  // ==================== 2D CALLOUT LABELS OVERLAY ====================
  const labelsContainer = document.getElementById('labels-overlay');
  const labelEls = layers.map((layer) => {
    const div = document.createElement('div');
    div.className = 'layer-label';
    div.innerHTML = `<span class="dot"></span><span>${layer.userData.trName}</span>`;
    labelsContainer.appendChild(div);
    return { div, layer };
  });

  function updateSceneAtTime(t) {
    // Update each layer's vertical exploded position
    layers.forEach((layer) => {
      const { assembledY, explodedY, order } = layer.userData;
      const f = getExplosionFactor(t, order);
      layer.position.y = assembledY + (explodedY - assembledY) * f;
    });

    // Spin floating micro-screws as they lift
    const screwFactor = getExplosionFactor(t, 7);
    screwMeshes.forEach((s, idx) => {
      s.rotation.y = screwFactor * Math.PI * 4 + idx;
      s.position.y = s.userData.baseY + Math.sin(t * 2.5 + idx) * 0.03 * screwFactor;
    });

    // Landscape Isometric diagonal angle matching @quantapar keyboard anatomy video!
    const baseYaw = 1.04 + Math.sin(t * 0.32) * 0.16 + userYawOffset;
    const basePitch = 0.52 + Math.cos(t * 0.25) * 0.05 + userPitchOffset;

    phoneRoot.rotation.y = baseYaw;
    phoneRoot.rotation.x = 0.04;
    phoneRoot.rotation.z = -0.05;

    camera.position.set(
      0,
      Math.sin(basePitch) * zoomDist,
      Math.cos(basePitch) * zoomDist
    );
    camera.lookAt(0, -0.1, 0);

    // Update UI timeline bar & timecode
    const pct = (t / TOTAL_DURATION) * 100;
    const fillEl = document.getElementById('progress-fill');
    if (fillEl) fillEl.style.width = `${pct}%`;

    const sec = Math.floor(t);
    const secStr = sec < 10 ? `0:0${sec}` : `0:${sec}`;
    const timeEl = document.getElementById('time-display');
    if (timeEl) timeEl.textContent = `${secStr} / 0:17`;

    // Update 2D callout labels if active
    if (showLabels) {
      const rect = renderer.domElement.getBoundingClientRect();
      labelEls.forEach(({ div, layer }, idx) => {
        const worldPos = new THREE.Vector3(idx % 2 === 0 ? -1.85 : 1.85, layer.position.y, 0);
        worldPos.applyMatrix4(phoneRoot.matrixWorld);
        worldPos.project(camera);
        const sx = (worldPos.x * 0.5 + 0.5) * rect.width;
        const sy = (-worldPos.y * 0.5 + 0.5) * rect.height;
        div.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
      });
    }
  }

  // ==================== RESIZE & RENDER LOOP ====================
  function onResize() {
    const rect = viewport.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
  }
  window.addEventListener('resize', onResize);
  onResize();

  let lastFrameTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (isPlaying) {
      currentTime = (currentTime + dt) % TOTAL_DURATION;
    }
    updateSceneAtTime(currentTime);
    renderer.render(scene, camera);
  }

  // Render initial frame at 0:05 / 0:17 immediately
  updateSceneAtTime(currentTime);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);

  // ==================== PUBLIC CONTROLS ====================
  window.iphoneAnatomy = {
    togglePlay() {
      isPlaying = !isPlaying;
      const icon = document.getElementById('play-icon');
      if (icon) {
        icon.innerHTML = isPlaying
          ? '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'
          : '<polygon points="6,4 20,12 6,20"/>';
      }
    },
    seekTo(ratio) {
      currentTime = Math.max(0, Math.min(TOTAL_DURATION, ratio * TOTAL_DURATION));
      updateSceneAtTime(currentTime);
      renderer.render(scene, camera);
    },
    setTime(t) {
      isPlaying = false;
      currentTime = t;
      updateSceneAtTime(currentTime);
      renderer.render(scene, camera);
    },
    toggleLabels() {
      showLabels = !showLabels;
      labelsContainer.classList.toggle('visible', showLabels);
      const btn = document.getElementById('btn-labels');
      if (btn) btn.classList.toggle('active', showLabels);
    },
    toggleTheme() {
      document.body.classList.toggle('dark-studio');
      const isDark = document.body.classList.contains('dark-studio');
      const btn = document.getElementById('btn-theme');
      if (btn) btn.textContent = isDark ? '☀️ Açık CAD Stüdyo' : '🌙 Koyu Keynote Modu';
    },
    recordVideo() {
      const btn = document.getElementById('btn-record');
      if (!canvasEl.captureStream) {
        alert('Tarayıcınız MediaRecorder desteklemiyor.');
        return;
      }
      const stream = canvasEl.captureStream(60);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'iphone_16_pro_anatomy.webm';
        a.click();
        btn.textContent = '🎥 Video İndir (Kaydet)';
        btn.disabled = false;
      };
      currentTime = 0;
      isPlaying = true;
      btn.textContent = '🔴 Kaydediliyor (8 sn)...';
      btn.disabled = true;
      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 8000);
    }
  };
})();

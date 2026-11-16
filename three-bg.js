import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('bg3d');
if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1120, 0.025);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 4, 12);
  camera.lookAt(0, 1, 0);

  // Lumières
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const cyanLight = new THREE.PointLight(0x06b6d4, 80, 20);
  cyanLight.position.set(-5, 3, 2);
  scene.add(cyanLight);

  const coralLight = new THREE.PointLight(0xfb7185, 60, 20);
  coralLight.position.set(6, 2, -2);
  scene.add(coralLight);

  // Groupe Bureau Flottant
  const deskGroup = new THREE.Group();
  scene.add(deskGroup);

  // Plateau
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.1 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 4), deskMat);
  desk.position.y = 0;
  desk.receiveShadow = true;
  desk.castShadow = true;
  deskGroup.add(desk);

  // Pieds du bureau
  const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  [-3, 3].forEach(x => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2, 0.15), legMat);
    leg.position.set(x, -1, 0);
    leg.castShadow = true;
    deskGroup.add(leg);
  });

  // Ordinateur Portable (Laptop)
  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(-1, 0.2, 0);
  laptopGroup.rotation.y = 0.2;
  deskGroup.add(laptopGroup);

  const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 1.4), baseMat);
  base.castShadow = true;
  laptopGroup.add(base);

  const screenMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
  const screenBody = new THREE.Mesh(new THREE.BoxGeometry(2, 1.3, 0.05), baseMat);
  screenBody.position.set(0, 0.65, -0.7);
  screenBody.rotation.x = -0.1;
  screenBody.castShadow = true;
  laptopGroup.add(screenBody);

  const displayMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.8 });
  const display = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 1.15), displayMat);
  display.position.set(0, 0.65, -0.67);
  display.rotation.x = -0.1;
  laptopGroup.add(display);

  // Dossiers (Folders)
  const folderColors = [0xfb7185, 0x38bdf8, 0xfbbf24]; // Corail, Bleu, Jaune
  for (let i = 0; i < 3; i++) {
    const folderMat = new THREE.MeshStandardMaterial({ color: folderColors[i], roughness: 0.7 });
    const folder = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.5), folderMat);
    folder.position.set(2, 0.15 + i * 0.11, 0.5);
    folder.rotation.y = -0.1 + (Math.random() * 0.2);
    folder.rotation.z = 0.05;
    folder.castShadow = true;
    folder.receiveShadow = true;
    deskGroup.add(folder);
  }

  // Lampe de bureau
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-2.5, 0.2, -0.8);
  deskGroup.add(lampGroup);
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.1, 16), baseMat);
  lampBase.castShadow = true;
  lampGroup.add(lampBase);
  const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), baseMat);
  lampArm.position.set(0, 0.75, 0);
  lampArm.rotation.z = 0.3;
  lampArm.castShadow = true;
  lampGroup.add(lampArm);
  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 16, 1, true), baseMat);
  lampHead.position.set(0.4, 1.4, 0);
  lampHead.rotation.x = Math.PI;
  lampHead.rotation.z = -0.3;
  lampGroup.add(lampHead);

  // Feuilles volantes
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, side: THREE.DoubleSide, roughness: 0.9 });
  const papers = [];
  for (let i = 0; i < 12; i++) {
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), paperMat);
    paper.position.set(
      (Math.random() - 0.5) * 8,
      1 + Math.random() * 4,
      (Math.random() - 0.5) * 6
    );
    paper.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    paper.userData = {
      speedY: 0.005 + Math.random() * 0.01,
      rotSpeedX: (Math.random() - 0.5) * 0.02,
      rotSpeedZ: (Math.random() - 0.5) * 0.02
    };
    papers.push(paper);
    scene.add(paper);
  }

  // Souris
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    // Effet de flottement du bureau
    deskGroup.position.y = Math.sin(t * 1.5) * 0.1;
    deskGroup.rotation.z = Math.sin(t * 0.5) * 0.02;

    // Écran qui pulse
    displayMat.emissiveIntensity = 0.6 + Math.sin(t * 2) * 0.3;

    // Animation des feuilles
    papers.forEach(p => {
      p.position.y += p.userData.speedY;
      p.rotation.x += p.userData.rotSpeedX;
      p.rotation.z += p.userData.rotSpeedZ;
      if (p.position.y > 6) {
        p.position.y = 1;
        p.position.x = (Math.random() - 0.5) * 8;
      }
    });

    // Caméra parallaxe
    camera.position.x += (mouse.x * 2 - camera.position.x) * 0.03;
    camera.position.y += (4 + mouse.y * 1 - camera.position.y) * 0.03;
    camera.lookAt(0, 1, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

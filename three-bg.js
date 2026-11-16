import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('bg3d');
if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090f, 0.02);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 5, 20);

  // Lumières
  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);

  const goldLight = new THREE.PointLight(0xd4af37, 200, 50);
  goldLight.position.set(10, 10, 10);
  scene.add(goldLight);

  const blueLight = new THREE.PointLight(0x4a90e2, 150, 50);
  blueLight.position.set(-10, -5, 5);
  scene.add(blueLight);

  // Groupe d'architecture
  const cityGroup = new THREE.Group();
  scene.add(cityGroup);

  const materialGlass = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.3
  });

  const materialGold = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.2,
    metalness: 1,
    emissive: 0x332200
  });

  // Génération de gratte-ciel abstraits
  for (let i = 0; i < 40; i++) {
    const h = 2 + Math.random() * 8;
    const w = 1 + Math.random() * 1.5;
    const d = 1 + Math.random() * 1.5;
    
    const isGold = Math.random() > 0.8;
    const mat = isGold ? materialGold : materialGlass;

    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 15;
    
    box.position.x = Math.cos(angle) * radius;
    box.position.z = Math.sin(angle) * radius - 5;
    box.position.y = h / 2 - 5; // Base au sol
    
    box.rotation.y = Math.random() * Math.PI;
    
    cityGroup.add(box);

    // Arêtes lumineuses (effet néon architectural)
    const edges = new THREE.EdgesGeometry(box.geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isGold ? 0xd4af37 : 0x4a90e2, transparent: true, opacity: 0.4 }));
    line.position.copy(box.position);
    line.rotation.copy(box.rotation);
    cityGroup.add(line);
  }

  // Sol réfléchissant abstrait
  const gridHelper = new THREE.GridHelper(60, 60, 0xd4af37, 0x223344);
  gridHelper.position.y = -5;
  scene.add(gridHelper);

  // Souris
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();
    
    cityGroup.rotation.y = t * 0.05;
    
    // Léger mouvement de la caméra
    camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
    camera.position.y += (5 + mouse.y * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

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

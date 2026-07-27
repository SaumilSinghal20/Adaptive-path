(function(){
  const host = document.getElementById('graphhost');
  if(!host) return; // Exit if not on dashboard page
  
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x14161c, 0.06);

  const camera = new THREE.PerspectiveCamera(50, host.clientWidth/host.clientHeight, 0.1, 100);
  camera.position.set(0, 0.6, 11);

  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x445566, 1.1));
  const pt = new THREE.PointLight(0x4fe3c1, 1.4, 30);
  pt.position.set(4,5,6);
  scene.add(pt);
  const pt2 = new THREE.PointLight(0xf2b84b, 0.7, 30);
  pt2.position.set(-5,-3,4);
  scene.add(pt2);

  const group = new THREE.Group();
  scene.add(group);

  // topic graph: id, position, state (mastered / current / locked), parent
  const topics = [
    {id:'foundations', pos:[0,3.2,0], state:'mastered', parent:null},
    {id:'arrays', pos:[-2.4,1.6,0.4], state:'mastered', parent:'foundations'},
    {id:'twopointers', pos:[-3.6,-0.2,-0.6], state:'mastered', parent:'arrays'},
    {id:'slidingwindow', pos:[-2.0,-2.0,0.8], state:'current', parent:'twopointers'},
    {id:'linkedlists', pos:[1.6,1.2,-1.0], state:'locked', parent:'foundations'},
    {id:'trees', pos:[3.4,-0.4,0.2], state:'locked', parent:'linkedlists'},
    {id:'graphs', pos:[3.2,-2.6,-0.8], state:'locked', parent:'trees'},
    {id:'dp', pos:[0.4,-3.4,1.2], state:'locked', parent:'slidingwindow'},
  ];

  const colors = {mastered:0xf2b84b, current:0x4fe3c1, locked:0x565a66};
  const nodeMeshes = {};

  topics.forEach(t=>{
    const isCurrent = t.state==='current';
    const size = t.state==='locked' ? 0.22 : 0.32;
    const geo = new THREE.SphereGeometry(size, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: colors[t.state],
      emissive: colors[t.state],
      emissiveIntensity: t.state==='locked' ? 0.15 : 0.55,
      roughness:0.4, metalness:0.1,
      transparent:true, opacity: t.state==='locked' ? 0.55 : 1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...t.pos);
    mesh.userData = t;
    group.add(mesh);
    nodeMeshes[t.id] = mesh;
  });

  topics.forEach(t=>{
    if(!t.parent) return;
    const a = nodeMeshes[t.parent].position;
    const b = nodeMeshes[t.id].position;
    const active = (t.state!=='locked') && (nodeMeshes[t.parent].userData.state!=='locked');
    const mat = new THREE.LineBasicMaterial({
      color: active ? 0x4fe3c1 : 0x33363f,
      transparent:true,
      opacity: active ? 0.85 : 0.35
    });
    const geo = new THREE.BufferGeometry().setFromPoints([a,b]);
    group.add(new THREE.Line(geo, mat));
  });

  // gentle drift + drag rotate
  let dragging=false, lastX=0, lastY=0, rotY=0.4, rotX=-0.1, velY=0.0015;
  host.addEventListener('pointerdown', e=>{dragging=true; lastX=e.clientX; lastY=e.clientY;});
  window.addEventListener('pointerup', ()=>dragging=false);
  window.addEventListener('pointermove', e=>{
    if(!dragging) return;
    const dx = e.clientX-lastX, dy = e.clientY-lastY;
    rotY += dx*0.005; rotX += dy*0.003;
    rotX = Math.max(-0.6, Math.min(0.6, rotX));
    lastX=e.clientX; lastY=e.clientY;
  });

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if(!dragging) rotY += velY;
    group.rotation.y = rotY;
    group.rotation.x = rotX;

    const cur = nodeMeshes['slidingwindow'];
    if(cur) {
      const pulse = 0.55 + Math.sin(t*2.2)*0.25;
      cur.material.emissiveIntensity = pulse;
      cur.scale.setScalar(1 + Math.sin(t*2.2)*0.06);
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', ()=>{
    camera.aspect = host.clientWidth/host.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
  });
  
  // User Dropdown Logic
  const avatar = document.querySelector('.avatar');
  const userMenu = document.getElementById('user-menu');
  
  if (avatar && userMenu) {
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target) && !avatar.contains(e.target)) {
        userMenu.classList.remove('active');
      }
    });
  }
})();

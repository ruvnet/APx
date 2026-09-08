"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export default function PowerScene({ power, time, playing }: { power: number; time: number; playing: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const values = useRef({ power, time, playing });
  const [failed, setFailed] = useState(false);
  useEffect(() => { values.current = { power, time, playing }; }, [power, time, playing]);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, .1, 80);
    camera.position.set(8, 5.7, 10.5);
    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(environment, .025);
    scene.environment = env.texture;
    const rig = new THREE.Group(); scene.add(rig);
    const chrome = new THREE.MeshStandardMaterial({ color: 0x626e69, metalness: 1, roughness: .18 });
    const graphite = new THREE.MeshStandardMaterial({ color: 0x101a16, metalness: .9, roughness: .28 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x19221d, metalness: .8, roughness: .32 });
    const lime = new THREE.MeshStandardMaterial({ color: 0xbeff77, emissive: 0x8ee647, emissiveIntensity: 2.1, metalness: .35, roughness: .25 });
    const white = new THREE.MeshStandardMaterial({ color: 0xcdd5c9, metalness: .7, roughness: .15 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xccf7d9, metalness: .05, roughness: .07, transmission: .93, thickness: .2, transparent: true, opacity: .55, ior: 1.45 });
    const geometries: THREE.BufferGeometry[] = [];
    function mesh(g: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D = rig) { geometries.push(g); const m = new THREE.Mesh(g, mat); parent.add(m); return m; }
    function torus(radius: number, tube: number, material: THREE.Material, y: number, parent = rig) {
      const m = mesh(new THREE.TorusGeometry(radius, tube, 12, 100), material, parent); m.rotation.x = Math.PI / 2; m.position.y = y; return m;
    }
    const plinth = mesh(new THREE.CylinderGeometry(3.7, 3.8, .28, 96), graphite); plinth.position.y = -1.45;
    const footing = mesh(new THREE.CylinderGeometry(3.48, 3.55, .08, 96), chrome); footing.position.y = -1.27;
    const plate = mesh(new THREE.CylinderGeometry(2.65, 2.65, .21, 96), dark); plate.position.y = -1.08;
    torus(3.2, .012, lime, -1.24);
    torus(3.58, .015, chrome, -1.29);
    const inner = new THREE.Group(); rig.add(inner);
    for (const y of [-.75, .8]) { torus(2.26, .13, chrome, y); torus(2.04, .038, lime, y); torus(1.87, .08, graphite, y); }
    const cage = mesh(new THREE.CylinderGeometry(2.17, 2.17, 1.47, 96, 1, true), glass); cage.position.y = .04;
    for (let i = 0; i < 48; i++) {
      const angle = i / 48 * Math.PI * 2;
      const fin = mesh(new THREE.BoxGeometry(.055, 1.32, .29), i % 6 === 0 ? white : graphite, inner);
      fin.position.set(Math.sin(angle) * 1.9, .025, Math.cos(angle) * 1.9); fin.rotation.y = angle;
      const tick = mesh(new THREE.BoxGeometry(.022, .012, i % 4 === 0 ? .21 : .10), white);
      tick.position.set(Math.sin(angle) * 3.38, -1.296, Math.cos(angle) * 3.38); tick.rotation.y = angle;
      if (i % 4 === 0) {
        const bolt = mesh(new THREE.CylinderGeometry(.045, .045, .03, 6), chrome); bolt.position.set(Math.sin(angle) * 2.3, .95, Math.cos(angle) * 2.3);
      }
    }
    const spindle = mesh(new THREE.CylinderGeometry(.38, .48, 2.72, 48), chrome); spindle.position.y = .14;
    const sphere = mesh(new THREE.IcosahedronGeometry(.77, 3), glass); sphere.position.y = .25;
    torus(.7, .065, lime, .25);
    const rotor = new THREE.Group(); rotor.position.y = 1.2; rig.add(rotor);
    torus(2.46, .10, graphite, 0, rotor); torus(2.48, .02, lime, .10, rotor);
    for (let i=0; i<8; i++) { const a=i/8*Math.PI*2; const blade=mesh(new THREE.BoxGeometry(.12,.1,1.65),chrome,rotor); blade.position.set(Math.sin(a)*1.46,0,Math.cos(a)*1.46); blade.rotation.y=a; }
    const crown = mesh(new THREE.CylinderGeometry(.55,.55,.14,48), chrome); crown.position.y=1.53;
    const packets = new THREE.Group(); rig.add(packets);
    const packetGeometry = new THREE.BoxGeometry(.085,.085,.36); geometries.push(packetGeometry);
    const particles: THREE.Mesh[] = [];
    for(let i=0;i<40;i++) { const p=new THREE.Mesh(packetGeometry,lime); packets.add(p); particles.push(p); }
    const key=new THREE.DirectionalLight(0xe0ffe4,5); key.position.set(4,7,2); scene.add(key);
    const fill=new THREE.DirectionalLight(0xadc2ce,3); fill.position.set(-5,2,-4);scene.add(fill);
    const glow=new THREE.PointLight(0xadff4e,35,9,2);glow.position.set(0,.5,0);scene.add(glow);
    let visible = true;
    let active = !document.hidden;
    let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMedia=()=>{reduced=media.matches;};media.addEventListener("change",onMedia);
    const observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); observer.observe(host);
    const resize = new ResizeObserver(() => { const w=host.clientWidth,h=host.clientHeight; if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();} });resize.observe(host);
    const onVisibility=()=>{active=!document.hidden;};document.addEventListener("visibilitychange",onVisibility);
    let pointerX=0,pointerY=0;
    const onMove=(e:PointerEvent)=>{const r=host.getBoundingClientRect();pointerX=((e.clientX-r.left)/r.width-.5);pointerY=((e.clientY-r.top)/r.height-.5);};host.addEventListener("pointermove",onMove);
    let elapsed=0,last=performance.now(),frame=0,lastRendered=0;
    const animate=(now:number)=>{
      frame=requestAnimationFrame(animate);
      const delta=Math.min((now-last)/1000,.05);last=now;
      if(!visible||!active||now-lastRendered<32) return;
      lastRendered=now;
      const v=values.current;
      if(v.playing&&!reduced) elapsed+=delta*2;
      const t=v.time*6.283+elapsed;
      const scroll=Math.min(window.scrollY / Math.max(window.innerHeight,1),1);
      inner.rotation.y=t*.12;rotor.rotation.y=-t*.09;
      rotor.position.y=1.2+scroll*.22;
      rig.rotation.y=-.35 + (reduced ? 0 : pointerX*.12);
      rig.rotation.z=reduced?0:pointerY*.025;
      for(let i=0;i<particles.length;i++) {
        const a=i/particles.length*Math.PI*2+t*.35;
        const r=2.73+.08*Math.sin(a*3);
        particles[i].position.set(Math.sin(a)*r, -.3+.30*Math.sin(a*2+t), Math.cos(a)*r);
        particles[i].rotation.y=a+Math.PI/2;
        particles[i].visible=i<Math.min(40,Math.max(0,Math.ceil(v.power*3)));
      }
      glow.intensity=15+Math.min(v.power,24);
      camera.position.y=5.7-scroll*.7;camera.lookAt(0,-.15,0);
      renderer.render(scene,camera);
    };
    frame=requestAnimationFrame(animate);
    const contextLost=(e:Event)=>{e.preventDefault();setFailed(true);};renderer.domElement.addEventListener("webglcontextlost",contextLost);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();media.removeEventListener("change",onMedia);document.removeEventListener("visibilitychange",onVisibility);host.removeEventListener("pointermove",onMove);renderer.domElement.removeEventListener("webglcontextlost",contextLost);geometries.forEach(g=>g.dispose());[chrome,graphite,dark,lime,white,glass].forEach(m=>m.dispose());env.dispose();environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div className="scene-host" ref={mount} aria-label="Interactive agentic power instrument. Rings represent work moving through verification. Animation is illustrative, not measured telemetry." role="img">{failed&&<div className="scene-fallback"><strong>2<sup>x</sup></strong><p>Agentic power</p><small>3D unavailable on this device. All calculations still work.</small></div>}</div>;
}

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";

// ── City data ─────────────────────────────────────────────────────────
interface CityNode {
  name: string;
  lat: number;
  lng: number;
  position?: THREE.Vector3;
}

const CITIES: CityNode[] = [
  { name: "New York", lat: 40.71, lng: -74.01 },
  { name: "London", lat: 51.51, lng: -0.13 },
  { name: "Moscow", lat: 55.76, lng: 37.62 },
  { name: "Beijing", lat: 39.9, lng: 116.4 },
  { name: "Tokyo", lat: 35.68, lng: 139.69 },
  { name: "Sydney", lat: -33.87, lng: 151.21 },
  { name: "São Paulo", lat: -23.55, lng: -46.63 },
  { name: "Lagos", lat: 6.52, lng: 3.38 },
  { name: "Mumbai", lat: 19.08, lng: 72.88 },
  { name: "Berlin", lat: 52.52, lng: 13.41 },
  { name: "Singapore", lat: 1.35, lng: 103.82 },
  { name: "Dubai", lat: 25.2, lng: 55.27 },
  { name: "Seoul", lat: 37.57, lng: 126.98 },
  { name: "Toronto", lat: 43.65, lng: -79.38 },
  { name: "Cape Town", lat: -33.93, lng: 18.42 },
];

const ATTACK_TYPES_FALLBACK = [
  "DDoS Attack", "Brute Force", "Phishing Campaign", "Ransomware",
  "SQL Injection", "Zero-Day Exploit", "Port Scan", "Data Exfiltration",
  "Credential Stuffing", "Man-in-the-Middle",
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#06b6d4",
};

interface ThreatEvent {
  id: string; type: string;
  source: { lat: number; lng: number; city: string; country: string };
  target: { lat: number; lng: number; city: string; country: string };
  timestamp: string; severity: string;
}

interface AttackEvent {
  id: number; type: string; from: string; to: string;
  severity: string; timestamp: number;
}

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createArc(start: THREE.Vector3, end: THREE.Vector3, radius: number): THREE.BufferGeometry {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    .normalize().multiplyScalar(radius * 1.5);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
}

export function AttackGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelContainerRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<AttackEvent[]>([]);
  const eventIdRef = useRef(0);
  const eventListRef = useRef<HTMLDivElement>(null);
  const threatQueueRef = useRef<ThreatEvent[]>([]);
  const [isLive, setIsLive] = useState(false);

  const updateEventFeed = useCallback(
    (from: string, to: string, type?: string, severity?: string) => {
      const attack: AttackEvent = {
        id: eventIdRef.current++,
        type: type || ATTACK_TYPES_FALLBACK[Math.floor(Math.random() * ATTACK_TYPES_FALLBACK.length)],
        from, to,
        severity: severity || "medium",
        timestamp: Date.now(),
      };
      eventsRef.current = [attack, ...eventsRef.current.slice(0, 4)];
      if (eventListRef.current) {
        eventListRef.current.innerHTML = eventsRef.current
          .map((e, i) => `
            <div class="attack-event-item" style="opacity:${1 - i * 0.18};animation:attackSlideIn 0.3s ease-out;">
              <span class="attack-dot" style="background:${SEVERITY_COLORS[e.severity] || "#ef4444"};box-shadow:0 0 6px ${SEVERITY_COLORS[e.severity] || "#ef4444"}80;"></span>
              <span class="attack-type" style="color:${SEVERITY_COLORS[e.severity] || "#ef4444"}">${e.type}</span>
              <span class="attack-route">${e.from} → ${e.to}</span>
            </div>
          `).join("");
      }
    }, []
  );

  // ── Fetch real threats ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchThreats() {
      try {
        const res = await fetch("/api/threats", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.threats?.length > 0) {
          threatQueueRef.current = [...threatQueueRef.current, ...data.threats];
          setIsLive(true);
        }
      } catch { /* fall back to simulated */ }
    }
    fetchThreats();
    const interval = setInterval(fetchThreats, 45000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const labelContainer = labelContainerRef.current;
    if (!container || !labelContainer) return;

    // ── Scene ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    const GLOBE_RADIUS = 1.6;

    // ── Earth with realistic + digital shader ───────────────────────
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load("/textures/earth-blue-marble.jpg");
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        u_texture: { value: earthTexture },
        u_time: { value: 0 },
        u_sunDirection: { value: new THREE.Vector3(1, 0.5, 1).normalize() }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D u_texture;
        uniform float u_time;
        uniform vec3 u_sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          // Base daylight color from Blue Marble texture
          vec4 texColor = texture2D(u_texture, vUv);
          vec3 color = texColor.rgb;

          // Simple day/night shading based on a fixed "sun" direction
          float dayIntensity = max(dot(vNormal, u_sunDirection), 0.0);
          // Soften the terminator line (twilight zone)
          float lighting = smoothstep(-0.2, 0.5, dayIntensity);
          
          // Minimum ambient light so the dark side isn't pitch black
          lighting = max(lighting, 0.15);
          
          // Apply lighting to base color
          color *= lighting;

          // Add a very subtle bluish tint to the dark side to simulate atmospheric scattering
          if (lighting < 0.5) {
             float darkMix = 1.0 - (lighting / 0.5);
             color += vec3(0.02, 0.04, 0.08) * darkMix;
          }

          // Subtle grid overlay (digital feel)
          float gridX = smoothstep(0.985, 1.0, fract(vUv.x * 36.0));
          float gridY = smoothstep(0.985, 1.0, fract(vUv.y * 18.0));
          float grid = max(gridX, gridY);
          // Grid is cyan on the dark side, faint white on the light side
          vec3 gridColor = mix(vec3(0.0, 0.8, 1.0), vec3(1.0), lighting);
          color += grid * gridColor * 0.15;

          // Barely perceptible scanlines
          float scanline = sin(vUv.y * 600.0 + u_time * 1.5) * 0.5 + 0.5;
          color *= 0.98 + scanline * 0.02;

          // Natural atmosphere fresnel (edge glow)
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
          // Make edge glow stronger on the day side
          color += fresnel * vec3(0.4, 0.6, 0.8) * (0.3 + lighting * 0.4);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // ── Atmosphere ──────────────────────────────────────────────────
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
          vec3 color = vec3(0.15, 0.4, 0.7);
          gl_FragColor = vec4(color, intensity * 0.35);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // ── Subtle equatorial ring ──────────────────────────────────────
    function makeRing(yOff: number, col: number, op: number) {
      const r = Math.sqrt(GLOBE_RADIUS * GLOBE_RADIUS * 1.0004 - yOff * yOff);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, yOff, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op }));
    }
    globeGroup.add(makeRing(0, 0x3b82f6, 0.08));

    // ── City nodes + labels ─────────────────────────────────────────
    const cityMeshes: THREE.Mesh[] = [];
    const cityLabels: HTMLDivElement[] = [];

    CITIES.forEach((city) => {
      city.position = latLngToVec3(city.lat, city.lng, GLOBE_RADIUS);

      // 3D node
      const nodeGeo = new THREE.SphereGeometry(0.018, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.95 });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.copy(city.position);
      globeGroup.add(node);
      cityMeshes.push(node);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(0.025, 0.04, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(city.position);
      ring.lookAt(0, 0, 0);
      globeGroup.add(ring);

      // HTML label
      const label = document.createElement("div");
      label.className = "globe-label";
      label.textContent = city.name;
      label.style.cssText = `
        position: absolute; pointer-events: none; white-space: nowrap;
        font-family: var(--font-mono), monospace; font-size: 9px;
        color: rgba(255,255,255,0.75); letter-spacing: 0.5px;
        text-transform: uppercase; text-shadow: 0 0 4px rgba(0,0,0,0.8);
        transition: opacity 0.3s ease; will-change: transform, opacity;
        transform-origin: center center;
      `;
      labelContainer.appendChild(label);
      cityLabels.push(label);
    });

    // ── Attack arcs ─────────────────────────────────────────────────
    interface ActiveArc {
      line: THREE.Line; pulse: THREE.Mesh; progress: number; speed: number;
      curve: THREE.QuadraticBezierCurve3; fromName: string; toName: string;
      fading: boolean; opacity: number; severity: string; type: string;
    }
    const activeArcs: ActiveArc[] = [];

    function spawnArcFromThreat(threat: ThreatEvent) {
      const start = latLngToVec3(threat.source.lat, threat.source.lng, GLOBE_RADIUS);
      const end = latLngToVec3(threat.target.lat, threat.target.lng, GLOBE_RADIUS);
      const arcCol = threat.severity === "critical" ? 0xef4444 : threat.severity === "high" ? 0xf97316 : 0x38bdf8;
      const arcMat = new THREE.LineBasicMaterial({ color: arcCol, transparent: true, opacity: 0 });
      const arcLine = new THREE.Line(createArc(start, end, GLOBE_RADIUS), arcMat);
      globeGroup.add(arcLine);

      const pulseCol = threat.severity === "critical" || threat.severity === "high" ? 0xf97316 : 0x38bdf8;
      const pulseMat = new THREE.MeshBasicMaterial({ color: pulseCol, transparent: true, opacity: 0.95 });
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), pulseMat);
      pulse.position.copy(start);
      globeGroup.add(pulse);

      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5).normalize().multiplyScalar(GLOBE_RADIUS * 1.5);
      activeArcs.push({
        line: arcLine, pulse, progress: 0, speed: 0.004 + Math.random() * 0.003,
        curve: new THREE.QuadraticBezierCurve3(start, mid, end),
        fromName: threat.source.city || threat.source.country,
        toName: threat.target.city || threat.target.country,
        fading: false, opacity: 0, severity: threat.severity, type: threat.type,
      });
      updateEventFeed(threat.source.city || threat.source.country, threat.target.city || threat.target.country, threat.type, threat.severity);
    }

    function spawnSimulatedArc() {
      const fi = Math.floor(Math.random() * CITIES.length);
      let ti = Math.floor(Math.random() * CITIES.length);
      while (ti === fi) ti = Math.floor(Math.random() * CITIES.length);
      const from = CITIES[fi], to = CITIES[ti];
      if (!from.position || !to.position) return;

      const arcMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
      const arcLine = new THREE.Line(createArc(from.position, to.position, GLOBE_RADIUS), arcMat);
      globeGroup.add(arcLine);

      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.95 });
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), pulseMat);
      pulse.position.copy(from.position);
      globeGroup.add(pulse);

      const mid = new THREE.Vector3().addVectors(from.position, to.position).multiplyScalar(0.5).normalize().multiplyScalar(GLOBE_RADIUS * 1.5);
      activeArcs.push({
        line: arcLine, pulse, progress: 0, speed: 0.004 + Math.random() * 0.004,
        curve: new THREE.QuadraticBezierCurve3(from.position, mid, to.position),
        fromName: from.name, toName: to.name,
        fading: false, opacity: 0,
        severity: ["medium", "high", "critical"][Math.floor(Math.random() * 3)],
        type: ATTACK_TYPES_FALLBACK[Math.floor(Math.random() * ATTACK_TYPES_FALLBACK.length)],
      });
      updateEventFeed(from.name, to.name);
    }

    // ── Mouse ───────────────────────────────────────────────────────
    let isDragging = false, prevM = { x: 0, y: 0 }, rotVel = { x: 0, y: 0 };
    const onMD = (e: MouseEvent) => { isDragging = true; prevM = { x: e.clientX, y: e.clientY }; };
    const onMM = (e: MouseEvent) => { if (!isDragging) return; rotVel.x = (e.clientY - prevM.y) * 0.002; rotVel.y = (e.clientX - prevM.x) * 0.002; prevM = { x: e.clientX, y: e.clientY }; };
    const onMU = () => { isDragging = false; };
    const onTS = (e: TouchEvent) => { isDragging = true; prevM = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTM = (e: TouchEvent) => { if (!isDragging) return; rotVel.x = (e.touches[0].clientY - prevM.y) * 0.002; rotVel.y = (e.touches[0].clientX - prevM.x) * 0.002; prevM = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTE = () => { isDragging = false; };

    container.addEventListener("mousedown", onMD);
    container.addEventListener("mousemove", onMM);
    window.addEventListener("mouseup", onMU);
    container.addEventListener("touchstart", onTS, { passive: true });
    container.addEventListener("touchmove", onTM, { passive: true });
    window.addEventListener("touchend", onTE);

    // ── Arc spawner ─────────────────────────────────────────────────
    const arcInterval = setInterval(() => {
      if (activeArcs.length >= 6) return;
      if (threatQueueRef.current.length > 0) spawnArcFromThreat(threatQueueRef.current.shift()!);
      else spawnSimulatedArc();
    }, 2000);
    setTimeout(() => spawnSimulatedArc(), 400);
    setTimeout(() => spawnSimulatedArc(), 900);
    setTimeout(() => spawnSimulatedArc(), 1400);

    // ── Resize ──────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Render loop ─────────────────────────────────────────────────
    let frameId: number;
    const startTime = Date.now();
    const tempVec = new THREE.Vector3();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const elapsed = (Date.now() - startTime) * 0.001;

      earthMat.uniforms.u_time.value = elapsed;

      if (!isDragging) globeGroup.rotation.y += 0.0008;
      globeGroup.rotation.x += rotVel.x;
      globeGroup.rotation.y += rotVel.y;
      rotVel.x *= 0.95;
      rotVel.y *= 0.95;

      // Pulse city nodes
      cityMeshes.forEach((node, i) => {
        const p = 1 + Math.sin(elapsed * 3 + i) * 0.15;
        node.scale.set(p, p, p);
      });

      // ── Update city labels (project 3D → 2D) ─────────────────
      const cameraDir = camera.position.clone().normalize();

      CITIES.forEach((city, i) => {
        if (!city.position) return;
        const label = cityLabels[i];

        // Get world position of this city
        tempVec.copy(city.position);
        globeGroup.localToWorld(tempVec);

        // Visibility check — is this side facing the camera?
        const cityDir = tempVec.clone().normalize();
        const dot = cameraDir.dot(cityDir);

        if (dot > 0.15) {
          // Project to screen coordinates
          const projected = tempVec.clone().project(camera);
          const x = (projected.x * 0.5 + 0.5) * (container?.clientWidth || 0);
          const y = (-projected.y * 0.5 + 0.5) * (container?.clientHeight || 0);

          const opacity = Math.min(0.85, (dot - 0.15) * 1.8);
          label.style.transform = `translate(-50%, calc(-50% - 14px)) translate(${x}px, ${y}px)`;
          label.style.opacity = String(opacity);
          label.style.display = "block";
        } else {
          label.style.opacity = "0";
        }
      });

      // ── Update arcs ───────────────────────────────────────────
      for (let i = activeArcs.length - 1; i >= 0; i--) {
        const arc = activeArcs[i];
        if (arc.opacity < 0.7 && !arc.fading) arc.opacity += 0.02;
        arc.progress += arc.speed;
        (arc.line.material as THREE.LineBasicMaterial).opacity = arc.opacity;

        if (arc.progress <= 1) {
          const point = arc.curve.getPoint(arc.progress);
          arc.pulse.position.copy(point);
          (arc.pulse.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - Math.abs(arc.progress - 0.5) * 0.5);
          const ps = 1 + Math.sin(arc.progress * Math.PI) * 0.5;
          arc.pulse.scale.set(ps, ps, ps);
        }
        if (arc.progress > 1 && !arc.fading) arc.fading = true;
        if (arc.fading) {
          arc.opacity -= 0.015;
          (arc.pulse.material as THREE.MeshBasicMaterial).opacity -= 0.03;
        }
        if (arc.opacity <= 0) {
          globeGroup.remove(arc.line); globeGroup.remove(arc.pulse);
          arc.line.geometry.dispose(); (arc.line.material as THREE.Material).dispose();
          arc.pulse.geometry.dispose(); (arc.pulse.material as THREE.Material).dispose();
          activeArcs.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(arcInterval);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mousedown", onMD);
      container.removeEventListener("mousemove", onMM);
      window.removeEventListener("mouseup", onMU);
      container.removeEventListener("touchstart", onTS);
      container.removeEventListener("touchmove", onTM);
      window.removeEventListener("touchend", onTE);
      // Clean up labels
      cityLabels.forEach((l) => l.remove());
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [updateEventFeed]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" style={{ minHeight: "500px" }} />

      {/* Label overlay — positioned absolutely over the canvas */}
      <div ref={labelContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

      {/* Threat Feed */}
      <div className="absolute bottom-4 left-4 z-10 w-80 pointer-events-none">
        <div className="glass-panel rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {isLive ? "Live Threat Feed" : "Threat Feed"}
            </span>
            {isLive && (
              <span className="ml-auto text-[10px] font-mono text-green-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div ref={eventListRef} className="flex flex-col gap-1.5" />
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs font-mono text-secondary/70 border border-white/5 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          Real-Time Monitoring
        </div>
      </div>
    </div>
  );
}

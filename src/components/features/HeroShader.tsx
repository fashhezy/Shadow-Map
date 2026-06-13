"use client";

import { useEffect, useRef } from "react";

export function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext("webgl") || (canvas.getContext("experimental-webgl") as WebGLRenderingContext);
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;
    vec2 centered = (uv - 0.5) * 2.0;
    centered.x *= u_resolution.x / u_resolution.y;

    // Deep tech background
    vec3 color = vec3(0.015, 0.02, 0.035);

    // Topographical / cyber distortion grid
    vec2 distortedUv = centered * 2.5;
    distortedUv.x += sin(distortedUv.y * 1.5 + u_time * 0.15) * 0.3;
    distortedUv.y += cos(distortedUv.x * 1.5 + u_time * 0.2) * 0.3;
    distortedUv.y -= u_time * 0.1; // Slow upward scroll

    // Create soft grid lines
    float gridX = smoothstep(0.96, 1.0, fract(distortedUv.x * 4.0));
    float gridY = smoothstep(0.96, 1.0, fract(distortedUv.y * 4.0));
    float grid = max(gridX, gridY);

    // Subtle cyan/teal color for the grid lines
    vec3 gridColor = vec3(0.05, 0.25, 0.35);
    color += grid * gridColor * 0.25; // Balanced opacity

    // Add glowing data "nodes" at intersections
    float nodes = gridX * gridY;
    color += nodes * vec3(0.1, 0.7, 0.9) * 0.5; // Balanced opacity

    // Soft moving scan gradient
    float scan = sin(uv.y * 8.0 - u_time * 0.8) * 0.5 + 0.5;
    color += scan * vec3(0.02, 0.08, 0.12) * 0.12;

    // Center ambient highlight
    float centerGlow = 1.0 - length(centered * 0.4);
    color += max(0.0, centerGlow) * vec3(0.02, 0.06, 0.1);

    // Fade to black at the edges to blend seamlessly into the page background
    float vignette = smoothstep(1.3, 0.4, length(uv - 0.5) * 2.0);
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}`;
    function cs(type: number, src: string) {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;
    const vertexShader = cs(gl.VERTEX_SHADER, vs);
    const fragmentShader = cs(gl.FRAGMENT_SHADER, fs);
    if (vertexShader) gl.attachShader(prog, vertexShader);
    if (fragmentShader) gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;

    function render(t: number) {
      if (!gl) return;
      if (typeof ResizeObserver === "undefined") syncSize();
      gl.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas!.width, canvas!.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
    />
  );
}

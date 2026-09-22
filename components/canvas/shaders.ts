export const TRAIL = 20

export const latticeVertex = /* glsl */ `
  uniform float uTime;
  uniform float uCamZ;
  uniform float uCell;
  uniform float uPx;
  uniform float uSize;
  uniform float uFar;
  uniform float uIntro;
  uniform float uMax;
  uniform vec2  uPulseO;
  uniform float uPulseR;
  uniform float uPulseK;
  uniform vec3  uTrail[${TRAIL}];

  attribute float aRand;

  varying float vDrift;
  varying float vFade;
  varying float vRand;
  varying float vRev;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main(){
    // The lattice is a window that follows the camera; snapping keeps every point fixed in world space.
    float snap = mod(uCamZ, uCell);
    vec2 w = vec2(position.x, position.z + uCamZ - snap);

    // Baseline terrain: a calm corridor down the middle, ridges either side.
    float side  = smoothstep(7.0, 30.0, abs(w.x));
    float ridge = vnoise(w * 0.06) * 2.4 + vnoise(w * 0.17) * 0.9;
    float h = side * ridge * 3.4 + (vnoise(w * 0.45) - 0.5) * 0.22 * (1.0 - side * 0.6);
    h += sin(uTime * 0.35 + w.x * 0.21 + w.y * 0.13) * 0.05;

    // Drift: the cursor's recent path pulls points off the baseline; they relax as the trail decays.
    float drift = 0.0;
    for (int i = 0; i < ${TRAIL}; i++) {
      vec3 t = uTrail[i];
      vec2 d = w - t.xy;
      drift += t.z * exp(-dot(d, d) * 0.05);
    }
    float ring = exp(-pow((distance(w, uPulseO) - uPulseR) / 3.2, 2.0)) * uPulseK;
    drift = min(drift + ring * 0.85, 1.6);

    vec2 jit = vec2(vnoise(w * 1.7 + uTime * 0.6), vnoise(w * 1.7 - uTime * 0.6 + 9.0)) - 0.5;
    w += jit * drift * 1.6;
    h += drift * (1.0 + aRand * 1.4);

    // Assemble on load: points fall into place from the middle outward.
    float rev = smoothstep(0.0, 1.0, clamp(uIntro * 1.9 - (length(position.xz) / 160.0) * 0.9, 0.0, 1.0));
    h += (1.0 - rev) * (5.0 + aRand * 14.0);

    vec4 mv = modelViewMatrix * vec4(w.x, h, w.y, 1.0);
    float dist = -mv.z;

    vFade  = smoothstep(uFar, uFar * 0.4, dist) * smoothstep(0.4, 4.0, dist);
    vDrift = drift;
    vRand  = aRand;
    vRev   = rev;

    gl_PointSize = clamp(uSize * uPx * (1.0 + drift * 2.4) * (26.0 / dist), uPx, uMax * uPx);
    gl_Position  = projectionMatrix * mv;
  }
`

export const latticeFragment = /* glsl */ `
  uniform vec3  uBase;
  uniform vec3  uHot;
  uniform vec3  uWhite;
  uniform float uDim;

  varying float vDrift;
  varying float vFade;
  varying float vRand;
  varying float vRev;

  void main(){
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.6);

    float k = smoothstep(0.05, 0.9, vDrift);
    vec3 col = mix(uBase, uHot, k);
    col = mix(col, uWhite, smoothstep(0.75, 1.5, vDrift));

    float alpha = a * vFade * vRev * uDim * (0.62 + 0.34 * vRand + vDrift * 0.9);
    gl_FragColor = vec4(col * (1.0 + vDrift * 1.6), alpha);
    #include <colorspace_fragment>
  }
`

import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import { Uniform, Vector2 } from 'three'

const fragment = /* glsl */ `
  uniform float uStrength;
  uniform float uChroma;
  uniform vec2  uCenter;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // at rest this effect costs one branch
    if (uStrength < 0.0008) { outputColor = inputColor; return; }

    vec2  d = uv - uCenter;
    float edge = 0.35 + length(d) * 1.4;     // stronger toward the edges, calmer at the centre
    float s = uStrength * edge;

    vec3 acc = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      float k = (float(i) / 3.0) * s;
      acc.r += texture2D(inputBuffer, uCenter + d * (1.0 - k * (1.0 + uChroma))).r;
      acc.g += texture2D(inputBuffer, uCenter + d * (1.0 - k)).g;
      acc.b += texture2D(inputBuffer, uCenter + d * (1.0 - k * (1.0 - uChroma))).b;
    }
    outputColor = vec4(acc / 4.0, inputColor.a);
  }
`

/**
 * Radial zoom blur with a chromatic split along the same axis: the "burst" you get when the camera
 * is moving fast. strength ≈ 0…0.12, chroma ≈ 0…1.
 */
export class ZoomBurstEffect extends Effect {
  constructor() {
    super('ZoomBurstEffect', fragment, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['uStrength', new Uniform(0)],
        ['uChroma', new Uniform(0.3)],
        ['uCenter', new Uniform(new Vector2(0.5, 0.5))],
      ]),
    })
  }
  set strength(v: number) {
    this.uniforms.get('uStrength')!.value = v
  }
  set chroma(v: number) {
    this.uniforms.get('uChroma')!.value = v
  }
  get center(): Vector2 {
    return this.uniforms.get('uCenter')!.value as Vector2
  }
}

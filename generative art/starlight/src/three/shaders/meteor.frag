precision mediump float;

uniform vec3 uColor;
varying float vFade;

void main() {
  if (vFade < 0.02) discard;
  float d = distance(gl_PointCoord, vec2(0.5));
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.05, d) * vFade * 0.9;
  gl_FragColor = vec4(uColor, alpha);
}

precision mediump float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uTime;
varying float vColorMix;
varying float vHover;
varying float vWarm;
varying float vNav;
varying float vTwinkle;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  if (d > 0.5) discard;

  // 暖星混合：5% 粒子混入琥珀色 uColorC
  vec3 color = mix(mix(uColorA, uColorB, vColorMix), uColorC, vWarm);

  // 闪烁叠加在基础透明度上
  float alpha = smoothstep(0.5, 0.05, d) * (0.8 + vHover * 0.5) * vTwinkle;

  // 主星十字星芒（仅 vNav > 0.5，即导航主星）
  if (vNav > 0.5) {
    vec2 q = gl_PointCoord - 0.5;
    float streak = smoothstep(0.035, 0.0, abs(q.x)) * exp(-abs(q.y) * 16.0)
                 + smoothstep(0.035, 0.0, abs(q.y)) * exp(-abs(q.x) * 16.0);
    alpha += streak * (0.9 + vHover * 0.8);
    alpha = min(alpha, 1.6);
  }
  gl_FragColor = vec4(color, min(alpha, 1.0));
}

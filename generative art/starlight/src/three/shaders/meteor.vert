uniform float uProgress;
uniform vec3 uDir;
uniform float uPixelRatio;

attribute float aT;

varying float vFade;

void main() {
  // 整条 40 顶点线段沿 dir 平移，亮度包络随 uProgress 前进
  vec3 pos = position + uDir * uProgress * 20.0;
  vFade = exp(-pow((aT - uProgress) * 14.0, 2.0));

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (1.5 + 2.5 * vFade) * uPixelRatio * (240.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}

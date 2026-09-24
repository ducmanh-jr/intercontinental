uniform float uTime;
uniform float uPixelRatio;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uMouse;
uniform float uRepelRadius;
uniform float uRepelStrength;

attribute float aSize;
attribute float aRadius;
attribute float aSpeed;
attribute float aDrift;
attribute float aColorMix;
attribute float aHover;
attribute float aWarm;
attribute float aNav;

varying float vColorMix;
varying float vHover;
varying float vWarm;
varying float vNav;
varying float vTwinkle;

void main() {
  vec3 pos = position;
  float t = uTime * aSpeed + aDrift;
  pos.x += sin(t) * aRadius;
  pos.y += cos(t * 0.8) * aRadius * 0.6;
  pos.z += cos(t * 0.5) * aRadius;

  // 闪烁：0.75~1.0，复用 aSpeed/aDrift 作相位频率，幅度克制
  float tw = 0.75 + 0.25 * sin(uTime * (0.6 + aSpeed * 0.8) + aDrift * 6.283);
  vTwinkle = tw;

  // 鼠标排斥场（强度为 0 时 GPU 分支免费跳过）
  if (uRepelStrength > 0.001) {
    vec3 diff = pos - uMouse;
    float dist = length(diff);
    if (dist < uRepelRadius && dist > 0.001) {
      pos += normalize(diff) * (uRepelRadius - dist) * uRepelStrength;
    }
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vHover = aHover;
  gl_PointSize = aSize * uPixelRatio * (240.0 / -mvPosition.z) * (1.0 + vHover * 0.7);
  gl_Position = projectionMatrix * mvPosition;
  vColorMix = aColorMix;
  vWarm = aWarm;
  vNav = aNav;
}

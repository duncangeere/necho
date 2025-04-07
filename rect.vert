#version 300 es
in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vUV;

void main() {
  vUV = aTexCoord;
  
  vec4 position = vec4(aPosition, 1.0);
  position.xy = position.xy * 2.0 - 1.0;
  
  gl_Position = position;
}
#version 300 es
precision highp float;


uniform vec2 u_res;
uniform float u_time, u_poetry_progress;
# define PI 3.14159265359

in vec2 vUV;

uint murmurHash12(uvec2 src) {
    const uint M = 0x5bd1e995u;
    uint h = 1190494759u;
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

// 1 output, 2 inputs
float hash12(vec2 src) {
    uint h = murmurHash12(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

uvec3 murmurHash33(uvec3 src) {
    const uint M = 0x5bd1e995u;
    uvec3 h = uvec3(1190494759u, 2147483647u, 3559788179u);
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y; h *= M; h ^= src.z;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

// 3 outputs, 3 inputs
vec3 hash33(vec3 src) {
    uvec3 h = murmurHash33(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

mat2 rot(float a){
  a = radians(a);
  float s = sin(a), c = cos(a);
  return mat2(c,-s,s,c);
  
}

vec3 noise(vec3 p){
  
  vec3 id = floor(p);
  vec3 n = hash33(id);
 // p.z = dot(sin(p), cos(p.yzx)) * 0.5;

  //n += fract(p * id);
  
  
  return vec3(n) - 0.5;
}

vec3 noise2( in vec3 x )
{
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
	
    return mix(mix(mix( hash33(i+vec3(0,0,0)), 
                        hash33(i+vec3(1,0,0)),f.x),
                   mix( hash33(i+vec3(0,1,0)), 
                        hash33(i+vec3(1,1,0)),f.x),f.y),
               mix(mix( hash33(i+vec3(0,0,1)), 
                        hash33(i+vec3(1,0,1)),f.x),
                   mix( hash33(i+vec3(0,1,1)), 
                        hash33(i+vec3(1,1,1)),f.x),f.y),f.z) * 2.0 - 1.0;
}

vec3 fbm(vec3 x, float H )
{    
  //  x.z += u_time * 0.02;
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    vec3 t = vec3(0.0);
    for( int i=0; i<6; i++ )
    {
        t += a*noise(f*x);
        f *= 2.0;
        a *= G;
      t.xz *= rot(u_time * -1.5);
       x += t.yzx * 0.2;
    }
    return t;
}

vec3 fbm2(vec3 x, float H )
{    
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    vec3 t = vec3(0.0);
    for( int i=0; i<6; i++ )
    {
        t += a*noise2(f*x);
        f *= 2.0;
        a *= G;
      t.xz *= rot(90.0);
       x += t * 0.5;
    }
  
    return t * t;
}


  


//in vec2 vUV;
out vec4 fragColor;


void main(){
  
  float wobblitude = cos(u_poetry_progress * 0.5 + 3.1415) *0.5 + 0.5;
  float shatter = cos(u_poetry_progress * 0.3 + 3.1415) * 0.5 + 0.5;
  
vec3 col = vec3(0.0);
vec2 uv = vUV.xy * 2.0 - 1.0;
uv.x *= u_res.x/u_res.y;
//uv *= 1.0 + sin(length(uv * 3.0) - u_time * 0.2) * sin(u_time * 0.05) * wobblitude * 0.1;
uv *= rot(u_time);
uv. x *= 1.0 + uv.y * wobblitude;// wobblitude;
  
  vec3 n_transform = vec3(sin(u_time * 0.1), u_time * 1.0, 0.0) * 0.5;
  vec3 p = vec3(uv, 0.0) - n_transform * 0.1;
  
  
  
vec3 n = fbm(p * 1.2, 2.0) * 1.0;
 float n0 = n.z;
n *= shatter;
//vec3 col_noise = fbm2(n + p, 1.0);
  
  p *= 1.0 + sin(u_time * 0.05) *0.1;
  
  
  vec3 fbm2 = fbm2(n+vec3(p.xy * rot(-u_time * 0.5), p.z), 0.76);
 // col += abs(fbm2.x + fbm2.z) *0.75;  //domain warp
  
float pct = smoothstep(0.000, 0.005, n0); //pct is set here

  float dw1 = abs(fbm2.x * 1.0);
  float dw2 = abs(-fbm2.z * 1.);
  
  col += mix(dw1, dw2, pct);
  
  
col *= 1.0 * clamp(u_poetry_progress * 1.5 - 0.5, 0.0, 1.0); //fade in

  
  
  vec2 p1 = fract(p.xy * 0.5 - fbm2.xy * 0.02) - 0.5;
  vec2 p2 = fract(p.xy * n0 - fbm2.xz * 0.01) - 0.5;


  
  
 float l = 0.01 / abs(length(p1.xy  - n.xz)-0.25);
 float l2 = 0.01 / abs(sin(length(p2.xy  - n.xz)-u_poetry_progress));
  
  vec2 uv2 = (uv - 0.4 - n.xy - fbm2.xy*0.01) * rot(45. + u_time);
  float l3 = 0.01 / (abs(uv2.x));

    

col += min(1.0, (l + l2) * (cos(u_poetry_progress * 3.1415 + 0.0) * 0.5 + 0.5));
 col += l3;
  
  
  
  
  col = mix(col, -col + 1.0, pct);

  vec2 vig_uv = vUV.xy * rot(-25.0);
  float vig = clamp(-abs(vig_uv.y * -0.5)+1.0, 0.05, 1.0); // vignette
 // col *= smoothstep(0.0, 1.0, u_poetry_progress.x*5.0)*0.8 + 0.2; // beginning fade
    

  col *= vig;

  col = clamp(col , 0.075, 0.9) * 0.9;
  col += (hash12(vUV)-0.5)*0.15;



  

  
col = mix(vec3(0.0, 0.15, 0.30), vec3(1.2, 1.0, 0.9), col.r);
  
  col *= vig; 
 
 //col = vec3(vig);
  
 fragColor = vec4(col, 1.0-hash12(vUV.xy)*0.1);
}
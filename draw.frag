#version 300 es
precision mediump float;

uniform vec2 u_res;
uniform float u_time, u_poetry_progress;
# define PI 3.14159265359
in vec2 vUV;

// 1 output, 2 inputs
float hash12(vec2 src) {
  return fract(sin(dot(src.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// 3 outputs, 3 inputs
vec3 hash33(vec3 src) {
  vec3 p3 = fract(src * vec3(443.897, 441.423, 437.195));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.xxy + p3.yzz) * p3.zyx);
}

mat2 rot(float a){
  a = radians(a);
  float s = sin(a), c = cos(a);
  return mat2(c,-s,s,c);
  
}

vec3 noise(vec3 p){
  
  vec3 id = floor(p);
  vec3 n = hash33(id);

  return vec3(n) - 0.5;
}

vec3 noise2( in vec3 x )
{
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
	
  
  //return smoothstep(f);

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
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    vec3 t = vec3(0.0);
    for( int i=0; i<5; i++ )
    {
        t += a*noise(f*x + float(i * i));
        f *= 2.0;
        a *= G;
      t.xz *= rot(u_time * -1.);
       x += t.zxy * 0.4;
    }
    return t;
}

vec3 fbm2(vec3 x, float H )
{    
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    vec3 t = vec3(0.0);
    for( int i=0; i<5; i++ )
    {
        t += a*noise2(f*x);
        f *= 2.0;
        a *= G;
      t.xz = t.yx;
       x += t * 1.;
    }
  
    return t * abs(t);
}



out vec4 fragColor;
void main(){
  
  float wobblitude = cos(u_poetry_progress * 0.5 + PI) *0.5 + 0.5;
  float shatter = cos(u_poetry_progress * 0.2 + PI) * 0.5 + 0.5;

float val = 0.0;
vec3 col = vec3(0.0);
vec2 uv = vUV.xy * 2.0 - 1.0;
uv.x *= u_res.x/u_res.y;
uv *= rot(u_time * 0.5);
uv. x *= 1.0 + uv.y * wobblitude;
  
  vec3 n_transform = vec3(sin(u_time * 0.05), u_time * 0.5, 0.0) * 0.5;
  vec3 p = vec3(uv, 0.0) - n_transform * 0.1;
  
  
  
vec3 n = fbm(p * 1.2, 2.0) * 1.0;
 float n0 = n.z;
n *= shatter;
//vec3 col_noise = fbm2(n + p, 1.0);
  
  p *= 1.0 + sin(u_time * 0.05) *0.1;
  
  
  vec3 fbm2 = fbm2(n+p, 0.7);
  
float pct = smoothstep(0.000, 0.001, n0); //pct is set here

  float dw1 = abs(fbm2.x * 0.75);
  float dw2 = abs(fbm2.z * 0.75);
  
  val += mix(dw1, dw2, pct);
  
  
val *= 1.0 * clamp(u_poetry_progress * 1.5 - 0.5, 0.0, 1.0); //fade in

  
  
  vec2 p1 = fract(p.xy * 0.5 - fbm2.xy * 0.01) - 0.5;
  vec2 p2 = fract((p.xy + 0.5) * n0 - fbm2.xz * 0.0055) - 0.5;


  
  
  float l = 0.01 / abs(length(p1.xy  - n.xz)-0.25);
  float l2 = 0.005 / abs(sin(length(p2.xy  - n.xz)-u_poetry_progress));
  
  vec2 uv2 = (uv - 0.4 - n.xy - fbm2.xy*0.0075) * rot(-5. + u_time);
  float l3 = 0.005 / (abs(uv2.x));

    

  val += (l + l2) * (cos(u_poetry_progress * PI + 0.0) * 0.5 + 0.5);
  val += l3;
  
  val = mix(val, -val + 1.0, pct);

  float vig = clamp(-abs(vUV.y * -0.5)+1.0, 0.05, 1.0); // vignette

    

  val *= vig;
 val += (hash12(vUV)-0.5)*0.2;

  val = clamp(val , 0.075, 0.9) * 0.9;

  col = mix(vec3(0.0, 0.15, 0.30), vec3(1.2, 1.0, 0.9), val);
  col *= vig; 
 
 //col = vec3(vig);
//col = vec3(hash33(vec3(vUV, u_time)));
  
 fragColor = vec4(col, 1.0);
}

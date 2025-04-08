#version 300 es
precision highp float;

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
      t.xz *= rot(u_time * -1.0);
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
    for( int i=0; i<6; i++ )
    {
        t += a*noise2(f*x);
        f *= 2.0;
        a *= G;
      t.xz = t.yx;
       x += t * 0.9;
    }
  
    return t * abs(t);
}

vec2 rand2( vec2 p)	{
	return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
}
float hash(float x) { return fract(x + 1.3215 * 1.8152); }

float hash3(vec3 a) { return fract((hash(a.z * 42.8883) + hash(a.y * 36.9125) + hash(a.x * 65.4321)) * 291.1257); }

vec3 rehash3(float x) { return vec3(hash(((x + 0.5283) * 59.3829) * 274.3487), hash(((x + 0.8192) * 83.6621) * 345.3871), hash(((x + 0.2157f) * 36.6521f) * 458.3971f)); }

float sqr(float x) {return x*x;}
float fastdist(vec3 a, vec3 b) { return sqr(b.x - a.x) + sqr(b.y - a.y) + sqr(b.z - a.z); }

float eval(float x, float y, float z) {
    vec4 p[27];
    for (int _x = -1; _x < 2; _x++) for (int _y = -1; _y < 2; _y++) for(int _z = -1; _z < 2; _z++) {
        vec3 _p = vec3(floor(x), floor(y), floor(z)) + vec3(_x, _y, _z);
        float h = hash3(_p);
        p[(_x + 1) + ((_y + 1) * 3) + ((_z + 1) * 3 * 3)] = vec4((rehash3(h) + _p).xyz, h);
    }
    float m = 9999.9999, w = 0.0;
    for (int i = 0; i < 27; i++) {
        float d = fastdist(vec3(x, y, z), p[i].xyz);
        if(d < m) { m = d; w = p[i].w; }
    }
    return m * m;
}




out vec4 fragColor;
void main(){
  
  float wobblitude = cos(u_poetry_progress * 0.75 + PI) *0.5 + 0.5;
  float shatter = cos(u_poetry_progress * 0.25 + PI) * 0.5 + 0.5;

float val = 0.0;
vec3 col = vec3(0.0);
vec2 uv = vUV.xy * 2.0 - 1.0;
uv.x *= u_res.x/u_res.y;
uv.x *= 1.0 + max(-0.95, uv.y * wobblitude);

uv *= rot(-u_time * 0.5 + 180.0);

  
  vec3 n_transform = vec3(sin(u_time * 0.05), u_time * 0.5, 0.0) * 0.55;
  vec3 p = vec3(uv * (2.0 + sin(u_time * 0.025 + PI)) * 0.5, -2.0) - n_transform * 0.1;
  
  
  
  vec3 n = fbm(p * 1. - n_transform * 0.05, 2.1) * 1.0;
  float n0 = n.z;
  n *= shatter;
    
  
  //creating the noise and storing it in val
  vec3 fbm2 = fbm2(p + n, 0.7);
  float vor = eval(p.x * 4.0 + fbm2.x * 0.85 + n.x, p.y * 4.0 + fbm2.y * 0.85 + n.y, p.z + u_time * 0.2);
  vor *= 1.5;
  
  //val += eval(p.x * n0, p.y * n0, p.z );
  
  float pct = smoothstep(0.000, 0.001, n0); //pct is set here

  float dw1 = abs(fbm2.x * 0.75);
  float dw2 = abs(-fbm2.z * 0.75);
  val += mix(dw1, -dw2+1.0, pct);
  
  //fading in the dw noise
 float fade_in = clamp(vUV.y + u_poetry_progress - 1.1 - n0 * 0.5, 0.0, 1.0);
  
//  fade_in = 1.0;
  
 val *= fade_in;
  
  //positions for circles
 // vec2 p1 = fract(p.xy * 0.25 - fbm2.xy * 0.01) - 0.5;
  vec2 p2 = fract(((p.xy + 0.75) * rot(u_time * 2.0)) * n0 - fbm2.xz * 0.0055) - 0.5;

    //adding  lines
  vec2 uv2 = (p.xy - 0.4 - n.xy - fbm2.xy*0.015);
  float l3 = (0.005 / abs(uv2.x)) + (0.005 / abs(uv2.y + 1.2));
  
  //adding circles
  uv2 *= rot(u_time);
  float l1 = 0.005 / abs(length(uv2 + vec2(0.1, 1.1)  - n.xz)-0.25);
  //float l2 = 0.0075 / abs(sin(length(p2.xy  - n.xz)-u_poetry_progress * 0.5));
  


 //val += l2 * (cos(u_poetry_progress * PI + 0.0) * 0.5 + 0.5); //adding circles
  val = max(val, min(0.9, l3 + l1)); // adding line
    
  vor = mix(vor, -vor *0.5, pct);
  val += vor * fade_in;
  val = mix(val, val - 0.2, n.y);

  //invert in grids
  //vignette
  val = -val+1.0;
  float vig = clamp(abs(vUV.y * -0.5)+0.6, 0.05, 1.0); // vignette
 // vig = -vig+1.0;
  val *= vig * 0.8;
  
  //adding hash noise

  //colors
  val = clamp(val , 0.0, 1.0) * 0.9;
  val += (hash12(vUV)-0.5)*0.1;

  col = mix(vec3(0.0, 0.15, 0.30), vec3(1.1, 1.0, 0.9), val);
  col *= vig; 
  
  //col = vec3(vig);

 fragColor = vec4(col, 1.0);
}

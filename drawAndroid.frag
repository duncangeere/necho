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
      t.xz *= rot(u_time * -0.5);
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
      t.xyz = t.yzx;
       x += t * 0.9;
    }
  
    return t;
}



out vec4 fragColor;
void main(){
  
  float wobblitude = cos(u_poetry_progress * 0.75 + PI) *0.5 + 0.5;
 // wobblitude = 1.0;
  float shatter = cos(u_poetry_progress * 0.15 + PI) * 0.5 + 0.5;
  shatter *= 0.5;

float val = 0.0;
vec3 col = vec3(0.0);
vec2 uv = vUV.xy * 2.0 - 1.0;
uv.x *= u_res.x/u_res.y;
uv.x *= 1.0 + max(-0.95, uv.y * wobblitude);

uv *= rot(-u_time * 0.5 + 180.0);

  
  vec3 n_transform = vec3(sin(u_time * 0.05), u_time * 0.5, 0.0) * 0.55;
  vec3 p = vec3(uv * (2.0 + sin(u_time * 0.025 + PI)) * 0.5, -2.0) - n_transform * 0.1;
  
  
  
  vec3 n = fbm(p * 1. - n_transform * 0.05, 1.0) * 1.0;
  float n0 = n.z;
  n *= shatter;
    
  
  //creating the noise and storing it in val
  vec3 fbm2 = fbm2(p * 1.5 + n, 0.78);

  fbm2 = normalize(fbm2);

  //val += eval(p.x * n0, p.y * n0, p.z );
  
  float pct = smoothstep(0.0, 0.001, n0); //pct is set here
/*
  float dw1 = abs(fbm2.x * 0.75);
  float dw2 = abs(-fbm2.z * 0.75);
 // val += mix(dw1, -dw2+1.0, pct);
  */
  float time = u_time * 0.1;
  vec3 light_p = vec3(cos(time + u_poetry_progress*10.0) * 3.0,sin(time * 0.25 +  u_poetry_progress*3.0) * 2.0 - 1.0, 1.0);
  float dp = dot(normalize(vec3(uv, 0.0) - light_p), fbm2);
  val += dp * 1.0 + 0.0;
  
  //fading in the dw noise
 float fade_in = clamp(vUV.y + u_poetry_progress - 1.4 - n0 * 1.0, 0.0, 1.0);
//fade_in = 1.0;
  
 val *= fade_in;
  
  //positions for circles
  vec2 p1 = fract(p.xy * 0.25 - fbm2.xy * 0.01) - 0.5;
  vec2 p2 = fract(((p.xy + 0.75) * rot(u_time * 2.0)) * n0 - fbm2.xz * 0.005) - 0.5;

    //adding  lines
  vec2 uv2 = (p.xy - 0.4 - n.xy - fbm2.xy*0.005);
  float l3 = (0.002 / abs(uv2.x)) + (0.002 / abs(uv2.y + 1.2));
  
  //adding circles
  uv2 *= rot(u_time);
  float l1 = 0.002 / abs(length(uv2 + vec2(0.1, 1.1)  - n.xz)-0.25);
  float l2 = 0.0075 / abs(sin(length(p2.xy  - n.xz)-u_poetry_progress * 0.5));
  


 val += l2 * (cos(u_poetry_progress * PI + 0.0) * 0.5 + 0.5) * 1.5; //adding circles
  val = max(val, min(0.9, l3 + l1)); // adding line
    


  val = mix(1.0- val, val, fade_in);
  float vig = clamp(abs(vUV.y * -0.5)+0.6, 0.05, 1.0); // vignette

  val *= vig * 0.8;
  


  //colors
  val = clamp(val , 0.0, 1.0) * 0.9;
  val += (hash12(vUV)-0.5)*0.2;

  col = mix(vec3(0.0, 0.2, 0.40), vec3(1.1, 1.0, 0.9), val);
  col *= vig; 
  
  //col = vec3(vig);

 fragColor = vec4(col, 1.0);
}

#version 300 es
precision highp float;

uniform vec2 u_res;
uniform float u_time,u_poetry_progress;
#define PI 3.14159265359
in vec2 vUV;

float hash12(vec2 src){
  return fract(sin(dot(src.xy,vec2(12.9898,78.233)))*43758.5453);
}

vec3 hash33(vec3 src){
  vec3 p3=fract(src*vec3(443.897,441.423,437.195));
  p3+=dot(p3,p3.yzx+19.19);
  return fract((p3.xxy+p3.yzz)*p3.zyx);
}

mat2 rot(float a){
  a=radians(a);
  float s=sin(a),c=cos(a);
  return mat2(c,-s,s,c);
  
}

vec3 noise(vec3 p){
  
  vec3 id=floor(p);
  vec3 n=hash33(id);
  
  return vec3(n)-.5;
}

vec3 noise2(in vec3 x){
  x+=55.;
  vec3 i=floor(x);
  vec3 f=fract(x);
  f=f*f*(3.-2.*f);
  
  //return smoothstep(f);
  
  return mix(mix(mix(hash33(i+vec3(0,0,0)),
  hash33(i+vec3(1,0,0)),f.x),
  mix(hash33(i+vec3(0,1,0)),
  hash33(i+vec3(1,1,0)),f.x),f.y),
  mix(mix(hash33(i+vec3(0,0,1)),
  hash33(i+vec3(1,0,1)),f.x),
  mix(hash33(i+vec3(0,1,1)),
  hash33(i+vec3(1,1,1)),f.x),f.y),f.z)*2.-1.;
  
}

vec3 fbm(vec3 x,float H){
  float G=exp2(-H);
  float f=1.;
  float a=1.;
  vec3 t=vec3(0.);
  for(int i=0;i<5;i++)
  {
    t+=a*noise(f*x+float(i*i));
    f*=2.;
    a*=G;
    t.xz*=rot(u_time*-.5);
    x+=t.zxy*.4;
  }
  return t;
}

vec3 fbm2(vec3 x,float H){
  
  float G=exp2(-H);
  float f=1.;
  float a=1.;
  vec3 t=vec3(0.);
  for(int i=0;i<6;i++)
  {
    x.y+=u_time*(1.-float(i)/6.)*.00025;
    t+=a*noise2(f*x);
    f*=1.95;
    a*=G;
    t.xyz=t.zxy;
    // x+=sin(x);
    x+=t.yzx;
  }
  
  return t;
}

out vec4 fragColor;
void main(){
  
  float wobblitude=cos(u_poetry_progress*.75+PI)*.5+.5;
  float shatter=cos(u_poetry_progress*.25+PI)*.5+.5;
  shatter*=.85;
  
  //initializing values
  float val=0.;
  vec3 col=vec3(0.);
  
  //uv shenanigans
  vec2 uv=vUV.xy*2.-1.;
  uv.x*=u_res.x/u_res.y;
  uv.x*=1.+max(-.95,uv.y*wobblitude);
  uv*=rot(-u_time*.5+180.);
  
  //noise p
  vec3 n_transform=vec3(sin(u_time*.05),u_time*.25,0.)*.55;
  vec3 p=vec3(uv*(2.+sin(u_time*.025+PI))*.2,-2.)-n_transform*.1;
  
  //grid noise
  vec3 n=fbm(p*1.-n_transform*.075,1.)*1.;
  float n0=n.z;
  n*=shatter;
  
  //pct
  float pct=smoothstep(0.,.001,n0);//pct is set here
  
  //fbm2
  vec3 v_fbm2=fbm2(p*1.5,.78);
  v_fbm2=normalize(v_fbm2);
  
  float time=u_time*.1;
  vec3 light_p=vec3(cos(u_poetry_progress*8.)*1.,sin(time*.45+u_poetry_progress*4.)*1.,.2);
  
  float dp=dot(normalize(vec3(vUV*2.-1.,-.4)-light_p+n*2.),v_fbm2);
  val+=dp*.9+.1;
  
  //fading the dw noise
  float fade_in=clamp(vUV.y*vUV.y+u_poetry_progress-1.6-n0*1.,0.,1.);
  // fade_in=1.;
  val*=fade_in;
  
  //positions of circles
  vec2 p1=fract(p.xy*.25-v_fbm2.xy*.01)-.5;
  vec2 p2=fract(((p.xy+.75)*rot(u_time*2.))*n0-v_fbm2.xz*.001)-.5;
  
  //adding  lines
  vec2 uv2=(p.xy-.3-n.xy-v_fbm2.xy*.0025)*2.;
  float l3=(.002/abs(uv2.x))+(.002/abs(uv2.y+1.2));
  
  //adding circles
  uv2*=rot(u_time);
  float l1=.002/abs(length(uv2+vec2(.1,1.1)-n.xz)-.25);
  float l2=.0075/abs(sin(length(fract(p.xy*n0)-n.xz)-u_poetry_progress*.5))*fade_in;
  
  val+=l2*(cos(u_poetry_progress*PI+0.)*.5+.5)*1.5;//adding circles
  val=max(val,min(.9,l3+l1));// adding line
  
  val=mix(1.-val,val,fade_in);
  
  //vignette
  float vig=clamp(abs(vUV.y*-.5)+.6,.05,1.);
  val*=vig*.9;
  
  //colors
  val=clamp(val,0.,1.)*.9;
  val+=(hash12(vUV.xy)-.5)*.13;
  
  col=mix(vec3(0.,.15,.30),vec3(1.1,1.,.9),val);
  col*=vig;
  
  fragColor=vec4(col,1.);
}

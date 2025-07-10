#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform vec4 u_mouse;

#define PI 3.14159265359
#define SPIRALS 7.
#define LEV 5

vec2 rotate2D(vec2 p, float t) {
    mat2 m = mat2( cos(t), sin(t), -sin(t), cos(t) );
    return m * p;
}

vec4 phyllotaxis(vec2 uv, float offset) {
    float i_s = 1.;
    float r_s = 1.;
    float t_s = 0.;
    float occ = 1.;
    vec3 n = vec3(0., 0., 1.);

    for(int i = 1; i < LEV; i++) {
        float zoom = i == 1 ? offset : 0.;
        float r = length(uv);
        float lr = log(r);
        float theta = atan(uv.x, uv.y);
        vec2 spiral = vec2(theta - lr, theta + lr - zoom)/PI;
        uv = fract(spiral * SPIRALS) - 0.5;

        t_s = theta + t_s + 0.36;

        float taper = smoothstep(0.0, 0.2, r) * (1. - smoothstep(0.5, 0.8, r));
        n += mix(vec3(0., 0., 1.0), vec3(sin(t_s), cos(t_s), 0.), pow(taper, 0.5)) * r_s;
        occ *= 1. - pow(r, 2.);
        i_s = 1. / float(i);
        r_s *= sqrt(r);
    }

    return vec4(normalize(n), occ);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.y *= u_resolution.y / u_resolution.x;

    vec2 m = u_mouse.xy / u_resolution.xy - 0.5;
    m.x *= u_resolution.x / u_resolution.y;
    m *= 20.0;

    float t = fract(u_time * .05) * PI;
    vec3 sp = vec3(uv - 0.4, 0.);
    vec3 lp = u_mouse.z < .5 ? vec3(sin(t*5.)*10., cos(t*8.)*10., -1.5) : vec3(m, -2.);
    vec3 ld = normalize(lp - sp);
    vec3 ro = vec3(0, 0, -0.5);
    vec3 rd = normalize(ro - sp);

    vec4 brocc = phyllotaxis(sp.xy, t);
    vec3 n = vec3(brocc.xy, -brocc.z);
    float occ = brocc.w;

    vec3 base = vec3(0.38, 0.52, 0.26);
    vec3 diff = vec3(0.6, 0.6, 0.5);
    vec3 spec = diff;
    vec3 back = vec3(0.1, 0.01, 1.5);
    vec3 ambi = vec3(0.25, 0.44, 0.23);

    diff *= max(dot(n, ld), 0.);
    back *= max(dot(n, vec3(0.4, -0.4, 0.2)), 0.);
    spec *= pow(max(dot(reflect(-ld, n), rd), 0.), 7.);
    ambi *= occ;

    vec3 col = base * ambi;
    col += base * diff;
    col += spec * 0.2;
    col += base * back;

    col *= pow(20.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.5) + 0.1;
    col = sqrt(col);

    gl_FragColor = vec4(col, 1.);
}


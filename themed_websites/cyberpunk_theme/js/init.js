const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// Vertex shader - handles position
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
    }
`);
gl.compileShader(vertexShader);

// Fragment shader - creates the melting effect
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
    precision highp float;
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float inRange(float value, float start, float end) {
        return step(start, value) * step(value, end);
    }
    float randomBetween(float min, float max, vec2 st) {
return mix(min, max, random(st));
}
    void main() {
        vec2 uv = vUv;
        
        // Melting effect
        float x = uv.y;
        for (float i = 0.0; i < 1.0; i += 0.01) {
            x += inRange(uv.x,i,i+0.01) * randomBetween(0.1, 0.3, uv+uTime);
        }
        float melt = pow(x, 1.0 + uTime * 2.0);
        uv.y = mix(uv.y, melt, uTime);

        
        
        // Glitch effect
        float noise = random(uv + uTime);
        float glitchStrength = smoothstep(0.8, 1.0, sin(uTime * 1.0));
        
        // RGB split
        vec2 redOffset = uv + vec2(0.01, 0.0) * glitchStrength;
        vec2 greenOffset = uv;
        vec2 blueOffset = uv - vec2(0.01, 0.0) * glitchStrength;
        
        vec4 color;
        color.r = texture2D(uTexture, redOffset).r;
        color.g = texture2D(uTexture, greenOffset).g;
        color.b = texture2D(uTexture, blueOffset).b;
        color.a = 1.0;
        
        // Add noise
        color.rgb += noise * glitchStrength * 0.1;
        
        gl_FragColor = color;
    }
`);
gl.compileShader(fragmentShader);

// Create shader program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Create a rectangle covering the screen
const vertices = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    1, 1
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Get uniform locations
const timeLocation = gl.getUniformLocation(program, 'uTime');
const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
const textureLocation = gl.getUniformLocation(program, 'uTexture');

// Create texture
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let isTransitioning = false;
let startTime;

function captureScreen() {
    html2canvas(document.querySelector('.page:not([style*="display: none"])'))
        .then(capturedCanvas => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, capturedCanvas);
        });
}

function render(time) {
    if (!isTransitioning) return;

    const elapsed = (time - startTime) / 1000;
    if (elapsed > 1) {
        isTransitioning = false;
        canvas.style.opacity = '0';
        return;
    }

    gl.uniform1f(timeLocation, elapsed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}

// Load html2canvas dynamically
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
document.head.appendChild(script);

function transitionToPage(targetId) {
    if (!window.html2canvas || isTransitioning) return;

    const currentPage = document.querySelector('.page:not([style*="display: none"])');
    const targetPage = document.getElementById(targetId);

    isTransitioning = true;
    startTime = performance.now();
    canvas.style.opacity = '1';

    captureScreen();
    
    setTimeout(() => {
        currentPage.style.display = 'none';
        targetPage.style.display = 'flex';
    }, 500);

    requestAnimationFrame(render);
}
        function createParticle(x, y) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            document.body.appendChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const velocity = 1 + Math.random() * 2;
            let opacity = 0.5;

            function updateParticle() {
                const currentX = parseFloat(particle.style.left);
                const currentY = parseFloat(particle.style.top);
                
                particle.style.left = (currentX + Math.cos(angle) * velocity) + 'px';
                particle.style.top = (currentY + Math.sin(angle) * velocity) + 'px';
                
                opacity -= 0.01;
                particle.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(updateParticle);
                } else {
                    particle.remove();
                }
            }

            updateParticle();
        }

        // Mouse movement particle creation
        document.addEventListener('mousemove', (e) => {
            if (Math.random() < 0.1) { // Create particle 10% of the time
                createParticle(e.clientX, e.clientY);
            }
        });

        // Status Updates
        function updateStatus() {
            const statuses = ['OPERATIONAL', 'SCANNING', 'PROCESSING', 'ANALYZING'];
            const memory = Math.floor(Math.random() * 100);
            const ping = Math.floor(Math.random() * 200);

            document.getElementById('systemStatus').textContent = 
                statuses[Math.floor(Math.random() * statuses.length)];
            document.getElementById('memoryUsage').textContent = `${memory}%`;
            document.getElementById('networkPing').textContent = `${ping}ms`;
        }

        setInterval(updateStatus, 2000);
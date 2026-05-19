import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class SteveBobs {
    constructor() {
        
        this.init_renderer();
        this.init_data();
        this.init_htmllinking();
    }

    init_renderer()
    {
        this.scene = new THREE.Scene();
        this.container = document.getElementById("viewer");
        
        this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.z = 15;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
    }

    init_data() {
        this.showUV = true;
        this.meshes = ["models/cow_unwrapped.gltf", "models/animeface.gltf", "models/bunny.gltf"]
        this.lights = [];
        this.showUV = true;
        this.currmeshindex = 0;
        this.material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide});
        this.mesh;
    }

    init_htmllinking()
    {
        //drawing app init items
        this.canvas = document.getElementById("drawingapp");
        this.uvmesh = document.getElementById("uv-layer");
        this.toolBtns = document.querySelectorAll(".tool");
        this.fillColor = document.querySelector("#fill-color");
        this.opacitySlider = document.querySelector("#opacity-slider");
        this.sizeSlider = document.querySelector("#size-slider");
        this.colorBtns = document.querySelectorAll(".colors .option");
        this.uvBtn = document.getElementById("uv-button");
        this.colorPicker = document.querySelector("#color-picker");
        this.generateMesh = document.querySelector(".generate-mesh");
        this.clearCanvas = document.querySelector(".clear-canvas");
        this.saveImg = document.querySelector(".save-img");
        this.importImg = document.querySelector(".import-img");
        this.importMesh = document.querySelector(".import-glb");
        this.ctx = this.canvas.getContext("2d");
        this.ctx_uv = this.uvmesh.getContext("2d");
        console.log(this.canvas)
        this.material.map = new THREE.CanvasTexture(this.canvas);
    }

    load_mesh(filepath)
    {

        this.scene.remove(this.mesh)
        filepath = this.meshes[this.currmeshindex];
        const loader = new GLTFLoader();
        //loading the cow
        return loader.loadAsync(
            filepath,

            // if 100% means loaded
            function (xhr) {
                console.log("Mesh loaded successfully");

            }).then((gltf) => {
                const modelGeometry = gltf.scene.children[0].geometry;

                this.mesh = new THREE.Mesh(modelGeometry, this.material);
                this.mesh.scale.set(5, 5, 5);
                this.scene.add(this.mesh);
                console.log(this.mesh)
                if (this.showUV) {
                    this.ctx_uv.clearRect(0, 0, this.uvmesh.width, this.uvmesh.height);
                    this.drawUV();
                }
            })
            .catch((error) => {
                console.error('An error happened', error);
            });
    }

    drawUV() {
        this.ctx_uv.lineCap = "round";
        this.ctx_uv.lineJoin = "round";
        this.ctx_uv.fillStyle = "#fff"; // passing selectedColor as fill style
        this.ctx_uv.lineWidth = 1; // passing brushSize as line width
    
        const uv = this.mesh.geometry.getAttribute('uv');
        let index = this.mesh.geometry.getIndex();
        for (let j = 0; j < index.count; j += 3) {
            let i0 = index.array[j] * 2;
            let i1 = index.array[j + 1] * 2;
            let i2 = index.array[j + 2] * 2;
            this.ctx_uv.beginPath();
            this.ctx_uv.moveTo(uv.array[i0] * this.uvmesh.width, (1 - uv.array[i0 + 1]) * this.uvmesh.height);
            this.ctx_uv.lineTo(uv.array[i1] * this.uvmesh.width, (1 - uv.array[i1 + 1]) * this.uvmesh.height);
            this.ctx_uv.stroke();
            this.ctx_uv.lineTo(uv.array[i2] *this.uvmesh.width, (1 - uv.array[i2 + 1]) * this.uvmesh.height);
            this.ctx_uv.stroke();
            this.ctx_uv.lineTo(uv.array[i0] * this.uvmesh.width, (1 - uv.array[i0 + 1]) * this.uvmesh.height);
            this.ctx_uv.stroke();
            this.ctx_uv.closePath();
        }
    }

    add_lights() {
        // Adding lighting
        const directionalLightTop = new THREE.DirectionalLight(0xffffff, 1);
        directionalLightTop.position.set(0, 1, 0);
        const directionalLightBottom = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLightBottom.position.set(-1, -1, 0);
        const hemlight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.7);
        this.scene.add(hemlight);
        this.scene.add(directionalLightTop);
        this.scene.add(directionalLightBottom);
        this.lights.push(hemlight);
        this.lights.push(directionalLightTop);
        this.lights.push(directionalLightBottom);
       
    }
}


let stevebobs = new SteveBobs(); // sets up webgl and canvas
stevebobs.load_mesh();
stevebobs.add_lights();
//calls on update
drawingapp();
animate();

//Drawing app for the canvas
function drawingapp() {
    let drawingOnMesh = false;
    let drawingOnCanvas = false;
    let prevMouseX, prevMouseY, snapshot,
        isDrawing = false,
        selectedTool = "brush",
        brushWidth = 5,
        opacity = 1,
        selectedColor = "#000";
    const setCanvasBackground = () => {
        // setting whole canvas background to white, so the downloaded img background will be white
        stevebobs.ctx.fillStyle = "#fff";
        stevebobs.ctx.fillRect(0, 0, stevebobs.canvas.width, stevebobs.canvas.height);
        stevebobs.ctx.fillStyle = selectedColor;
        stevebobs.ctx_uv.clearRect(0, 0, stevebobs.uvmesh.width, stevebobs.uvmesh.height);
    }
    window.addEventListener("load", () => {
        // setting canvas width/height.. offsetwidth/height returns viewable width/height of an element
        stevebobs.canvas.width = stevebobs.canvas.offsetWidth;
        stevebobs.canvas.height = stevebobs.canvas.offsetHeight;
        stevebobs.uvmesh.width = stevebobs.uvmesh.offsetWidth;
        stevebobs.uvmesh.height = stevebobs.uvmesh.offsetHeight;
        setCanvasBackground();
    });

    let lastBrushX;
    let lastBrushY;

    const startDraw = (e) => {

        prevMouseX = e.offsetX; // passing current mouseX position as prevMouseX value
        prevMouseY = e.offsetY; // passing current mouseY position as prevMouseY value

        isDrawing = true;
        stevebobs.ctx.lineCap = "round";
        stevebobs.ctx.lineJoin = "round";
        stevebobs.ctx.fillStyle = selectedColor; // passing selectedColor as fill style
        stevebobs.ctx.globalAlpha = opacity;
        stevebobs.ctx.beginPath(); // creating new path to draw

        stevebobs.ctx.lineWidth = brushWidth; // passing brushSize as line width
        stevebobs.ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;

        // copying canvas data & passing as snapshot value.. this avoids dragging the image
        snapshot = stevebobs.ctx.getImageData(0, 0, stevebobs.canvas.width, stevebobs.canvas.height);

        //setting lastbrushx and lastbrushy
        stevebobs.raycaster.setFromCamera(stevebobs.pointer, stevebobs.camera);
        //cast a ray and find uv coordinates to draw onto
        const intersects = stevebobs.raycaster.intersectObjects(stevebobs.scene.children);
        if (intersects.length > 0) {
            stevebobs.controls.enabled = false;
            //the raycaster found a face to paint on
            const intersection = intersects[0];
            //calculating brsuh positions from uv coordinates
            lastBrushX = intersection.uv.x * stevebobs.canvas.width;
            lastBrushY = (1 - intersection.uv.y) * stevebobs.canvas.height; //top left corner is 0
        }

    }
    const drawing = (e) => {

        if (!isDrawing) return; // if isDrawing is false return from here
        stevebobs.ctx.putImageData(snapshot, 0, 0); // adding copied canvas data on to this canvas
        if (selectedTool === "brush" || selectedTool === "eraser") {
            if (drawingOnCanvas) {
                stevebobs.ctx.lineTo(e.offsetX, e.offsetY); // creating line according to the mouse pointer
                stevebobs.ctx.stroke(); // drawing/filling line with color
                stevebobs.material.map = new THREE.CanvasTexture(stevebobs.canvas);
            } else if (drawingOnMesh) {
                stevebobs.raycaster.setFromCamera(stevebobs.pointer, stevebobs.camera);
                //cast a ray and find uv coordinates to draw onto
                const intersects = stevebobs.raycaster.intersectObjects(stevebobs.scene.children);
                if (intersects.length > 0) {
                    stevebobs.controls.enabled = false;
                    //the raycaster found a face to paint on
                    const intersection = intersects[0];
                    //calculating brsuh positions from uv coordinates

                    var brushX = intersection.uv.x * stevebobs.canvas.width;
                    var brushY = (1 - intersection.uv.y) * stevebobs.canvas.height; //top left corner is 0

                    if ((Math.abs(brushX - lastBrushX) < 30) && (Math.abs(brushY - lastBrushY) < 30)) {

                        stevebobs.ctx.lineTo(brushX, brushY); // creating line according to the mouse pointer
                        stevebobs.ctx.stroke(); // drawing/filling line with color
                        //saving the last positions
                    } else {
                        stevebobs.ctx.lineTo(lastBrushX, lastBrushY); // creating line according to the mouse pointer
                        stevebobs.ctx.stroke();
                        startDraw(e);
                    }
                    lastBrushX = brushX;
                    lastBrushY = brushY;

                    stevebobs.material.map = new THREE.CanvasTexture(stevebobs.canvas);
                }
            }
        }
    }
    stevebobs.toolBtns.forEach(btn => {
        btn.addEventListener("click", () => { // adding click event to all tool option
            // removing active class from the previous option and adding on current clicked option
            document.querySelector(".options .active").classList.remove("active");
            btn.classList.add("active");
            selectedTool = btn.id;
        });
    });
    stevebobs.sizeSlider.addEventListener("change", () => { // passing slider value as brushSize
        brushWidth = stevebobs.sizeSlider.value;
    });

    stevebobs.opacitySlider.addEventListener("change", () => { // passing slider value as opacity
        opacity = stevebobs.opacitySlider.value / 100.0;
    });
    // brush size cursor display change
    document.onmousemove = function (e) {
        var circle = document.getElementById("circle");
        circle.style.top = e.clientY + "px";
        circle.style.left = e.clientX + "px";
        circle.style.width = brushWidth + "px";
        circle.style.height = brushWidth + "px";
    }
    stevebobs.colorBtns.forEach(btn => {
        btn.addEventListener("click", () => { // adding click event to all color button
            // removing selected class from the previous option and adding on current clicked option
            document.querySelector(".options .selected").classList.remove("selected");
            btn.classList.add("selected");
            // passing selected btn background color as selectedColor value
            selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
        });
    });
    stevebobs.colorPicker.addEventListener("change", () => {
        // passing picked color value from color picker to last color btn background
        stevebobs.colorPicker.parentElement.style.background = stevebobs.colorPicker.value;
        stevebobs.colorPicker.parentElement.click();
    });
    stevebobs.uvBtn.addEventListener("click", () => {
        stevebobs.showUV = !stevebobs.showUV;
        if (stevebobs.showUV) {
            stevebobs.drawUV();
        } else {
            stevebobs.ctx_uv.clearRect(0, 0, stevebobs.uvmesh.width, stevebobs.uvmesh.height); // clearing whole canvas
        }
    });
    stevebobs.clearCanvas.addEventListener("click", () => {
        stevebobs.ctx.fillRect(0, 0, stevebobs.canvas.width, stevebobs.canvas.height); // clearing whole canvas
        stevebobs.material.map = new THREE.CanvasTexture(stevebobs.canvas);
        setCanvasBackground();
    });
    stevebobs.saveImg.addEventListener("click", () => {
        const link = document.createElement("a"); // creating <a> element
        link.download = `${Date.now()}.png`; // passing current date as link download value
        link.href = stevebobs.canvas.toDataURL(); // passing canvasData as link href value
        link.click(); // clicking link to download image
    });
    stevebobs.importImg.addEventListener("click", () => {

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function (event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    stevebobs.ctx.clearRect(0, 0, stevebobs.canvas.width, stevebobs.canvas.height); // clearing whole canvas
                    setCanvasBackground();
                    stevebobs.ctx.drawImage(img, 0, 0, stevebobs.canvas.width, stevebobs.canvas.height);
                    stevebobs.material.map = new THREE.CanvasTexture(stevebobs.canvas);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };
        input.click();

    });
    stevebobs.importMesh.addEventListener("click", () => {
       const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.glb, .gltf'; // Accept GLTF and GLB files
        input.onchange = async function (event) {
            const file = event.target.files[0];
            if (!file)  return;
            const url = URL.createObjectURL(file);
            stevebobs.meshes.push(url);
            stevebobs.currmeshindex = stevebobs.meshes.length - 1;
            await stevebobs.load_mesh(stevebobs.currmeshindex);
        };
        stevebobs.load_mesh(stevebobs.currmeshindex);
        input.click();

    });
    stevebobs.generateMesh.addEventListener("click", async () => {
        stevebobs.currmeshindex = (stevebobs.currmeshindex + 1) % stevebobs.meshes.length;
        await stevebobs.load_mesh()
    });


    stevebobs.canvas.addEventListener("mousedown", (event) => {
        drawingOnMesh = false;
        drawingOnCanvas = true;
        startDraw(event);

    });
    stevebobs.canvas.addEventListener("mousemove", drawing);
    stevebobs.canvas.addEventListener("mouseup", () => {
        stevebobs.controls.enabled = true;
        drawingOnMesh = false;
        drawingOnCanvas = false;
        isDrawing = false;
    });

    //event listeners for the 3d viewer
    stevebobs.renderer.domElement.addEventListener('mousedown', (event) => {
        stevebobs.raycaster.setFromCamera(stevebobs.pointer, stevebobs.camera);
        stevebobs.raycaster.intersectObjects(stevebobs.scene.children)
        if (stevebobs.raycaster.intersectObjects(stevebobs.scene.children).length > 0) {
            drawingOnMesh = true;
        }
        drawingOnCanvas = false;
        startDraw(event);


    });
    stevebobs.renderer.domElement.addEventListener('mousemove', (event) => {
        drawing(event);
    });
    stevebobs.renderer.domElement.addEventListener('mouseup', () => {
        stevebobs.controls.enabled = true;
        drawingOnMesh = false;
        drawingOnCanvas = false;
        isDrawing = false;
    });

    window.addEventListener('pointermove', onPointerMove);

    function onPointerMove(event) {

        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components
        stevebobs.pointer.x = ((event.pageX - stevebobs.container.offsetLeft) / stevebobs.container.offsetWidth) * 2 - 1;
        stevebobs.pointer.y = - ((event.pageY - stevebobs.container.offsetTop) / stevebobs.container.offsetHeight) * 2 + 1;
    }
}

function animate() {
    requestAnimationFrame(animate);
    stevebobs.controls.update();
    stevebobs.renderer.render(stevebobs.scene, stevebobs.camera);
}

//event listeners
window.addEventListener("resize", function () {
    var width = stevebobs.container.clientWidth;
    var height = stevebobs.container.clientHeight;
    stevebobs.renderer.setSize(width, height);
    stevebobs.camera.aspect = width / height;
    stevebobs.camera.updateProjectionMatrix();
});


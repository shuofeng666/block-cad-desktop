import * as THREE from "three";
import { OrbitControls } from "./OrbitControls";
import { OBJLoader } from "./OBJLoader";
const textureLoader = new THREE.TextureLoader();
const material = new THREE.MeshMatcapMaterial({
  color: 0xffffff,
  matcap: textureLoader.load("assets/matcap-porcelain-white.jpg"),
});
var loader = new OBJLoader();

export class GLViewer {
  camera: THREE.PerspectiveCamera;
  element: HTMLDivElement;
  orbitControl: OrbitControls;
  renderer = new THREE.WebGLRenderer();
  scene = new THREE.Scene();
  group = new THREE.Group();

  constructor(element: HTMLDivElement) {
    this.element = element;
    const pos = element.getBoundingClientRect();

    this.camera = new THREE.PerspectiveCamera(32, pos.width / pos.height, 0.01, 10000);
    this.camera.position.setScalar(300);
    this.camera.up.set(0, 0, 1);

    // 渲染器
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(pos.width, pos.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // 控制器
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControl.enableDamping = true;
    this.orbitControl.dampingFactor = 0.1;

    // 场景设置
    this.scene.background = new THREE.Color(0xffffff);
    this.scene.add(this.group);

    // 添加网格
    const grid = new THREE.GridHelper(200, 20, 0x444444, 0x888888);
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    grid.position.y = -0.01;
    grid.rotation.x = -Math.PI / 2;
    this.scene.add(grid);

    // 添加坐标轴
    const axes = new THREE.AxesHelper(50);
    this.scene.add(axes);

    // 添加灯光
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbfd4d2, 0.9);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.setScalar(2048);
    dirLight.shadow.bias = -1e-4;
    dirLight.shadow.normalBias = 1e-4;
    this.scene.add(dirLight);

    // 阴影接收平面
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.ShadowMaterial({
        transparent: true,
        opacity: 0.075,
        side: THREE.DoubleSide,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);

    // 添加渲染器到页面
    this.element.appendChild(this.renderer.domElement);
    this.resize();
    this.animate();
  }

  resize() {
    var pos = this.element.getBoundingClientRect();
    this.camera.aspect = pos.width / pos.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(pos.width, pos.height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  clearScene() {
    // 清理 group 中的所有对象
    while(this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      // 如果有 geometry 和 material，释放内存
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    }
    
    // 清理场景中的所有动态添加的对象（例如灯光）
    const objectsToRemove = [];
    this.scene.traverse((object) => {
      if (object !== this.scene && 
          object !== this.group && 
          object.type !== 'GridHelper' && 
          object.type !== 'AxesHelper' &&
          !(object instanceof THREE.Mesh && object.material.type === 'ShadowMaterial')) {
        objectsToRemove.push(object);
      }
    });
    
    objectsToRemove.forEach(object => {
      this.scene.remove(object);
      // 释放资源
      if (object instanceof THREE.Light) {
        object.dispose?.();
      }
    });
  }



  updateObjMesh(mesh) {
    this.group.add(mesh);
  }
}

import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

const initPointerLock = (canvas, camera) => {
  // On click event, request pointer lock
  canvas.addEventListener(
    "click",
    (evt) => {
      canvas.requestPointerLock =
        canvas.requestPointerLock ||
        canvas.msRequestPointerLock ||
        canvas.mozRequestPointerLock ||
        canvas.webkitRequestPointerLock;
      if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    },
    false
  );

  // Event listener when the pointerlock is updated (or removed by pressing ESC for example).
  const pointerlockchange = (event) => {
    const controlEnabled =
      document.mozPointerLockElement === canvas ||
      document.webkitPointerLockElement === canvas ||
      document.msPointerLockElement === canvas ||
      document.pointerLockElement === canvas;
    // If the user is already locked
    if (!controlEnabled) {
      camera.detachControl(canvas);
    } else {
      camera.attachControl(canvas);
    }
  };

  // Attach events to the document
  document.addEventListener("pointerlockchange", pointerlockchange, false);
  document.addEventListener("mspointerlockchange", pointerlockchange, false);
  document.addEventListener("mozpointerlockchange", pointerlockchange, false);
  document.addEventListener(
    "webkitpointerlockchange",
    pointerlockchange,
    false
  );
};

const createScene = function () {
  const scene = new BABYLON.Scene(engine);

  // This creates and positions a free camera (non-mesh)
  const camera = new BABYLON.UniversalCamera(
    "Camera",
    new BABYLON.Vector3(0, 1, 0.5),
    scene
  );
  initPointerLock(engine.getRenderingCanvas(), camera);

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // Environment Texture
  const hdrTexture = new BABYLON.CubeTexture.CreateFromPrefilteredData(
    "img/nightEnvSpecularHDR.dds",
    scene
  );
  scene.imageProcessingConfiguration.exposure = 0.1;
  scene.imageProcessingConfiguration.contrast = 1.0;
  scene.environmentTexture = hdrTexture;

  // Skybox
  const hdrSkybox = BABYLON.Mesh.CreateBox("hdrSkyBox", 1000.0, scene);
  const hdrSkyboxMaterial = new BABYLON.PBRMaterial("skyBox", scene);
  hdrSkyboxMaterial.backFaceCulling = false;
  hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
  hdrSkyboxMaterial.reflectionTexture.coordinatesMode =
    BABYLON.Texture.SKYBOX_MODE;
  hdrSkyboxMaterial.microSurface = 1.0;
  hdrSkyboxMaterial.disableLighting = true;
  hdrSkybox.material = hdrSkyboxMaterial;
  hdrSkybox.infiniteDistance = true;

  // const sphere = BABYLON.MeshBuilder.CreateSphere(
  //   "sphere",
  //   { diameter: 2 },
  //   scene
  // );
  // const plastic = new BABYLON.PBRMaterial("plastic", scene);
  // plastic.reflectionTexture = hdrTexture;
  // plastic.microSurface = 0.96;
  // plastic.albedoColor = new BABYLON.Color3(0.206, 0.94, 1);
  // plastic.reflectivityColor = new BABYLON.Color3(0.003, 0.003, 0.003);
  // sphere.material = plastic;

  // BABYLON.SceneLoader.Append("./resources/", "gallery53.glb", scene);

  BABYLON.SceneLoader.LoadAssetContainer(
    "./resources/",
    "gallery53.glb",
    scene,
    (container) => {
      const meshes = container.meshes;
      container.addAllToScene();
    }
  );

  const light1 = new BABYLON.HemisphericLight(
    "light1",
    new BABYLON.Vector3(1, 1, 0),
    scene
  );
  const light2 = new BABYLON.PointLight(
    "light2",
    new BABYLON.Vector3(0, 1, -1),
    scene
  );

  return scene;
};

const initBabylonCanvas = () => {
  const scene = createScene();
  engine.runRenderLoop(function () {
    scene.render();
  });
  window.addEventListener("resize", function () {
    engine.resize();
  });
};

export { initBabylonCanvas };

import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

const initPointerLock = (canvas, camera) => {
  // On click event, request pointer lock
  canvas.addEventListener(
    "click",
    () => {
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
  const pointerlockchange = () => {
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

const setupCamera = (scene) => {
  // This creates and positions a free camera (non-mesh)
  const camera = new BABYLON.UniversalCamera(
    "Camera",
    new BABYLON.Vector3(0, 1.5, -3),
    scene
  );
  initPointerLock(engine.getRenderingCanvas(), camera);

  // This targets the camera to scene origin
  camera.setTarget(new BABYLON.Vector3(0, 1, 0));

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // Physics model
  camera.checkCollisions = true;
  camera.applyGravity = true;
  camera.speed = 0.025;

  // Key controls for WASD and arrows
  camera.keysUp = [87, 38];
  camera.keysDown = [83, 40];
  camera.keysLeft = [65, 37];
  camera.keysRight = [68, 39];

  // Set the ellipsoid around the camera (e.g. your player's size)
  camera.ellipsoid = new BABYLON.Vector3(0.5, 0.2, 0.5);

  return camera;
};

const setupEnvironment = (scene) => {
  // Environment Texture
  const hdrTexture = new BABYLON.CubeTexture.CreateFromPrefilteredData(
    "img/gallery.env",
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
};

const setupLights = (scene) => {
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
  light1.intensity = 10;

  return [light1, light2];
};

const setupGltf = async (scene) => {
  const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
    "./resources/",
    "gallery63.glb",
    scene
  );

  // Set up mirror material for the floor material only
  // add mirror reflection to floor, index of floor material may
  // change on new export
  const mirrorTex = new BABYLON.MirrorTexture(
    "mirror",
    { ratio: 1 },
    scene,
    true
  );
  const floorMaterial = container.materials.find((e) => e.id === "floor");
  floorMaterial.reflectionTexture = mirrorTex;
  floorMaterial.reflectionTexture.mirrorPlane = new BABYLON.Plane.FromPositionAndNormal(
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(0, -1, 0)
  );
  floorMaterial.reflectionTexture.renderList = container.meshes;
  floorMaterial.reflectionTexture.level = 5;

  container.addAllToScene(scene);
  return container;
};

const setupText = (scene) => {
  const plane = new BABYLON.Mesh.CreatePlane("Text Plane", 2, scene);
  plane.rotation.y = 3.14159;
  plane.position.y += 1;

  const textTexture = new BABYLON.DynamicTexture(
    "Dynamic Texture",
    { width: 512, height: 512 },
    scene
  );
  const textContext = textTexture.getContext();

  const textMaterial = new BABYLON.StandardMaterial("Mat", scene);
  textMaterial.diffuseTexture = textTexture;
  plane.material = textMaterial;

  // Add text to dynamic texture
  const font = "bold 44px helvetica";
  textTexture.drawText("ORIGIN", 75, 135, font, "black", "white", true, true);
};

const createScene = async () => {
  const scene = new BABYLON.Scene(engine);
  scene.collisionsEnabled = true;
  scene.gravity = new BABYLON.Vector3(0, -0.9, 0);

  scene.debugLayer.show();

  const camera = setupCamera(scene);
  setupLights();
  setupEnvironment(scene);
  const gltf = await setupGltf(scene);
  const collisionMesh = gltf.meshes.find((e) => e.name === "CollisionMesh");
  if (collisionMesh) {
    collisionMesh.checkCollisions = true;
    collisionMesh.visibility = 0;
  }

  setupText(scene);

  const pipeline = new BABYLON.StandardRenderingPipeline(
    "Motion Blur",
    scene,
    1.0,
    null,
    [camera]
  );
  pipeline.MotionBlurEnabled = true;
  pipeline.motionStrength = 3.2;
  pipeline.motionBlurSamples = 32;

  return scene;
};

const initBabylonCanvas = async () => {
  const scene = await createScene();
  engine.runRenderLoop(function () {
    scene.render();
  });
  window.addEventListener("resize", function () {
    engine.resize();
  });
};

export { initBabylonCanvas };

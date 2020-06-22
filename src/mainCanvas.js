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
  camera.speed = 0.035;

  // Key controls for WASD and arrows
  camera.keysUp = [87, 38];
  camera.keysDown = [83, 40];
  camera.keysLeft = [65, 37];
  camera.keysRight = [68, 39];

  // Set the ellipsoid around the camera (e.g. your player's size)
  camera.ellipsoid = new BABYLON.Vector3(0.6, 0.2, 0.9);

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
    "gallery.glb",
    scene
  );

  // Set up mirror material for the floor material only
  // add mirror reflection to floor
  const mirrorTex = new BABYLON.MirrorTexture(
    "mirror texture",
    { ratio: 1 },
    scene,
    true
  );
  const floorMesh = container.meshes.find((e) => e.id === "floor");
  const floorMaterial = floorMesh.material;
  floorMaterial.reflectionTexture = mirrorTex;
  floorMaterial.reflectionTexture.mirrorPlane = new BABYLON.Plane.FromPositionAndNormal(
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(0, -1, 0)
  );
  floorMaterial.reflectionTexture.renderList = container.meshes.filter(
    (e) => e.id !== "floor"
  );
  floorMaterial.reflectionTexture.level = 5;
  floorMaterial.reflectionTexture.adaptiveBlurKernel = 32;

  container.addAllToScene(scene);
  return container;
};

const setupText = (scene) => {
  const plane = new BABYLON.Mesh.CreatePlane("Text Plane", 1, scene);
  plane.rotation.y = 3.14159;
  plane.position = new BABYLON.Vector3(-2.27, 1, -0.335);

  const textTexture = new BABYLON.DynamicTexture(
    "Dynamic Texture",
    { width: 512, height: 512 },
    scene
  );
  textTexture.hasAlpha = true;
  const textContext = textTexture.getContext();

  const textMaterial = new BABYLON.StandardMaterial("Mat", scene);
  textMaterial.diffuseTexture = textTexture;
  plane.material = textMaterial;

  // Add text to dynamic texture
  const font = "bold 44px helvetica";
  textTexture.drawText(
    "WHAT COLOUR IS YOUR WORLD?",
    75,
    135,
    font,
    "black",
    null,
    true,
    true
  );
};

const setupPipeline = (scene, camera) => {
  const pipeline = new BABYLON.DefaultRenderingPipeline(
    "Default pipeline",
    false,
    scene,
    [camera]
  );
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.vignetteEnabled = true;
  pipeline.imageProcessing.vignetteWeight = 5;
  pipeline.imageProcessing.contrast = 1.6;
  pipeline.imageProcessing.exposure = 0.2;

  const curve = new BABYLON.ColorCurves();
  curve.globalHue = 0;
  curve.globalDensity = 100;
  curve.globalSaturation = 20;
  pipeline.imageProcessing.colorCurvesEnabled = true;
  pipeline.imageProcessing.colorCurves = curve;

  // Motion blur - causes jaggies
  // const motionblur = new BABYLON.MotionBlurPostProcess(
  //   "motionblur",
  //   scene,
  //   1.0,
  //   camera
  // );
  // motionblur.MotionBlurEnabled = true;
  // motionblur.motionStrength = 3.2;
  // motionblur.motionBlurSamples = 32;

  // Glow
  const gl = new BABYLON.GlowLayer("glow", scene, { mainTextureSamples: 1 });
  gl.intensity = 0.2;

  const densities = new Array(50).fill(0);

  const setHue = (enabled, hue) => {
    densities.shift();
    densities.push(enabled ? 85 : 0);
    pipeline.imageProcessing.colorCurves.globalDensity =
      densities.reduce((a, b) => a + b) / densities.length;

    pipeline.imageProcessing.colorCurves.globalHue = hue;
  };

  return { setHue };
};

const rangeMap = (value, start1, stop1, start2, stop2) => {
  if (value < start1) {
    return start2;
  }
  if (value >= stop1) {
    return stop2;
  }
  return ((value - start1) * (stop2 - start2)) / (stop1 - start1) + start2;
};

const sketch1 = (scene, camera, s1Bounds, setHue) => {
  const start = new BABYLON.Vector3(0, 0, 1);
  const end = new BABYLON.Vector3(0, 0, -3.5);
  const totalDistance = BABYLON.Vector3.Distance(start, end);
  let hue = 0;

  const textMesh = scene.meshes.find((e) => e.name === "S1Text");
  if (textMesh) {
    const textTexture = new BABYLON.DynamicTexture(
      "Dynamic Texture",
      { width: 512, height: 512 },
      scene
    );
    textTexture.hasAlpha = true;
    const textContext = textTexture.getContext();

    const textMaterial = new BABYLON.StandardMaterial("Mat", scene);
    textMaterial.diffuseTexture = textTexture;
    textMesh.material = textMaterial;

    // Add text to dynamic texture
    const font = "bold 24px helvetica";
    textTexture.drawText(
      "WHAT COLOUR IS YOUR WORLD?",
      55,
      235,
      font,
      "black",
      null,
      true,
      true
    );
  }

  const update = () => {
    const localPoint = BABYLON.Vector3.TransformCoordinates(
      camera.position,
      s1Bounds.getWorldMatrix().clone().invert()
    );
    if (intersectWithPoint(s1Bounds, localPoint)) {
      const distance = Math.abs(start.z - localPoint.z);
      hue = rangeMap(distance, 0, totalDistance, 0, 359);
      setHue(true, hue);
    } else {
      setHue(false, hue);
    }
  };

  const getHue = () => {
    return hue;
  };

  return { update, getHue };
};

const intersectWithPoint = (mesh, point) => {
  var boundInfo = mesh.getBoundingInfo();
  var max = boundInfo.maximum;
  var min = boundInfo.minimum;
  if (point.x > min.x && point.x < max.x) {
    if (point.z > min.z && point.z < max.z) {
      return true;
    }
  }
  return false;
};

const createScene = async () => {
  const scene = new BABYLON.Scene(engine);
  scene.collisionsEnabled = true;
  scene.gravity = new BABYLON.Vector3(0, -0.9, 0);

  // scene.debugLayer.show();

  const camera = setupCamera(scene);
  setupLights();
  setupEnvironment(scene);
  const gltf = await setupGltf(scene);
  const collisionMesh = gltf.meshes.find((e) => e.name === "CollisionMesh");
  if (collisionMesh) {
    collisionMesh.checkCollisions = true;
    collisionMesh.visibility = 0;
  }
  const s1Bounds = gltf.meshes.find((e) => e.name === "S1Bounds");
  if (s1Bounds) {
    s1Bounds.visibility = 0;
  }

  // setupText(scene);
  const pipeline = setupPipeline(scene, camera);

  const s1 = sketch1(scene, camera, s1Bounds, pipeline.setHue);

  scene.registerBeforeRender(() => {
    s1.update();
  });

  return scene;
};

const initBabylonCanvas = async () => {
  const scene = await createScene();
  engine.runRenderLoop(() => {
    scene.render();
  });
  window.addEventListener("resize", () => {
    engine.resize();
  });
};

export { initBabylonCanvas };

import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

import { sketch1 } from "./sketch1";
import { sketch2 } from "./sketch2";

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

const initPointerLock = (canvas, camera) => {
  // On click event, request pointer lock
  canvas.addEventListener(
    "click",
    (event) => {
      blocker.display = "none";
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

  canvas.addEventListener("touchstart", () => {
    blocker.style.display = "none";
  });

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
      blocker.style.display = "flex";
    } else {
      camera.attachControl(canvas);
      blocker.style.display = "none";
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
  camera.minZ = 0.1;
  camera.position.set(0.64, 1.25, 9.98);
  camera.rotation.set(0, -3.13, 0);
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

  const blocker = document.getElementById("blocker");

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

  container.addAllToScene(scene);
  return container;
};

const setupReflection = (scene, reflectiveMesh, meshes) => {
  // Set up mirror material for the floor material only
  // add mirror reflection to floor
  const mirrorTex = new BABYLON.MirrorTexture(
    "mirror texture",
    { ratio: 1 },
    scene,
    true
  );
  const reflectiveMaterial = reflectiveMesh.material;
  reflectiveMaterial.reflectionTexture = mirrorTex;
  reflectiveMaterial.reflectionTexture.mirrorPlane = new BABYLON.Plane.FromPositionAndNormal(
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(0, -1, 0)
  );
  reflectiveMaterial.reflectionTexture.renderList = meshes.filter(
    (e) => e.id !== "floor"
  );
  reflectiveMaterial.reflectionTexture.level = 5;
  reflectiveMaterial.reflectionTexture.adaptiveBlurKernel = 32;

  return {
    updateMeshes: (meshes) => {
      reflectiveMaterial.reflectionTexture.renderList = meshes.filter(
        (e) => e.id !== "floor"
      );
    },
  };
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
  const s2Bounds = gltf.meshes.find((e) => e.name === "S2Bounds");
  if (s2Bounds) {
    s2Bounds.visibility = 0;
  }

  const s2Text = gltf.meshes.find((e) => e.id === "S2Text");
  s2Text.material = new BABYLON.StandardMaterial("titleCard", scene);
  s2Text.material.diffuseTexture = new BABYLON.Texture(
    "./resources/titlecard.svg",
    scene,
    false
  );
  s2Text.material.diffuseTexture.hasAlpha = true;
  s2Text.material.diffuseTexture.uScale = 1.0;
  s2Text.material.diffuseTexture.vScale = -1.0;

  // setupText(scene);
  const pipeline = setupPipeline(scene, camera);

  const floorMesh = gltf.meshes.find((e) => e.id === "floor");
  const reflection = setupReflection(scene, floorMesh, []);
  const updateReflection = (refMeshes) => {
    const filteredMeshes = gltf.meshes
      .filter((e) => e.id !== "floor")
      .concat(refMeshes);
    reflection.updateMeshes(filteredMeshes);
  };

  const s1 = sketch1(scene, camera, s1Bounds, pipeline.setHue);
  const s2 = sketch2(
    scene,
    engine,
    camera,
    s1Bounds,
    s2Bounds,
    updateReflection
  );
  s2.anchor.position = new BABYLON.Vector3(1.2, 1, 4.1);
  s2.anchor.scaling = new BABYLON.Vector3(0.67, 0.67, 0.67);

  updateReflection(s2.meshes);

  // const testBox = new BABYLON.MeshBuilder.CreateBox("testbox", {}, scene);
  // testBox.material = new BABYLON.StandardMaterial("testmat", scene);

  let time = 0;

  scene.registerBeforeRender(() => {
    time += engine.getDeltaTime() / 1000;
    s1.update();
    s2.update(time);
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

import * as BABYLON from "babylonjs";
import random from "canvas-sketch-util/random";
import palettes from "nice-color-palettes";
import { intersectWithPoint } from "./utils";

const setupLights = (scene, meshes) => {
  const directionalLight = new BABYLON.DirectionalLight(
    "white",
    new BABYLON.Vector3(0, 4, 0),
    scene
  );
  directionalLight.diffuse = BABYLON.Color3.FromHexString("#ffffff");
  directionalLight.specular = BABYLON.Color3.FromHexString("#ffffff");
  directionalLight.ground = BABYLON.Color3.FromHexString("#000000");

  const directionalLight2 = new BABYLON.DirectionalLight(
    "blue",
    new BABYLON.Vector3(4, 4, 0),
    scene
  );
  directionalLight2.diffuse = BABYLON.Color3.FromHexString("#0000ff");
  directionalLight2.specular = BABYLON.Color3.FromHexString("#0000ff");
  directionalLight2.ground = BABYLON.Color3.FromHexString("#000000");
  directionalLight2.includedOnlyMeshes = meshes;
  // directionalLight2.intensity = 0.1;

  // scene.add(new BABYLON.AmbientLight("hsl(0, 0, 40%)"));
  const hemiLight = new BABYLON.HemisphericLight(
    "HemiLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  hemiLight.diffuse = BABYLON.Color3.FromHexString("#ffffff");
  hemiLight.specular = BABYLON.Color3.FromHexString("#ffffff");
  hemiLight.ground = BABYLON.Color3.FromHexString("#000000");
  hemiLight.includedOnlyMeshes = meshes;
  hemiLight.intensity = 100;

  return [directionalLight, directionalLight2, hemiLight];
};

export const sketch2 = (scene, engine, camera, s2Bounds, updateReflection) => {
  const anchor = new BABYLON.Mesh("anchor", scene);
  const box = new BABYLON.MeshBuilder.CreateBox("box", {}, scene);
  // console.log("LOG palette: ", palette);
  const meshes = [];
  const displacements = [];

  let enteredBounds = false;

  const instanceCount = 20;
  const colorData = new Float32Array(4 * instanceCount);

  const makeColorBuffer = (colorData, instanceCount, palette) => {
    for (let i = 0; i < instanceCount; i++) {
      const color = BABYLON.Color3.FromHexString(random.pick(palette));
      colorData[i * 4 + 0] = color.r;
      colorData[i * 4 + 1] = color.g;
      colorData[i * 4 + 2] = color.b;
      colorData[i * 4 + 3] = 1.0;
    }

    const colorBuffer = new BABYLON.VertexBuffer(
      engine,
      colorData,
      BABYLON.VertexBuffer.ColorKind,
      false,
      false,
      4,
      true
    );

    return colorBuffer;
  };

  box.material = new BABYLON.StandardMaterial("box material", scene);
  // box.material.disableLighting = false;
  box.material.specularPower = 20;
  // box.material.specularTextureEnabled = false;
  box.material.diffuseColor = BABYLON.Color3.White();
  box.material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  box.material.ambientColor = new BABYLON.Color3(1, 1, 0);

  scene.ambientColor = new BABYLON.Color3(1, 1, 1);

  const processMesh = (mesh) => {
    mesh.position.set(
      random.range(-1, 1),
      random.range(-1, 1),
      random.range(-1, 1)
    );
    const scaleFactor = 0.5;
    mesh.scaling = new BABYLON.Vector3(
      random.range(-1, 1) * scaleFactor,
      random.range(-1, 1) * scaleFactor,
      random.range(-1, 1) * scaleFactor
    );
    mesh.alwaysSelectAsActiveMesh = true;
    meshes.push(mesh);
    displacements.push(random.range(-1, 1));

    mesh.parent = anchor;
  };

  const init = () => {
    box.setVerticesBuffer(
      makeColorBuffer(colorData, instanceCount, random.pick(palettes))
    );

    while (meshes.length > 0) {
      const mesh = meshes.pop();
      if (mesh.id !== "box") {
        mesh.dispose();
      }
    }
    displacements.length = 0;

    // Setup a mesh with geometry + material
    for (let i = 0; i < instanceCount - 1; i++) {
      const mesh = box.createInstance("box" + i);
      processMesh(mesh);
    }
    processMesh(box);
  };

  init();

  const lights = setupLights(scene, meshes);
  lights.forEach((light) => {
    light.parent = anchor;
  });

  const refresh = () => {
    init();
  };

  const zip = (arr1, arr2) => arr1.map((k, i) => [k, arr2[i]]);
  const enumerate = (arr) => arr.map((k, i) => [k, i]);

  const update = (time) => {
    enumerate(zip(meshes, displacements)).forEach(
      ([[mesh, displacement], i]) => {
        const speedFactor = 0.1 * ((i % 3) + 1);
        mesh.position.y = Math.sin(displacement + time * speedFactor) * 0.75;
      }
    );

    const localPoint = BABYLON.Vector3.TransformCoordinates(
      camera.position,
      s2Bounds.getWorldMatrix().clone().invert()
    );

    let rotation = camera.rotation.y % (2 * Math.PI);
    if (rotation < 0) {
      rotation += 2 * Math.PI;
    }

    if (intersectWithPoint(s2Bounds, localPoint)) {
      if (!enteredBounds && rotation > 2 && rotation < 4) {
        init();
        updateReflection(meshes);
        enteredBounds = true;
      }
    } else {
      enteredBounds = false;
    }
  };

  return {
    anchor,
    meshes,
    update,
  };
};

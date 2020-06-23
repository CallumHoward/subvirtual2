import * as BABYLON from "babylonjs";
import { rangeMap, intersectWithPoint } from "./utils";

export const sketch1 = (scene, camera, s1Bounds, setHue) => {
  const start = new BABYLON.Vector3(0, 0, 1);
  const end = new BABYLON.Vector3(0, 0, -3.5);
  const totalDistance = BABYLON.Vector3.Distance(start, end);
  let hue = 0;

  const textMesh = scene.meshes.find((e) => e.name === "S1Text");
  if (textMesh) {
    const textTexture = new BABYLON.DynamicTexture(
      "Dynamic Texture",
      { width: 512, height: 512 },
      scene,
      true
    );
    textTexture.hasAlpha = true;
    textTexture.anisotropicFilteringLevel = 8;
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

  const arrowMesh = scene.meshes.find((e) => e.name === "S1Arrow");
  if (arrowMesh) {
    const arrowTexture = new BABYLON.DynamicTexture(
      "Dynamic Texture",
      { width: 512, height: 512 },
      scene
    );
    arrowTexture.hasAlpha = true;
    const arrowContext = arrowTexture.getContext();

    const arrowMaterial = new BABYLON.StandardMaterial("Mat", scene);
    arrowMaterial.diffuseTexture = arrowTexture;
    arrowMaterial.disableLighting = true;
    arrowMesh.material = arrowMaterial;

    // Add arrow to dynamic texture
    const font = "bold 280px helvetica";
    arrowTexture.drawText("➔", 55, 335, font, "black", null, true, true);
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


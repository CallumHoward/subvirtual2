export const rangeMap = (value, start1, stop1, start2, stop2) => {
  if (value < start1) {
    return start2;
  }
  if (value >= stop1) {
    return stop2;
  }
  return ((value - start1) * (stop2 - start2)) / (stop1 - start1) + start2;
};

export const intersectWithPoint = (mesh, point) => {
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

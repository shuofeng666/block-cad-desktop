// hull.js

// Calculates cross product to determine point orientation
function cross(o, a, b) {
	return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }
  
  // Calculate upper tangent
  function upperTangent(points) {
	const upper = [];
	for (let i = 0; i < points.length; i++) {
	  while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
		upper.pop();
	  }
	  upper.push(points[i]);
	}
	upper.pop();
	return upper;
  }
  
  // Calculate lower tangent
  function lowerTangent(points) {
	const reversed = points.slice().reverse();
	const lower = [];
	for (let i = 0; i < reversed.length; i++) {
	  while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], reversed[i]) <= 0) {
		lower.pop();
	  }
	  lower.push(reversed[i]);
	}
	lower.pop();
	return lower;
  }
  
  // Calculate convex hull
  function convexHull(points) {
	points.sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  
	if (points.length <= 2) return points;
  
	const upper = upperTangent(points);
	const lower = lowerTangent(points);
  
	return lower.concat(upper).concat([points[0]]);
  }
  
  // Calculate concave hull
  export function hull(points, concavity = 20) {
	if (points.length < 4) {
	  return convexHull(points);
	}
  
	const hull = convexHull(points);
  
	function addPoint(hullPoints, allPoints, maxDist) {
	  let maxDistPoint = null;
	  let maxDistance = 0;
	  let insertIndex = -1;
  
	  for (let i = 0; i < hullPoints.length - 1; i++) {
		const a = hullPoints[i];
		const b = hullPoints[i + 1];
  
		for (let j = 0; j < allPoints.length; j++) {
		  const p = allPoints[j];
  
		  if (p === a || p === b) continue;
  
		  const dist = pointToLineDistance(p, a, b);
  
		  if (dist > maxDistance && isPointInside(p, a, b)) {
			maxDistance = dist;
			maxDistPoint = p;
			insertIndex = i + 1;
		  }
		}
	  }
  
	  if (maxDistance > maxDist && maxDistPoint) {
		hullPoints.splice(insertIndex, 0, maxDistPoint);
		addPoint(hullPoints, allPoints, maxDist);
	  }
  
	  return hullPoints;
	}
  
	function pointToLineDistance(p, a, b) {
	  const ab = [b[0] - a[0], b[1] - a[1]];
	  const ap = [p[0] - a[0], p[1] - a[1]];
	  const abLen = Math.sqrt(ab[0] ** 2 + ab[1] ** 2);
  
	  if (abLen === 0) return Math.sqrt(ap[0] ** 2 + ap[1] ** 2);
  
	  const proj = (ap[0] * ab[0] + ap[1] * ab[1]) / abLen;
  
	  if (proj < 0) return Math.sqrt(ap[0] ** 2 + ap[1] ** 2);
	  if (proj > abLen) return Math.sqrt((p[0] - b[0]) ** 2 + (p[1] - b[1]) ** 2);
  
	  return Math.abs(ap[0] * ab[1] - ap[1] * ab[0]) / abLen;
	}
  
	function isPointInside(p, a, b) {
	  const minX = Math.min(a[0], b[0]);
	  const maxX = Math.max(a[0], b[0]);
	  const minY = Math.min(a[1], b[1]);
	  const maxY = Math.max(a[1], b[1]);
  
	  return p[0] >= minX && p[0] <= maxX && p[1] >= minY && p[1] <= maxY;
	}
  
	hull.pop();
	const result = addPoint(hull, points, concavity);
	result.push(result[0]);
  
	return result;
  }
  
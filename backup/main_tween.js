let RED = 'rgba(255, 79, 73, 1)'
let BLUE ='rgba(107,174,255,1)';

function initTwojs(id){
	let elem = document.querySelector(id)
	let params = { width: 640, height: 250 };
	let two = new Two(params).appendTo(elem);
	two.renderer.domElement.setAttribute("viewBox", "0 0 " + String(params.width) + " " + String(params.height));
    two.renderer.domElement.removeAttribute("width");
    two.renderer.domElement.removeAttribute("height");

    return two;
}

function make2DAxes(x,y, canvas){
	let lineColor = "rgba(0, 0, 0, 1)";
	let lineWidth = 2;
	let gridSize = 200;
	let origin = {x:x+gridSize/2,y:y-gridSize/2};

	let line = canvas.makeLine(origin.x, y, x+ gridSize/2, y - gridSize);
	line.linewidth = lineWidth;
	line.stroke = lineColor;

	line = canvas.makeLine(x, origin.y, x + gridSize, y - gridSize/2);
	line.linewidth = lineWidth;
	line.stroke = lineColor;

	// Make grid 
	let spacing = 20;
	for(let X=x; X<=x+gridSize; X+=spacing){
		// Vertical lines
		line = canvas.makeLine(X, y, X, y - gridSize);
		line.linewidth = lineWidth;
		line.stroke = 'rgba(0, 0, 0, 0.2)';

		// Horizontal lines 
		let offset = X - x + y - gridSize; 
		line = canvas.makeLine(x, offset, x + gridSize, offset);
		line.linewidth = lineWidth;
		line.stroke = 'rgba(0, 0, 0, 0.2)';
	}

	return {size:gridSize,spacing:spacing,origin:origin}
}

function plotPoints(canvas, gridMeta, points, classes){
	let radius = 5;
	let circles = [];

	for(let p of points){
		let circle = canvas.makeCircle(0,0,radius);
		circle.fill = classes[circles.length];
		circle.stroke = 'none';

		circle.meta = gridMeta
		circle.data = p;
		circle.convertToWorldCoordinates = function(data){
			let final = [];
			final.push(data[0] * gridMeta.spacing + gridMeta.origin.x);
			final.push(data[1] * gridMeta.spacing + gridMeta.origin.y);
			return final
		}
		let finalCoords = circle.convertToWorldCoordinates(circle.data)
		circle.translation.x = finalCoords[0]
		circle.translation.y = finalCoords[1]

		circles.push(circle);
	}

	return circles;
}

function addVectors(v1,v2){
	let v3 = []
	for(let i = 0;i < v1.length; i++){
		v3.push(v1[i]+v2[i])
	}
	return v3;
}

function scaleVector(v,s){
	let v2 = []
	for(let i = 0;i < v.length;i++){
		v2.push(v[i]*s)
	}
	return v2;
}

function dot(v1,v2){
	let result = 0;
	for(let i = 0;i < v1.length; i++){
		result += v1[i] * v2[i]
	}
	return result
}

function project(point, basis){
	// Project a N dimensional point onto an N-k dimensional orthonormal basis
	// where k >= 0 

	// Initialize the vector
	let projectedVector = []
	for(let d of point){
		projectedVector.push(0)
	}
	// The projection formula (see https://www.cliffsnotes.com/study-guides/algebra/linear-algebra/real-euclidean-vector-spaces/projection-onto-a-subspace)
	for(let V of basis){
		let proj = scaleVector(V,dot(point,V))
		proj = scaleVector(proj, 1/dot(V,V))
		projectedVector = addVectors(projectedVector, proj)
	}
	
	return projectedVector;
}

document.addEventListener("DOMContentLoaded", function() {
	let two = initTwojs('#projection-2d')

	let gridMeta = make2DAxes(50,220,two);

	var x = 350;
	var y = 120;
	let line = two.makeLine(x, y, x + 200, y);
	line.stroke = 'rgba(0,0,0,1)'
	line.linewidth = 2;

	let data = [[0,0],[1,1],[-3,5],[2,-4],[-2,-2]]
	let classes = [RED,BLUE, BLUE,RED, RED]
	let points2D = plotPoints(two, gridMeta, data, classes)

	// Label axes
	let style = {weight:700, opacity: 0.7}
	two.makeText("Size", 150, 240, style);
	two.makeText("Age", 20, 120, style);

	// Project and draw 
	let newData = []
	for(let datum of data){
		newData.push(project(datum,[[1,0]]))	
	}
	let points1D = plotPoints(two, {size:gridMeta.size,spacing:gridMeta.spacing,origin:{x:x+100,y:y}} , newData, classes)

	// Tween points to their project positions 
	for(let i=0;i<points1D.length;i++){
		let point = points1D[i]
		let original = {y:points2D[i].translation.y}
		let projected = {y: point.translation.y}

		let tween = new TWEEN.Tween(point.translation)
			.to(original, 1000)
			.delay(1000)
			.easing(TWEEN.Easing.Quadratic.Out)
			.start();

		let tweenBack = new TWEEN.Tween(point.translation)
			.delay(1000)
			.easing(TWEEN.Easing.Quadratic.In)
			.to(projected, 1000)

		tween.chain(tweenBack)
		tweenBack.chain(tween)
	}
	
	

	function update(time){
		requestAnimationFrame(update);
		TWEEN.update(time);
		two.update();
	}
	requestAnimationFrame(update);
});
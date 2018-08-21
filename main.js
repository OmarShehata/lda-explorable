let RED = 'rgba(255, 79, 73, 1)';
let BLUE ='rgba(107,174,255,1)';
let ORANGE = 'rgba(244, 194, 66,1)';
let GREEN = 'rgba(rgb(107, 244, 65,1)';
let PURPLE = 'rgba(233, 88, 252,1)'

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

function make2DProjectionDiagram(canvas){
	let two = canvas; 

	let gridX = 90;
	let gridY = 210;
	let gridMeta = make2DAxes(gridX,gridY,two);

	let xOffset = 300;
	var x = gridX + xOffset;
	var y = gridY - 100;
	let line = two.makeLine(x, y, x + 200, y);
	line.stroke = 'rgba(0,0,0,1)'
	line.linewidth = 2;

	let defaultData = [[0,0],[1,1],[-3,5],[2,-4],[-2,-2]]
	let defaultClasses = [RED,BLUE, BLUE,RED, RED]

	// Label axes
	let style = {weight:700, opacity: 0.7, size: 13}
	let xText = two.makeText("Size", 170, 240, style);
	let yText = two.makeText("Age", 30, y, style);

	let projectionBasis = [[1,0]]
	let points1D = [];
	let points2D = [];

	function updateData(data, classes){
		if(points1D.length != 0){
			for(let p of points1D){
				two.remove(p)
			}
		}
		if(points2D.length != 0){
			for(let p of points2D){
				two.remove(p)
			}
		}

		// Plot original data
		points2D = plotPoints(two, gridMeta, data, classes)
		// Project 
		let newData = []
		for(let datum of data){
			newData.push(project(datum,projectionBasis))	
		}
		// Plot projection
		points1D = plotPoints(two, {size:gridMeta.size,spacing:gridMeta.spacing,origin:{x:x+gridMeta.size/2,y:y}} , newData, classes)

		// Tween points to their projected positions 
		for(let i=0;i<points2D.length;i++){
			let point = points2D[i]
			let projected = {x: points1D[i].translation.x - xOffset, y: points1D[i].translation.y}

			point.setTween = function(target, initialDelay){
				this.tween = new TWEEN.Tween(this.translation)
					.to(target, 700)
					.delay(2000)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.repeat(Infinity)
					.yoyo(true)
					.start();
			}
			point.original = {x: point.translation.x, y: point.translation.y}
			point.resetPosition = function(){
				this.translation.x = this.original.x; 
				this.translation.y = this.original.y;
			}

			point.setTween(projected)
		}
	}

	function updateLabels(xLabel, yLabel){
		xText.value = xLabel
		yText.value = yLabel
	}

	updateData(defaultData, defaultClasses)

	// Create invisible point at (0,0) to find out where the origin is in DOM coordinates 
	let origin = two.makeCircle(gridMeta.origin.x, gridMeta.origin.y,5);
	origin.fill = 'none';
	origin.stroke = 'none';
	
	// Projection line 
	let projectionLine = two.makeLine(gridX-20, gridY - gridMeta.size/2, gridX + gridMeta.size + 20, gridY - gridMeta.size/2);
	projectionLine.stroke = 'rgba(244, 185, 95, 1)'
	two.update();

	projectionLine._renderer.elem.style['stroke-dasharray'] = 2
	projectionLine.linewidth = 3;	
	xText._renderer.elem.style['user-select'] = 'none';
	yText._renderer.elem.style['user-select'] = 'none';

	let cPoint = two.renderer.domElement.createSVGPoint();
	cPoint.getDOMCoordinates = function(x,y){
		this.x = x; 
		this.y = y; 
		return this.matrixTransform(two.renderer.domElement.getScreenCTM().inverse())
	}
	
	let isTouching = false;
	let mousePos = {x:0,y:0};

	function mouseDown(e){
		isTouching = true;
	}
	function mouseUp(e){
		isTouching = false;
	}
	function touchStart(e){
		mousePos.x = e.touches[0].clientX; 
		mousePos.y = e.touches[0].clientY;
		isTouching = true;
	}
	function touchEnd(e){
		isTouching = false;
	}
	function touchCancel(e){
		isTouching = false;
	}
	function mouseMove(e){
		mousePos.x = e.clientX; 
		mousePos.y = e.clientY;
	}

	two.renderer.domElement.addEventListener('mousedown', mouseDown)
	two.renderer.domElement.addEventListener('mouseup', mouseUp)
	two.renderer.domElement.addEventListener('touchstart', touchStart)
	two.renderer.domElement.addEventListener('touchend', touchEnd)
	two.renderer.domElement.addEventListener('touchcancel', touchCancel)
	two.renderer.domElement.addEventListener('mousemove', mouseMove)

	function update(time){
		requestAnimationFrame(update);
		TWEEN.update(time);
		two.update();

		if(isTouching){
			let newMouse = cPoint.getDOMCoordinates(mousePos.x, mousePos.y)

			let dx = newMouse.x - gridMeta.origin.x;
			let dy = newMouse.y - gridMeta.origin.y; 
			let dist = Math.sqrt(dx * dx + dy * dy);
			dx /= dist; 
			dy /= dist;

			// Update projected points 
			for(let i=0; i< points2D.length; i++){
				let p = points2D[i]
				// Cancel tween for each of points2D
				p.resetPosition()
				p.tween.stop()
				// Re-project
				projectionBasis = [[dx, dy]]
				let newProjection = project(p.data, projectionBasis)
				let newCoords = points1D[i].convertToWorldCoordinates(newProjection)
				// Create new tween
				p.setTween({x: newCoords[0] - xOffset, y: newCoords[1] }) 
				// Divide (x,y) by the basis (it must be a scalar multiple) to get the new (x,0) coordinate 
				newProjection[0] = newProjection[0] / dx
				// update points1D
				newCoords = points1D[i].convertToWorldCoordinates([newProjection[0],0])
				points1D[i].translation.x = newCoords[0]
			}

			projectionLine.vertices[0].set(dx * 120, dy * 120)
			projectionLine.vertices[1].set(-dx * 120, -dy * 120)
		}
	}
	requestAnimationFrame(update);

	return {updateData:updateData, updateLabels: updateLabels};
}

document.addEventListener("DOMContentLoaded", function() {
	let two = initTwojs('#projection-2d')

	fetch("data/sample-simple-2d.csv")
    .then(res => res.blob())
    .then(res => {
    	Papa.parse(res, {
			complete: function(results) {
				let diagram = make2DProjectionDiagram(two);

				// Get headers 
				let header = results.data.shift()
				diagram.updateLabels(header[0],header[1])

				let availableClasses = [RED, BLUE, ORANGE, GREEN, PURPLE]
				let classDict = {}
				let classes = []
				let data = []
				// Assume the first 2 are data, and the third is class
				for(let datum of results.data){
					let d_class = datum[2].trim()
					if(classDict[d_class] == undefined){
						classDict[d_class] = availableClasses.shift()
					}
					classes.push(classDict[d_class])
					data.push(datum.slice(0,2))
				}

				diagram.updateData(data, classes);
			}
		});
    })
	
});
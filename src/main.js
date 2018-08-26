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
		// (-4, 2) for basis [1,0]
		// (-4 * x + 2 * y)
		// 
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

	let projectionBasis = [[1,0]]//[[0.623,-0.782]]
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
			let nDatum = project(datum,projectionBasis)
			nDatum[1] = 0
			nDatum[0] /= projectionBasis[0][0]
			newData.push(nDatum)	
		}
		// Plot projection
		points1D = plotPoints(two, {size:gridMeta.size,spacing:gridMeta.spacing,origin:{x:x+gridMeta.size/2,y:y}} , newData, classes)

		// Tween points to their projected positions 
		for(let i=0;i<points2D.length;i++){
			let point = points2D[i]
			let nDatum = project(point.data, projectionBasis)
			let newCoords = point.convertToWorldCoordinates(nDatum)
			let projected = {x:newCoords[0], y: newCoords[1]}  //{x: points1D[i].translation.x - xOffset, y: points1D[i].translation.y}

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
	projectionLine.updateAngle = function(vector, normalized){
		let x = vector[0]
		let y = vector[1]
		if(!normalized){
			let dx = x - gridMeta.origin.x;
			let dy = y - gridMeta.origin.y; 
			let dist = Math.sqrt(dx * dx + dy * dy);
			dx /= dist; 
			dy /= dist;
			x = dx; 
			y = dy;
		} 
		
		projectionLine.vertices[0].set(x * 120, y * 120)
		projectionLine.vertices[1].set(-x * 120, -y * 120)

		return [x,y]
	}
	projectionLine.updateAngle(projectionBasis[0], true)
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

	let element = two.renderer.domElement.parentNode;
	element.addEventListener('mousedown', mouseDown)
	element.addEventListener('mouseup', mouseUp)
	element.addEventListener('touchstart', touchStart)
	element.addEventListener('touchend', touchEnd)
	element.addEventListener('touchcancel', touchCancel)
	element.addEventListener('mousemove', mouseMove)

	two.renderer.domElement.style['pointer-events'] = 'none';

	function updateProjection(Vector, normalized){
		let vector = projectionLine.updateAngle(Vector, normalized)

		// Update projected points 
		for(let i=0; i< points2D.length; i++){
			let p = points2D[i]
			// Cancel tween for each of points2D
			p.resetPosition()
			p.tween.stop()
			// Re-project
			projectionBasis = [vector]
			let newProjection = project(p.data, projectionBasis)
			let newCoords = points1D[i].convertToWorldCoordinates(newProjection)
			// Create new tween
			p.setTween({x: newCoords[0] - xOffset, y: newCoords[1] }) 
			// Divide (x,y) by the basis (it must be a scalar multiple) to get the new (x,0) coordinate 
			newProjection[0] = newProjection[0] / vector[0]
			// update points1D
			newCoords = points1D[i].convertToWorldCoordinates([newProjection[0],0])
			points1D[i].translation.x = newCoords[0]
		}
	}

	function update(time){
		requestAnimationFrame(update);
		TWEEN.update(time);
		two.update();

		if(isTouching){
			let newMouse = cPoint.getDOMCoordinates(mousePos.x, mousePos.y)

			updateProjection([newMouse.x, newMouse.y])
			
		}
	}
	requestAnimationFrame(update);

	function getProjectionBasis(){
		return projectionBasis
	}



	return {updateData:updateData, updateLabels: updateLabels, updateProjection: updateProjection, getProjectionBasis: getProjectionBasis};
}

function parse2DData(papaResults){
	let results = papaResults

	// Get headers 
	let header = results.data.shift()
	

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


	return {header:header, data:data, classes: classes}
}

document.addEventListener("DOMContentLoaded", function() {
	let two = initTwojs('#projection-2d')

	fetch("data/sample-2d.csv")
    .then(res => res.blob())
    .then(res => {
    	Papa.parse(res, {
			complete: function(results) {
				let diagram = make2DProjectionDiagram(two);
				window.diagram = diagram

				let csvData = parse2DData(results)
				let header = csvData.header 

				let LDA = new LinearDiscriminantAnalysis();
				LDA.fit(csvData.data, csvData.classes)

				diagram.updateLabels(header[0],header[1])
				diagram.updateData(csvData.data, csvData.classes);

				let basis = diagram.getProjectionBasis()
				let tween = new TWEEN.Tween({x:basis[0][0], y: basis[0][1]})
					.to({x:0.62, y: -0.78}, 2000)
					.delay(1000)
					.easing(TWEEN.Easing.Quadratic.InOut)
	 				.start()
	 				.onUpdate(function(value){
	 					let vector = [value.x,value.y]
	 					let scale = 1/dot(vector,vector)
	 					vector = scaleVector(vector,scale)
	 					diagram.updateProjection(vector, true)
	 				})
			}
		});
    })
	
});

function dragOverHandler(ev) {
	if(!ev.currentTarget.classList.contains('highlight')){
		ev.currentTarget.classList.toggle('highlight')
	}  

 	ev.preventDefault();
}

function dragLeaveHandler(ev) {
	if(ev.currentTarget.classList.contains('highlight')){
		ev.currentTarget.classList.toggle('highlight')
	}  
}

function removeDragData(ev) {
  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to remove the drag data
    ev.dataTransfer.items.clear();
  } else {
    // Use DataTransfer interface to remove the drag data
    ev.dataTransfer.clearData();
  }
}

function processFile(file){
	var reader = new FileReader();
	reader.onload = function(e) { 
	  var contents = e.target.result;
	  Papa.parse(contents, {
	  	complete: function(results){
	  		let csvData = parse2DData(results)
			let header = csvData.header 

			let diagram = window.diagram
			diagram.updateLabels(header[0],header[1])
			diagram.updateData(csvData.data, csvData.classes);
	  	}
	  })
	}
	reader.readAsText(file);
}

function dropHandler(ev) {
	//See https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === 'file') {
        var file = ev.dataTransfer.items[i].getAsFile();
        processFile(file)
        break; // Only care about one file
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    processFile(ev.dataTransfer.files[0])
  } 
  
  removeDragData(ev)
  dragLeaveHandler(ev)
}
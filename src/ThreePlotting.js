class ThreePlotting {
  constructor(canvas, width, height) {
	this.scene = new THREE.Scene();
	let scene = this.scene;
	this.camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
	this.camera.position.set(5,10,20);
	this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
	this.renderer.setClearColor(0xffffff);
	this.renderer.setSize( width, height );
	canvas.width = width; 
	canvas.height = height;
	canvas.style.width = '50%';
	canvas.style.height = 'auto';

	this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
	this.controls.enableKeys  = false; 	

	scene.add(this.createGrid("XZ")); 
	scene.add(this.createAxis("X")); 
	scene.add(this.createAxis("Y")); 
	scene.add(this.createAxis("Z"));

	this.xLabel = this.createLabel("X",12,0,0);
	this.yLabel = this.createLabel("Y",0,12,0);
	this.zLabel = this.createLabel("Z",0,0,12);

	scene.add(this.xLabel);
	scene.add(this.yLabel);
	scene.add(this.zLabel);

	this.addLights(scene);

	let plane = this.createPlane();
	scene.add(plane);
	this.plane = plane;

	let that = this;
	this.isKeyPressed = {};
	document.addEventListener("keydown", function(event){
		that.onDocumentKeyDown(event,that)
	}, false);
	document.addEventListener("keyup", function(event){
		that.onDocumentKeyUp(event,that)
	}, false);

	this.points = [];
  }

  update() {
  	this.renderer.render(this.scene, this.camera);
  	this.movementUpdate();
  }

  updateData(data, classes) {
  	for(let point of this.points) {
  		this.scene.remove(point);
  	}

  	this.points = [];

    let m1 = new THREE.Matrix4().makeRotationX(-Math.PI/4);
    let m2 = new THREE.Matrix4().makeRotationY(0)
    let m3 = new THREE.Matrix4().makeRotationZ(0)
    let m = new THREE.Matrix4();
    m.multiplyMatrices(m1,m2);
    m.multiply(m3)

  	// Plot points in 3D
  	let processedData = [];
    let newString = "";

  	for(let datumRaw of data) {
  		let datum = []
  		for(let num of datumRaw) {
  			datum.push(Number(num));
  		}
  		processedData.push(datum);

		let geometry = new THREE.SphereGeometry( 0.5, 16, 16 );
		let material = new THREE.MeshBasicMaterial({ color: classes[this.points.length] });
		let sphere = new THREE.Mesh( geometry, material );
		this.scene.add( sphere );
		this.points.push(sphere);
		
		sphere.position.x = datum[0];
		sphere.position.y = datum[1];
		sphere.position.z = datum[2];	
		sphere.originalPosition = sphere.position.clone();

    let newPos = sphere.position.clone().applyMatrix4(m);
    let c = 0;
    if(this.points.length > 4) {
      c = 1;
    }
    if(this.points.length > 8) {
      c = 2;
    }
    newString += newPos.x.toFixed(2) + "," + newPos.y.toFixed(2) + "," + newPos.z.toFixed(2) + "," + c + '\n';
  	}
    //console.log(newString)

  	this.originalData = processedData; 
  	this.classes = classes;

  	this.projectPoints();
  }

  updateLabels(labels) {
  	this.xLabel.updateText(labels['X']);
  	this.yLabel.updateText(labels['Y']);
  	this.zLabel.updateText(labels['Z']);
  }

  getQuaternionFromBasis(newBasis) {
    let M = new THREE.Matrix4();

    // v2 and v3 are swapped because the plane at rotation 0 is the XZ plane, not the XY plane. 
    let v1 = newBasis.v1; 
    let v2 = newBasis.v3;
    let v3 = newBasis.v2;
    
    let xAxis = new THREE.Vector3(v1.x, v1.y, v1.z);
    let yAxis = new THREE.Vector3(v2.x, v2.y, v2.z);
    let zAxis = new THREE.Vector3(v3.x, v3.y, v3.z);
    
    M.makeBasis(xAxis, yAxis, zAxis)

    let targetQuaternion = new THREE.Quaternion()
    let pos = new THREE.Vector3()
    let scale = new THREE.Vector3()

    M.decompose(pos, targetQuaternion, scale);

    return targetQuaternion;
  }

  movementUpdate() {
  	let rotationSpeed = 0.04;
  	let plane = this.plane;
  	let change = false;

  	if (this.isKeyPressed['A']) {
  		plane.rotation.y += rotationSpeed;
  		change = true;
  	}

  	if (this.isKeyPressed['D']) {
  		plane.rotation.y -= rotationSpeed;
  		change = true;
  	}

  	if (this.isKeyPressed['W']) {
  		plane.rotation.x += rotationSpeed;
  		change = true;
  	}

  	if (this.isKeyPressed['S']) {
  		plane.rotation.x -= rotationSpeed;
  		change = true;
  	}

  	if (this.isKeyPressed['Q']) {
  		plane.rotation.z += rotationSpeed;
  		change = true;
  	}

  	if (this.isKeyPressed['E']) {
  		plane.rotation.z -= rotationSpeed;
  		change = true;
  	}

  	if(change) {
  		this.projectPoints(true);
  	}
  	
  }

  getCurrentBasis() {
    let v1 = new THREE.Vector3(1,0,0);
    let v2 = new THREE.Vector3(0,0,1);
    v1 = v1.applyMatrix4(this.plane.matrix);
    v2 = v2.applyMatrix4(this.plane.matrix);
    let basis = [[v1.x,v1.y,v1.z],[v2.x,v2.y,v2.z]];
    return basis;
  }

  projectPoints(doTween) {
  	if(!this.originalData) return;

  	let mathlib = new MathLibrary();
  	let points2D = [];

  	let basis = this.getCurrentBasis();
  	
  	let inverse = this.plane.matrix.getInverse(this.plane.matrix);

  	for(let datum of this.originalData) {
  		let projectedPoint = mathlib.project(datum,basis);
  		let originalPoint = this.points[points2D.length];
  		
  		let vector2D = new THREE.Vector3(projectedPoint[0], projectedPoint[1], projectedPoint[2]);
  		vector2D = vector2D.applyMatrix4(inverse);
  		// Flip the Y because in 2D the Y axis is flipped 
  		points2D.push([vector2D.x, vector2D.z]);

  		if (doTween) {
  			originalPoint.position.x = originalPoint.originalPosition.x;
  			originalPoint.position.y = originalPoint.originalPosition.y;
  			originalPoint.position.z = originalPoint.originalPosition.z;
  			if(originalPoint.tween){
  				originalPoint.tween.stop();
  			}
	  		originalPoint.tween = new TWEEN.Tween(originalPoint.position)
						.to({x:projectedPoint[0], y:projectedPoint[1], z:projectedPoint[2]}, 700)
						.delay(400)
						.easing(TWEEN.Easing.Quadratic.InOut)

			originalPoint.tween.chain(
				new TWEEN.Tween(originalPoint.position)
					.to(originalPoint.originalPosition,700)
					.delay(1000)
					.easing(TWEEN.Easing.Quadratic.InOut)
				)	
			originalPoint.tween.start();
  		}
  	}

  	this.projectionCallback(points2D,this.classes);


  }

  onDocumentKeyUp(event,that) {
  	let keyCode = event.which; 
  	let keys = {'A':65,'D':68,'W':87,'S':83,'Q':81,'E':69,
                'J':74,'L':76,'I':73,'K':75,'U':85,'O':79};

    for(var key in keys) {
      if(keyCode == keys[key]) {
        that.isKeyPressed[key] = false;
      }
    }

  }

  onDocumentKeyDown(event,that) {
  	let keyCode = event.which; 
  	let keys = {'A':65,'D':68,'W':87,'S':83,'Q':81,'E':69,
                'J':74,'L':76,'I':73,'K':75,'U':85,'O':79};

  	for(var key in keys) {
      if(keyCode == keys[key]) {
        that.isKeyPressed[key] = true;
      }
    }

  }

  addLights(scene) {
  	let light = new THREE.AmbientLight( 0xffffff, 0.8 ); // soft white light
	scene.add( light );
  }

  createPlane() {
  	let v1 = new THREE.Vector3( 10, 0, 10 );
	let v2 = new THREE.Vector3( -10, 0, 10 );
	let v3 = new THREE.Vector3( -10, 0, -10 );
	let v4 = new THREE.Vector3( 10, 0, -10 );

	let geometry = new THREE.Geometry();
	geometry.vertices.push( v1 );
	geometry.vertices.push( v2 );
	geometry.vertices.push( v3 );
	geometry.vertices.push( v4 );
	geometry.faces.push(new THREE.Face3(0,1,2));
	geometry.faces.push(new THREE.Face3(2,3,0));

	let material = new THREE.MeshPhongMaterial({ color: '#e59a1c', flatShading:true, transparent:true, opacity:0.25, side:THREE.DoubleSide} );
	let mesh = new THREE.Mesh( geometry, material );

	return mesh;
  }

  createGrid(plane) {
  	let size = 20;
	let divisions = 10;
	let gridHelper = new THREE.GridHelper(size,divisions,0x444444,0xd0d0d0);

	if (plane=="XY"){
		gridHelper.rotation.x = Math.PI/2;
	} else if (plane=="YZ") {
		gridHelper.rotation.z = Math.PI/2;
	}

	return gridHelper;
  }

  createAxis(axis) {
  	let coneRadius = 0.2;
	let coneHeight = 0.5;
	let coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 32);
	coneGeometry.translate(0,10.2,0); // move cone to tip of cylinder

	let cylinderRadius = 0.05;
	let cylinderHeight = 20;
	let cylinderGeometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, 32);

	cylinderGeometry.merge(coneGeometry); // combine the cone and cylinder
	let material = new THREE.MeshBasicMaterial( {color: 0x000000} );
	let cylinder = new THREE.Mesh( cylinderGeometry, material );

	// axis is already positioned to be the Y axis,
	// but for other axis...
	if(axis == "X") {
		cylinder.rotateZ(-Math.PI/2);
	} else if (axis == "Z") {
		cylinder.rotateX(Math.PI/2);
	} else if (axis == "W") {
		// a bit confusing, but it is the not the point of the
		// axis that looks at the point, it is the edge
		cylinder.lookAt(new THREE.Vector3(10, -10, -10));
	}

	return cylinder;
  }

  createLabel(message, x, y, z) {
  	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');
	ctx.font = "40px Arial";
	ctx.fillText( message, canvas.width/2, canvas.height/2);

	// canvas contents will be used for a texture
	let texture = new THREE.Texture(canvas)
	texture.needsUpdate = true;

	let material = new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
	material.transparent = true; 

	let ratio = canvas.height / canvas.width; 
	let W = 7;
	let H = W * ratio;

	let mesh = new THREE.Mesh(new THREE.PlaneGeometry(W,H),material);
	mesh.position.set(x,y,z);
	mesh.ctx = ctx;
	mesh.canvas = canvas;

	mesh.updateText = function(newText) {
		this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
		this.ctx.fillText( newText, this.canvas.width/2, this.canvas.height/2);
		this.material.map.needsUpdate = true;
	}

	return mesh;
  }
}
  
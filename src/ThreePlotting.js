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

	scene.add(this.createLabel("X",12,0,0));
	scene.add(this.createLabel("Y",0,12,0));
	scene.add(this.createLabel("Z",0,0,12));

	this.addLights(scene);

	let plane = this.createPlane();
	scene.add(plane);
	plane.rotation.x = Math.PI/2;
	this.plane = plane;

	let that = this;
	this.isKeyPressed = {};
	document.addEventListener("keydown", function(event){
		that.onDocumentKeyDown(event,that)
	}, false);
	document.addEventListener("keyup", function(event){
		that.onDocumentKeyUp(event,that)
	}, false);

	// TODO: Read CSV and plot the points with color as class

	// TODO: Project points mathematically, tween them to this position on move 

	// TODO: Draw the points in 2D 
  }

  update() {
  	this.renderer.render(this.scene, this.camera);
  	this.movementUpdate();
  }

  movementUpdate() {
  	let rotationSpeed = 0.04;
  	let plane = this.plane;
  	if (this.isKeyPressed['A']) {
  		plane.rotation.x += rotationSpeed;
  	}

  	if (this.isKeyPressed['D']) {
  		plane.rotation.x -= rotationSpeed;
  	}

  	if (this.isKeyPressed['W']) {
  		plane.rotation.y += rotationSpeed;
  	}

  	if (this.isKeyPressed['S']) {
  		plane.rotation.y -= rotationSpeed;
  	}

  	if (this.isKeyPressed['Q']) {
  		plane.rotation.z += rotationSpeed;
  	}

  	if (this.isKeyPressed['E']) {
  		plane.rotation.z -= rotationSpeed;
  	}
  }

  onDocumentKeyUp(event,that) {
  	let keyCode = event.which; 
  	let keys = {'A':65,'D':68,'W':87,'S':83,'Q':81,'E':69};

  	if (keyCode == keys['A']) {
  		that.isKeyPressed['A'] = false;
  	}

  	if (keyCode == keys['D']) {
  		that.isKeyPressed['D'] = false;
  	}

  	if (keyCode == keys['W']) {
  		that.isKeyPressed['W'] = false;
  	}

  	if (keyCode == keys['S']) {
  		that.isKeyPressed['S'] = false;
  	}

  	if (keyCode == keys['Q']) {
  		that.isKeyPressed['Q'] = false;
  	}

  	if (keyCode == keys['E']) {
  		that.isKeyPressed['E'] = false;
  	}

  }

  onDocumentKeyDown(event,that) {
  	let keyCode = event.which; 
  	let keys = {'A':65,'D':68,'W':87,'S':83,'Q':81,'E':69};

  	if (keyCode == keys['A']) {
  		that.isKeyPressed['A'] = true;
  	}

  	if (keyCode == keys['D']) {
  		that.isKeyPressed['D'] = true;
  	}

  	if (keyCode == keys['W']) {
  		that.isKeyPressed['W'] = true;
  	}

  	if (keyCode == keys['S']) {
  		that.isKeyPressed['S'] = true;
  	}

  	if (keyCode == keys['Q']) {
  		that.isKeyPressed['Q'] = true;
  	}

  	if (keyCode == keys['E']) {
  		that.isKeyPressed['E'] = true;
  	}

  }

  addLights(scene) {
  	var light = new THREE.AmbientLight( 0xffffff, 0.8 ); // soft white light
	scene.add( light );
  }

  createPlane() {
  	var v1 = new THREE.Vector3( 10, 0, 10 );
	var v2 = new THREE.Vector3( -10, 0, 10 );
	var v3 = new THREE.Vector3( -10, 0, -10 );
	var v4 = new THREE.Vector3( 10, 0, -10 );

	var geometry = new THREE.Geometry();
	geometry.vertices.push( v1 );
	geometry.vertices.push( v2 );
	geometry.vertices.push( v3 );
	geometry.vertices.push( v4 );
	geometry.faces.push(new THREE.Face3(0,1,2));
	geometry.faces.push(new THREE.Face3(2,3,0));

	var material = new THREE.MeshPhongMaterial({ color: '#e59a1c', flatShading:true, transparent:true, opacity:0.25, side:THREE.DoubleSide} );
	var mesh = new THREE.Mesh( geometry, material );

	return mesh;
  }

  createGrid(plane) {
  	var size = 20;
	var divisions = 20;
	var gridHelper = new THREE.GridHelper(size,divisions,0x444444,0xd0d0d0);

	if (plane=="XY"){
		gridHelper.rotation.x = Math.PI/2;
	} else if (plane=="YZ") {
		gridHelper.rotation.z = Math.PI/2;
	}

	return gridHelper;
  }

  createAxis(axis) {
  	var coneRadius = 0.2;
	var coneHeight = 0.5;
	var coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 32);
	coneGeometry.translate(0,10.2,0); // move cone to tip of cylinder

	var cylinderRadius = 0.05;
	var cylinderHeight = 20;
	var cylinderGeometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, 32);

	cylinderGeometry.merge(coneGeometry); // combine the cone and cylinder
	var material = new THREE.MeshBasicMaterial( {color: 0x000000} );
	var cylinder = new THREE.Mesh( cylinderGeometry, material );

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
  	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');
	ctx.font = "40px Arial";
	ctx.fillText( message, canvas.width/2, canvas.height/2);

	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas)
	texture.needsUpdate = true;

	var material = new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
	material.transparent = true; 

	var ratio = canvas.height / canvas.width; 
	var W = 7;
	var H = W * ratio;

	var mesh = new THREE.Mesh(new THREE.PlaneGeometry(W,H),material);
	mesh.position.set(x,y,z);
	mesh.ctx = ctx;
	mesh.canvas = canvas;

	return mesh;
  }
}
  
class MathLibrary {
	addVectors(v1,v2){
		let v3 = []
		for(let i = 0;i < v1.length; i++){
			v3.push(v1[i]+v2[i])
		}
		return v3;
	}

	scaleVector(v,s){
		let v2 = []
		for(let i = 0;i < v.length;i++){
			v2.push(v[i]*s)
		}
		return v2;
	}

	dot(v1,v2){
		let result = 0;
		for(let i = 0;i < v1.length; i++){
			result += v1[i] * v2[i]
		}
		return result
	}

	project(point, basis){
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
			let proj = this.scaleVector(V,this.dot(point,V))
			proj = this.scaleVector(proj, 1/this.dot(V,V))
			projectedVector = this.addVectors(projectedVector, proj)
		}
		
		return projectedVector;
	}
}
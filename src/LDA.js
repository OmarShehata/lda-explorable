class LinearDiscriminantAnalysis {
  _compute_cov_matrix(columns){
    let cov = []
    for(let r=0;r<columns.length;r++){
        let newRow = []
        for(let c=0;c<columns.length;c++){
          let col1 = columns[r];
          let col2 = columns[c];

          let covariance = numbers.statistic.covariance(col1, col2);
          newRow.push(covariance)
        }
        cov.push(newRow)
      }
    return cov;
  }

  fit(Features, Classes){
  	// Separate out classes 
    let featuresByClass = {}
    for(let i=0;i<Features.length;i++){
      if(featuresByClass[Classes[i]] == undefined){
        featuresByClass[Classes[i]] = []
      }
      featuresByClass[Classes[i]].push(Features[i])
    }

  	// Compute covariance for each class
    let covByClass = {}
    let totalColumns = []
    for(let key in featuresByClass){
      let values = featuresByClass[key]
      // Split into columns 
      let columns = []
      for(let i=0;i<values[0].length;i++) columns.push([])
      for(let val of values){
        for(let i=0;i<val.length;i++){
          let finalVal = Number(val[i])
          columns[i].push(finalVal)
          if(totalColumns[i] == undefined) totalColumns[i] = []
          totalColumns[i].push(finalVal)
        }
      }
      // Compute covariance matrix 
      let cov = this._compute_cov_matrix(columns)
      covByClass[key] = cov
    }

  	// Compute average covariance 
    let avgCov = []
    let totalNum = 0;
    for(let key in covByClass){
      let cov = covByClass[key]
      totalNum ++;
      // Initialize with 0's
      if(avgCov.length == 0){
        for(let i=0;i<cov.length;i++){
          let newRow = []
          for(let j=0;j<cov.length;j++){
            newRow.push(0)
          }
          avgCov.push(newRow)
        }
      }
      // Sum 
      for(let r=0;r<cov.length;r++){
        for(let c=0;c<cov.length;c++){
          avgCov[c][r] += cov[c][r]
        }
      }
    }

    // Divide 
    for(let r=0;r<avgCov.length;r++){
      for(let c=0;c<avgCov.length;c++){
        avgCov[c][r] /= totalNum
      }
    }

    // Compute total covariance 
    let totalCovariance = this._compute_cov_matrix(totalColumns);

  	let Sw = avgCov;// average covariance 
  	let St = totalCovariance;//total covariance of all features 
  	let Sb = numeric.sub(St,Sw);

  	// Compute eigenvectors 
    // This is rather tricky because the right way to do it is eig(Sb, Sw)
    // (https://github.com/scipy/scipy/blob/v1.1.0/scipy/linalg/decomp.py#L118-L267)
    // but numeric doesn't support that! What this does is solve
    // (Sb)x = Lambda (Sw) x 
    // So instead, we bring (Sw) to the other side 
    // (Sw)^-1 (Sb) x = Lambda x 
    // But I think this only works if Sw has an inverse
    // See also http://fourier.eng.hmc.edu/e161/lectures/algebra/node7.html
    let S = numeric.dot(numeric.inv(Sw),Sb); 
    let eigen = numeric.eig(S)

    let evecs = []
    for(let i=0;i<eigen.E.x.length;i ++){
      let column = []
      for(let j=0;j<eigen.E.x.length;j++){
        column.push(eigen.E.x[j][i])
      }
      evecs.push({column:column, value: eigen.lambda.x[i]})
    }

  	// Sort eigenvectors by eigenvalues 
    evecs.sort(function(a,b){ return a.value < b.value })

  	this.scalings = [];
    for(let v of evecs){
      this.scalings.push(v.column)
    }

  }

  getReducedScalings() {
    return this.scalings;
  }

}
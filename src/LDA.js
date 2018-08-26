class LinearDiscriminantAnalysis {
  constructor(n_components) {
  	this.n_components = n_components || 1;
  }
  
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
    let S = numeric.dot(numeric.inv(Sw),Sb);
    let eigen = numeric.eig(S)
    console.log(eigen)
  	// Sort eigenvectors by eigenvalues 

  	//this.scalings = eigenvectors;
  }

  fit_transform(Features, Classes){
  	// Call fit 
  	// 0 out columns after the first n_components
  	// Multiply the features as a matrix by the scalings 
  	// return the new projected features
  }
}
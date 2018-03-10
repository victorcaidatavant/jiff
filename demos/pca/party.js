var BigNumber = require('bignumber.js');
var numeric = require('numeric/numeric-1.2.6');
var jiff_instance;

/**
* 
* @param items An array of items.
* @param fn A function that accepts an item from the array and returns a promise.
* @returns {Promise}
*/
function forEachPromise(items, fn) {
  return items.reduce(function (promise, item) {
      return promise.then(function () {
          return fn(item);
      });
  }, Promise.resolve());
}

function logItem(item) {
    return new Promise((resolve, reject) => {
        process.nextTick(() => {
            console.log(item);
            resolve();
        })
    });
}
// element-wise subtraction of arrays of the same length
function subtractArrays(arr1, arr2){
    result = []
    for (var i = 0; i < arr1.length; i++){
      result.push(arr1[i] - arr2[i]);
    }
    return result;
  }

function print2DArray(arr){
    result = "";
    arr.map(function(row){
      result += `[${row}] <br>`;
    });
    return result;
  }

var options = {party_count: 2, Zp: new BigNumber(32416190071), offset: 100, bits: 8, digits: 2 };
options.onConnect = function() {
	console.log("i'm in onConnect")
  	var pca_sum = [];

  	var arr_sum = [];
    var arr = [Math.floor(2.0), Math.floor(3.0), Math.floor(4.0)];


    arr.map(function(item){
      var shares = jiff_instance.share(item);
      var sum = shares[1];
      for(var i = 2; i <= jiff_instance.party_count; i++){
        sum = sum.sadd(shares[i]);
      }
      console.log(sum);
      arr_sum.push(sum.open_to_promise().then(success, failure)); 
    });
    console.log("1")

    Promise.all(arr_sum).then(function(results){
          var mean = results.map(function(item){
            return item/jiff_instance.party_count;
          });
          
          //arr = math.matrix(arr);
          //mean = math.matrix(mean);
          console.log("local arr = " + arr);
          diff = [subtractArrays(arr, mean)];

          
          diff_T = numeric.transpose(diff);
          console.log("arr = " + arr);
          console.log("mean = " + mean);
          console.log(diff);
          console.log(diff_T);


          var scatter = numeric.dot(diff_T, diff);

          console.log("local scatter:");
          console.log(scatter);

          console.log("begin calculating scatter sum")
          scatter_sum = [];
          scatter.map(function(row){
            
            scatter_sum.push(new Promise(function(resolve, reject) {
              console.log("sharing row = " + row);
              row_sum = [];
              row.map(function(item){
                console.log("sharing item = " + item)
                var shares = jiff_instance.share(item);
                var sum = shares[1];
                for(var i = 2; i <= jiff_instance.party_count; i++){
                  sum = sum.add(shares[i]);
                }
                row_sum.push(sum.open_to_promise().then(success, failure)); 
              });

              Promise.all(row_sum).then(function(results){
                console.log("this row is done = " + results);
                resolve(results);
              });



            }).then(success, failure));

            
          
          });
          
          Promise.all(scatter_sum).then(function(results){
                console.log("scatter_sum computed = ");
                console.log(results);

                


                console.log("scatter_sum eig = ");
                var eig = numeric.eig(results);
                var eig_copy = Object.assign({}, eig);
                console.log(eig);
                console.log("find the two largest eigenvalues");
                var sorted_eigen_values = eig_copy.lambda.x.sort().reverse().slice(0,2);
                console.log("two largest eigen values = " + sorted_eigen_values);
                var corresponding_largest_eigenvectors = []
                sorted_eigen_values.map(function(item){
                  corresponding_largest_eigenvectors.push(eig.E.x[eig.lambda.x.indexOf(item)])
                });
                corresponding_largest_eigenvectors = numeric.transpose(corresponding_largest_eigenvectors);
                console.log("corresponding eigenvectors:");
                console.log(corresponding_largest_eigenvectors);

                var result = numeric.dot(numeric.transpose(corresponding_largest_eigenvectors), arr);
                console.log("the result is:");
                console.log(result);

              });

        });


}

jiff_instance = require('../../lib/jiff-client').make_jiff("http://localhost:8080", 'test-pca', options);
jiff_instance = require('../../lib/ext/jiff-client-bignumber').make_jiff(jiff_instance);
jiff_instance = require('../../lib/ext/jiff-client-negativenumber').make_jiff(jiff_instance, options); // Max bits allowed after decimal.


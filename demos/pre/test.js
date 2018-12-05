// Chai
var assert = require('chai').assert;

var mpc = require('./mpc.js');

// Generic Testing Parameters
var showProgress = true;
var party_count = 4;
var parallelismDegree = 5; // Max number of test cases running in parallel
var n = 10;
var Zp = 15485867;

// Parameters specific to this demo
var maxValue = 500;


/**
 * CHANGE THIS: Generate inputs for your tests
 * Should return an object with this format:
 * {
 *   'party_id': [ 'test1_input', 'test2_input', ...]
 * }
 */
function generateInputs(party_count) {
  var inputs = {};
  var i;

  for (i = 0; i < party_count; i++) {
    inputs[i+1] = [];
  }

  for (i = 0; i < party_count; i++) {
    for (var j = 0; j < n; j++) {
      inputs[i+1].push(Math.floor((Math.random() * maxValue)));
    }
  }
  return inputs;
}

/**
 * CHANGE THIS: Compute the expected results not in MPC
 * @param {object} inputs - same format as generateInputs output.
 * Should return a single array with the expected result for every test in order
 *   [ 'test1_output', 'test2_output', ... ]
 */
function computeResults(inputs) {
  var results = [];

  for (var j = 0; j < n; j++) {
    var product = 1;
    for (var i = 1; i <= party_count; i++) {
      product = (product * inputs[i][j]) % Zp;
    }
    results.push(product);
  }
  return results;
}

/**
 * Do not change unless you have to.
 */
// eslint-disable-next-line no-undef
describe('Test', function () {
  this.timeout(0); // Remove timeout

  // eslint-disable-next-line no-undef
  it('Exhaustive', function (done) {
    var count = 0;

    var inputs = generateInputs(party_count);
    var realResults = computeResults(inputs);

    // Computation
    var compute = function (jiff_instance) {
      var partyInputs = inputs[jiff_instance.id];

      var testResults = [];
      (function one_test_case(j) {
        if (jiff_instance.id === 1 && showProgress) {
          console.log('\tCompute ', j > partyInputs.length ? partyInputs.length : j, '/', partyInputs.length);
        }

        if (j < partyInputs.length) {
          var promises = [];
          for (var t = 0; t < parallelismDegree && (j + t) < partyInputs.length; t++) {
            promises.push(mpc.compute(partyInputs[j + t], jiff_instance));
          }

          Promise.all(promises).then(function (parallelResults) {
            for (var t = 0; t < parallelResults.length; t++) {
              testResults.push(parallelResults[t]);
            }

            one_test_case(j + parallelismDegree);
          });

          return;
        }

        // If we reached here, it means we are done
        count++;
        for (var i = 0; i < testResults.length; i++) {
          // construct debugging message
          var ithInputs = inputs[1][i] + '';
          for (var p = 2; p <= party_count; p++) {
            ithInputs += ',' + inputs[p][i];
          }
          var msg = 'Party: ' + jiff_instance.id + '. inputs: [' + ithInputs + ']';

          // assert results are accurate
          try {
            assert.deepEqual(testResults[i].toString(), realResults[i].toString(), msg);
          } catch (assertionError) {
            done(assertionError);
            done = function () {
            };
          }
        }

        jiff_instance.disconnect(true);
        if (count === party_count) {
          done();
        }
      })(0);
    };

    // Pre-processing
    var preprocess = function (jiff_instance) {
      (function preprocess_batch(j) {
        if (jiff_instance.id === 1 && showProgress) {
          console.log('\tPreprocess ', j, '/', n);
        }

        if (j >= n) {
          // done
          mpc.done_preprocess(jiff_instance);
          compute(jiff_instance);
          return;
        }
        var batch_size = parallelismDegree;
        if (j + batch_size > n) {
          batch_size = n - j;
        }
        // we have party_count - 1 multiplication per input!
        var promise = mpc.preprocess(batch_size * (party_count - 1), jiff_instance);
        promise.then(function () {
          preprocess_batch(j + batch_size);
        });
      })(0);
    };

    var options = { party_count: party_count, onError: console.log, onConnect: preprocess, Zp: Zp };
    for (var i = 0; i < party_count; i++) {
      mpc.connect('http://localhost:8080', 'mocha-test', options);
    }
  });
});

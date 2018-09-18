var BigNumber = require('bignumber.js');
var Zp;

// Real mod as opposed to remainder
function bigNumberMod(x, y) {
  if (x.lt(0)) {
    return x.plus(y).mod(y);
  }
  return x.mod(y);
}

// How to interpret non-MPC operations
var bigNumberOpenOps = {
  '+': function (operand1, operand2) {
    return operand1.plus(operand2).mod(Zp);
  },
  '-': function (operand1, operand2) {
    return bigNumberMod(operand1.minus(operand2), Zp);
  },
  '*': function (operand1, operand2) {
    return operand1.times(operand2).mod(Zp);
  },
  '*bgw': function (operand1, operand2) {
    return operand1.times(operand2).mod(Zp);
  },
  '^': function (operand1, operand2) {
    return new BigNumber(Number(!operand1.eq(operand2)));
  },
  '|': function (operand1, operand2) {
    return new BigNumber(Number(operand1.plus(operand2).gte(1)));
  },
  '/': function (operand1, operand2) {
    return operand1.div(operand2).floor();
  },
  '%' : function (operand1, operand2) {
    return operand1.mod(operand2).floor();
  },
  '<': function (operand1, operand2) {
    return new BigNumber(Number(operand1.lt(operand2)));
  },
  '<=': function (operand1, operand2) {
    return new BigNumber(Number(operand1.lte(operand2)));
  },
  '>': function (operand1, operand2) {
    return new BigNumber(Number(operand1.gt(operand2)));
  },
  '>=': function (operand1, operand2) {
    return new BigNumber(Number(operand1.gte(operand2)));
  },
  '==': function (operand1, operand2) {
    return new BigNumber(Number(operand1.eq(operand2)));
  },
  '!=': function (operand1, operand2) {
    return new BigNumber(Number(!operand1.eq(operand2)));
  }
};

var baseComputations = require('../../computations.js');

// Default Computation Scheme
exports.compute = function (jiff_instance, _test, _inputs, _testParallel, _done) {
  Zp = jiff_instance.Zp;
  return baseComputations.compute(jiff_instance, _test, _inputs, _testParallel, _done, null, bigNumberOpenOps, bigNumberMod);
};
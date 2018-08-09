(function(exports, node) {
  var saved_instance;

  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);
    // Added options goes here
    opt.Zp = 13;

    if(node) {
      jiff = require('../../lib/jiff-client');
      $ = require('jquery-deferred');
    }

    saved_instance = jiff.make_jiff(hostname, computation_id, opt);
    // if you need any extensions, put them here

    return saved_instance;
  };

  /**
   * The MPC computation
   */
  exports.compute = function (inputs, jiff_instance) {
    if(jiff_instance == null) jiff_instance = saved_instance;

    var deferred = $.Deferred();

    // This array holds the shares for each option in the voting
    jiff_instance.share_array(inputs).then(function(option_shares) {
      var results = option_shares[1];
      //Get a partial tally for each option in the vote by adding the shares across parties together.
      for(var j = 2; j <= jiff_instance.party_count; j++) {
        for(var i = 0; i < option_shares[j].length; i++)
          results[i] = results[i].sadd(option_shares[j][i]);
      }
      
      jiff_instance.open_array(results).then(function(results) {
        deferred.resolve(results);
      });
    });

    return deferred.promise();
  };
}((typeof exports == 'undefined' ? this.mpc = {} : exports), typeof exports != 'undefined'));

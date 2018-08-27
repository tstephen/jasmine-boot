/*
 * Console support
 */
var console = {
  log : print,
  debug : print,
  warn : print,
  error : print,
  trace : print
};

var report;
var myReporter = {
  state: {
    suite : undefined,
    results : []
  },

  jasmineStarted: function(suiteInfo) {
    console.log('Running suite with ' + suiteInfo.totalSpecsDefined
        + ' spec(s)');

    console.log('  suiteInfo: ' + JSON.stringify(suiteInfo));
    this.state.suite = suiteInfo;
  },

  suiteStarted: function(result) {
    console.log('Suite started: ' + result.description);
    console.log('  result: ' + JSON.stringify(result));
  },

  specStarted: function(result) {
    console.log('Spec started: ' + result.description);
    console.log('  result: ' + JSON.stringify(result));
  },

  specDone: function(result) {
    console.log('Spec completed: ' + result.description + ' was ' + result.status);

    for (var i = 0; i < result.failedExpectations.length; i++) {
      console.log('  failure: ' + result.failedExpectations[i].message);
    }
    console.log('  result: ' + JSON.stringify(result));
    this.state.results.push(result);
  },

  suiteDone: function(result) {
    console.log('Suite completed: ' + result.description + ' was ' + result.status);
    for (var i = 0; i < result.failedExpectations.length; i++) {
      console.log('  failure: ' + result.failedExpectations[i].message);
    }
    console.log('  result: ' + JSON.stringify(result));
    report = JSON.stringify(this.state);
  },
  jasmineDone: function(config) {
    console.log('Jasmine done using config: '+JSON.stringify(config));
  }
};

jasmine.getEnv().addReporter(myReporter);
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js deferral-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:

var $Promise = function () {
	this.state = "pending";
	this.value = undefined;
	this.handlerGroups = [];
};

// deferrals are created with a new Promise each time
// This acts as a 'parent' or manager, and it resolves or rejects its associated promise using it's methods
var Deferral = function () {
	this.$promise = new $Promise();
};

// This code ensures that the promise is locked once it's resolved.
// it is stuck in this state and cannot be changed again.
Deferral.prototype.resolve = function (data) {
	// using this.$promise.value here is poor form since it's possible for a promise to return falsey values
	if (!this.$promise.value && this.$promise.state === "pending") { 
		this.$promise.value = data; 
		this.$promise.state = "resolved";
	}

	// This block allows us to append callbacks to our handlerGroup even before the promise has been resolved.
	// The handlerGroup will execute anything in the callstack once the promise resolution happens.
	if (this.$promise.state === "resolved" && this.$promise.handlerGroups.length > 0) {
		this.$promise.callHandlers();
	}
}

Deferral.prototype.reject = function (reason) {
	if (!this.$promise.value && this.$promise.state === "pending") {
		this.$promise.value = reason;
		this.$promise.state = "rejected";
	}

	if (this.$promise.state === "rejected" && this.$promise.handlerGroups.length > 0) {
		this.$promise.callHandlers();
	}
}

$Promise.prototype.then = function ( success, error ) {
	var args = Array.prototype.slice.call(arguments);

	if(this.state === "rejected" && success !== null) { 
		error = success; 
		success = null;
	}

	if(!(success instanceof Function)) { success = null; }
	if(!(error instanceof Function)) { error = null; }

	var handlerObj = {
		successCb: success,
		errorCb: error,
		successExecuted: false,
		errorExecuted: false,
	};

	this.handlerGroups.push(handlerObj);
	this.callHandlers();
}

$Promise.prototype.callHandlers = function() {
	if(this.state === "rejected") {
		var that = this;

		// Started out with this narrow case to test direction
		// this.handlerGroups[0].errorCb(this.value);

		that.handlerGroups.forEach(function (handlerObj) {
			if(!handlerObj.errorExecuted) {
				handlerObj.errorCb(that.value);
				handlerObj.errorExecuted = true;
			}
		});
	}

	if(this.state === "resolved") {
		// Lexical Scoping issue. When you see 'function' ask yourself; is 'this' what I think it is?
		var that = this;
		// this.handlerGroups[0].successCb(this.value);
		// this in this loop lost it's reference without using 'this/that' trick
		// the function is not bound to any lexical scope.
		that.handlerGroups.forEach(function(handlerObj) {
			if(!handlerObj.successExecuted) {
				handlerObj.successCb(that.value);
				handlerObj.successExecuted = true;
			}
		});
	}
};

$Promise.prototype.catch = function ( func ) {
	// adding the return keyword ensures that catch also returns whatever '.then' is supposed to as well
	return this.then(null, func);
}

// defer is a deferral factory
var defer = function () {
	return new Deferral();
}

// function isFunction(x) {
//   return Object.prototype.toString.call(x) == '[object Function]';
// }


/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = {
  defer: defer,
};

So in a Node-based project we could write things like this:

var pledge = require('pledge');
…
var myDeferral = pledge.defer();
var myPromise1 = myDeferral.$promise;
--------------------------------------------------------*/

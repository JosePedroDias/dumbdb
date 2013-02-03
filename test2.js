//var d = require('dumbdb')({
var d = require('./dumbdb')({
	verbose: true
});

d.open('person', function(err, p) {
	if (err) { return console.log(err); }

	var j = {name:'Johnny', age:32};
	p.put(j);

	console.log('EXISTS?', p.exists('bogusId') );
	console.log('EXISTS?', p.exists(j._id) );

	console.log('sleeping 0.5s...');

	setTimeout(
		function() {
			var p = this;

			var m = {name:'Mary', age:10};
			p.put(m);

			j.gender = 'male';
			p.put(j);

			console.log( p.all() );
		}.bind(p),
		500
	);
	
});

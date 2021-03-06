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

			p.append(j._id, {address:'lisbon', works:'no'});

			console.log( p.getRevisionDates(j._id) );

			p.discardRevisions(j._id);

			//p.clear();

			//p.drop();

			//p.get('a');

			console.log( p.all() );
		}.bind(p),
		500
	);
	
});

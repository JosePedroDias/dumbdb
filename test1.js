var firstNames = [[
	'Afonso', 'Aníbal', 'Álvaro', 'Albano', 'André', 'António',
	'Bruno', 'Bernardo',
	'Carlos', 'César', 'Cesário', 'Cláudio',
	'David', 'Duarte', 'Dionísio', 'Diogo', 'Daniel',
	'Eduardo', 'Edmundo', 'Eurico',
	'Fernando', 'Fábio', 'Francisco', 'Felizberto', 'Fausto',
	'Gaspar', 'Guilherme', 'Gabriel', 'Gustavo', 'Gonçalo', 'Graciano',
	'Hélio', 'Humberto', 'Henrique', 'Horácio',
	'Ivo', 'Igor', 'Inácio',
	'Jaime', 'José', 'Joaquim', 'Jorge', 'Júlio',
	'Leandro', 'Leonel', 'Luís', 'Lauro',
	'Manuel', 'Mário', 'Miguel', 'Márcio',
	'Norberto',
	'Óscar',
	'Paulo', 'Pedro', 'Pascoal',
	'Rafael',
	'Serafim',
	'Tiago',
	'Vasco', 'Vitorino', 'Vítor'
], [
	'Ana', 'Andreia', 'Alcina', 'Alice', 'Ágata', 'Anastácia',
	'Bárbara', 'Beatriz',
	'Catarina', 'Constança', 'Cláudia',
	'Daniela',
	'Eduarda',
	'Fernanda', 'Francisca', 'Fátima', 'Felizberta', 'Filomena',
	'Gabriela', 'Gertrudes', 'Graça', 'Graciana',
	'Helena',
	'Isabel', 'Isadora', 'Inês', 'Ivone',
	'Joana', 'Júlia',
	'Leonor', 'Lurdes', 'Luisa', 'Laura',
	'Manuela', 'Maria', 'Margarida', 'Márcia', 'Marta', 'Madalena', 'Mariana',
	'Natália',
	'Olga',
	'Paula', 'Petra',
	'Rita', 'Rute', 'Rafaela',
	'Sara', 'Sofia', 'Sónia', 'Sílvia',
	'Tânia',
	'Vânia', 'Vitória',
	'Zulmira'
]];

var lastNames = [
	'Alves',
	'Borges', 'Braga', 'Batarda',
	'Castro', 'Carvalho', 'Coelho',
	'Dias', 'Domingues',
	'Évora',
	'Fontes', 'Fraga', 'Figueiredo', 'Fonseca', 'Fagundes', 'Figo',
	'Gonçalves', 'Graça', 'Gomes',
	'Horta', 'Henriques',
	'Martins', 'Matias', 'Melo', 'Marques',
	'Nobre', 'Neves', 'Nunes', 'Nascimento',
	'Pereira', 'Portas', 'Ponte', 'Pinto', 'Pombo',
	'Saraiva', 'Silva', 'Souto',
	'Tavares', 'Torga', 'Teodoro', 'Torres',
	'Vasques'
];

var genders = ['male', 'female'];



var rndBtw = function(max, min) {
	if (!min) { min = 0; }
	return min + Math.floor( Math.random() * (max - min));
};

var rndArr = function(arr) {
	return arr[ Math.floor( Math.random() * arr.length) ];
};

var heap = function() {
	console.log( (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'MB heap used.' );
};



var r1 = /[áàâã]/g,
	r2 = /[éê]/g,
	r3 = /í/g,
	r4 = /ó/g,
	r5 = /ú/g,
	r6 = /ç/g;
var simpleString = function(s) {
	s = s.toLowerCase();
	s = s.replace(r1, 'a'); r1.lastIndex = 0;
	s = s.replace(r2, 'e'); r2.lastIndex = 0;
	s = s.replace(r3, 'i'); r3.lastIndex = 0;
	s = s.replace(r4, 'o'); r4.lastIndex = 0;
	s = s.replace(r5, 'u'); r5.lastIndex = 0;
	s = s.replace(r6, 'c'); r6.lastIndex = 0;
	return s;
};

var util = require('util');


heap();

var d = require('./dumbdb')({verbose:true});

d.open('person', true, function(err, p) {

	if (err) { return console.log(err); }

	heap();



	if (1) {
		var g;
		for (var i = 0, f = 50000; i < f; ++i) {
			g = rndBtw(2);
			p.put({
				name:	rndArr(firstNames[g]) + ' ' + rndArr(lastNames),
				age:	rndBtw(85, 5),
				gender:	genders[g]
			});
		}
	}
	


	console.log( p.get('4a') );

	//return;



	var v = p.mapReduce(
		function(d) {
			if (d.age < 7 && d.gender === 'male') {
				this.emit(null, d.name);
			}
		}
	);
	console.log(v);



	v = p.mapReduce(
		function(d) {
			if (d.age < 7 && d.gender === 'male') {
				this.emit(null, d.age);
			}
		},
		function(k, v) {
			return this.avg(v);
		}
	);
	console.log(v);



	v = p.mapReduce(
		function(d) {
			//if (d.name[0] === 'D') {
				this.emit( simpleString(d.name.split(' ')[0]), 1);
			//}
		},
		function(k, v) {
			return this.sum(v);
		}
	);
	console.log(v);



	//console.log( p.all() );



	// TODO NOT WORKING?!
	setTimeout(function() {
		console.log('Exiting...');
		heap();
		this.close();
	}.bind(p), 1000);

});
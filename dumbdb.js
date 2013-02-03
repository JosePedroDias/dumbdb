(function() {

    'use strict';

    // TODO
    // BiNARY OPS
    // clone optional de i/o for local usage

    /*jshint node:true */
    /*global */

    var fs = require('fs');



    // for measuring time
    var t;
    var start = function() {
        t = new Date().valueOf();
    };
    var stop = function(msg) {
        console.log(msg, (new Date().valueOf() - t));
    };

    // returns a new object
    var clone = function(o) {
        return JSON.parse( JSON.stringify(o) );
    };

    var idify = function(id) {
        var chars = id.split('');
        var chars2 = [];
        var c, n;
        for (var i = 0, f = chars.length; i < f; ++i) {
            c = chars[i];
            n = c.charCodeAt(0);
            if      (n >= 97 && n <= 122) {} // a-z
            else if (n >= 65 && n <= 90) {} // A-Z
            else if (n >= 48 && n <= 57) {} // 0-9
            else if (' _'.indexOf(c) !== -1) { c = '_'; }
            else if ('áàã'.indexOf(c) !== -1) { c = 'a'; }
            else if ('éê'.indexOf(c) !== -1) { c = 'e'; }
            else if ('í'.indexOf(c) !== -1) { c = 'i'; }
            else if ('óõô'.indexOf(c) !== -1) { c = 'o'; }
            else if ('ú'.indexOf(c) !== -1) { c = 'u'; }
            else if ('ÁÀÃ'.indexOf(c) !== -1) { c = 'A'; }
            else if ('ÉÊ'.indexOf(c) !== -1) { c = 'E'; }
            else if ('Í'.indexOf(c) !== -1) { c = 'I'; }
            else if ('ÓÕÔ'.indexOf(c) !== -1) { c = 'O'; }
            else if ('Ú'.indexOf(c) !== -1) { c = 'U'; }
            else { continue; }
            chars2.push(c);
        }
        return chars2.join('');
    };



    var defaults = function(defaults, opts) {
        if (!opts) { opts = {}; }
        for (var k in defaults) {
            if (!(k in opts)) {
                opts[k] = defaults[k];
            }
        }
        return opts;
    };



    var DumbdbCollection = function(name, path, d, revs, cfg) {
        this._name = name;
        this._path = path;
        this._d    = d;
        this._revs = revs;
        this._cfg  = cfg;
        this._boundSave = this._save.bind(this);
        this._length  = Object.keys(d).length;
        this._lastId  = this._length;
        this._isDirty = false;
        this._timer   = setInterval(this._boundSave, this._cfg.saveEveryNSeconds * 1000);
    };

    DumbdbCollection.prototype = {

        get: function(id, rev) {
            if (rev !== undefined) {
                return this._revs[id][rev];
            }

            return this._d[id];
        },

        create: function(o) {
            var id = o._id;

            // encapsulate primitive types and arrays
            if (typeof o !== 'object' || o instanceof Array) {
                var tmp = o;
                o = {
                    _data: tmp
                };
            }

            if (id !== undefined) {
                if (this.exists(id)) {
                    throw new Error('id already present!');
                }
                else {
                    id = idify(id);
                }
            }
            else {
                id = this._getId();
                o._id = id;
            }

            o._rev = 1;

            var ts = new Date().valueOf();
            o._createdAt = ts;
            o._modifiedAt = ts;

            this._d[id] = o;
            this._revs[id] = [o];
            ++this._length;

            this._isDirty = true;

            return id;
        },

        set: function(id, o) {
            if (typeof o !== 'object') {
                throw new Error('o must be an object!');
            }

            if (!('_id' in o) || id !== o._id) {
                throw new Error('issues with id: not present or different!');
            }

            o = clone(o);

            o._modifiedAt = new Date().valueOf();

            this._d[id] = o;

            var revArr = this._revs[id];
            revArr.push(o);
            o._rev = revArr.length;

            this._isDirty = true;
        },

        append: function(id, oAppend) {
            var o = this.get(id);
            if (o === undefined) {
                throw new Error('item not found!');
            }
            for (var k in oAppend) {
                o[k] = oAppend[k];
            }
            this.set(id, o);
        },

        put: function(o) {
            if ('_id' in o) {
                //console.log('SET', o);
                return this.set(o._id, o);
            }
            //console.log('CREATE', o);
            return this.create(o);
        },

        getRevisions: function(id) {
            return this._revs[id];
        },

        getRevisionDates: function(id) {
            var revs = this._revs[id];
            if (revs === undefined) {
                throw new Error('item not found!');
            }
            var i, f = revs.length;
            var dates = new Array(f);
            for (i = 0; i < f; ++i) {
                dates[i] = revs[i]._modifiedAt;
            }
            return dates;
        },

        //createBin
        //setBin
        //getBin

        del: function(id, revsToo) {
            if (!this._d[id]) {
                return false;
            }
            delete this._d[id];

            if (revsToo) {
                delete this._revs[id];
            }

            --this._length;

            this._isDirty = true;
            return true;
        },

        restore: function(id, rev) {
            var revArr = this._revs[id];
            if (!revArr) { return; }
            var len = revArr.length;
            if (rev === undefined) { rev = len; }
            else if (rev < 1 || rev > len) {
                throw new Error('inexistent revision!');
            }
            var o = revArr[rev - 1];
            if (this._d[id] === undefined) {
                ++this._length;
            }
            this._d[id] = o;
            this._isDirty = true;
            return o;
        },

        discardRevisions: function(id) {
            if (id === undefined) {
                var keys = Object.keys(this._d);
                for (var i = 0, f = keys.length; i < f; ++i) {
                    this.discardRevisions(keys[i]);
                }
                return;
            }

            var o = this._d[id];
            if (o === undefined) {
                throw new Error('inexistent id!');
            }
            o._rev = 1;
            this._revs[id] = [o];
            this._isDirty = true;
        },

        exists: function(id) {
            return !!this._d[id];
        },

        all: function() {
            var res = new Array(this._length);

            var i = 0;
            for (var id in this._d) {
                res[i] = this._d[id];
            }

            return res;
        },

        mapReduce: function(map, reduce) {
            var id, res;

            if (!reduce) {
                this._res = [];

                this.emit = function(k, v) {
                    this._res.push(v);
                };

                this._map = map;
                for (id in this._d) {
                    this._map( this._d[id] );
                }
                res = this._res;
                delete this._map;
                delete this._res;
                return res;
            }

            this._res = {};

            this.emit = function(k, v) {
                if (k in this._res) { return this._res[k].push(v); }
                this._res[k] = [v];
            };

            this._map = map;
            for (id in this._d) {
                this._map( this._d[id] );
            }
            res = this._res;

            var res2 = {};
            this._reduce = reduce;
            for (var k in res) {
                res2[k] = this._reduce(k, res[k]);
            }
            delete this._map;
            delete this._reduce;
            delete this._res;
            return res2;
        },

        clear: function() {
            this._d = {};
            this._revs = {};
            this._isDirty = true;
        },

        close: function(skipSave) {
            clearInterval(this._timer);
            delete this._timer;
            this._dying = true;
            if (!skipSave) {
                this._save();
            }
            
            var warn = function() { throw 'Performed operation on a closed collection!'; };

            // make sure calling these methods throws exception...
            var that = this;
            'all append clear create del discardRevisions exists get getRevisionDates getRevisions mapReduce put restore set'.split(' ').forEach(function(methodName) {
                that[methodName] = warn;
            });
        },

        drop: function() {
            this.close(true);
            fs.unlink(this._path);
            if (this._cfg.verbose) {
                console.log('collection ' + this._name + ' dropped.');
            }
        },



        //// PRIVATES ////
        
        _getId: function() {
            var id;
            /*do {
                id = Math.floor( Math.random() * Math.pow(32, 6) ).toString(32);
            } while (this._d[id]);*/

            do {
                id = (++this._lastId).toString(32);
            } while (this._revs[id]);
            return id;
        },

        _save: function(force, cb) {
            if (!this._isDirty && !force) { return cb ? cb(null) : null; }
            if (this._cfg.verbose) { start(); }
            this._isDirty = false;
            //fs.writeFile(this._path, JSON.stringify([this._d, this._revs]), function(err) {
            fs.writeFile(this._path, JSON.stringify([this._d, this._revs], null, '\t'), function(err) {
                if (err) { return cb ? cb(err) : err; }
                if (this._cfg.verbose) {
                    stop('Saved ' + this._name + ' in %d ms having ' + Object.keys(this._d).length + ' items.');
                }
                if (this._dying) {
                    delete this._d;
                }
                if (cb) { cb(null); }
            }.bind(this));
        },



        //// REDUCE UTILITIES ////

        sum: function(arr) {
            var r = 0;
            for (var i = 0, f = arr.length; i < f; ++i) { r += arr[i]; }
            return r;
        },

        factor: function(arr) {
            var r = 1;
            for (var i = 0, f = arr.length; i < f; ++i) { r *= arr[i]; }
            return r;
        },

        avg: function(arr) {
            var r = 0;
            for (var i = 0, f = arr.length; i < f; ++i) { r += arr[i]; }
            return r / f;
        }

    };



    var Dumbdb = function(cfg) {

        this._collections = {};

        this._cfg = defaults({
            saveEveryNSeconds: 5,
            dir:               '.',
            verbose:           false
        }, cfg);
    };

    Dumbdb.prototype = {

        open: function(collName, cb) {
            collName = idify(collName);

            if (!cb) { cb = function() {}; }

            if (collName in this._collections) {
                return cb(null, this._collections[collName]);
            }

            var path = [this._cfg.dir, '/', collName, '.ddb'].join('');

            if (this._cfg.verbose) { start(); }

            var that = this;
            var existed = true;

            fs.readFile(path, function(err, data) {
                if (err) {
                    data = '[{},{}]';
                    existed = false;
                    if (that._cfg.verbose) {
                        console.log('called open() on inexistent collection, creating instead...');
                    }
                }
                else if (that._cfg.verbose) {
                    console.log('called open() on existing collection.');
                }

                try {
                    data = JSON.parse(data);
                } catch (ex) {
                    console.error('problem parsing file contents!');
                    return;
                }

                var coll = new DumbdbCollection(collName, path, data[0], data[1], that._cfg);
                that._collections[collName] = coll;

                if (!existed) { coll._save(true); }

                if (that._cfg.verbose) {
                    stop('Loaded ' + collName + ' in %d ms having ' + Object.keys(data).length + ' items.');
                }

                return cb(null, coll);
            });
        }
    };

    

    var dumbdb = function(cfg) {
        return new Dumbdb(cfg);
    };



    module.exports = dumbdb;

})();
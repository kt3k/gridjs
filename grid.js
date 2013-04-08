'ユニコード';
/**
 * grid.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: div.js@2.0
 */

window.grid = (function (window) {
    'use strict';

    var DELAY_LEVEL = 300;
    var ANIMATION_DURATION = '500ms';

    // utility for periodic metrics
    var period = function (table) {
        var index = 0;
        var length = table.length;
        return {
            up: function () {
                index += 1;
                index %= length;
                return this.value();
            },
            down: function () {
                index += length - 1;
                index %= length;
                return this.value();
            },
            value: function () {
                return table[index];
            }
        };
    };

    // constructor
    var grid = function (i, j, parent) {
        this.row = this.rowToGo = i;
        this.col = this.colToGo = j;
        this.parent = parent;

        var basicStyle = {
            position: 'absolute',
            left: 0,
            top: 0,
            width: this.parent.GRID_SIZE + 'px',
            height: this.parent.GRID_SIZE + 'px',
            webkitTransitionDuration: ANIMATION_DURATION,
            borderRadius: '5px'
        };

        this.div = window.div(basicStyle).css(this.parent.style);

        this.commitDelay = 0;

        // periodic parameters
        this.periodic = {};
        this.periodic.scale = period([100, 112, 100, 88]);
        this.periodic.sat = period([30, 60, 90, 60, 30, 0]);
        this.periodic.lum = period([50, 70, 90, 70, 50, 30, 10, 30]);

        parent[this.row] || (parent[this.row] = {});
        parent[this.row][this.col] = this;

        parent.metricsExcited || (parent.metricsExcited = []);

        this.met = this.div.met;
        this.dom = this.div.dom;
    };

    var pt = grid.prototype;

    // return random positive integer less than n.
    var dice = function (n) {
        return Math.floor(Math.random() * n);
    };

    pt.setRandomMetrics = function () {
        this.div.setX(dice(this.parent.FIELD_SIZE) - this.parent.FIELD_SIZE / 2 + this.parent.FIELD_CENTER_X - this.parent.GRID_SIZE / 2);
        this.div.setY(dice(this.parent.FIELD_SIZE) - this.parent.FIELD_SIZE / 2 + this.parent.FIELD_CENTER_Y - this.parent.GRID_SIZE / 2);

        var amp = 270;
        this.div.setRot(dice(amp * 2) - amp);
    };

    pt.reset = function () {
        this.div.setRot(0);
        this.resetXY();
        this.exciteMetrics();
    };

    pt.resetXY = function () {
        this.div
        .setY(this.parent.GRID_LEVEL * this.row + this.parent.TOP_MARGIN)
        .setX(this.parent.GRID_LEVEL * this.col + this.parent.LEFT_MARGIN);
    };

    pt.exciteMetrics = function () {
        if (this.parent.metricsExcited.indexOf(this) === -1) {
            this.parent.metricsExcited.push(this);
        }
    };

    pt.commit = function () {
        this.parent.metricsExcited.forEach(function (grid) {
            window.setTimeout(function () {
                grid.affectRider();
                grid.div.commit();
            }, Math.random() * grid.parent.COMMIT_DIFF + grid.commitDelay);

            grid.commitMetrics();

            grid.resetMetrics();
        });

        this.parent.metricsExcited = [];

        return this;
    };

    pt.commitMetrics = function () {
        this.row = this.rowToGo;
        this.col = this.colToGo;
        this.parent[this.row][this.col] = this;
        this.resetXY();
    };

    pt.resetMetrics = function () {
        this.commitDelay = 0;
    };

    pt.riderExists = function () {
        return this.rider !== null;
    }

    pt.affectRider = function () {
        if (this.rider != null && typeof this.rider.listen === 'function') {
            this.rider.listen(this.div.getDiff());
        }

        return this;
    };

    pt.initRider = function () {
        if (this.rider != null && typeof this.rider.init === 'function') {
            this.rider.init(this);
        }

        return this;
    };

    pt.setRider = function (rider) {
        this.rider = rider;

        this.initRider();

        return this;
    };

    pt.unsetRider = function () {
        this.rider = null;

        return this;
    };

    pt.removeRider = function () {
        if (this.rider != null && typeof this.rider.remove === 'function') {
            this.rider.remove();
        }

        return this;
    };

    pt.appendTo = function (dom) {
        this.div.appendTo(dom);

        return this;
    };

    pt.remove = function () {
        this.removeRider();
        this.unsetRider();

        this.div
        .transition()
        .duration(500)
        .remove()
        .transitionCommit();
    };

    pt.execute = function (cmd) {
        return this[cmd]();
    };

    var linearChangeMethod = function (callback) {
        return function () {
            var args = arguments;
            return function () {
                callback.apply(this, args);
                this.exciteMetrics();
                return this;
            };
        };
    };

    var periodicMethod = function (key, dir) {
        return function () {
            this.div.met[key] = this.periodic[key][dir]();
            this.exciteMetrics();
            return this;
        };
    };

    var rotateMethod = linearChangeMethod(function (deg) {
        this.div.addRot(deg);
    });

    var hueMethod = linearChangeMethod(function (hue) {
        this.div.addHue(hue);
    });

    pt.rR = rotateMethod(90);
    pt.rL = rotateMethod(-90);

    pt.hR = hueMethod(60);
    pt.hL = hueMethod(-60);

    pt.sR = periodicMethod('sat', 'up');
    pt.sL = periodicMethod('sat', 'down');

    pt.lR = periodicMethod('lum', 'up');
    pt.lL = periodicMethod('lum', 'down');

    pt.cR = periodicMethod('scale', 'up');
    pt.cL = periodicMethod('scale', 'down');

    var nextGetOp = function (r, c) {
        return function () {
            return this.parent[this.nextRow(this.row, r)][this.nextCol(this.col, c)];
        };
    };

    pt.nextRow = function (row, d) {
        return (row + this.parent.NUM_GRIDS + d) % this.parent.NUM_GRIDS;
    };

    pt.nextCol = function (col, d) {
        return (col + this.parent.NUM_GRIDS + d) % this.parent.NUM_GRIDS;
    };

    // g[num] num is ten key notation.
    pt.g1 = nextGetOp(1, -1);
    pt.g2 = nextGetOp(1, 0);
    pt.g3 = nextGetOp(1, 1);
    pt.g4 = nextGetOp(0, -1);
    pt.g6 = nextGetOp(0, 1);
    pt.g7 = nextGetOp(-1, -1);
    pt.g8 = nextGetOp(-1, 0);
    pt.g9 = nextGetOp(-1, 1);

    pt.gN = function () {
        return this.onLastCol() ? this.g3() : this.g6();
    };

    pt.onLastCol = function () {
        return this.col === this.parent.NUM_GRIDS - 1;
    };

    var delayMethod = function (n) {
        return function () {
            this.commitDelay = n * DELAY_LEVEL;
            this.exciteMetrics();
            return this;
        };
    };

    pt.d1 = delayMethod(1);
    pt.d2 = delayMethod(2);
    pt.d3 = delayMethod(3);
    pt.d4 = delayMethod(4);
    pt.d5 = delayMethod(5);
    pt.d6 = delayMethod(6);
    pt.d7 = delayMethod(7);
    pt.d8 = delayMethod(8);
    pt.d9 = delayMethod(9);

    var transMethod = function (r, c) {
        return function () {
            this.rowToGo = this.nextRow(this.rowToGo, r);
            this.colToGo = this.nextCol(this.colToGo, c);

            this.exciteMetrics();
            return this;
        };
    };

    // ten key notation.
    pt.t1 = transMethod(1, -1);
    pt.t2 = transMethod(1, 0);
    pt.t3 = transMethod(1, 1);
    pt.t4 = transMethod(0, -1);
    pt.t6 = transMethod(0, 1);
    pt.t7 = transMethod(-1, -1);
    pt.t8 = transMethod(-1, 0);
    pt.t9 = transMethod(-1, 1);

    pt.nop = function () {};

    var exports = function (i, j, parent) {
        return new grid(i, j, parent);
    };

    pt.constructor = exports;
    exports.prototype = pt;

    return exports;
}(window));

/**
 * gridfield.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: grid.js@0.1.0
 */

window.gridField = (function () {
    'use strict';

    var gridField = function () {};

    var pt = gridField.prototype;

    // return random positive integer less than n.
    var dice = function (n) {
        return Math.floor(Math.random() * n);
    };

    var bump = function (n, list) {
        list.sort();

        list.forEach(function (i) {
            if (i <= n) {
                n++;
            }
        });

        return n;
    }

    var sample = function (list, numOfSamples) {
        if (numOfSamples == null) {
            numOfSamples = 1;
        }

        var listLength = list.length;
        var nums = [];

        while (nums.length < numOfSamples) {
            var n = dice(listLength - nums.length);
            n = bump(n, nums);
            nums.push(n);
        }

        return nums.map(function (n) { return list[n]; });
    }

    window.sample = sample;

    pt.init = function (args) {
        this.NUM_GRIDS = args.num;
        this.GRID_MARGIN = args.margin;
        this.LEFT_MARGIN = args.left;
        this.TOP_MARGIN = args.top;
        this.GRID_SIZE = args.size;
        this.GRID_LEVEL = this.GRID_SIZE + this.GRID_MARGIN;
        this.FIELD_SIZE = this.GRID_LEVEL * this.NUM_GRIDS;
        this.FIELD_CENTER_X = this.LEFT_MARGIN + this.FIELD_SIZE / 2;
        this.FIELD_CENTER_Y = this.TOP_MARGIN + this.FIELD_SIZE / 2;

        this.COMMIT_DIFF = args.diff;

        this.HUE_DEFAULT = args.hue;
        this.SAT_DEFAULT = args.sat;
        this.LUM_DEFAULT = args.lum;

        this.style = args.style;

        return this;
    };

    pt.origin = function () {
        return this[0][0];
    };

    pt.getRandomGrid = function () {
        return this[dice(4)][dice(4)];
    };

    pt.executeGridCommands = function (cmds) {
        cmds.reduce(function (grid, cmd) {
            return grid.execute(cmd);
        }, this.origin());

        return this;
    };

    pt.create = function () {
        window.div.hue = this.HUE_DEFAULT;
        window.div.sat = this.SAT_DEFAULT;
        window.div.lum = this.LUM_DEFAULT;

        this.forEachIndex(function (i, j) {
            window.grid(i, j, this);
        });

        return this;
    };

    pt.css = function (style) {
        this.forEachGrid(function (grid) {
            grid.div.css(style);
        });

        return this;
    };

    pt.commit = function () {
        this.forEachGrid(function (grid) {
            grid.div.commit();
        });

        return this;
    };

    pt.randomize = function () {
        this.forEachGrid(function (grid) {
            grid.setRandomMetrics();
        });

        return this;
    };

    pt.reset = function () {
        this.forEachGrid(function (grid) {
            grid.reset();
        });

        return this;
    };

    pt.appendTo = function (dom) {
        this.forEachGrid(function (grid) {
            grid.appendTo(dom);
        });

        return this;
    };

    pt.remove = function () {
        this.forEachGrid(function (grid) {
            grid.remove();
        });

        return this;
    };

    pt.removeRider = function () {
        this.forEachGrid(function (grid) {
            grid.removeRider();
        });

        return this;
    };

    pt.vacantGrids = function () {
        var list = [];

        this.forEachGrid(function (grid) {
            if (!grid.riderExists()) {
                list.push(grid);
            }
        });

        return list;
    };

    pt.forEachGrid = function (func) {
        this.forEachIndex(function (i, j) {
            func.call(this, this[i][j]);
        });
    };

    pt.forEachIndex = function (func) {
        for (var i = 0; i < this.NUM_GRIDS; i++) {
            for (var j = 0; j < this.NUM_GRIDS; j++) {
                func.call(this, i, j);
            }
        }
    };

    var exports = function () {
        return new gridField();
    };

    pt.constructor = exports;
    exports.prototype = pt;

    return exports;
}());

/**
 * gridlayouter.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: grid.js@0.1.0 card-ribosome.js@0.1.0 elapsed.js@1.0 scene.js@0.1.0
 */

/**
 * gridLayouter implements scene
 */

window.gridLayouter = (function () {
    'use strict';

    var elapsed = window.elapsed;

    var NUM_GRIDS_DEFAULT = 4;
    var GRID_MARGIN_DEFAULT = 10;
    var LEFT_MARGIN_DEFAULT = 30;
    var TOP_MARGIN_DEFAULT = 10;
    var GRID_SIZE_DEFAULT = 50;
    var COMMIT_DIFF_DEFAULT = 40;
    var HUE_DEFAULT = Math.floor(Math.random() * 360);
    var SAT_DEFAULT = 30;
    var LUM_DEFAULT = 50;

    var gridLayouter = function (args) {
        this.args = args;
        this.initParams();
    };

    var pt = gridLayouter.prototype = new window.scene();

    pt.initParams = function () {
        this.num = NUM_GRIDS_DEFAULT;
        this.margin = GRID_MARGIN_DEFAULT;
        this.left = LEFT_MARGIN_DEFAULT;
        this.top = TOP_MARGIN_DEFAULT;
        this.size = GRID_SIZE_DEFAULT;
        this.diff = COMMIT_DIFF_DEFAULT;
        this.hue = HUE_DEFAULT;
        this.sat = SAT_DEFAULT;
        this.lum = LUM_DEFAULT;
    };

    pt.onEnter = function (done) {

        var gfield = this.gfield = window.gridField()
        .init({
            num: this.num,
            margin: this.margin,
            left: this.left,
            top: this.top,
            size: this.size,
            diff: this.diff,
            hue: this.hue,
            sat: this.sat,
            lum: this.lum
        })
        .create()
        .css({opacity: 0})
        .randomize()
        .commit()
        .appendTo(window.document.body);

        elapsed(0).then(function () {
            gfield
            .css({opacity: 1})
            .commit();

            elapsed(200).then(function () {
                gfield
                .reset()
                .commit();

                elapsed(0).then(done);
            });
        });

        this.deck = window.cardDeck(function (syms) {
            var cmds = codonMap[syms];

            if (!cmds) {
                throw Error('Operation "' + syms + '" is not defined');
            }

            gfield.executeGridCommands(cmds);
        });

    };
    pt.onEnter = pt.methodOnEnter(pt.onEnter);

    pt.onExit = function (done) {
        var gfield = this.gfield;
        var self = this;

        gfield
        .randomize()
        .commit();

        this.deck.clear();

        elapsed(100).then(function () {
            gfield.css({opacity: 0}).commit();

            elapsed(0).then(function () {
                gfield.remove();
                delete self.gfield;

                elapsed(0).then(done);
            });
        });
    };
    pt.onExit = pt.methodOnExit(pt.onExit);

    pt.exitConfirmNeeded = true;

    var exports = function (args) {
        return new gridLayouter(args);
    };

    exports.prototype = pt;

    pt.constructor = gridLayouter;

    return exports;
}());
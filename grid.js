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
            webkitTransitionDuration: ANIMATION_DURATION
        };

        this.div = window.div(basicStyle);

        this.commitDelay = 0;
        this.__excited__ = false;

        // periodic parameters
        this.periodic = {};
        this.periodic.scale = period([100, 112, 100, 88]);
        this.periodic.sat = period([30, 60, 90, 60, 30, 0]);
        this.periodic.lum = period([50, 70, 90, 70, 50, 30, 10, 30]);

        parent[this.row] || (parent[this.row] = {});
        parent[this.row][this.col] = this;
    };

    var exports = function (i, j, parent) {
        return new grid(i, j, parent);
    };

    var gridPrototype = grid.prototype = exports.prototype = {constructor: exports};

    // return random positive integer less than n.
    var dice = function (n) {
        return Math.floor(Math.random() * n);
    };

    var Chainable = function (f) {
        return function () {
            f.apply(this, arguments);

            return this;
        };
    };

    gridPrototype.setRandomMetrics = function () {
        this.div.setX(dice(this.parent.FIELD_SIZE) - this.parent.FIELD_SIZE / 2 + this.parent.FIELD_CENTER_X - this.parent.GRID_SIZE / 2);
        this.div.setY(dice(this.parent.FIELD_SIZE) - this.parent.FIELD_SIZE / 2 + this.parent.FIELD_CENTER_Y - this.parent.GRID_SIZE / 2);

        var amp = 270;
        this.div.setRot(dice(amp * 2) - amp);
    };

    gridPrototype.reset = function () {
        this.div.setRot(0);
        this.resetXY();
        this.exciteMetrics();
    };

    gridPrototype.resetXY = function () {
        this.div
        .setY(this.parent.GRID_LEVEL * this.row + this.parent.TOP_MARGIN)
        .setX(this.parent.GRID_LEVEL * this.col + this.parent.LEFT_MARGIN);
    };

    gridPrototype.exciteMetrics = function () {
        this.__excited__ = true;
    };

    gridPrototype.commitExcited = function () {
        this.parent.commitExcited();
    }
    .E(Chainable);

    gridPrototype.commit = function () {
        this.div.commit();
    }
    .E(Chainable);

    gridPrototype.commitMetrics = function () {
        this.row = this.rowToGo;
        this.col = this.colToGo;
        this.parent[this.row][this.col] = this;
        this.resetXY();
    };

    gridPrototype.resetMetrics = function () {
        this.commitDelay = 0;
        this.__excited__ = false;
    };

    gridPrototype.riderExists = function () {
        return this.rider != null;
    };

    gridPrototype.affectRider = function () {
        if (this.rider != null && typeof this.rider.listen === 'function') {
            this.rider.listen(this.div.getDiff());
        }

        return this;
    };

    gridPrototype.initRider = function () {
        if (this.rider != null && typeof this.rider.init === 'function') {
            this.rider.init(this);
        }

        return this;
    };

    gridPrototype.setRider = function (rider) {
        if (this.riderExists()) {
            this.removeRider();
        }

        this.rider = rider;

        this.initRider();

        return this;
    };

    gridPrototype.unsetRider = function () {
        this.rider = null;

        return this;
    };

    gridPrototype.removeRider = function () {
        if (this.rider != null && typeof this.rider.remove === 'function') {
            this.rider.remove();
        }

        return this;
    };

    gridPrototype.appendTo = function (dom) {
        this.div.appendTo(dom);

        return this;
    };

    gridPrototype.remove = function () {
        this.removeRider();
        this.unsetRider();

        this.div
        .transition()
        .duration(500)
        .remove()
        .transitionCommit();
    };

    gridPrototype.execute = function (cmd) {
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

    gridPrototype.rR = rotateMethod(90);
    gridPrototype.rL = rotateMethod(-90);

    gridPrototype.hR = hueMethod(60);
    gridPrototype.hL = hueMethod(-60);

    gridPrototype.sR = periodicMethod('sat', 'up');
    gridPrototype.sL = periodicMethod('sat', 'down');

    gridPrototype.lR = periodicMethod('lum', 'up');
    gridPrototype.lL = periodicMethod('lum', 'down');

    gridPrototype.cR = periodicMethod('scale', 'up');
    gridPrototype.cL = periodicMethod('scale', 'down');

    var nextGetOp = function (r, c) {
        return function () {
            return this.parent[this.nextRow(this.row, r)][this.nextCol(this.col, c)];
        };
    };

    gridPrototype.nextRow = function (row, d) {
        return (row + this.parent.NUM_GRIDS + d) % this.parent.NUM_GRIDS;
    };

    gridPrototype.nextCol = function (col, d) {
        return (col + this.parent.NUM_GRIDS + d) % this.parent.NUM_GRIDS;
    };

    // g[num] num is ten key notation.
    gridPrototype.g1 = nextGetOp(1, -1);
    gridPrototype.g2 = nextGetOp(1, 0);
    gridPrototype.g3 = nextGetOp(1, 1);
    gridPrototype.g4 = nextGetOp(0, -1);
    gridPrototype.g6 = nextGetOp(0, 1);
    gridPrototype.g7 = nextGetOp(-1, -1);
    gridPrototype.g8 = nextGetOp(-1, 0);
    gridPrototype.g9 = nextGetOp(-1, 1);

    gridPrototype.gN = function () {
        return this.onLastCol() ? this.g3() : this.g6();
    };

    gridPrototype.onLastCol = function () {
        return this.col === this.parent.NUM_GRIDS - 1;
    };

    var delayMethod = function (n) {
        return function () {
            this.commitDelay = n * DELAY_LEVEL;
            this.exciteMetrics();
            return this;
        };
    };

    gridPrototype.d1 = delayMethod(1);
    gridPrototype.d2 = delayMethod(2);
    gridPrototype.d3 = delayMethod(3);
    gridPrototype.d4 = delayMethod(4);
    gridPrototype.d5 = delayMethod(5);
    gridPrototype.d6 = delayMethod(6);
    gridPrototype.d7 = delayMethod(7);
    gridPrototype.d8 = delayMethod(8);
    gridPrototype.d9 = delayMethod(9);

    var transMethod = function (r, c) {
        return function () {
            this.rowToGo = this.nextRow(this.rowToGo, r);
            this.colToGo = this.nextCol(this.colToGo, c);

            this.exciteMetrics();
            return this;
        };
    };

    // ten key notation.
    gridPrototype.t1 = transMethod(1, -1);
    gridPrototype.t2 = transMethod(1, 0);
    gridPrototype.t3 = transMethod(1, 1);
    gridPrototype.t4 = transMethod(0, -1);
    gridPrototype.t6 = transMethod(0, 1);
    gridPrototype.t7 = transMethod(-1, -1);
    gridPrototype.t8 = transMethod(-1, 0);
    gridPrototype.t9 = transMethod(-1, 1);

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

    var exports = function () {
        return new gridField();
    };

    var gridFieldPrototype = gridField.prototype = exports.prototype = new window.Transitionable();

    gridFieldPrototype.constructor = exports;

    var Chainable = function (f) {
        return function () {
            f.apply(this, arguments);

            return this;
        };
    };

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
    };

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
    };

    exports.sample = sample;

    gridFieldPrototype.init = function (args) {
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

        this.initTransition(this);

        this.style = args.style;
    }
    .E(Chainable);

    gridFieldPrototype.origin = function () {
        return this[0][0];
    };

    gridFieldPrototype.getRandomGrid = function () {
        return this[dice(4)][dice(4)];
    };

    gridFieldPrototype.executeGridCommands = function (cmds) {
        cmds.reduce(function (grid, cmd) {
            return grid.execute(cmd);
        }, this.origin());
    }
    .E(Chainable);

    gridFieldPrototype.create = function () {
        window.div.hue = this.HUE_DEFAULT;
        window.div.sat = this.SAT_DEFAULT;
        window.div.lum = this.LUM_DEFAULT;

        this.list = [];

        this.forEachIndex(function (i, j) {
            this.list.push(window.grid(i, j, this));
        });
    }
    .E(Chainable);


    gridFieldPrototype.css = function (style) {
        this.forEachGrid(function (grid) {
            grid.div.css(style);
        });
    }
    .E(window.transition.Transitionable)
    .E(Chainable);

    gridFieldPrototype.commit = function () {
        this.forEachGrid(function (grid) {
            grid.commit();
        });
    }
    .E(window.transition.Transitionable)
    .E(Chainable);

    gridFieldPrototype.commitExcited = function () {
        this.forEachExcitedGrid(function (grid) {
            window.setTimeout(function () {
                grid.affectRider();
                grid.commit();
            }, grid.commitDelay);

            grid.commitMetrics();

            grid.resetMetrics();
        });
    }
    .E(Chainable);

    gridFieldPrototype.randomize = function () {
        this.forEachGrid(function (grid) {
            grid.setRandomMetrics();
        });
    }
    .E(Chainable);

    gridFieldPrototype.reset = function () {
        this.forEachGrid(function (grid) {
            grid.reset();
        });
    }
    .E(window.transition.Transitionable)
    .E(Chainable);

    gridFieldPrototype.appendTo = function (dom) {
        this.forEachGrid(function (grid) {
            grid.appendTo(dom);
        });
    }
    .E(Chainable);

    gridFieldPrototype.remove = function () {
        this.forEachGrid(function (grid) {
            grid.remove();
        });
    }
    .E(window.transition.Transitionable)
    .E(Chainable);

    gridFieldPrototype.removeRider = function () {
        this.forEachGrid(function (grid) {
            grid.removeRider();
        });
    }
    .E(Chainable);

    gridFieldPrototype.vacantGrids = function () {
        return this.list.filter(function (grid) {
            return !grid.riderExists();
        });
    };

    gridFieldPrototype.sampleVacantGrids = function (n) {
        return sample(this.vacantGrids(), n);
    };

    gridFieldPrototype.riderExists = function () {
        return this.vacantGrids().length < this.NUM_GRIDS * this.NUM_GRIDS;
    };

    gridFieldPrototype.forEachIndex = function (func) {
        for (var i = 0; i < this.NUM_GRIDS; i++) {
            for (var j = 0; j < this.NUM_GRIDS; j++) {
                func.call(this, i, j);
            }
        }
    };

    gridFieldPrototype.forEachGrid = function (func) {
        this.list.forEach(function (grid) {
            func.call(this, grid);
        }, this);
    };

    gridFieldPrototype.forEachExcitedGrid = function (func) {
        this.list.filter(function (grid) {
            return grid.__excited__;
        }).forEach(function (grid) {
            func.call(this, grid);
        }, this);
    };

    return exports;
}());

/**
 * roomscene.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: grid.js@0.1.0 carddeck.js@0.1.0 scene.js@0.1.0
 */

/**
 * RoomScene implements scene
 */

var NUM_GRIDS_DEFAULT = 4;
var GRID_MARGIN_DEFAULT = 10;
var LEFT_MARGIN_DEFAULT = 30;
var TOP_MARGIN_DEFAULT = 10;
var GRID_SIZE_DEFAULT = 50;
var COMMIT_DIFF_DEFAULT = 40;
var HUE_DEFAULT = Math.floor(Math.random() * 360);
var SAT_DEFAULT = 30;
var LUM_DEFAULT = 50;

window.RoomScene = window.scene.branch(function (prototype, parent) {
    prototype.constructor = function () {
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

    prototype.onEnter = function (done) {
        var gfield = this.gfield = window.gfield = window.gridField()
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
            .appendTo(window.document.body)

            .transition()
            .duration(0)
            .css({opacity: 1})
            .commit()

            .transition()
            .duration(200)
            .reset()
            .commit()
            .callback(done)

            .transitionCommit();

        this.k = window.kunkun().init(document.body).loop();
        this.flux = window.flow().init(document.body).loop();

        this.timer = setInterval(function () {
            if (!gfield.riderExists()) {
                gfield.sampleVacantGrids(3).forEach(function (grid) {
                    grid.setRider(new window.actorOnGrid());
                });

                setTimeout(function () {
                    gfield.sampleVacantGrids(3).forEach(function (grid) {
                        grid.setRider(new window.actorOnGrid());
                    });
                }, 400);

                setTimeout(function () {
                    gfield.sampleVacantGrids(3).forEach(function (grid) {
                        grid.setRider(new window.actorOnGrid());
                    });
                }, 800);
            }
        }, 500);

        this.deck = window.cardDeck(function (syms) {
            var cmds = window.codonMap[syms];

            if (!cmds) {
                throw Error('Operation "' + syms + '" is not defined');
            }

            gfield.executeGridCommands(cmds);
        });
    };

    prototype.onExit = function (done) {
        this.deck.clear();

        this.k.stop();
        this.flux.stop();

        clearInterval(this.timer);

        this.gfield
            .randomize()
            .commit()

            .transition()
            .duration(100)
            .css({opacity: 0})
            .commit()

            .transition()
            .duration(0)
            .remove()
            .callback(done)

            .transitionCommit();
    };

    prototype.exitConfirmNeeded = true;

    prototype.exitConfirmMessage = 'Do you really want to leave this room?';
});

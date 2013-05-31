/**
 * grid.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: div.js@2.0
 */

window.grid = window.Transitionable.branch(function (gridPrototype, parent, decorators) {
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

    var dice = function (n) {
        return Math.floor(Math.random() * n);
    };

    var Chainable = decorators.Chainable;

    // constructor
    gridPrototype.constructor = function (i, j, parent) {
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

        this.div = window.div().css(basicStyle);

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

    gridPrototype.commitFull = function () {
        var self = this;

        window.setTimeout(function () {
            self.affectRider();
            self.commit();
        }, this.commitDelay);

        this.commitMetrics();

        this.resetMetrics();
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
    }
    .E(Chainable);

    gridPrototype.initRider = function () {
        if (this.rider != null && typeof this.rider.init === 'function') {
            this.rider.init(this);
        }
    }
    .E(Chainable);

    gridPrototype.setRider = function (rider) {
        if (this.riderExists()) {
            this.removeRider();
        }

        this.rider = rider;

        this.initRider();
    }
    .E(Chainable);

    gridPrototype.unsetRider = function () {
        this.rider = null;
    }
    .E(Chainable);

    gridPrototype.removeRider = function () {
        if (this.rider != null && typeof this.rider.remove === 'function') {
            this.rider.remove();
        }
    }
    .E(Chainable);

    gridPrototype.appendTo = function (dom) {
        this.div.appendTo(dom);
    }
    .E(Chainable);

    gridPrototype.remove = function () {
        this.removeRider();
        this.unsetRider();

        this.div
        .transition()
        .duration(500)
        .remove()
        .transitionCommit();
    }
    .E(Chainable);

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
});

/**
 * gridfield.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: grid.js@0.1.0
 */

window.GridField = window.Transitionable.branch(function (gridFieldPrototype, parent, decorators) {
    'use strict';

    var Chainable = decorators.Chainable;

    var Transitionable = decorators.Transitionable;

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

    var bind = function (obj, method) {
        return function () {
            obj[method].apply(obj, arguments);
        };
    };

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

        this.__subscription__ = {
            symListener: args.opEvent
        };

        this.codonMap = args.codonMap;

        this.initTransition();

        this.style = args.style;

        this.targetDom = args.dom;
    }
    .E(pubsub.InitSubscription)
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

    gridFieldPrototype.appear = function (done) {
        this
        .create()
        .css({opacity: 0})
        .randomize()
        .commit()

        .appendTo(this.targetDom)

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
    }
    .E(pubsub.Subscribe)
    .E(Chainable);

    gridFieldPrototype.disappear = function (done) {
        this
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
    }
    .E(pubsub.Unsubscribe)
    .E(Chainable);

    gridFieldPrototype.css = function (style) {
        this.forEachGrid(function (grid) {
            grid.div.css(style);
        });
    }
    .E(Transitionable)
    .E(Chainable);

    gridFieldPrototype.commit = function () {
        this.forEachGrid(function (grid) {
            grid.commit();
        });
    }
    .E(Transitionable)
    .E(Chainable);

    gridFieldPrototype.commitExcited = function () {
        this.forEachExcitedGrid(function (grid) {
            grid.commitFull();
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
    .E(Transitionable)
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
    .E(Transitionable)
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

    gridFieldPrototype.symListener = function (data) {
        var cmds = this.codonMap[data.codon];

        if (!cmds) {
            throw Error('Operation "' + syms + '" is not defined');
        }

        this.executeGridCommands(cmds);
    };

});

/**
 * roomscene.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://kt3k.mit-license.org/ )
 * dependency: grid.js@0.1.0 carddeck.js@0.1.0 scene.js@0.1.0
 */

/**
 * RoomScene implements scene
 */

var SCREEN_WIDTH = 320;
var SCREEN_HEIGHT = 414;

var NUM_GRIDS = 4;
var GRID_MARGIN = 10;
var TOP_MARGIN = 40;
var GRID_SIZE = 40;

var LEFT_MARGIN = (SCREEN_WIDTH - GRID_SIZE * NUM_GRIDS - GRID_MARGIN * (NUM_GRIDS - 1)) / 2;

var COMMIT_DIFF = 40;

var HUE = Math.floor(Math.random() * 360);
var SAT = 30;
var LUM = 50;

window.RoomScene = window.scene.branch(function (prototype, parent, decorators) {
    'use strict';

    prototype.onEnter = function (done) {
        this.radio = window.radio;

        this.gfield = window.GridField().init({
            num: NUM_GRIDS,
            margin: GRID_MARGIN,
            left: LEFT_MARGIN,
            top: TOP_MARGIN,
            size: GRID_SIZE,
            diff: COMMIT_DIFF,
            hue: HUE,
            sat: SAT,
            lum: LUM,
            opEvent: 'op-event',
            codonMap: window.codonMap,
            dom: this.getTargetDom()
        }).appear(done);

        this.k = window.kunkun().init({
            dom: this.getTargetDom()
        }).appear();

        this.flux = window.flow().init({
            dom: this.getTargetDom()
        }).appear();

        this.deck = window.cardDeck().init({
            opEvent: 'op-event',
            baseEvent: 'base-event',
            popEvent: 'pop-event',
            shootEvent: 'shoot-event',
            dealEvent: 'deal-event',
            dom: this.getTargetDom()
        }).appear();

        var self = this;

        this.timer = setInterval(function () {
            if (!self.gfield.riderExists()) {
                self.gfield.sampleVacantGrids(3).forEach(function (grid) {
                    grid.setRider(new window.actorOnGrid());
                });

                setTimeout(function () {
                    self.gfield.sampleVacantGrids(3).forEach(function (grid) {
                        grid.setRider(new window.actorOnGrid());
                    });
                }, 400);

                setTimeout(function () {
                    self.gfield.sampleVacantGrids(3).forEach(function (grid) {
                        grid.setRider(new window.actorOnGrid());
                    });
                }, 800);
            }
        }, 500);

    }
    .E(decorators.OnEnterMethod);

    prototype.onExit = function (done) {
        this.gfield.disappear(done);
        this.k.disappear();
        this.flux.disappear();
        this.deck.disappear();

        clearInterval(this.timer);
    }
    .E(decorators.OnExitMethod);

    prototype.exitConfirmNeeded = true;

    prototype.exitConfirmMessage = 'Do you really want to leave this room?';
});

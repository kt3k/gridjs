'ユニコード';
/**
 * grid.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://opensource.org/licenses/MIT )
 */

window.grid = (function (window) {
    'use strict';

    var DELAY_LEVEL = 300;

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

        this.div = window.div({
            position: 'absolute',
            left: 0,
            top: 0,
            width: this.parent.GRID_SIZE + 'px',
            height: this.parent.GRID_SIZE + 'px',
            webkitTransitionDuration: '500ms'
        });

        this.commitDelay = 0;

        this.periodic = {};
        this.periodic.scale = period([100, 112, 100, 88]);
        this.periodic.sat = period([30, 60, 90, 60, 30, 0]);
        this.periodic.lum = period([50, 70, 90, 70, 50, 30, 10, 30]);

        parent[this.row] || (parent[this.row] = {});
        parent[this.row][this.col] = this;

        parent.metricsExcited || (parent.metricsExcited = []);

        this.resetXY();

        this.div.grid = this;

        this.met = this.div.met;
        this.dom = this.div.dom;
    };

    var pt = grid.prototype;

    pt.resetXY = function () {
        this.div.setY(this.parent.GRID_LEVEL * this.row + this.parent.TOP_MARGIN);
        this.div.setX(this.parent.GRID_LEVEL * this.col + this.parent.LEFT_MARGIN);
        this.exciteMetrics();
    };

    pt.exciteMetrics = function () {
        if (this.parent.metricsExcited.indexOf(this) === -1) {
            this.parent.metricsExcited.push(this);
        }
    };

    pt.commit = function () {
        this.parent.metricsExcited.forEach(function (grid) {
            window.setTimeout(function () {
                grid.div.commit();
            }, Math.random() * grid.parent.COMMIT_DIFF + grid.commitDelay);
            grid.commitMetrics();
        });
        this.parent.metricsExcited = [];
        return this;
    };

    pt.commitMetrics = function () {
        this.row = this.rowToGo;
        this.col = this.colToGo;
        this.parent[this.row][this.col] = this;
        this.resetXY();
        this.commitDelay = 0;
    }

    pt.appendTo = function (dom) {
        dom.appendChild(this.dom);
        return this;
    };

    pt.execute = function (cmd) {
        return this[cmd]();
    };

    pt.executeIterate = function (cmds) {
        return cmds.reduce(function (grid, cmd) {
            return grid.execute(cmd);
        }, this);
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



window.gridField = (function () {
    'use strict';

    var gridField = function (args) {
        this.init(args);
    };

    var pt = gridField.prototype;

    pt.init = function (args) {
        this.NUM_GRIDS = args.num;
        this.GRID_MARGIN = args.margin;
        this.LEFT_MARGIN = args.left;
        this.TOP_MARGIN = args.top;
        this.GRID_SIZE = args.size;
        this.GRID_LEVEL = this.GRID_SIZE + this.GRID_MARGIN;
        this.LEFT_LIMIT = this.LEFT_MARGIN - this.GRID_SIZE;
        this.TOP_LIMIT = this.TOP_MARGIN - this.GRID_SIZE;
        this.FIELD_SIZE = this.GRID_LEVEL * this.NUM_GRIDS;
        this.RIGHT_LIMIT = this.LEFT_MARGIN + this.FIELD_SIZE;
        this.BOTTOM_LIMIT = this.TOP_MARGIN + this.FIELD_SIZE;

        this.COMMIT_DIFF = args.diff;

        this.HUE_DEFAULT = args.hue;
        this.SAT_DEFAULT = args.sat;
        this.LUM_DEFAULT = args.lum;
    };

    pt.origin = function () {
        return this[0][0];
    };

    pt.born = function () {
        window.div.hue = this.HUE_DEFAULT;
        window.div.sat = this.SAT_DEFAULT;
        window.div.lum = this.LUM_DEFAULT;

        this.forEachGrid(function (i, j) {
            window.grid(i, j, this);
        });

        return this;
    };

    pt.commit = function () {
        this.origin().commit();
        return this;
    };

    pt.solidCommit = function () {
        this.forEachGrid(function (i, j) {
            this[i][j].div.commit();
        });

        return this;
    };

    pt.appendTo = function (dom) {
        this.forEachGrid(function (i, j) {
            this[i][j].appendTo(dom);
        });

        return this;
    };

    pt.forEachGrid = function (func) {
        for (var i = 0; i < this.NUM_GRIDS; i++) {
            for (var j = 0; j < this.NUM_GRIDS; j++) {
                func.call(this, i, j);
            }
        }
    };

    var COMMAND_SEPARATOR = '|';

    var mapper = function (mapping) {
        return function (x) {
            return mapping[x];
        };
    };

    var flattenJoin = function flattenJoin(array, sep) {
        if (array instanceof Array) {
            return array.map(function (x) {
                return flattenJoin(x, sep);
            }).join(sep);
        }

        return array;
    };

    var reduceCommandsWithMapping = function (mapping, append) {
        append = append || [];
        return function (routes) {
            routes = flattenJoin(routes, '');

            var commands = routes.split('')
            .map(mapper(mapping))
            .join(COMMAND_SEPARATOR)
            .split(COMMAND_SEPARATOR)
            .concat(append);

            this.origin().executeIterate(commands);

            return this;
        };
    };

    pt.reduceDelay = reduceCommandsWithMapping({
        '1': 'd1|gN',
        '2': 'd2|gN',
        '3': 'd3|gN',
        '4': 'd4|gN',
        '5': 'd5|gN',
        '6': 'd6|gN',
        '7': 'd7|gN',
        '8': 'd8|gN',
        '9': 'd9|gN',
        ' ': 'gN'
    });

    pt.reduceTranslate = reduceCommandsWithMapping({
        '↙': 't1|gN',
        '↓': 't2|gN',
        '↘': 't3|gN',
        '←': 't4|gN',
        '→': 't6|gN',
        '↖': 't7|gN',
        '↑': 't8|gN',
        '↗': 't9|gN',
        ' ': 'gN'
    });

    pt.reduceScales = reduceCommandsWithMapping({
        '↑': 'cR|gN',
        '↓': 'cL|gN',
        ' ': 'gN'
    });

    pt.reduceRot = reduceCommandsWithMapping({
        'R': 'rR|gN',
        'L': 'rL|gN',
        ' ': 'gN'
    });

    pt.reduceHue = reduceCommandsWithMapping({
        '↑': 'hR|gN',
        '↓': 'hL|gN',
        ' ': 'gN'
    });

    pt.reduceSat = reduceCommandsWithMapping({
        'R': 'sR|gN',
        'L': 'sL|gN',
        ' ': 'gN'
    });

    pt.reduceLum = reduceCommandsWithMapping({
        'R': 'lR|gN',
        'L': 'lL|gN',
        ' ': 'gN'
    });

    var exports = function (args) {
        return new gridField(args);
    };

    pt.constructor = exports;
    exports.prototype = pt;

    return exports;
}());

window.documentReady(function () {
    'use strict';

    var NUM_GRIDS_DEFAULT = 4;
    var GRID_MARGIN_DEFAULT = 10;
    var LEFT_MARGIN_DEFAULT = 30;
    var TOP_MARGIN_DEFAULT = 10;
    var GRID_SIZE_DEFAULT = 50;
    var COMMIT_DIFF_DEFAULT = 40;
    var HUE_DEFAULT = 23;
    var SAT_DEFAULT = 30;
    var LUM_DEFAULT = 50;

    var sixteen = window.gridField({
        num: NUM_GRIDS_DEFAULT,
        margin: GRID_MARGIN_DEFAULT,
        left: LEFT_MARGIN_DEFAULT,
        top: TOP_MARGIN_DEFAULT,
        size: GRID_SIZE_DEFAULT,
        diff: COMMIT_DIFF_DEFAULT,
        hue: HUE_DEFAULT,
        sat: SAT_DEFAULT,
        lum: LUM_DEFAULT
    });

    sixteen.born().solidCommit();

    sixteen.appendTo(document.body);

    var proteins = {
        SSS: function () {
            sixteen.reduceDelay([
                '21 3',
                '21 3',
                '21 3',
                '21 4'
            ]).reduceTranslate([
                '→→→↘',
                '→→→↘',
                '→→→↘',
                '→→→↘'
            ]).commit();
        },
        SSN: function () {
            sixteen.reduceRot([
                'RLRL',
                '    ',
                '    ',
                '  R '
            ]).commit();
        },
        SSO: function () {
            sixteen.reduceRot([
                ' L  ',
                ' L  ',
                'L L ',
                '   L'
            ]).reduceLum([
                ' L  ',
                ' L  ',
                'L L ',
                '   L'
            ]).commit();
        },
        SSW: function () {
            sixteen.reduceRot([
                '    ',
                '    ',
                'RRRR',
                '    '
            ]).reduceLum([
                '    ',
                '    ',
                'RRRR',
                '    '
            ]).commit();
        },

        SNS: function () {
            sixteen.reduceRot([
                '  R ',
                '  R ',
                '  R ',
                '  R '
            ]).reduceLum([
                '  R ',
                '  R ',
                '  R ',
                '  R '
            ]).commit();
        },
        SNN: function () {
            sixteen.reduceTranslate([
                '↓←↓←',
                '↓↑←↑',
                '↓→↓↑',
                '→↑→↑'
            ]).commit();
        },
        SNO: function () {
            sixteen.reduceDelay([
                '11  ',
                '11  ',
                '  11',
                '  11'
            ]).reduceTranslate([
                '→↓→↓',
                '↑←↑←',
                '→↓→↓',
                '↑←↑←'
            ]).commit();
        },
        SNW: function () {
            sixteen.reduceDelay([
                '  11',
                '  11',
                '11  ',
                '11  '
            ]).reduceTranslate([
                '↓←↓←',
                '→↑→↑',
                '↓←↓←',
                '→↑→↑'
            ]).commit();
        },

        SOS: function () {
            sixteen.reduceDelay([
                '3113',
                '2  2',
                '2  2',
                '2  2'
            ]).reduceTranslate([
                '↖↗↖↗',
                '↖↗↖↗',
                '↖↗↖↗',
                '↖↗↖↗'
            ]).commit();
        },
        SON: function () {
            sixteen.reduceDelay([
                '1111',
                '1  1',
                '1  1',
                '1111'
            ]).reduceTranslate([
                '→→→↓',
                '↑→↓↓',
                '↑↑←↓',
                '↑←←←'
            ]).commit();
        },
        SOO: function () {
            sixteen.reduceDelay([
                ' 123',
                ' 123',
                ' 123',
                '1234'
            ]).reduceTranslate([
                '↓↓↓↓',
                '↓↓↓↓',
                '↓↓↓↓',
                '↓↓↓↓'
            ]).commit();
        },
        SOW: function () {
            sixteen.reduceScales([
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
            ]).commit();
        },

        SWS: function () {
            sixteen.reduceScales([
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
            ]).commit();
        },
        SWN: function () {
            sixteen.reduceRot([
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]).reduceHue([
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
            ]).commit();
        },
        SWO: function () {
            sixteen.reduceRot([
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]).reduceHue([
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
            ]).commit();
        },
        SWW: function () {
            sixteen.reduceRot([
                ' L  ',
                ' L  ',
                'L L ',
                '   L'
            ]).reduceLum([
                ' L  ',
                ' L  ',
                'L L ',
                '   L'
            ]).reduceHue([
                ' ↑  ',
                ' ↑  ',
                '↑ ↑ ',
                '   ↑'
            ]).commit();
        },
        
        NSS: function () {
            sixteen.reduceRot([
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]).reduceSat([
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]).commit();
        },
        NSN: function () {
            sixteen.reduceRot([
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]).reduceSat([
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]).commit();
        },
        NSO: function () {
            sixteen.reduceRot([
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]).reduceLum([
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]).commit();
        },
        NSW: function () {
            sixteen.reduceRot([
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]).reduceLum([
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]).commit();
        },
        
        NNS: function () {
            sixteen.reduceDelay([
                '3 23',
                '211 ',
                ' 112',
                '32 3'
            ]).reduceTranslate([
                '←→↘↑',
                '↗→↓↓',
                '↑↑←↙',
                '↓↖←→'
            ]).commit();
        },
        NNN: function () {
            sixteen.reduceDelay([
                '3 23',
                '211 ',
                ' 112',
                '32 3'
            ]).reduceTranslate([
                '←→↘↑',
                '↗→↓↓',
                '↑↑←↙',
                '↓↖←→',

                ' ↘↓ ',
                '→  ↙',
                '↗  ←',
                ' ↑↖ '
            ]).commit();
        },
        NNO: function () {},
        NNW: function () {},
        
        NOS: function () {},
        NON: function () {},
        NOO: function () {},
        NOW: function () {},
        
        NWS: function () {},
        NWN: function () {},
        NWO: function () {},
        NWW: function () {},
        
        OSS: function () {},
        OSN: function () {},
        OSO: function () {},
        OSW: function () {},
        
        ONS: function () {},
        ONN: function () {},
        ONO: function () {},
        ONW: function () {},
        
        OOS: function () {},
        OON: function () {},
        OOO: function () {},
        OOW: function () {},
        
        OWS: function () {},
        OWN: function () {},
        OWO: function () {},
        OWW: function () {},
        
        WSS: function () {},
        WSN: function () {},
        WSO: function () {},
        WSW: function () {},
        
        WNS: function () {},
        WNN: function () {},
        WNO: function () {},
        WNW: function () {},
        
        WOS: function () {},
        WON: function () {},
        WOO: function () {},
        WOW: function () {},
        
        WWS: function () {},
        WWN: function () {},
        WWO: function () {},
        WWW: function () {}
    };

    window.cardRibosome(proteins);
});

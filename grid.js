'ユニコード';
/**
 * grid.js 0.1.0
 * author: Yosiya Hinosawa ( @kt3k )
 * license: MIT License ( http://opensource.org/licenses/MIT )
 */

var window = this;

this.grid = (function (window) {
    'use strict';

    var NUM_GRIDS, GRID_LEVEL, GRID_SIZE, GRID_MARGIN, LEFT_MARGIN, TOP_MARGIN, LEFT_LIMIT,
        TOP_LIMIT, FIELD_SIZE, RIGHT_LIMIT, BOTTOM_LIMIT, COMMIT_DIFF;

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

    var swapParam = function (x, y, key) {
        var xKey = x[key];
        x[key] = y[key];
        y[key] = xKey;
    };

    var init = function (args) {
        NUM_GRIDS = args.num;
        GRID_MARGIN = args.margin;
        LEFT_MARGIN = args.left;
        TOP_MARGIN = args.top;
        GRID_SIZE = args.size;
        GRID_LEVEL = GRID_SIZE + GRID_MARGIN;
        LEFT_LIMIT = LEFT_MARGIN - GRID_SIZE;
        TOP_LIMIT = TOP_MARGIN - GRID_SIZE;
        FIELD_SIZE = GRID_LEVEL * NUM_GRIDS;
        RIGHT_LIMIT = LEFT_MARGIN + FIELD_SIZE;
        BOTTOM_LIMIT = TOP_MARGIN + FIELD_SIZE;
        COMMIT_DIFF = args.diff;
    };

    var NUM_GRIDS_DEFAULT = 4;
    var GRID_MARGIN_DEFAULT = 10;
    var LEFT_MARGIN_DEFAULT = 30;
    var TOP_MARGIN_DEFAULT = 10;
    var GRID_SIZE_DEFAULT = 50;
    var COMMIT_DIFF_DEFAULT = 50;

    init({
        num: NUM_GRIDS_DEFAULT,
        margin: GRID_MARGIN_DEFAULT,
        left: LEFT_MARGIN_DEFAULT,
        top: TOP_MARGIN_DEFAULT,
        size: GRID_SIZE_DEFAULT,
        diff: COMMIT_DIFF_DEFAULT
    });

    var metricsExcited = [];

    // constructor
    var grid = function (i, j, parent) {
        this.div = window.div({
            position: 'absolute',
            left: 0,
            top: 0,
            width: GRID_SIZE + 'px',
            height: GRID_SIZE + 'px',
            webkitTransitionDuration: '500ms'
        });

        this.row = i;
        this.col = j;
        this.parent = parent;
        this.commitDelay = 0;

        this.periodic = {}
        this.periodic.scale = period([100, 112, 100, 88]);
        this.periodic.sat = period([30, 60, 90, 60, 30, 0]);
        this.periodic.lum = period([50, 70, 90, 70, 50, 30, 10, 30]);

        parent[this.row] || (parent[this.row] = {});
        parent[this.row][this.col] = this;

        this.resetXY();

        this.div.grid = this;

        this.met = this.div.met;
        this.dom = this.div.dom;
    };

    grid.prototype.resetXY = function () {
        this.div.setX(GRID_LEVEL * this.row + LEFT_MARGIN);
        this.div.setY(GRID_LEVEL * this.col + TOP_MARGIN);
        this.exciteMetrics();
    };

    grid.metricsChange = function (callback) {
        return function () {
            var args = arguments;
            return function () {
                callback.apply(this, args);
                this.exciteMetrics();
                return this;
            };
        };
    };

    grid.periodicMethod = function (key, dir) {
        return function () {
            this.div.met[key](this.periodic[key][dir]());
            this.exciteMetrics();
            return this;
        };
    };

    grid.translate = grid.metricsChange(function (i, j) {
        this.div.addX(i);
        this.div.addY(j);
        this.wrapXY();
    });

    grid.rotate = grid.metricsChange(function (deg) {
        this.div.addRot(deg);
    });

    grid.hue = grid.metricsChange(function (hue) {
        this.div.addHue(hue);
    });

    grid.saturation = grid.metricsChange(function (sat) {
        this.div.addSat(sat);
        this.checkColor();
    });

    grid.luminosity = grid.metricsChange(function (lum) {
        this.div.addLum(lum);
        this.checkColor();
    });

    grid.scale = grid.metricsChange(function (scale) {
        this.div.addScale(scale);
    });

    grid.prototype.wrapXY = function () {
        if (this.met.x <= LEFT_LIMIT) {
            this.met.x += FIELD_SIZE;
        } else if (this.met.x >= RIGHT_LIMIT) {
            this.met.x -= FIELD_SIZE;
        }
        if (this.met.y <= TOP_LIMIT) {
            this.met.y += FIELD_SIZE;
        } else if (this.met.y >= BOTTOM_LIMIT) {
            this.met.y -= FIELD_SIZE;
        }
    };

    grid.prototype.checkColor = function () {
        this.met.sat = Math.min(Math.max(this.met.sat, 0), 100);
        this.met.lum = Math.min(Math.max(this.met.lum, 20), 100);
    };

    grid.prototype.swapPosition = function (target) {
        this.parent[this.row][this.col] = target;
        this.parent[target.row][target.col] = this;

        swapParam(target, this, 'col');
        swapParam(target, this, 'row');

        this.resetXY();
        target.resetXY();

        this.setLastOne(target);
        return this;
    };

    grid.prototype.exciteMetrics = function () {
        if (metricsExcited.indexOf(this) === -1) {
            metricsExcited.push(this);
        }
    };

    grid.prototype.tR = grid.translate(GRID_LEVEL, 0);
    grid.prototype.tL = grid.translate(-GRID_LEVEL, 0);
    grid.prototype.tD = grid.translate(0, GRID_LEVEL);
    grid.prototype.tU = grid.translate(0, -GRID_LEVEL);

    grid.prototype.rR = grid.rotate(90);
    grid.prototype.rL = grid.rotate(-90);

    grid.prototype.hR = grid.hue(60);
    grid.prototype.hL = grid.hue(-60);

    grid.prototype.sU = grid.saturation(20);
    grid.prototype.sD = grid.saturation(-20);

    grid.prototype.sR = grid.periodicMethod('sat', 'up');
    grid.prototype.sL = grid.periodicMethod('sat', 'down');

    grid.prototype.lU = grid.luminosity(20);
    grid.prototype.lD = grid.luminosity(-20);

    grid.prototype.lR = grid.periodicMethod('lum', 'up');
    grid.prototype.lL = grid.periodicMethod('lum', 'down');

    grid.prototype.cU = grid.scale(8);
    grid.prototype.cD = grid.scale(-8);

    grid.prototype.cR = grid.periodicMethod('scale', 'up');
    grid.prototype.cL = grid.periodicMethod('scale', 'down');

    grid.prototype.commit = function () {
        metricsExcited.forEach(function (grid) {
            window.setTimeout(function () {
                grid.div.commit();
            }, Math.random() * COMMIT_DIFF + grid.commitDelay);
            grid.commitDelay = 0;
        });
        metricsExcited = [];
        return this;
    };

    grid.next = function (r, c) {
        return function () {
            return this.parent[
                (this.row + NUM_GRIDS + r) % NUM_GRIDS
            ][
                (this.col + NUM_GRIDS + c) % NUM_GRIDS
            ];
        };
    };

    grid.prototype.appendTo = function (dom) {
        dom.appendChild(this.dom);
        return this;
    };

    grid.prototype.execute = function (cmd) {
        return this[cmd]();
    };

    grid.prototype.executeIterate = function (cmds) {
        return cmds.reduce(function (grid, cmd) {
            return grid.execute(cmd);
        }, this);
    };

    grid.prototype.g1 = grid.next(-1, 1);
    grid.prototype.g2 = grid.next(0, 1);
    grid.prototype.g3 = grid.next(1, 1);
    grid.prototype.g4 = grid.next(-1, 0);
    grid.prototype.g6 = grid.next(1, 0);
    grid.prototype.g7 = grid.next(-1, -1);
    grid.prototype.g8 = grid.next(0, -1);
    grid.prototype.g9 = grid.next(1, -1);

    grid.prototype.gN = function () {
        return this.onLastRow() ? this.g3() : this.g6();
    };

    grid.prototype.onLastRow = function () {
        return this.row === NUM_GRIDS - 1;
    };

    grid.prototype.ex = function () {
        var lastOne = this.getLastOne();
        lastOne.commitDelay += 300;
        return this;
    };

    grid.prototype.resetLastOne = function () {
        this.parent.lastOneGrid = null;
        return this;
    };

    grid.prototype.setLastOne = function (target) {
        this.parent.lastOneGrid = target;
    };

    grid.prototype.getLastOne = function () {
        return this.parent.lastOneGrid || this;
    };

    grid.swapNext = function (direction) {
        return function () {
            return this.swapPosition(this.execute(direction));
        };
    };

    grid.prototype.w1 = grid.swapNext('g1');
    grid.prototype.w2 = grid.swapNext('g2');
    grid.prototype.w3 = grid.swapNext('g3');
    grid.prototype.w4 = grid.swapNext('g4');
    grid.prototype.w6 = grid.swapNext('g6');
    grid.prototype.w7 = grid.swapNext('g7');
    grid.prototype.w8 = grid.swapNext('g8');
    grid.prototype.w9 = grid.swapNext('g9');

    grid.prototype.nop = function () {};

    var exports = function (i, j, parent) {
        return new grid(i, j, parent);
    };

    grid.prototype.constructor = exports;
    exports.prototype = grid.prototype;

    exports.init = init;

    return exports;
}(this));

var NUM_GRIDS_DEFAULT = 4;
var GRID_MARGIN_DEFAULT = 10;
var LEFT_MARGIN_DEFAULT = 30;
var TOP_MARGIN_DEFAULT = 10;
var GRID_SIZE_DEFAULT = 50;
var COMMIT_DIFF_DEFAULT = 40;

this.grid.init({
    num: NUM_GRIDS_DEFAULT,
    margin: GRID_MARGIN_DEFAULT,
    left: LEFT_MARGIN_DEFAULT,
    top: TOP_MARGIN_DEFAULT,
    size: GRID_SIZE_DEFAULT,
    diff: COMMIT_DIFF_DEFAULT
});

window.div.hue = 17;
window.div.sat = 30;
window.div.lum = 50;

var sixteen = {};

sixteen.origin = function () {
    'use strict';
    return this[0][0];
};

var born = function () {
    'use strict';
    for (var i = 0; i < NUM_GRIDS_DEFAULT; i++) {
        for (var j = 0; j < NUM_GRIDS_DEFAULT; j++) {
            window.grid(i, j, sixteen).commit().appendTo(window.document.body);
        }
    }
};

var COMMAND_SEPARATOR = '|';

var mapper = function (mapping) {
    'use strict';
    return function (x) {
        return mapping[x];
    };
};

var flattenJoin = function flattenJoin(array, sep) {
    'use strict';
    if (!(array instanceof Array)) {
        return array;
    }
    return array.map(function (x) {
        return flattenJoin(x, sep);
    }).join(sep);
};

var reduceCommandsWithMapping = function (mapping, append) {
    'use strict';

    return function (grid, routes) {
        routes = flattenJoin(routes, '');

        var commands = routes.split('')
        .map(mapper(mapping))
        .join(COMMAND_SEPARATOR)
        .split(COMMAND_SEPARATOR)
        .concat(append || []);

        return grid.executeIterate(commands);
    };
};

var reduce2 = reduceCommandsWithMapping({
    '→': 'w6',
    '←': 'w4',
    '↓': 'w2',
    '↑': 'w8',
    '↘': 'w3',
    '↗': 'w9',
    '↖': 'w7',
    '↙': 'w1',
    '*': 'ex'
}, ['resetLastOne']);

var reduceScales = reduceCommandsWithMapping({
    '↑': 'cR|gN',
    '↓': 'cL|gN',
    ' ': 'gN'
});

var reduceRot = reduceCommandsWithMapping({
    'R': 'rR|gN',
    'L': 'rL|gN',
    ' ': 'gN'
});

var reduceHue = reduceCommandsWithMapping({
    '↑': 'hR|gN',
    '↓': 'hL|gN',
    ' ': 'gN'
});

var reduceSat = reduceCommandsWithMapping({
    '↑': 'sR|gN',
    '↓': 'sL|gN',
    ' ': 'gN'
});

var reduceLum = reduceCommandsWithMapping({
    '↑': 'lR|gN',
    '↓': 'lL|gN',
    ' ': 'gN'
});

var signHooks = (function () {
    'use strict';
    return {
        SSS: function () {
            reduce2(sixteen.origin(), '↖*←←←↖←←←↖←←←↖←←').commit();
        },
        SSN: function () {
            sixteen[0][0].rR();
            sixteen[1][0].rL();
            sixteen[2][0].rR();
            sixteen[3][0].rL();
            sixteen[2][3].rR().commit();
        },
        SSO: function () {
            sixteen[1][0].rR().lD();
            sixteen[1][1].rL().lD();
            sixteen[2][2].rR().lD();
            sixteen[3][3].rL().lD();
            sixteen[0][2].rR().lD().commit();
        },
        SSW: function () {
            sixteen[0][2].rR().lU();
            sixteen[1][2].rL().lU();
            sixteen[2][2].rR().lU();
            sixteen[3][2].rL().lU();
            sixteen[0][0].commit();
        },

        SNS: function () {
            sixteen[2][0].rR().sU();
            sixteen[2][1].rL().sU();
            sixteen[2][2].rR().sU();
            sixteen[2][3].rR().sU();
            sixteen[0][0].commit();
        },
        SNN: function () {
            reduce2(sixteen[0][0], '↓↓↓→↑→↓→↑↑↑←↓←↑').commit();
        },
        SNO: function () {
            reduce2(sixteen[0][0], '*↓*→*↑*');
            reduce2(sixteen[0][2], '↓→↑');
            reduce2(sixteen[2][0], '↓→↑');
            reduce2(sixteen[2][2], '*↓*→*↑*').commit();
        },
        SNW: function () {
            reduce2(sixteen[0][0], '*→*↓*←*');
            reduce2(sixteen[0][2], '→↓←');
            reduce2(sixteen[2][0], '→↓←');
            reduce2(sixteen[2][2], '*→*↓*←*').commit();
        },

        SOS: function () {
            reduce2(sixteen.origin(), '*↓↓↓↙*↓↓↓').commit();
            reduce2(sixteen.origin().g6(), '*↓↓↓↘*↓↓↓').commit();
        },
        SON: function () {
            reduce2(sixteen.origin(), '*↓*↓*↓*→*→*→*↑*↑*↑*←*←*').commit();
            reduce2(sixteen.origin().g3(), '→↓←').commit();
        },
        SOO: function () {
            reduce2(sixteen.origin(), '↓↓↓');
            reduce2(sixteen.origin().g6(), '*↓*↓*↓*');
            reduce2(sixteen.origin().g4(), '***↓***↓***↓***');
            reduce2(sixteen.origin().g6().g6(), '**↓**↓**↓**').commit();
        },
        SOW: function () {
            reduceScales(sixteen.origin(), [
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
            ]).commit();
        },

        SWS: function () {
            reduceScales(sixteen.origin(), [
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
            ]).commit();
        },
        SWN: function () {
            reduceRot(sixteen.origin(), [
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]);
            reduceHue(sixteen.origin(), [
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
            ]).commit();
        },
        SWO: function () {
            reduceRot(sixteen.origin(), [
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]);
            reduceHue(sixteen.origin(), [
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
            ]).commit();
        },
        SWW: function () {},
        
        NSS: function () {
            reduceRot(sixteen.origin(), [
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]);
            reduceSat(sixteen.origin(), [
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
            ]).commit();
        },
        NSN: function () {
            reduceRot(sixteen.origin(), [
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]);
            reduceSat(sixteen.origin(), [
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
            ]).commit();
        },
        NSO: function () {
            reduceRot(sixteen.origin(), [
                ' RL ',
                'RRLL',
                'LLRR',
                ' LR '
            ]);
            reduceLum(sixteen.origin(), [
                ' ↑↓ ',
                '↑↑↓↓',
                '↓↓↑↑',
                ' ↓↑ '
            ]).commit();
        },
        NSW: function () {
            reduceRot(sixteen.origin(), [
                'RLRL',
                'LRLR',
                'RLRL',
                'LRLR'
            ]);
            reduceLum(sixteen.origin(), [
                '↑↓↑↓',
                '↓↑↓↑',
                '↑↓↑↓',
                '↓↑↓↑'
            ]).commit();
        },
        
        NNS: function () {},
        NNN: function () {},
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
}());

window.cardRibosome(signHooks);

window.document.addEventListener('DOMContentLoaded', function x() {
    'use strict';
    born();

    window.document.removeEventListener('DOMConetenLoaded', x);
});

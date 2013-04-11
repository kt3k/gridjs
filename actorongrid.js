/**
 * actorongrid.js 0.0.1
 * author: Yosiya Hinosawa ( @kt3k )
 */

var dice = function (n) {
    'use strict';

    return Math.floor(Math.random() * n);
};

var idice = function (n) {
    'use strict';

    return dice(n * 2 + 1) - n;
};

window.actorOnGrid = (function (window) {
    'use strict';

    var GRID_SIZE = 50;
    var BORDER = 10;
    var RIDER_SIZE = GRID_SIZE - BORDER * 2;

    var actorOnGrid = function () {
        this.parity = 1;
    };

    var pt = {};

    pt.init = function (grid) {
        this.grid = grid;

        this.div = window.div()
        .css({
            'position': 'absolute',
            'width': RIDER_SIZE + 'px',
            'height': RIDER_SIZE + 'px',
            'opacity': 0,
            'zIndex': 5,
            'backgroundImage': 'url(img/firefox-icon-30.png)'
        })
        .setX(BORDER + grid.div.getX())
        .setY(BORDER + grid.div.getY() - 400)
        .setHue(dice(360))
        .setRot(-360)
        .commit()
        .appendTo(window.document.body)
        .transition()
        .css({opacity: 1})
        .addY(400)
        .addRot(360)
        .transitionCommit();

        var self = this;

        this.div.dom.addEventListener('click', function () { self.deathSequece(); }, true);
    };

    pt.listen = function (move) {
        Object.keys(move).forEach(function (key) {
            this.div.met[key] += move[key];
        }, this);

        this.commit();

        if (this.isDead()) {
            this.unset();
            this.deathSequece();
        }
    };

    pt.unset = function () {
        this.grid.unsetRider();
    };

    pt.commit = function () {
        this.div.commit();
    };

    pt.isDead = function () {
        return Math.abs(this.div.getRot()) > 500;
    };

    pt.remove = function () {
        this.div
        .transition()
        .addRot(400)
        .setScale(0)
        .css({opacity: 0})
        .transition()
        .remove()
        .transitionCommit();
    };

    pt.deathSequece = function () {
        this.div
        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))

        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .setHue(0)
        .setSat(100)
        .setLum(50)
        .setScale(150)
        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .setSat(0)
        .setLum(0)
        .setScale(50)

        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .setSat(100)
        .setLum(50)
        .setScale(150)
        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .setSat(0)
        .setLum(0)
        .setScale(50)

        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .setSat(100)
        .setLum(50)
        .setScale(150)
        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .setSat(0)
        .setLum(0)
        .setScale(50)

        .transition()
        .duration(200)
        .addX(idice(10))
        .addY(idice(10))
        .setSat(100)
        .setLum(50)
        .setScale(150)
        .transition()
        .css({opacity: 0})
        .transition()
        .remove()

        .transitionCommit();
    };

    var exports = pt.constructor = function () {
        return new actorOnGrid();
    };

    exports.prototype = actorOnGrid.prototype = pt;

    return exports;
}(this));
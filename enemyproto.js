/**
 * enemyproto.js v0.1
 * author: Yosiya HINOSAWA ( @kt3k )
 * license: MIT ( http://kt3k.mit-license.org/ )
 * description: a part of Yggs Building Adventure
 */

this.EnemyGroup = Object.branch(function (enemyGroupPrototype, parent, decorators) {
    'use strict';

    enemyGroupPrototype.init = function (args) {
        this.gfield = args.gridField;

        this.__subscription__ = {};
        this.__publication__ = {};
    }
    .E(pubsub.Init)
    .E(decorators.Chainable);

    enemyGroupPrototype.appear = function () {
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
    .E(pubsub.Subscribe)
    .E(decorators.Chainable);

    enemyGroupPrototype.disappear = function () {
        clearInterval(this.timer);
    }
    .E(pubsub.Unsubscribe)
    .E(decorators.Chainable);
});

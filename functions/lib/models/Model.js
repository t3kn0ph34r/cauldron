'use strict';
const BtPromise = require('../util/promise.js');
const BlueBirdPromise = BtPromise.BluebirdPromise;
const fs = require('fs');
const DatabaseHelper = require('../helpers/databaseHelper.js');
const Config = require('../config.js');
const getBaseModel = require('./BaseModel.js');
const Signals = require('bookshelf-signals');
const Backbone = require('backbone');
require('trigger-then')(Backbone, BlueBirdPromise);

// Models are defined per instance of bookshelf
// These WeakMaps store bookshelf models per bookshelf instance
const bookshelfLoadModelPromises = new WeakMap();
const bookshelfModels = new WeakMap();
const bookshelfPluginLoaded = new WeakSet();
const bookshelfBaseModel = new WeakMap();
const signalHubs = new WeakMap();


/**
 * Loads plugins for this instance of bookshelf
 *
 * @param bookshelf
 */
function loadPlugins(bookshelf) {
    if (! bookshelfPluginLoaded.has(bookshelf)) {
        bookshelfPluginLoaded.add(bookshelf);

        let signalHub = new Backbone.Model();
        signalHubs.set(bookshelf, signalHub);

        bookshelf.plugin('registry');
        bookshelf.plugin('pagination');
        bookshelf.plugin(Signals(signalHub));
    }
}

/**
 * Callback after model is registered
 *
 * @callback OnRegistered
 * @param {Env} env
 * @param {*} model
 */

/**
 * define a bookshelf model
 *
 * @param modelName
 * @param bookshelfConfig
 * @param {OnRegistered} onRegistered
 * @return {Function}
 */
function define(modelName, bookshelfConfig, onRegistered) {
    if (typeof onRegistered !== 'function') {
        onRegistered = function(){};
    }

    return function(env) {
        let Model = withEnv(env);

        return Model.getOrm().then(bookshelf => {

            loadPlugins(bookshelf);

            if (!bookshelfBaseModel.has(bookshelf)) {
                bookshelfBaseModel.set(bookshelf, getBaseModel(bookshelf));
            }

            let BaseModel = bookshelfBaseModel.get(bookshelf);

            let config = Config.withEnv(env);

            let configWithEnv = Config.util.deepCopy({ env, config }, bookshelfConfig);

            let model = class extends BaseModel {};
            Object.assign(model.prototype, configWithEnv);

            bookshelf.model(modelName, model);

            if (! bookshelfModels.has(bookshelf)) {
                bookshelfModels.set(bookshelf, {});
            }

            bookshelfModels.get(bookshelf)[modelName] = model;
            return onRegistered(env, model);
        });
    };
}

/**
 *
 * @param env
 * @return {Model}
 */
function withEnv(env) {
    return new Model(env);
}

/**
 * @class Model
 * @property {Object} models
 * @property {boolean} pluginsLoaded
 */
class Model {
    constructor(env) {
        this.env = env;
        this.models = {};

        this.getOrm = BtPromise.methodOnce(function () {
            return DatabaseHelper.withEnv(env).getOrm();
        });

        function loadModels() {
            const readdir = BlueBirdPromise.promisify(fs.readdir, {context: fs});

            return readdir(__dirname).then(files => {
                return BlueBirdPromise.each(files, file => {
                    if (file !== 'Model.js' && file !== 'BaseModel.js') {
                        return require('./' + file)(env);
                    }
                });
            });
        }

        /**
         * Initialize all of the Bookshelf models in the Models directory
         * @type {Function}
         */
        this.loadModels = function() {
            return this.getOrm().then(bookshelf => {
                // If this bookshelf
                if (!bookshelfLoadModelPromises.has(bookshelf)) {
                    bookshelfLoadModelPromises.set(bookshelf, loadModels());
                }

                return bookshelfLoadModelPromises.get(bookshelf);
            });
        };


        this.getEventEmitter = function () {
            return this.getOrm().then(bookshelf => {
                return signalHubs.get(bookshelf);
            });
        };
    }


    /**
     * Get a bookshelf class asynchronously
     * @param className
     * @return {*}
     */
    getClass(className) {
        return this.loadModels().then(() => {
            return this.getOrm();
        }).then(bookshelf => {
            return bookshelfModels.get(bookshelf)[className];
        });
    }
}

module.exports = {
    define,
    withEnv
};
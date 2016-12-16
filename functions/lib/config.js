'use strict';
const path = require('path');
const Env = require('./env.js');
let fullConfig = null;

/**
 *
 * @param {Env} env
 * @return {Config}
 */
function withEnv(env) {
    return new Config(env);
}

function deepCopy(target, newObj) {

    if (typeof target !== 'object') {
        return newObj;
    }

    if (Array.isArray(target)) {
        return newObj;
    }

    for (var prop in newObj) {

        target[prop] = deepCopy(target[prop], newObj[prop]);
    }

    return target;
}

class Config {
    constructor(env) {
        let fullConfig = null;
        let self = this;

        function getFullConfig() {
            if (!fullConfig) {
                self.init(env);
            }

            return fullConfig;
        }

        function loadConfig(filePath) {
            let loadedConfig = {};
            try {
                loadedConfig = require(filePath);
            } catch (e) {}

            return loadedConfig;
        }

        function deepIterate(key, cb) {
            if (typeof key !== 'string') {
                throw new Error('key must be a string.');
            }

            if (! key) {
                throw new Error('key must not be empty.');
            }

            let keyParts = key.split('.');
            let currentContext = getFullConfig();
            let part;
            for (let i = 0; i < keyParts.length; i++) {
                part = keyParts[i];

                if (typeof currentContext !== 'object') {
                    return null;
                }

                cb(currentContext, part, keyParts[keyParts.length - 1]);
                currentContext = currentContext[part];
            }
        }

        this.init = function(env) {
            const NODE_ENV = env.getEnv();
            const NODE_BASE_CONFIG_DIR = path.join(__dirname, 'config');
            const NODE_CONFIG_DIR = path.join(NODE_BASE_CONFIG_DIR, NODE_ENV);
            const NODE_APP_INSTANCE = 'secure';

            fullConfig = {};
            let fileOrder;
            let isTest = env.isTest();

            // create paths to default conf
            const defaultConfig = path.join(NODE_BASE_CONFIG_DIR, 'default.json');
            const defaultSecureConfig = path.join(NODE_BASE_CONFIG_DIR, `default-${NODE_APP_INSTANCE}.json`);

            const localGlobalConfig = path.join(NODE_BASE_CONFIG_DIR, 'local.json');
            const localGlobalSecureConfig = path.join(NODE_BASE_CONFIG_DIR, `local-${NODE_APP_INSTANCE}.json`);

            const envConfig = path.join(NODE_CONFIG_DIR, `${NODE_ENV}.json`);
            const envSecureConfig = path.join(NODE_CONFIG_DIR, `${NODE_ENV}-${NODE_APP_INSTANCE}.json`);

            const envTestConfig = path.join(NODE_CONFIG_DIR, `${NODE_ENV}-test.json`);
            const envTestSecureConfig = path.join(NODE_CONFIG_DIR, `${NODE_ENV}-test-${NODE_APP_INSTANCE}.json`);

            const envLocalTestConfig = path.join(NODE_CONFIG_DIR, `${NODE_ENV}-test-local.json`);
            const envLocalTestSecureConfig = path.join(NODE_CONFIG_DIR, `${NODE_ENV}-test-local-${NODE_APP_INSTANCE}.json`);

            const localEnvConfig = path.join(NODE_CONFIG_DIR, `${NODE_ENV}-local.json`);
            const localEnvSecureConfig = path.join(NODE_CONFIG_DIR, `${NODE_ENV}-local-${NODE_APP_INSTANCE}.json`);

            if (NODE_ENV === Env.ENVIRONMENTS.devlocal) {
                // if this is the local environment, all files in devlocal take precedence
                fileOrder = [
                    defaultConfig, // default.json
                    defaultSecureConfig, // default-secure.json
                    localGlobalConfig, // local.json
                    localGlobalSecureConfig, // local-secure.json
                    envConfig, // devlocal/devlocal.json
                ].concat(isTest ? [
                    envTestConfig // if testing, devlocal/devlocal-test.json
                ] : []).concat([
                    envSecureConfig //devlocal/devlocal-secure.json
                ]).concat(isTest ? [
                    envTestSecureConfig // if testing, devlocal/devlocal-test-secure.json
                ] : []);
            } else {
                // if this environment is not the local environment, the env configs are overridden by the local configs.
                // In Lambda, there are no local configs.
                fileOrder = [
                    defaultConfig, // default.json
                    defaultSecureConfig, // default-secure.json
                    envConfig, // {env}/{env}.json
                    envSecureConfig, // {env}/{env}-secure.json
                ].concat(isTest ? [
                    envTestConfig // if testing, {env}/{env}-test.json
                ] : []).concat([
                    envSecureConfig // {env}/{env}-secure.json
                ]).concat(isTest ? [
                    envTestSecureConfig // if testing, {env}/{env}-test-secure.json
                ] : []).concat([
                    localGlobalConfig, // local.json -- ingored in Lambda, used when testing an env locally
                    localGlobalSecureConfig, // local-secure.json -- ingored in Lambda, used when testing an env locally

                    localEnvConfig, // {env}/{env}-local.json -- ingored in Lambda, used when testing an env locally
                    localEnvSecureConfig // {env}/{env}-local-secure.json -- ingored in Lambda, used when testing an env locally
                ]).concat(isTest ? [
                    envLocalTestConfig, // {env}/{env}-test-local.json -- ingored in Lambda, used when testing an env locally
                    envLocalTestSecureConfig // {env}/{env}-test-local-secure.json -- ingored in Lambda, used when testing an env locally
                ] : []);
            }

            // first load the default configs
            fileOrder.forEach(configFile => {
                fullConfig = deepCopy(fullConfig, loadConfig(configFile));
            });
        };

        /**
         * Gets a value from the config, with a fallback
         *
         * @param {string} [key]
         * @param {*} [defaultValue]
         * @return {*}
         */
        this.get = function (key, defaultValue) {
            if (key === undefined) {
                return getFullConfig();
            }

            let value;
            deepIterate(key, (obj, key) => {
                value = obj[key];
            });

            if (value === undefined) {
                return defaultValue;
            }

            return value;
        };

        /**
         * True if the key is not undefined in the config
         * @param {string} key
         * @return {boolean}
         */
        this.has = function(key) {
            if (key === undefined) {
                throw new Error('key must be defined.');
            }

            return this.get(key) !== undefined;
        };

        /**
         * Sets a value in the config
         *
         * @param {string} key
         * @param {*} value
         */
        this.set = function(key, value) {
            if (key === undefined) {
                throw new Error('key must be defined.');
            }

            deepIterate(key, (obj, key, lastKey) => {
                // if we've reached the end of the path, set the value
                if (key === lastKey) {
                    obj[key] = value;

                    // if this path doesn't exist in the config, create a path with the value
                } else if (typeof obj[key] !== 'object') {
                    obj[key] = {};
                }
            });
        };
    }
}


module.exports = {
    withEnv,
    util: {
        deepCopy
    }
};
'use strict';
const Knex = require('knex');
const tunnelSsh = require('tunnel-ssh');
const Config = require('../config.js');
const fs = require('fs');
const BtPromise = require('../util/promise.js');
const BluebirdPromise = BtPromise.BluebirdPromise;

const DB_CONTEXT = {
    test: 'test',
    live: 'live'
};

const connections = {
    invocation: {},
    dbContext: {
        [DB_CONTEXT.test]: undefined,
        [DB_CONTEXT.live]: undefined
    }
};

let _server;
/**
 * A global ssh tunnel
 *
 * @return {Promise.<*>}
 */
function makeTunnelConnection(sshTunnelConfig, forceConnect) {

    if (forceConnect || !_server) {
        return tunnelSsh.tunnel(sshTunnelConfig).then(server => {
            _server = server;
            server.on('error', function (err) {
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    makeTunnelConnection(sshTunnelConfig, true).then(server => {
                        _server = server;
                    });
                }
            });

            return server;
        });
    }

    return BluebirdPromise.resolve(_server);
}

/**
 * Get an instance of DatabaseHelper within the context of the current environment
 *
 * @param {Env} env
 */
function withEnv(env) {
    let config = Config.withEnv(env);
    let connectionGranularity;
    let connectionToken;

    if (config.get('database.connections.perInvocation')) {
        connectionGranularity = 'invocation';
        connectionToken = env.context.awsRequestId;
    } else {
        connectionGranularity = 'dbContext';
        connectionToken = env.isTest() ? DB_CONTEXT.test : DB_CONTEXT.live;
    }


    if (! (connections[connectionGranularity] && connections[connectionGranularity][connectionToken])) {
        connections[connectionGranularity][connectionToken] = new DatabaseHelper(connectionGranularity, connectionToken, config, env);
    }

    return connections[connectionGranularity][connectionToken];
}

/**
 * @class DatabaseHelper
 * @property {Function} getOrm
 */
class DatabaseHelper {
    constructor(connectionGranularity, connectionToken, config, env) {
        let knexPromise;
        let bookshelfPromise;

        let context = env.context;

        const useTunnel = (
            config.has('database.tunnel.enabled') &&
            config.get('database.tunnel.enabled') &&
            config.has('database.tunnel.ssh')
        );

        let tearDown = () => {
            return this.getQueryBuilder().then(knex => {
                return knex.destroy();
            }).then(() => {
                knexPromise = undefined;
                bookshelfPromise = undefined;

                delete connections[connectionGranularity][connectionToken];
            });
        };

        if (config.get('database.connections.perInvocation')) {
            let fail = context.fail;
            let succeed = context.succeed;
            let requestId = context.awsRequestId;

            connectionToken = requestId;
            connections.invocation[connectionToken] = {};

            context.fail = function () {
                const args = arguments;
                tearDown().then(() => {
                    return fail.apply(context, args);
                });
            };

            context.succeed = function () {
                const args = arguments;
                tearDown().then(() => {
                    return succeed.apply(context, args);
                });
            };
        } else {
            connectionGranularity = 'dbContext';
            connectionToken = env.isTest() ? DB_CONTEXT.test : DB_CONTEXT.live;

            // no teardown here
        }
        
        function getTunnelSshConfig() {
            let getPrivateKey;

            if (config.has('database.tunnel.ssh.privateKeyFile')) {
                let readFile = BluebirdPromise.promisify(fs.readFile, {context: fs});

                getPrivateKey = readFile(config.get('database.tunnel.ssh.privateKeyFile')).then(key => key.toString());
            } else if (config.has('database.tunnel.ssh.privateKey')) {
                getPrivateKey = BluebirdPromise.resolve(config.get('database.tunnel.ssh.privateKey'));
            } else {
                getPrivateKey = BluebirdPromise.resolve(null);
            }


            return getPrivateKey.then(privateKey => {

                return {
                    host: config.get('database.tunnel.ssh.host'), // the SSH host
                    port: config.get('database.tunnel.ssh.port') || 22, // the port on the SSH host

                    dstHost: config.get('database.host'), // the mysql server host
                    dstPort: config.get('database.port') || 3306, // mysql server port

                    srcPort: config.get('database.tunnel.localPort') || 3309, // a available local port
                    srcHost: config.get('database.tunnel.localHost') || '127.0.0.1', // a local hostname

                    username: config.get('database.tunnel.ssh.user'),

                    password: config.has('database.tunnel.ssh.password') ? config.get('database.tunnel.ssh.password') : null,

                    verbose: true, // dump information to stdout
                    disabled: false, //set this to true to disable tunnel (useful to keep architecture for local connections

                    privateKey // the private key for this ssh connection
                };
            });
        }
        
        this.getDatabaseConfig = () => {
            if (config.has('database.socketPath')) {
                return {
                    socketPath: config.get('database.socketPath'),
                    user: config.get('database.user'),
                    password: config.get('database.password'),
                    database: config.get('database.database')
                };
            }

            return {
                host: useTunnel ? config.get('database.tunnel.localHost') : config.get('database.host'),
                user: config.get('database.user'),
                password: config.get('database.password'),
                database: config.get('database.database'),
                port: (useTunnel ? config.get('database.tunnel.localPort') : config.get('database.port')) || 3306
            };
        };



        this.getQueryBuilder = function () {
            if (! knexPromise) {
                knexPromise = BluebirdPromise.resolve(null);
                if (useTunnel) {
                    knexPromise = getTunnelSshConfig().then(makeTunnelConnection);
                }

                knexPromise = knexPromise.then(server => {

                    return Knex({
                        client: 'mysql2',
                        connection: this.getDatabaseConfig()
                    });
                });
            }

            return knexPromise;
        };

        this.getOrm = function () {
            if (!bookshelfPromise) {
                bookshelfPromise = this.getQueryBuilder().then(knex => {
                    return require('bookshelf')(knex);
                });
            }

            return bookshelfPromise;
        };
    }
}

module.exports = {
    withEnv
};

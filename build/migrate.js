'use strict';
// set this env var so that config can read from config/*-secure.js files.
const args = require('minimist')(process.argv.slice(2));

// check to see if the environment was specified
let env = args._[0]; // the specified enivronment, eg: npm run-script migrate devint
let isTest = args.t || 0; // whether this migration is for the test db

const rollback = args.rollback;

if (env) {
    const environments = require('./environments.json').environments;
    if (!environments.some(e => e.name === env)) {
        console.error(`${env} is not a valid evironment name.`);
        process.exit(1);
    }
} else {
    env = 'devlocal';
}
process.env.NODE_ENV = env;

const path = require('path');
const currentEnv = require('../functions/lib/env.js').withMockContext(isTest);
const databaseHelper = require('../functions/lib/helpers/databaseHelper.js').withEnv(currentEnv);

const knexConfig = {
    migrations: {
        directory: path.join(__dirname, '../migrations')
    },
    seeds: {
        directory: path.join(__dirname, '../seeds')
    }
};

function migrate(knex) {
    console.log('migrating...');

    return knex.migrate.latest(knexConfig.migrations).then(() => {
        console.log('seeding...');
        return knex.seed.run(knexConfig.seeds);
    });
}

function rollbackMigrations(knex) {
    console.log('rolling back...');

    return knex.migrate.rollback(knexConfig.migrations);
}

// Get the query builder from the actual app, because that contains the logic that does the SSH tunneling
databaseHelper.getQueryBuilder().then(knex => {
    if (rollback) {
        return rollbackMigrations(knex);
    }

    return migrate(knex);
}).then(() => {
    console.log('done');
    process.exit(0);
});
'use strict';
const os = require('os');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const environments = require('./environments.json').environments;

const bucket = 'cauldron-config';
const accessKeyId = process.env.CAULDRON_ACCESS_KEY_ID;
const secretAccessKey = process.env.CAULDRON_SECRET_ACCESS_KEY;
const region = 'us-east-1';

if (!(accessKeyId && secretAccessKey)) {
    throw new Error('Environment variables "CAULDRON_ACCESS_KEY_ID" and "CAULDRON_SECRET_ACCESS_KEY" must be set.');
}

const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    accessKeyId,
    secretAccessKey,
    region
});

let nonLocalEnvironments = environments.filter(env => env.name !== 'devlocal');

function getConfigs() {
    const getObject = Promise.promisify(s3.getObject, {context: s3});
    const writeFile = Promise.promisify(fs.writeFile, {context: fs});
    const access = Promise.promisify(fs.access, {context: fs});

    function fileExists(fileName) {
        return new Promise((resolve) => {
            access(fileName, fs.R_OK).then(() => {
                resolve(true);
            }).catch(() => {
                resolve(false);
            });
        });
    }

    return Promise.all(nonLocalEnvironments.concat({name: 'default'}).map(environment => {
        let stageName = environment.name;
        console.log('Loading config for ' + stageName);

        return Promise.all([
            '',
            '-test'
        ].map(prependKey => {
            let key = stageName + prependKey;
            return new Promise((resolve, reject) => {
                // attempt to get the object from s3
                return getObject({
                    Bucket: bucket,
                    Key: key + '.json'
                    // if successful resolve the promise
                }).then(data => {
                    return resolve(data);

                    // if the s3 object just doesn't exist, resolve with an empty object
                }).catch(err => {
                    if (err.code === 'NoSuchKey') {
                        return resolve({
                            Body: '{}'
                        });
                    }


                    // otherwise, pass the error through
                    return reject(err);
                });
            }).then(data => {

                let fileName = path.join(__dirname, '../functions/lib/config', stageName, key +'-secure.json');

                if (stageName === 'default') {
                    fileName = path.join(__dirname, '../functions/lib/config', key +'-secure.json');
                }

                console.log('Writing config for ' + key);
                return writeFile(fileName, data.Body);
            });
        }));
    })).then(() => {
        let localFiles = [
            'local-secure',
            'default-secure',
            'default-test-secure',
            'local-test-secure',
            'devlocal/devlocal-secure',
            'devlocal/devlocal-test-secure'
        ];

        let localSecureEnvironments = nonLocalEnvironments.map(env => `${env.name}/${env.name}-local-secure`);

        let localSecureTestEnvironments = nonLocalEnvironments.map(env => `${env.name}/${env.name}-test-local-secure`);

        let files = localFiles.concat(localSecureEnvironments, localSecureTestEnvironments);

        return Promise.all(

            //check to see if local configs exist
            files.map(fileName => {
                let filePath = path.join(__dirname, '../functions/lib/config/' + fileName + '.json');

                // if they don't, create them
                return fileExists(filePath).then(exists => {
                    if (! exists) {
                        console.log('Writing config file: ' + fileName + '.json');
                        return writeFile(filePath, JSON.stringify({})).then(() => fileName);
                    }

                    return fileName;
                });
            })
        );
    });
}

function saveConfigs() {
    const putObject = Promise.promisify(s3.putObject, {context: s3});
    const readFile = Promise.promisify(fs.readFile, {context: fs});

    return Promise.all(environments.concat([{name: 'default'}]).map(environment => {
        let stageName = environment.name;

        return Promise.all([
            '',
            '-test'
        ].map(prependFilename => {
            let fileName;
            let key = stageName + prependFilename;
            if (stageName === 'default') {
                fileName = path.join(__dirname, '../functions/lib/config/', key + '-secure.json');
            } else {
                fileName = path.join(__dirname, '../functions/lib/config/', stageName, key + '-secure.json');
            }

            return readFile(fileName).then(data => {

                console.log('Saving config to s3 for ' + key);

                return putObject({
                    Bucket: bucket,
                    Key: key + '.json',
                    Body: data
                });
            });
        }));
    }));
}

module.exports = {
    getConfigs,
    saveConfigs
};
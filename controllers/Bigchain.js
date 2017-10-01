'use strict';

var config = require('../config/config');
var driver = require('bigchaindb-driver');
const key =  new driver.Ed25519Keypair();
const conn = new driver.Connection(config.DB_API);

exports.pushData = function (json,next) {

    const tx = driver.Transaction.makeCreateTransaction(
        json,
        { what: 'TEST 1234567890' },
        [ driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(key.publicKey))
        ],
        key.publicKey
    );
    const txSigned = driver.Transaction.signTransaction(tx, key.privateKey);
    conn.postTransaction(txSigned)
        .then(() => conn.pollStatusAndFetchTransaction(txSigned.id))
        .then(retrievedTx => next(retrievedTx))
};

exports.searchAssets = function(text,next) {
    conn.searchAssets(text)
        .then(json => next(json));
}
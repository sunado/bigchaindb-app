var User = require('../models/User');
var jwt = require('jsonwebtoken');
var config = require('../config/config');
var driver = require('bigchaindb-driver');
const conn = new driver.Connection(config.DB_API);

exports.filter = function (req, res, next) {
    if (req.url == '/authenticate' || req.url == '/user') {
        next();
    } else {
        // check header or url parameters or post parameters for token
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        // decode token
        if (token) {
            // verifies secret and checks exp
            jwt.verify(token, req.app.get('superSecret'), function (err, decoded) {
                if (err) {
                    return res.json({success: false, message: 'Failed to authenticate token.'});
                } else {
                    // if everything is good, save to request for use in other routes
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            // if there is no token
            // return an error
            return res.status(403).send({
                success: false,
                message: 'No token provided.'
            });

        }
    }
};

exports.authenticate = function (req, res, next) {
    console.log(req.body.publicKey);
    User.findOne({
        publicKey: req.body.publicKey
    }, function (err, user) {
        if (err) {
            throw err;
        }

        if (!user) {
            res.json({success: false, message: 'Authentication failed. User not found.'});
            console.log("User not found")
        } else {
            if (user.privateKey != req.body.privateKey) {
                res.json({success: false, message: 'Authentication failed. Wrong password.'});
            } else {
                const payload = {
                    admin: user.admin,
                    privateKey: user.privateKey,
                    publicKey: user.publicKey
                };
                var token = jwt.sign(payload, req.app.get('superSecret'), {
                    expiresIn: 60 * 60 * 24 // expires in 24 hours
                });
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }
        }
    })
};

exports.listUser = function (req, res, next) {
    User.find({}, function (err, users) {
        res.json(users);
    });
};

exports.createUser = function (req, res, next) {
    var key =  new driver.Ed25519Keypair();
    var user = new User({
        publicKey: key.publicKey,
        privateKey: key.privateKey,
        admin: false
    });
    user.save(function (err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({
            success: true,
            publicKey: key.publicKey,
            privateKey: key.privateKey,
            admin: false
        });
    });
};

exports.createTransaction = function (req, res, next) {
    var userData = req.decoded;
    var json = req.body
    const tx = driver.Transaction.makeCreateTransaction(
        json,
        { what: 'TEST 1234567890' },
        [ driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(userData.publicKey))
        ],
        key.publicKey
    );
    const txSigned = driver.Transaction.signTransaction(tx, userData.privateKey);
    conn.postTransaction(txSigned)
        .then(() => conn.pollStatusAndFetchTransaction(txSigned.id))
        .then(retrievedTx => next(retrievedTx))
};
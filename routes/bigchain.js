'use strict';
var express = require('express');
var router = express.Router();
var controller = require('../controllers/Bigchain');
const sampleJson = {
  "name": "Hello It's me",
  "score": 10
};
router.get('/create', function (req,res) {
    controller.pushData(sampleJson, function (retrievedTx) {
        console.log("Create transition id: ",retrievedTx.id);
        res.render('index', { title: retrievedTx.id });
    });
});

router.get('/search=:text', function(req,res) {
    controller.searchAssets(req.params.text, function (json) {
        console.log("search assets ", req.params.text," output:\n",json);
        res.render('index',{title: req.params.text})
    })
});

module.exports = router;
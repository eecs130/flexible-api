var express = require("express");
var serveIndex = require('serve-index');
const handlebars  = require('express-handlebars');
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var generic = require("./controllers/generic");
var db;

// CORS Headers:
const allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,OPTIONS,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
};

const addDBToRequest = (request, response, next) => {
    //http://stackoverflow.com/questions/9651066/how-can-i-structure-my-express-app-where-i-only-need-to-open-a-mongodb-connectio
    'use strict';
    request.db = db;
    request.handleError = function (res, reason, message, code) {
        console.log("ERROR: " + reason);
        return res.status(code || 500).json({"error": message}).end();
    };
    next();
};

const showListOfCollections = (mainreq, mainres) => {
    // get all collections in the database and list them:
    mainreq.db.listCollections().toArray((err, collInfos) => {
        if (err) {
            mainres.status(400).render('index', { 
                error: err
            });
        } else {
            const endpoints = collInfos.map(item => { 
                return {
                    'name': item.name 
                }
            });
            mainres.render('index', { 
                endpoints: endpoints,
                baseURL: '//' + mainreq.get('host')
            });
        }
    });
};

const initDatabaseAndStartServer = () => {
    const dbConnection = process.env.MONGODB_URI || LOCAL_MONGODB
    mongodb.MongoClient.connect(dbConnection,  (err, database) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
    
        // Save database object from the callback for reuse.
        db = database;
        // Initialize the app.
        var server = app.listen(process.env.PORT || 8080, function () {
            console.log("App now running on port", server.address().port);
        });
    });
};


/************************************************************************
 * Begin App:
************************************************************************/
var app = express();
module.exports = app;

// Allow Cors
app.use(allowCrossDomain);

// Configure Handlebars: 
app.engine('handlebars', handlebars({
    extname: '.handlebars',
    defaultLayout: 'index',
    layoutsDir: 'views'
  }));
app.set('view engine', 'handlebars');

// Middleware:
app.all('*', addDBToRequest);

// Static Pages
app.use('/static', express.static('views'))
app.use('/samples', express.static(__dirname + "/samples"));
app.use('/samples', serveIndex(__dirname + "/samples"));

app.use('/samples-angular', express.static(__dirname + "/samples_angular"));
app.use('/samples-angular', serveIndex(__dirname + "/samples_angular"));
app.use(bodyParser.json());


// Dynamic Routes:
app.get('/', showListOfCollections);

// Generic, user-defined tables w/S3 & thumbnailing support:
var multipart = require('connect-multiparty'),
    multipartMiddleware = multipart();
detailPaths = ['/:collection/:id([0-9a-fA-F]+)/'];
listPaths = ['/:collection/'];
app.get(listPaths, multipartMiddleware, generic.list);
app.get(detailPaths, multipartMiddleware, generic.get);
app.post(listPaths, multipartMiddleware, generic.post);
app.put(detailPaths, multipartMiddleware, generic.put);
app.delete(detailPaths, generic.delete);
app.get('/:collection/delete-all', generic.deleteAll);

// start database and server:
initDatabaseAndStartServer();
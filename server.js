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

const getEndpoints = (mainreq, mainres, callback) => {
    const endpointsFinal = {};
    mainreq.db.listCollections().toArray()
        .then(collInfos => {
            baseURL = '//' + mainreq.get('host')
            return collInfos.map(item => { 
                return { 
                    'name': item.name, 
                    'url':  baseURL + '/' + item.name + '/'};
            });
        })
        .then(endpoints => {
            // This function iterates through each DB collection to generate
            // a list of endpoints...
            baseURL = '//' + mainreq.get('host');
            for (let i = 0, p = Promise.resolve(); i < endpoints.length; i++) {
                p = p.then(_ => new Promise(resolve => {
                    mainreq.db.collection(endpoints[i]['name']).find().toArray(function(err, items) {
                        if (err) throw err;
                        console.log(endpoints[i]['name']);
                        endpointsFinal[endpoints[i]['name']] = items.map(item => item['_id']);
                        // if it's the last endpoint, render the response
                        // (needs to happen within a promise):
                        if (i === endpoints.length - 1) {
                            callback(endpointsFinal);
                        }
                        resolve();
                    })
                }));
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
app.use(bodyParser.json());

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

app.use('/tester', express.static(__dirname + "/tester"));
app.use('/tester', serveIndex(__dirname + "/tester"));


// Dynamic Routes:
app.get('/', (mainreq, mainres) => {
    getEndpoints(mainreq, mainres, (endpoints) => {
        mainres.render('index', { 
            endpoints: endpoints,
            baseURL: '//' + mainreq.get('host')
        });
    })
});

app.get('/endpoints/', (mainreq, mainres) => {
    getEndpoints(mainreq, mainres, (endpoints) => {
        mainres.status(200).json(endpoints);
    })
});

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
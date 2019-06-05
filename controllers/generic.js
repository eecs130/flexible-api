var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var thumbnailer = require("../lib/thumbnailer");
var fileHandler = require("../lib/fileHandler");

// SEE: http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html
var flow = require('flow'),
    getCollection = function (params) {
        'use strict';
        return params.collection;
    };

exports.list = function (req, res) {
    'use strict';
    var COLLECTION = getCollection(req.params),
        query = req.query,
        key;
    // convert to case-insensitive 'like' query using regex:
    for (key in query) {
        query[key] = new RegExp(query[key], "ig");
    }
    req.db.collection(COLLECTION).find(query).toArray(function (err, docs) {
        if (err) {
            req.handleError(res, err.message, "Failed to get images.");
        } else {
            res.status(200).json(docs);
        }
    });
};

exports.post = function (req, res) {
    'use strict';
    var COLLECTION = getCollection(req.params),
        newImage = req.body;
    // ensure if someone accidentally posts an _id, that it doesn't
    // interfere w/MongoDB's indexing system. Delete _id from dictionary:
    delete req.body._id;

    const hasValidS3Config = fileHandler.checkIfValidS3Config();

    flow.exec(
        // 1. Generate thumbnails and transfer them to S3
        //    Only executes if S3 is configured correctly, otherwise
        //    it ignores file posts:
        function () {
            if (req.files && req.files.image && hasValidS3Config) {
                thumbnailer.generateThumbnails({
                    req: req,
                    res: res,
                    image: req.files.image,
                    index: 0
                }, this);
            } else {
                this();
            }
        },
        // 2. append thumbnails data to JSON object (if applicable):
        function (images) {
            if (images && hasValidS3Config) {
                newImage.image = {
                    items: images,
                    original_file_name: req.files.image.name
                };
            }
            this();
        },
        // 3. transfer audio to S3 (if applicable / if S3 configured):
        function () {
            if (req.files && req.files.audio && hasValidS3Config) {
                fileHandler.transferFile({
                    req: req,
                    res: res,
                    file: req.files.audio
                }, this);
            } else {
                this();
            }
        },
        // 4. append audio data to JSON object (if applicable):
        function (audioData) {
            if (audioData && hasValidS3Config) {
                newImage.audio = audioData;
            }
            this();
        },
        // 5. transfer file to S3 (if applicable / if S3 configured):
        function () {
            if (req.files && req.files.file && hasValidS3Config) {
                fileHandler.transferFile({
                    req: req,
                    res: res,
                    file: req.files.file
                }, this);
            } else {
                this();
            }
        },
        // 6. append file data data to JSON object (if applicable):
        function (fileData) {
            if (fileData && hasValidS3Config) {
                newImage.file = fileData;
            }
            this();
        },
        // 7. finally, save to database (for attribute / non-binary data):
        function () {
            newImage.createDate = new Date();
            //finally, insert a new record:
            req.db.collection(COLLECTION).insertOne(newImage, function (err, doc) {
                if (err) {
                    req.handleError(res, err.message, "Failed to create new resource.");
                } else {
                    var d = doc.ops[0];
                    d.message = 'Resource successfully created';
                    console.log(doc.ops[0]);
                    res.status(201).json(d);
                }
            });
        }
    );
};

exports.get = function (req, res) {
    'use strict';
    var COLLECTION = getCollection(req.params);
    req.db.collection(COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function (err, doc) {
        if (err) {
            req.handleError(res, err.message, "Failed to find the requested resource");
        } else {
            console.log("Retrieved one:", doc);
            res.status(200).json(doc);
        }
    });
};

exports.put = function (req, res) {
    'use strict';
    var COLLECTION = getCollection(req.params),
        updateDoc = req.body;
    const _id = updateDoc._id;
    delete updateDoc._id;
    req.db.collection(COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc
    ).then(data => {
        updateDoc._id = _id;
        res.status(200).json(updateDoc);
    });
};

exports.delete = function (req, res) {
    'use strict';
    var COLLECTION = getCollection(req.params);
    console.log(req.params.id, req.params.collection);
    flow.exec(
        function () {
            // get image from database:
            req.db.collection(COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, this);
            //req.db.collection(COLLECTION).findOne({"_id" : new ObjectID("583e4736afabfc00104b9ace")}, this);
        },
        function (err, record) {
            // store image in local variable or throw error:
            if (err) {
                req.handleError(res, err.message, "Failed to delete the requested resource");
            } else if (!record) {
                req.handleError(res, null, "Failed to locate the requested resource");
            } else {
                console.log(record);
                //image = record;
                this(record);
            }
        },
        function (record) {
            if (record.image && record.image.items) {
                //remove thumbnails from S3
                thumbnailer.deleteThumbnails({
                    req: req,
                    res: res,
                    record: record,
                    index: 0
                }, this);
            } else {
                this(record);
            }
        },
        function (record) {
            if (record.audio) {
                //remove audio file from S3
                fileHandler.deleteFile({
                    req: req,
                    res: res,
                    key: record.audio.key,
                    record: record
                }, this);
            } else {
                this(record);
            }
        },
        function (record) {
            if (record.file) {
                //remove audio file from S3
                fileHandler.deleteFile({
                    req: req,
                    res: res,
                    key: record.file.key,
                    record: record
                }, this);
            } else {
                this(record);
            }
        },
        function () {
            req.db.collection(COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function (err, result) {
                if (err) {
                    req.handleError(res, err.message, "Failed to delete the requested resource");
                } else {
                    res.status(204).json(result).end();
                }
            });
        }
    );
};

exports.deleteAll = function (req, res) {
    'use strict';
    var COLLECTION = getCollection(req.params);
    req.db.collection(COLLECTION).deleteMany({}, function (err, result) {
        if (err) {
            req.handleError(res, err.message, "Failed to delete the requested resource");
        } else {
            res.status(204).json(result).end();
        }
    });
};
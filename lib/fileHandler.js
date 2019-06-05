var AWS = require('aws-sdk'),
    fs = require('fs'),
    flow = require('flow'),
    helpers = require("./helpers");

const checkIfValidS3Config = exports.checkIfValidS3Config = () => {
    const bucket = process.env.AWS_S3_BUCKET;
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secret = process.env.AWS_SECRET_ACCESS_KEY;
    return bucket && accessKey && secret;
} 

exports.transferFile = function (opts, callback) {
    'use strict';
    var s3 = new AWS.S3(),
        req = opts.req,
        res = opts.res,
        file = opts.file,
        uuID = helpers.generateUUID(),
        key,
        extension = file.path.split(".");
    
    // throws error if not correctly configured:
    const isValid = checkIfValidS3Config();
    if (!isValid) {
        throw "Please set the following Amazon S3 environment \
        variables in order to upload images: AWS_S3_BUCKET, \
        AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY."
    }

    extension = extension[extension.length - 1].toLowerCase();
    key = uuID + "." + extension;

    // Do S3 file transfer:
    flow.exec(
        function () {
            fs.readFile(file.path, this);
        },
        function (err, data) { // Upload file to S3
            if (err) {
                req.handleError(res, err, "Failed to read file.");
            } else {
                console.log("transferring...", key);
                console.log(process.env.AWS_S3_BUCKET, key);
                s3.putObject({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: key,
                    Body: data
                }, this);
            }
        },
        function (err, data) { //Upload Callback
            if (err) {
                req.handleError(res, err, "Failed to put image onto S3");
            }
            callback({
                ETag: data.ETag,
                key: key,
                original_file_name: file.name,
                file_path: "https://s3.us-east-2.amazonaws.com/" +
                    process.env.AWS_S3_BUCKET + "/" + key
            });
        }
    );
};

exports.deleteFile = function (opts, callback) {
    'use strict';
    var s3 = new AWS.S3(),
        req = opts.req,
        res = opts.res;
        
    const isValid = checkIfValidS3Config();
    if (!isValid) {
        throw "Please set the following Amazon S3 environment \
        variables in order to upload images: AWS_S3_BUCKET, \
        AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY."
    }
    s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: opts.key
    }, function (err, data) { //Upload Callback
        if (err) {
            req.handleError(res, err, "Failed to delete file from S3");
        }
        callback(opts.record);
    });
};

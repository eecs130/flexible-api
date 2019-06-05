var AWS = require('aws-sdk'),
    fs = require('fs'),
    flow = require('flow'),
    im = require('imagemagick'),
    fileHandler = require('./fileHandler'),
    helpers = require("./helpers");

var getImageConfig = function (image) {
    'use strict';
    var uuID = helpers.generateUUID(),
        extension = image.path.split(".");
    extension = extension[extension.length - 1].toLowerCase();
    return [
        { file_path: image.path, key: uuID + "." + extension },
        { w: 640, file_path: 'tmp/resized_640', key: uuID + "_thumb640." + extension },
        { w: 300, file_path: 'tmp/resized_300', key: uuID + "_thumb300." + extension },
        { w: 64, file_path: 'tmp/resized_64', key: uuID + "_thumb64." + extension }
    ];
};

exports.generateThumbnails = function (opts, callback) {
    //because of asynchronosity, this is a recursive function:
    'use strict';
    let s3 = new AWS.S3();
    let req = opts.req;
    let res = opts.res;
    let thumb = null;

    // before doing thumbnailing, check if Amazon configured
    const isValid = fileHandler.checkIfValidS3Config();
    if (!isValid) {
        throw "Please set the following Amazon S3 environment \
        variables in order to upload images: AWS_S3_BUCKET, \
        AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY."
    }
    if (!opts.images) {
        opts.images = getImageConfig(opts.image);
    }
    thumb = opts.images[opts.index];

    console.log('Now on', opts.index, 'of', opts.images.length);
    if (opts.index >= opts.images.length) {
        // if finished, this is the exit point:
        return callback(opts.images);
    }

    // Do the thumbnailing + S3 file transfer:
    flow.exec(
        function () {
            var ext = opts.image.path.split(".");
            ext = ext[ext.length - 1].toLowerCase();
            if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'gif') {
                req.handleError(res, null, "Invalid image type (must be png, jpg, or gif).");
                return;
            }
            if (thumb.w) {
                im.resize({
                    srcPath: opts.image.path,
                    dstPath: thumb.file_path,
                    width: thumb.w
                }, this);
            } else {
                this();
            }
        },
        function (err, stdout, stderr) {
            if (err) {
                req.handleError(res, err, stdout + stderr + "Failed to generate thumbnail.");
            } else {
                fs.readFile(thumb.file_path, this);
            }
        },
        function (err, data) { // Upload file to S3
            if (err) {
                req.handleError(res, err, "Failed to read file.");
            } else {
                s3.putObject({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: thumb.key,
                    Body: data
                }, this);
            }
        },
        function (err, data) { //Upload Callback
            if (err) {
                req.handleError(res, err, "Failed to put image onto S3");
            }
            thumb.ETag = data.ETag;
            thumb.file_path = "https://s3.us-east-2.amazonaws.com/" +
                    process.env.AWS_S3_BUCKET + "/" + thumb.key;
            this();
        },
        function () {
            //note: this is a recursive function:
            ++opts.index;
            exports.generateThumbnails(opts, callback);
        }
    );
};

exports.deleteThumbnails = function (opts, callback) {
    'use strict';
    var s3 = new AWS.S3(),
        req = opts.req,
        res = opts.res,
        record = opts.record,
        thumb = record.image.items[opts.index];

    //because of asynchronosity, this is a recursive function:
    if (opts.index >= record.image.items.length) {
        callback(record);
        return; //exit the function
    }

    // if there are more thumbnails to delete, do it:
    flow.exec(
        function () {
            // go and delete image from S3:
            var params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: thumb.key
            };
            s3.deleteObject(params, this);
        },
        function (err, data) {
            // verify success or throw error:
            if (err) {
                console.log(err, err.stack);
                req.handleError(res, err.stack, "Failed to delete image from S3");
            } else {
                console.log("image deleted:", data);
                this();
            }
        },
        function () {
            //note: this is a recursive function:
            ++opts.index;
            exports.deleteThumbnails(opts, callback);
        }
    );
};



# How it works
This API has been created for learning purposes. It is intended for prototyping endpoints. However unlike other prototyping tools (e.g. json-server-heroku), data will persist across sessions in a MongoDB database. There is also support for binary media if you choose to configure an S3 Bucket. Some caveats:
* Not intended for production.
* Does not currently support sorting, filtering, limit_by, etc (though it certainly could be extended to do so).
* Does not currently support data validation / schemas (though it certainly could be extended to do so).
* I have not written tests yet.

## Endpoints
You may create as many endpoints as you wish. If the endpoint does not exist, it will be created when you POST data to it. Each endpoint will create a new MongoDB Collection (i.e. table).

## Handling Images and Files
Each of your endpoints can store any field that you wish, however
there are a few special **naming conventions** that you should use if you
want your data to be treated as an image or as an audio file:
* Images: any key that is prefaced with an **image_** string will be treated as an image.
* Audio: any key that is prefaced with an **audio_** string will be treated as an audio file.

# Setup Instructions
## Deploying to Heroku
1. Set up an empty MongoDB using the **mLab MongoDB** Add-on (use Free "Sandbox" version).
2. Create an environment variable called MONGODB_URI that points to your newly created database.

## Environment variables
In order for the app to work, you need to configure the following environment variables:
```bash
MONGODB_URI=mongodb://{{YOUR_DB_HOST}}:{{YOUR_DB_PORT}}/{{YOUR_DB_NAME}}
AWS_ACCESS_KEY_ID={{YOUR_AWS_ACCESS_KEY_ID}}
AWS_SECRET_ACCESS_KEY={{YOUR_AWS_SECRET_ACCESS_KEY}}
AWS_S3_BUCKET={{YOUR_AWS_S3_BUCKET}}
```
Only the MONGODB_URI is required. The AWS variables are only required if you wish to store images remotely.

## S3 File setup instructions (Optional)
Note that support for images and audio files (e.g. blobs) requires that you set
up an Amazon S3 Bucket. See S3 instructions for more details. If you do not need to upload images and audio, you can skip this step.

## ImageMagick
The thumbnailer requires imagemagick, which means that you will need to install imagemagick on the server that is hosting your application. Here are installation instructions on Mac and on Linux.

### Mac
```bash 
$ brew install imagemagick
```

### Linux
```bash 
$ sudo apt-get install imagemagick
```
# Instructions
This API has been created for learning purposes. Here are the rules:

## Endpoints
You may create as many endpoints as you wish. If the endpoint does not exist, it will be created when you POST data to it. Each endpoint will create a new MongoDB Collection (i.e. table).

## Handling Images and Files
Each of your endpoints can store any field that you wish, however
there are a few special **naming conventions** that you should use if you
want your data to be treated as an image or as an audio file:
* Images: any key that is prefaced with an **image_** string will be treated as an image.
* Audio: any key that is prefaced with an **audio_** string will be treated as an audio file.

# Setup Instructions
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
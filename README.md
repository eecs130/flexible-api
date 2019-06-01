# Instructions
This API has been created for learning purposes. It has been designed for
maximum flexibility. Here are the rules:

## Endpoints
You may create as many endpoints as you wish, but each must be prefixed with
your username, followed by the name of your endpoint:

`https://mmart162-api.herokuapp.com/{{username}}/{{endpoint}}/`

You may name your endpoint anything you want, and if it doesn't exist, it will be created. Each endpoint is analogous to a table.

## Naming conventions
Each of your endpoints can store any field that you wish, however
there are a few special naming conventions that you should use if you
want your data to be treated as an image or as an audio file:
* Images: any key that is prefaced with an **image_** string will be treated as an image.
* Audio: any key that is prefaced with an **audio_** string will be treated as an audio file.

# S3 File setup instructions


## Local Server

* export AWS_ACCESS_KEY_ID=XXXXX
* export AWS_SECRET_ACCESS_KEY=XXXX
* export AWS_S3_BUCKET=XXXXXXXX
* export BLITLINE_API_KEY=XXXXX

## Heroku Server

* heroku config:set AWS_ACCESS_KEY_ID=XXXXX
* heroku config:set AWS_SECRET_ACCESS_KEY=XXXX
* heroku config:set AWS_S3_BUCKET=XXXXXXXX
* heroku config:set BLITLINE_API_KEY=XXXXX

# ImageMagick
The thumbnailer requires imagemagick
## Mac
```bash 
$ brew install imagemagick
```

## Linux
```bash 
$ sudo apt-get install imagemagick
```
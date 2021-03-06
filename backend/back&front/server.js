var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var crypto = require("crypto");
var mime = require("mime");
var multer = require("multer"); //File upload (local and remote)
var sharp = require("sharp"); //Image processing
var aws = require('aws-sdk'); //AWS interaction
var fs = require('fs');
var path = require('path');
app.set('view engine', 'ejs');

//////////////////////
// GLOBAL CONSTANTS //
//////////////////////
var PORT = 8000;
var API_URL = '/api';
var LOCAL_IMAGES_PATH = 'images/';
var s3 = new aws.S3();

// Enviroment variables for DB and S3
/*var S3_BUCKET_NAME = process.env.S3_BUCKET;
var DB_HOST = process.env.RDS_HOST; 
var DB_USERNAME = process.env.RDS_USERNAME
var DB_PASSWORD = process.env.RDS_PASSWORD;
*/

//sed -i 's/"t_VALUE"/\"actual_value\"/g' server.js
var S3_BUCKET_NAME = t_S3_BUCKET_NAME;
var DB_HOST = t_DB_HOST;
var DB_USERNAME = t_DB_USERNAME;
var DB_PASSWORD = t_DB_PASSWORD;

/* //For local testing
var S3_BUCKET_NAME = 'sample bucket';
var DB_HOST = 'sample host';
var DB_USERNAME = 'paco';
var DB_PASSWORD = 'sample pass';
*/

var DB_PORT = '8000';
var DB_NAME = 'imagesdb'; 
///////////////////////
// DB Initialization //
///////////////////////
var mysql = require('mysql'); 
//Update dbConnection to automatically connect to the created DB
dbConnection = mysql.createConnection({
  host     : DB_HOST,
  user     : DB_USERNAME,
  password : DB_PASSWORD,
  port     : DB_PORT,
  database : DB_NAME
});
sql = 'CREATE TABLE images (\
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,\
        email VARCHAR(32),\
        phone VARCHAR(32),\
        url VARCHAR(255),\
        bwurl VARCHAR(255),\
        status INT(1),\
        receipt VARCHAR(255))';
dbConnection.query(sql, function (err, result) {
  console.log(sql);
  if (err) {
    //throw err;
    console.log('Error: ' + err);
    return;
  }
  console.log("Result: " + result);
});

////////////////////////////////////////////////////
// Middlewares and functions to be called in POST //
////////////////////////////////////////////////////
var fileName = '';
// MW: save uploaded image and upload it to S3 bucket
var upload = multer({
  dest: LOCAL_IMAGES_PATH, 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, LOCAL_IMAGES_PATH)
    },
    filename: function (req, file, cb) {
      console.log("====================== UPLOAD LOCAL ======================");
      crypto.pseudoRandomBytes(16, function (err, raw) {
        fileName = raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype);
        cb(null, fileName);
      });
    }
    })
});

//S3 bucket file upload auxiliary function
function uploadToS3(bucket, filename, callback) {
   fs.readFile(LOCAL_IMAGES_PATH+filename, function (err, data) {
      if (err) { throw err; }
      var base64data = new Buffer(data, 'binary');
      console.log("====================== UPLOAD TO "+bucket+" ======================");
      s3.putObject({
          Bucket: bucket,
          Key: filename,
          Body: base64data,
          ACL: 'public-read'
        },
        function (resp) {
          //if(res) console.dir(resp);
          console.log('Successfully uploaded package.');
          if (callback) {callback();}
        }
      );
   });
}

// MW: transform image to Black&White and upload it to post-S3 bucket
function processImage(req,res,next) {
  console.log("====================== BW TRANSFORMATION ======================");
  console.log("Processing image: " + req.file.originalname);
  // Transfrom to B&W
  //sharp('x.jpeg').greyscale().toFile('bw.jpeg', function(err){});
  sharp(LOCAL_IMAGES_PATH + fileName)
  .greyscale()
  .toFile(LOCAL_IMAGES_PATH + 'bw_'+fileName, function(err, info) {
    if (err) {
      console.log('Error: '+err);
      if (info) console.log('Info: '+info);
    } 
    else {
      console.log("Image processed: " + req.file.originalname);
      uploadToS3(S3_BUCKET_NAME,fileName,null);
      uploadToS3('post-'+S3_BUCKET_NAME, 'bw_'+fileName,next);
    }
  });
}

// MW: save transaction into DB and remove local files
function insertImageDB(req,res,next) {
    console.log("====================== DATABASE INSERT ======================");
    //res.send(req.files);
    sql = 'INSERT INTO images (email, phone, url, bwurl, status, receipt) VALUES ?';
    var url = 'https://' + S3_BUCKET_NAME + '.s3.amazonaws.com/' + fileName;
    var bwurl = 'https://post-' + S3_BUCKET_NAME + '.s3.amazonaws.com/' + 'bw_' + fileName;
    //hardcode status and receipt (filename, which is a random unique string)
    var status = 1;
    var receipt = fileName.split(".")[0];
    var values = [[req.body.email, req.body.phone, url , bwurl, status, receipt]];
    dbConnection.query(sql, [values], function (err, result) {
      console.log(sql);
      console.dir(values);
      if (err) throw err;
      console.log("Result: ");
      console.dir(result);
    });
    //Clear images folder
    fs.readdir(LOCAL_IMAGES_PATH, (err, files) => {
      if (err) throw error;
      console.log('Removing files:');
      for (const file of files) {
        console.log(file);
        fs.unlink(path.join(LOCAL_IMAGES_PATH, file), err => {
          if (err) throw error;
        });
      }
    });
    next();
}

////////////////////////
// HTTP-REST handling //
////////////////////////
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get('/', function(req, res) {
    res.render('index');
});
app.get('/index', function(req, res) {
    res.render('index');
});
app.get('/index.html', function(req, res) {
    res.render('index');
});

app.get('/upload', function(req, res) {
  res.render('upload', {
        submitted: false,
        error: false
      });
});

app.get('/gallery', function(req, res) {
    //Load image data from database
    sql = 'SELECT * FROM images';
    dbConnection.query(sql, function (err, result) {
      console.log(sql);
      if (err) {
        //throw err;
        console.log('Error: ' + err);
        return;
      }
      console.log("Result: ");
      console.dir(result);
      // send result to the frontend
      //console.log(JSON.stringify(result));
      res.render('gallery', {
        images: JSON.parse(JSON.stringify(result))
      });
    });
});


/* 
  POST ACTION 

  Involved middlewares: (main server logic)
  1. upload.single("image") => saves image locally
  2. processImage => transforms image to black and white, and uploads
     it to the post-S3 bucket and the raw image to the s3 bucket
  3. insertImageDB => records transaction in DB, removes files from /images  
     and sends "SELECT * FROM images" result to frontend
*/
app.post(API_URL + '/upload', upload.single("image"), processImage, insertImageDB, function(req, res) {
  res.render('upload', {
        submitted: true,
        error: false
      });
});

// Route to get all the info from the database
app.get(API_URL + '/getTable', function(req, res) {
  console.log("Received GET");
  sql = 'SELECT * FROM images';
  dbConnection.query(sql, function (err, result) {
    console.log(sql);
    if (err) {
      //throw err;
      console.log('Error: ' + err);
      return;
    }
    console.log("Result: ");
    console.dir(result);
    // send result to the frontend
    res.send(JSON.stringify(result));
  });
});

// Route to remove table 'images'
app.get(API_URL + '/removeTable', function(req, res) {
  console.log("Received GET");
  sql = 'DROP TABLE images';
  dbConnection.query(sql, function (err, result) {
    console.log(sql);
    if (err) {
      //throw err;
      console.log('Error: ' + err);
      return;
    }
    console.log("Result: ");
    console.dir(result);
    // send result to the frontend
    res.send(JSON.stringify(result));
  });
});

var server = app.listen(PORT, function() {
    console.log("Listening on port %s...", server.address().port);
});
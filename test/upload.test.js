var express    = require('express'),
	fileUpload = require('../lib/index.js'),
	app        = express(),
	cors = require('cors'),
	fileType = require('file-type'),
	chance = new require('chance')();

app.use('/form', express.static(__dirname + '/upload.test.html'));
app.use(cors());
app.use('/files', express.static(__dirname + '/uploadedfiles/'));

// default options
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }
}));

app.get('/del/:qr', function(req, res) {
	var exec = require('child_process').exec;
	var path = __dirname + '/uploadedfiles/';

	if(req.params.qr != 'all'){
		var qr = req.params.qr;
		var prs = {
			'second': 1000,
			'minute': 60000,
			'day': 90000,
			'week': 630000,
			'mouth': 2700000
		}
		prs.hasOwnProperty(qr) ? qr = prs[qr] : void(0);
		exec('cd ' + path + "&& ls -a", function (err, stdout, stderr) {
			if(!err&&!stderr){
				var files = stdout.split('\n').slice(2, stdout.split('\n').length - 1);
				for(var i in files){
					(new Date()).getTime() - files[i].split('.')[1] > parseInt(qr) ?
					exec('rm -r ' + path + files[i], function (err, stdout, stderr) {
					  console.log(stdout);
					}):
						void(0)
					;
				}
				res.json(files);
			}else{
				res.json(false);
			}
		});
	}else{
		exec('rm -r ' + path + '*', function (err, stdout, stderr) {
		  res.send(stdout);
		});
	}
});

function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

app.post('/up', function(req,res){
	if(req.body.sampleFile){
		var fs = require("fs"), name = namegen(req.body)
  	fs.writeFile( __dirname + '/uploadedfiles/' + name, new Buffer(req.body.sampleFile, "base64"), function(err) {
			err?res.send(err):res.json({
				path: 'http://localhost:4000/files/' + "my_new_file"
			});
		});
	}else{
		res.json({error: true});
	}
})

app.post('/upload', function(req, res) {
	var sampleFile, uploadPath;

	if (!req.files) {
		res.status(400).send('No files were uploaded.');
		return;
	}

	sampleFile = req.files.sampleFile;

	console.log(JSON.stringify(Object.keys(sampleFile)));

	sampleFile.name =  namegen(sampleFile);

	uploadPath = __dirname + '/uploadedfiles/' + sampleFile.name;

	sampleFile.mv(uploadPath, function(err) {
		if (err) {
			res.status(500).send(err);
		}
		else {
			res.json({
				path: 'http://localhost:4000/files/' + sampleFile.name
			});
		}
	});
});

function namegen(data){
	data.mimetype ? void(0) : data.mimetype = data.type ;
	return chance.word({length: 5}) + '.' + (new Date()).getTime() + '.' + data.mimetype.split('/')[0]
	 +  '.' + data.name.split('.')[data.name.split('.').length - 1];
}

app.all('*', function(req,res){
	res.removeHeader('Transfer-Encoding');
  res.removeHeader('X-Powered-By');
	res.status(404).end();
})

app.listen(4000, function() {
	console.log('Express server listening on port 8000');
})

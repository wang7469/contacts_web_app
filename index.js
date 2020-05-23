// include the express module which is a Node.js web application framework
var express = require("express");

// create an express application
var app = express();

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// required for reading XML files
var xml2js = require('xml2js');

var app = express();

var crypto = require('crypto');

var mysql = require("mysql");

var err_msg = '0';
var log_in = '0';

var login_name;


app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false}
));

// server listens on port 9634 for incoming connections
app.listen(9634, () => console.log('Listening on port 9634!'));

var parser = new xml2js.Parser();
var theinfo;
var con;

fs.readFile(__dirname + '/dbconfig-1.xml', function(err, data) {
	if (err) throw err;
	//console.log("data: \n" + data);
    parser.parseString(data, function (err, result) {
		if (err) throw err;
		//console.log("The first name stored in the info record:\n" + result.info.fname[0]);
    con = mysql.createConnection({
    host: result.dbconfig.host[0],
    user: result.dbconfig.user[0],
    password: result.dbconfig.password[0],
    database: result.dbconfig.database[0],
    port: result.dbconfig.port[0]
	});
});
});


//default route
app.get('/',function(req,res){
  err_msg = "0";
	res.sendFile('/client/welcome.html', {root : __dirname});
});
//navigate to login page
app.get('/login', function(req, res){
  //log_in = "1";
  res.sendFile('/client/login.html', {root : __dirname});
});

app.get('/contact', function(req, res){
  //redirect to login page if not logged in
  if(log_in == "0"){
    res.redirect('/login');
  }else{
    res.sendFile('/client/contact.html', {root : __dirname});
  }
});

app.get('/addContact', function(req, res){
  //redirect to login page if not logged in
  if(log_in == "0"){
    //log_in = "1";
    res.redirect('/login');
  }else{
    res.sendFile('/client/addContact.html', {root : __dirname});
  }
});

app.get('/stock', function(req, res){
  //redirect to login page if not logged in
  if(log_in == "0"){
    res.redirect('/login');
  }else{
    res.sendFile('/client/stock.html', {root : __dirname});
  }
});

app.get('/admin', function(req, res){
  //redirect to login page if not logged in
  if(log_in == "0"){
    res.redirect('/login');
 }else{
    res.sendFile('/client/adminpage.html', {root : __dirname});
  }
});

app.get('/logout', function(req, res) {
	if(log_in == "0") {
		res.send('Not logged in yet, cannot log out!');
	} else {
		console.log ("Successfully Logged Out!");
		req.session.destroy();
		//res.send("Logged out!");
		res.redirect('/login');
	}
});

app.use(express.urlencoded());

app.post("/postContactEntry", function(req, res){
  var contactName = req.body.contactName;
  var email = req.body.email;
  var address = req.body.address;
  var phoneNumber = req.body.phoneNumber;
  var favoritePlace = req.body.favoritePlace;
  var favoritePlaceURL = req.body.favoritePlaceURL;

  var rowToBeInserted = {
      contact_name: contactName,
      contact_email: email,
      contact_address: address,
      contact_phone: phoneNumber,
      contact_favoriteplace: favoritePlace,
      contact_favoriteplaceurl: favoritePlaceURL,
    };


  con.query('INSERT tbl_contacts SET ?', rowToBeInserted, function(err, result) {  //Parameterized insert
        if(err) throw err;
        console.log("Contact info inserted");
      });
  res.redirect("/contact");

})

app.post("/login_submit", function(req, res){
  var username = req.body.username;
  username = String(username);
  var password = req.body.password;


    var acc_password = crypto.createHash('sha256').update(password).digest('base64');
    acc_password = String(acc_password);

    var sql = ``;
    con.query("SELECT * FROM tbl_accounts WHERE acc_login = '" + username + "' AND acc_password = '" + acc_password + "'", function(err, result) {
      if(err)throw err;
      //if login page entered info not in the database
      //validation failed
      if(result.length == 0) {
        console.log("wrong login info");
        //res.session.login = 0;
        log_in = '0';
        err_msg = '1';
        res.redirect("/login");
      }else{
        //validation success
        //create user session
        console.log("login success!");
        log_in = "1";
        login_name = username;
        console.log(login_name);
        //req.session.login = 1;
        res.redirect("/contact");
      }
    });

});



app.get('/getContact', function (req, res){

  con.query('SELECT * FROM tbl_contacts', function(err,rows) {
    if (err) throw err;
    if (rows.length == 0)
      console.log("No entries in table");
    else {
      //console.log(rows);
      var contactArray = [];
      for (var i = 0 ; i < rows.length; i++){
        var jsonObj = {name: rows[i].contact_name, email:rows[i].contact_email, address:rows[i].contact_address, phoneNumber:rows[i].contact_phone, favoritePlace:rows[i].contact_favoriteplace, favoritePlaceURL:rows[i].contact_favoriteplaceurl};
        //console.log(jsonObj);
        contactArray.push(jsonObj);
        //console.log(contactArray);
      }
    //  console.log(contactArray);

      }
     //console.log(contactArray);
     returnObj = {"contact": contactArray};
     responseObj = {res:returnObj};
     //console.log(returnObj);
     toSend = JSON.stringify(responseObj);
     res.send(toSend);
  });
});



app.get('/getflag',function(req,res) {
  //console.log(log_in);
	res.status(200).send(err_msg);
  //log_in = "1";
});



app.post('/addUser', function(req, res){
  var id = req.body.id;
  var name = req.body.name;
  var login = req.body.login;
  var password = crypto.createHash('sha256').update(req.body.password).digest('base64');
  console.log(req.body);

  con.query("SELECT * FROM tbl_accounts WHERE acc_login = '" + login + "'", function(err, result) {
    if(err)throw err;
    if(result.length == 0){
      console.log("Login id validated");
      con.query("INSERT INTO tbl_accounts (acc_id, acc_name, acc_login, acc_password) VALUES ('" + id + "','" + name + "','" + login + "','"+ password +"')", function(err, result){
        if(err) throw err;
        console.log("Successfully inserted new user info");
      });
      con.query("SELECT * FROM tbl_accounts WHERE acc_id = (SELECT MAX(acc_id) FROM tbl_accounts)", function(err, result) {
        if(err)throw err;
        res.send({'flag':true, 'id': result[0].acc_id});
      });
    }else{
      console.log("Login info already exist!");
      res.send({'flag':false});
    }
  });
});

app.get('/getUsers', function(req, res){
  con.query('SELECT * FROM tbl_accounts', function(err,rows) {
    if (err) throw err;
    if (rows.length == 0)
      console.log("No users exist");
    else {
      console.log(rows);
      var contactArray = [];
      for (var i = 0 ; i < rows.length; i++){
        var jsonObj = {id: rows[i].acc_id, name:rows[i].acc_name, login:rows[i].acc_login};
        //console.log(jsonObj);
        contactArray.push(jsonObj);
        //console.log(contactArray);
      }
    //  console.log(contactArray);

      }
     //console.log(contactArray);
     returnObj = {"userList": contactArray};
     responseObj = {res:returnObj};
     //console.log(returnObj);
     toSend = JSON.stringify(responseObj);
     res.send(toSend);
  });

});

app.post("/updateUser", function(req, res){
  var id = req.body.id;
  var name = req.body.name;
  var login = req.body.login;
  var password = crypto.createHash('sha256').update(req.body.password).digest('base64');;
  console.log(req.body);

  con.query("SELECT 1 FROM tbl_accounts WHERE acc_login = '" + login + "'", function(err, result) {
    if(err)throw err;
    if(result.length == 0){
      console.log("Login id validated");
      con.query("UPDATE tbl_accounts SET acc_name= '" + name + "'WHERE acc_id = '" + id + "'", function(err, result){
        if(err) throw err;
      });
      con.query("UPDATE tbl_accounts SET acc_login= '" + login + "'WHERE acc_id = '" + id + "'", function(err, result){
        if(err) throw err;
      });
      con.query("UPDATE tbl_accounts SET acc_password = '" + password + "'WHERE acc_id = '" + id + "'", function(err, result){
        if(err) throw err;
      });

      res.send({'flag':true});
    }else{
      console.log("Login info already exist!");
      res.send({'flag': false});
    }
  });

});

app.post("/deleteUser", function(req, res){
  var login = req.body.login;
  if(login == login_name){
    res.send({'flag': false});
  }else{
    con.query("DELETE FROM tbl_accounts WHERE acc_login = '" + login + "'", function(err, result) {
      if(err)throw err;
      console.log("user deleted");
      res.send({'flag':true});
    });
  }
});


app.get("/userLogin", function(req, res){
  //console.log(login_name);
  responseObj = {login:login_name};
  toSend = JSON.stringify(responseObj);
  res.status(200).send(responseObj);
});


app.get("*", function(req, res){
  //console.log("page not found");
  res.sendStatus(404);
});

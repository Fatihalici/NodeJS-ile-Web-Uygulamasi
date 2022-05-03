const express = require('express')
const app = express();
var mysql = require('mysql');
const mongoose = require('mongoose')
const readcsv = require('../models/csvNmq')
const amqp = require('amqplib');
const { Socket, Server } = require('socket.io');
const server = require('../../server');
const cars2 = require('../models/consumer')
var csvSchema = new mongoose.Schema({
    date: { type: String },
    latitude: { type: String },
    langitude: { type: String },
    carID: { type: String },

})
const io = new Server(server);



const url = 'mongodb+srv://admin:admin@nodejsblog.mokoj.mongodb.net/yazlab2?retryWrites=true&w=majority'
app.use(express.urlencoded({ extended: true }));

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    pass: "",
    database: "yazlab2"
});
const cars = mongoose.model('cars', csvSchema)

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => console.log('mongdb baglantisi kuruldu'))
    .catch((err) => console.log(err))

async function sendDatasfromMongodb(startdate, enddate, carid) {
    var z = await getDatasfromMongodb(startdate, enddate, carid);
    return z;
}

function getDatasfromMongodb(startdate, enddate, carid) {
    return new Promise(resolve => {
        cars2.find({ carID: carid }).find({
                "date": {
                    $gte: startdate,
                    $lt: enddate
                }
            },
            function(err, doc) {
                if (err) {
                    return err
                } else {
                    resolve(doc)
                }
            })
    })
}
async function sendlastminutesfromMongodb(carid) {
    var z = await getlastminutesfromMongodb(carid);
    if (z == []) {
        z = "0000-00-00 00:00"
        return z
    }
    return z[0].date;
}

function getlastminutesfromMongodb(carid) {
    return new Promise(resolve => {
        cars2.find({ carID: carid }).sort({ date: -1 }).limit(1).exec((err, lastcardate) => {
            if (err) {
                resolve("0000-00-00 00:00")
            } else {
                resolve(lastcardate)
            }
        })
    })
}


function findUserid(userID) {
    var userid
    for (var i = 0; i < userID.length; i++)
        for (var name in userID[i]) {
            userid = userID[i][name];
        }
    return userid
}

function findCarid(carIDs) {
    var carIDarray = []
    for (var i = 0; i < carIDs.length; i++)
        for (var name in carIDs[i]) {
            carIDarray.push(carIDs[i][name]);
        }
    return carIDarray
}

async function sendCarIDs(UserID) {
    var z = await getCarIDs(UserID);
    return z;
}

function getCarIDs(userID) {
    return new Promise(resolve => {
        con.connect(function(err) {
            var sorgu = "SELECT carID FROM arabalar WHERE UserID = '" + userID + "'"
            con.query(sorgu, function(err, response) {
                if (err) {
                    resolve(err)
                } else {
                    resolve(response)
                }

            })
        })
    })
}

async function sendUserID(username, password) {
    var y = await getUserID(username, password);
    return y;
}

function getUserID(username, password) {
    return new Promise(resolve => {
        con.connect(function(err) {
            var sorgu = "SELECT UserID FROM kullanicilar WHERE username = '" + username + "' AND password = '" + password + "'";
            con.query(sorgu, function(err, response) {
                if (response.length === 0) {
                    resolve(err)
                } else {
                    resolve(response)
                }

            })
        });
    })
}



async function checkUser(username, password) {
    var x = await resolveAfter(username, password);
    return x;
}

function resolveAfter(username, password) {
    return new Promise(resolve => {
        con.connect(function(err) {
            var sorgu = "SELECT * FROM kullanicilar WHERE username = '" + username + "' AND password = '" + password + "'";
            con.query(sorgu, function(err, response) {
                if (response.length === 0) {
                    resolve(false)
                } else {
                    resolve(true)
                }

            })
        });


    })
}




function mySQLdb() {
    con.connect(function(err) {
        if (err) throw err;
        var sorgu = "CREATE TABLE kullanicilar (UserID INT AUTO_INCREMENT PRIMARY KEY ,username VARCHAR(30) UNIQUE KEY ,password VARCHAR(20), logintime VARCHAR(30),logouttime VARCHAR(30), islogged BOOLEAN)";
        var sorgu2 = "CREATE TABLE arabalar (UserID INT, carID  INT)"
        con.query(sorgu, function(err) {
            if (err) return;
            console.log("Tablo olusturuldu");

        })

        con.query(sorgu2, function(err) {
            if (err) return;
            console.log("araba tablosu oluşturuldu");
        })

    });
}

function sendDatatoDB(username, password, nDate, islogged, logoutDate) {
    con.connect(function(err) {
        var sorgu = "UPDATE kullanicilar SET logintime = '" + nDate + "' WHERE username = '" + username + "' AND password = '" + password + "'"
        var sorgu2 = "UPDATE kullanicilar SET islogged = '" + islogged + "' WHERE username = '" + username + "' AND password = '" + password + "'"
        var sorgu3 = "UPDATE kullanicilar SET logouttime = '" + logoutDate + "' WHERE username = '" + username + "' AND password = '" + password + "'"
        if (nDate != null)
            con.query(sorgu, function(err) {
                if (err) throw err;
                console.log("bilgiler database e eklendi");
            })
        con.query(sorgu2, function(err) {
            if (err) throw err;
            console.log("bilgiler database e eklendi2");
        })

        con.query(sorgu3, function(err) {
            if (err) throw err;
            console.log("bilgiler database e eklendi3");
        })
    })
}


exports.mySQLdb = mySQLdb;
exports.checkUser = checkUser;
exports.sendDatatoDB = sendDatatoDB;
exports.sendUserID = sendUserID;
exports.sendDatasfromMongodb = sendDatasfromMongodb;
exports.sendlastminutesfromMongodb = sendlastminutesfromMongodb;
exports.findUserid = findUserid;
exports.sendCarIDs = sendCarIDs;
exports.findCarid = findCarid;
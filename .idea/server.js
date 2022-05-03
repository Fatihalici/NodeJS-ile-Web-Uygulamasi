const express = require('express');
const app = express();
const server = module.exports = require('http').createServer(app);
const path = require('path');
const res = require('express/lib/response');
const bodyParser = require('body-parser');
const mysqlcon = require('./server/controller/controller');
const csvNmq = require('./server/models/csvNmq')
const rabbitmq = require('./server/models/consumer')
const { Server, Socket } = require("socket.io");
const io = new Server(server);
const session = require('express-session');
var counter = 0;

app.use(express.static(path.join(__dirname + '/server/views')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your secret',
    resave: true,
    saveUninitialized: true
}));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/server/views/views.html'));
})
app.get('/views', (req, res) => {
    const logoutDate = new Date().toLocaleString('en-US', {
        timeZone: 'Europe/Istanbul',
        hour12: false
    });
    isLogged = "0";
    mysqlcon.sendDatatoDB(req.session.username, req.session.password, null, isLogged, logoutDate)
    req.session.destroy()
    if (req.session == undefined)
        res.sendFile(path.join(__dirname + '/server/views/views.html'));
})
app.post('/views', async(req, res) => {
    var ress = await mysqlcon.checkUser(req.body.text, req.body.password)
    if (ress) {
        const nDate = new Date().toLocaleString('en-US', {
            timeZone: 'Europe/Istanbul',
            hour12: false
        });
        isLogged = "1";
        req.session.username = req.body.text
        req.session.password = req.body.password
        console.log("Giris Basarili");
        mysqlcon.sendDatatoDB(req.body.text, req.body.password, nDate, isLogged, null)


        var userid = await mysqlcon.sendUserID(req.body.text, req.body.password)
        userid = Object.values(JSON.parse(JSON.stringify(userid)))
        var carid = await mysqlcon.sendCarIDs(mysqlcon.findUserid(userid))
        carid = Object.values(JSON.parse(JSON.stringify(carid)))
        var carID = await mysqlcon.findCarid(carid)

        for (let i = 0; i < carID.length; i++) {
            csvNmq.readCSVnMQ(carID[i])
        }
        var date = []
        for (let i = 0; i < carID.length; i++) {
            date.push(await mysqlcon.sendlastminutesfromMongodb(carID[i]));
            setTimeout(() => {
                io.emit('send lastcarIDs', carID, date)
            }, 100)
        }
        res.sendFile(path.join(__dirname, '/server/views/mainwindow.html'))
        setTimeout(() => {
            io.emit('send carIDs', carID)
        }, 500)
    } else {
        counter++;
        if (counter % 3 == 0) {
            res.send(500, '3 kez yanlis giris yaptiniz. Lutfen dogru bilgileri giriniz')
        }
        console.log("Giris basarısız")

    }
})

mysqlcon.mySQLdb()

server.listen(3000, () => {
    console.log('Listenin on port :3000')
})

io.on('connect', function(args) {
    args.on('send datetimes', async function(datas) {
        datas.startdate = datas.startdate.replace("T", " ")
        datas.enddate = datas.enddate.replace("T", " ")
        mysqlcon.sendDatasfromMongodb(datas.startdate, datas.enddate, datas.carID);
        var documents = await mysqlcon.sendDatasfromMongodb(datas.startdate, datas.enddate, datas.carID)
        io.emit('sendcardocuments', documents)

    })
    args.on('send carid', function(data) {})
    args.on('send 30mindatetime', async function(dates) {
        dates.startdate = dates.startdate.replace("T", " ")
        dates.enddate = dates.enddate.replace("T", " ")
        mysqlcon.sendDatasfromMongodb(dates.startdate, dates.enddate, dates.carID);
        var documents = await mysqlcon.sendDatasfromMongodb(dates.startdate, dates.enddate, dates.carID)
        io.emit('send30mindocuments', documents)
    })

})
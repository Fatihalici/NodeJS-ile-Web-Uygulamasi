const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse')
const mongoose = require('mongoose')
const amqp = require('amqplib');
const mongoDB = require('../controller/controller');
const sleep = t => new Promise(s => setTimeout(s, t));
const cars2 = require('./consumer')


async function sendlastDate(carid) {
    var x = await getlastDate(carid)
    if (x != [] && x > "0000-00-00 00:00") {
        return x[0].date
    } else
        x = "0000-00-00 00:00"
    return x
}

function getlastDate(carid) {
    return new Promise(resolve => {
        cars2.find({ carID: carid }).sort({ date: -1 }).limit(1).exec((err, lastcardate) => {
            if (err || lastcardate == []) {
                resolve("0000-00-00 00:00")
            } else {
                resolve(lastcardate)
            }
        })
    })

}

var connection
var channel
var assertion
async function connect_() {
    connection = await amqp.connect("amqp://localhost:")
    channel = await connection.createChannel();
    assertion = await channel.assertQueue("carsQueue")
    console.log("connected");
}
connect_()

async function readCSVnMQ(carIDs) {
    var state = await sendlastDate(carIDs)
    var data = fs.readFileSync(path.resolve(__dirname, 'allCars_clean.csv')).toLocaleString();
    var rows = data.split("\n"); // SPLIT ROWS
    console.log(state);
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const columns = row.split(","); //SPLIT COLUMNS
        if (carIDs == parseInt(columns[3])) {
            try {
                var message = {
                    date: columns[0],
                    latitude: columns[1],
                    langitude: columns[2],
                    carID: columns[3].replace("\r", "")
                }
                if (message.date > state) {
                    channel.sendToQueue("carsQueue", Buffer.from(JSON.stringify(message)))
                    await sleep(1000)

                }

            } catch (error) {}
        }
    }
}


exports.readCSVnMQ = readCSVnMQ
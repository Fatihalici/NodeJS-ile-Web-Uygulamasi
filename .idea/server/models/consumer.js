const amqp = require('amqplib');
const mongoose = require('mongoose')

const sleep = t => new Promise(s => setTimeout(s, t));
var csvSchema = new mongoose.Schema({
    date: { type: String },
    latitude: { type: String },
    langitude: { type: String },
    carID: { type: String },

})
const cars2 = mongoose.model('cars2', csvSchema)
module.exports = mongoose.model('cars2', csvSchema)

var connection
var channel
var assertion
async function connect_() {
    connection = await amqp.connect("amqp://localhost:")
    channel = await connection.createChannel();
    assertion = await channel.assertQueue("carsQueue")
    console.log("connected");
}


async function connect_rabbitmq() {
    await connect_()
    channel.consume("carsQueue", function(data) {
        sleep(1000)
        var user = JSON.parse(data.content.toString())
        var carData = new cars2(user)
        carData.save()
    }, {
        noAck: true
    })


}
connect_rabbitmq()
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q0qwx.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()
app.use(cors());
app.use(express.json());
app.use(express.static('doctors'));
app.use(fileUpload());

const port = 5000;

app.get('/', (req, res) => {
    res.send("hello from db it's working working")
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const appointmentCollection = client.db("doctorsPortal").collection("appointments");
    const doctorCollection = client.db("doctorsPortal").collection("doctors");

    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        console.log(appointment);
        appointmentCollection.insertOne(appointment)
            .then(result => {
                res.send(result)
            })
    });
    // Render all the appointments
    app.get('/appointments', (req, res) => {
        appointmentCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });
    app.get('/approvedAppointments', (req, res) => {
        appointmentCollection.find({ status: 'approved' })
            .toArray((err, documents) => {
                res.send(documents);
            })
    });
    // Find appointments. For doctor all the appointments will be visible. For patients only his/her information will be available.
    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body.date;
        appointmentCollection.find({ date: date })
            .toArray((err, documents) => {
                console.log(documents)
                res.send(documents);
            })
    });

    // Update the action of patients
    app.patch('/update/:id', (req, res) => {
        appointmentCollection.updateOne({ _id: ObjectId(req.params.id) },
            {
                $set: { action: req.body.action }
            })
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    });
    // update status of appointment
    app.patch('/updateStatus/:id', (req, res) => {

        appointmentCollection.updateOne({ _id: ObjectId(req.params.id) },
            {
                $set: { status: req.body.status }
            })
            .then(result => {
                console.log(result);
                res.send(result.modifiedCount > 0)
            })
    });
    // Delete any appointment
    app.delete('/deleteAppointment/:id', (req, res) => {
        const id = ObjectId(req.params.id);
        console.log("DELETING", id);
        appointmentCollection.findOneAndDelete({ _id: id })
            .then((result) => {
                res.send(result.ok > 0);
            })
    });

    // Create a new doctor and upload image of doctor
    app.post('/addADoctor', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        doctorCollection.insertOne({ name, email, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    });

    // Render all the doctors from doctorCollection
    app.get('/doctors', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });
    // Check if logged in user is a doctor or not
    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0);
            })
    });
    // Check if logged in user is a doctor or not reading email from URL
    app.get("/doctorCheck/:email", (req, res) => {
        // console.log(req.params.email);
        doctorCollection.find({ email: req.params.email }).toArray((err, items) => {
            res.send(items.length > 0);
        });
    });

});


app.listen(process.env.PORT || port)
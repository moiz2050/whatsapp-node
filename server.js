// Importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.port || 9001;

const pusher = new Pusher({
    appId: '1079381',
    key: 'e9beb284750752f78269',
    secret: 'b5f2a2db709559f4c0f7',
    cluster: 'eu',
    encrypted: true
  });

// middlewares
app.use(express.json());
app.use(cors());

// DB config
const connection_url = 'mongodb+srv://admin:kr7rz0Zcj6pCHobV@cluster0.mt8uq.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once("open", () => {
    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name : messageDetails.name,
                message : messageDetails.message,
                timestamp : messageDetails.timestamp,
                received : messageDetails.received
            });
        } else {
            console.log('Error triggering pusher');
        }
    })
})


//???

// api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    const dbMessage = req.body;

    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
});

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})

// listener
app.listen(port, () => console.log(`Listening to localhost:${port}`));
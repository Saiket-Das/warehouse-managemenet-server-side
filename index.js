const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()


const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();


// Middleware 
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@cluster0.9ntna.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    await client.connect()
    const inventroyCollection = client.db('inventory').collection('car');


    try {

        // ALL CAR INVENTORY 
        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = inventroyCollection.find(query)
            const cars = await cursor.toArray(cursor)
            res.send(cars);
        })

        // SINGLE CAR DETAILS 
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const carDetails = await inventroyCollection.findOne(query);
            res.send(carDetails)
        })
    }

    finally {

    }
}
run().catch(console.dir)




app.get('/', (req, res) => {
    res.send('Warehouse Inventory Node.js running')
})

app.listen(port, (req, res) => {
    console.log('Warehouse Inventory Node.js running', port)
})
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
    const inventoryCollection = client.db('inventory').collection('car');
    const orderCollection = client.db('usersOrder').collection('order');


    try {

        /* --------------- INVENTORY ----------------*/



        // ALL CAR INVENTORY
        app.get('/inventory', async (req, res) => {
            const email = req.query.email;

            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            let query = {};
            const cursor = inventoryCollection.find(query);

            let cars;
            if (!page && !size && !email) {
                const cursor = inventoryCollection.find(query)
                const cars = await cursor.toArray(cursor)
            }
            else if (page || size) {
                cars = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                if (email) {
                    const query = { email: email };
                    const cursor = inventoryCollection.find(query)
                    cars = await cursor.toArray();
                }
            }

            res.send(cars);
        });

        // SINGLE CAR DETAILS 
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const carDetails = await inventoryCollection.findOne(query);
            res.send(carDetails)
        })

        // ADD NEW CAR 
        app.post('/inventory', async (req, res) => {
            const newCar = req.body;
            const addNewCar = await inventoryCollection.insertOne(newCar);
            res.send(addNewCar);
        })

        // DELETE CAR 
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const deleteCar = await inventoryCollection.deleteOne(query);
            res.send(deleteCar)
        })

        // PRODUCT COUNT 
        app.get('/totalCar', async (req, res) => {
            const count = await inventoryCollection.estimatedDocumentCount();
            res.send({ count });
        });



        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const updateDetails = req.body;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };

            const updateManuallyQuantity = updateDetails.Quantity;
            const updateDescription = updateDetails.Description;

            const decraseQuantity = updateDetails.updateQuantity;

            if (decraseQuantity) {
                const updateData = {
                    $set: {
                        quantity: decraseQuantity
                    }
                };
                const result = await inventoryCollection.updateOne(query, updateData, options);
                res.send(result);
            }

            else if (updateManuallyQuantity) {
                const updatedDoc = {
                    $set: {
                        quantity: updateManuallyQuantity,
                        description: updateDescription
                    }
                };
                const result = await inventoryCollection.updateOne(query, updatedDoc, options);
                res.send(result);
            }

        })




        /* --------------- ORDER ----------------*/

        // NEW ORDER POST 
        app.post('/order', async (req, res) => {
            const order = req.body;
            const newOrder = await orderCollection.insertOne(order);
            res.send(newOrder);
        })

        // GET ORDER  
        app.get('/order', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = orderCollection.find(query)
            const cars = await cursor.toArray(cursor)
            res.send(cars);
        })

        // GET SPECIFIC ORDER WITH ID 
        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const carDetails = await orderCollection.findOne(query);
            res.send(carDetails)
        })

        // DELETE ORDER 
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            // const query = { email: email };
            const deleteOrder = await orderCollection.deleteOne(query);
            res.send(deleteOrder)
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
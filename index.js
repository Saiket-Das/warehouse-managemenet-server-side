const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()


const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { decode } = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();


// Middleware 
app.use(cors())
app.use(express.json());



function verifyJWT(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = header.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN,
        (err, decoded) => {
            if (err) {
                return res.status(403).send({ message: "Forbidden access" })
            }
            req.decoded = decoded;
            next();
        }
    )
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@cluster0.9ntna.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    await client.connect()
    const inventoryCollection = client.db('inventory').collection('car');
    const orderCollection = client.db('usersOrder').collection('order');
    const reviewCollection = client.db('customer').collection('review');


    try {
        /* --------------- USER ----------------*/
        app.post('/login', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN,
                { expiresIn: '1d' }
            );
            res.send({ token })
        })


        /* --------------- INVENTORY API ----------------*/

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


        // MANAGE INVENTORY 
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




        /* --------------- ORDER API ----------------*/

        // NEW ORDER POST 
        app.post('/order', async (req, res) => {
            const order = req.body;
            const newOrder = await orderCollection.insertOne(order);
            res.send(newOrder);
        })

        // GET ORDER  
        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;

            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query)
                const cars = await cursor.toArray(cursor)
                res.send(cars);
            }

            else {
                res.status(403).send({ message: "Forbidden access" })
            }
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




        /* --------------- CUSTOMER REVIEW ----------------*/

        app.post('/review', async (req, res) => {
            const order = req.body;
            const newOrder = await reviewCollection.insertOne(order);
            res.send(newOrder);
        })

        // GET ORDER  
        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query)
            const cars = await cursor.toArray(cursor)
            res.send(cars);
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
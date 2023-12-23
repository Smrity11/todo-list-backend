const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ikoswdf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("todoDb").collection("users");
    const allTodoList = client.db("todoDb").collection("allTodo");


        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
            res.send({ token });
          })
      
          // middlewares 
          const verifyToken = (req, res, next) => {
            // console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
              return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
              if (err) {
                return res.status(401).send({ message: 'unauthorized access' })
              }
              req.decoded = decoded;
              next();
            })
          }


              // users related api
     app.get('/users' , async (req, res) => {
        const result = await userCollection.find().toArray();
        res.send(result);
      });
    
  
      app.post('/users', async (req, res) => {
        const user = req.body;
        // insert email if user doesnt exists: 
        // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
        const query = { email: user.email }
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: 'user already exists', insertedId: null })
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
      });


      app.post('/allTodo', async (req, res) => {
        const item = req.body;
        const result = await allTodoList.insertOne(item);
        res.send(result);
      });

      app.get('/allTodo', async (req, res) => {
        const result = await allTodoList.find().toArray();
        res.send(result);
      });

      app.delete('/allTodo/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await allTodoList.deleteOne(query);
        res.send(result);
      })

     // Update a ToDo item
     app.put('/updateTodo/:id', async (req, res) => {
      const todoId = req.params.id;
      const updatedText = req.body.task; // Use 'task' as the key
    
      try {
        // Update the ToDo item in the MongoDB collection
        const query = { _id: new ObjectId(todoId) };
        const update = { $set: { task: updatedText } };
        const result = await allTodoList.updateOne(query, update);
    
        // Check if the update was successful
        if (result.modifiedCount === 1) {
          res.json({ message: 'ToDo updated successfully' });
        } else {
          res.status(404).json({ error: 'ToDo not found' });
        }
      } catch (error) {
        console.error('Error updating ToDo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('todo is sitting')
  })
  
  app.listen(port, () => {
    console.log(`todo is sitting on port ${port}`);
  })


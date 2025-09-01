require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r4vhlna.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //DB AND COLLECTION STARTS
    const db = client.db("Pet-Shop-Project");
    const usersCollections = db.collection("Users");
    const productsCollections = db.collection("Products");
    const petCollections = db.collection("Pet");
    const breedCollections=db.collection("Breeds")
    //DB AND COLLECTION ENDS

    //user info adding to the db

    // API endpoint to add user info
    app.post("/users", async (req, res) => {
      try {
        const userInfo = req.body;
        console.log(userInfo);

        // Check if user already exists by email
        const existingUser = await usersCollections.findOne({
          email: userInfo.email,
        });
        if (existingUser) {
          return res.status(409).json({ message: "User already exists" });
        }

        // Insert new user
        const result = await usersCollections.insertOne(userInfo);
        if (result.insertedId) {
          res.status(201).json({
            message: "User added successfully",
            userId: result.insertedId,
          });
        } else {
          res.status(500).json({ message: "Failed to add user" });
        }
      } catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Server error", error: error.message });
      }
    });

    //getting user role from the db
    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollections.findOne({ email });

      res.send({ role: user.role || "user" });
    });

    //  products realted api
    app.post("/add-product", async (req, res) => {
      const productInfo = req.body;
      console.log(productInfo);
      const result = await productsCollections.insertOne(productInfo);
      res.send(result);
    });

    // Get first 9 products from productsCollections
    app.get("/homepage/products", async (req, res) => {
      try {
        const products = await productsCollections.find().limit(9).toArray();
        res.send(products);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch products" });
      }
    });

    app.get("/products", async (req, res) => {
      const products = await productsCollections.find().toArray();
      res.send(products);
    });
    //PET UPLOAD API TO THE DB
    app.post("/add-pet", async (req, res) => {
      const petData = req.body;
      const result = await petCollections.insertOne(petData);
      res.send(result);
    });

    app.get('/pets',async (req,res)=>{
      
      const result=await petCollections.find({status:'approved'}).toArray()
      res.send(result)
    })

    app.get('/admin/pets',async (req,res)=>{
      
      const result=await petCollections.find().toArray()
      res.send(result)
    })

    //pet status approve api
    app.patch('/admin/pets/:id/approve',async (req,res)=>{
      const id=req.params.id
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid pet id" });
      }
      const filter={_id:new ObjectId(id)}

      const updatedDoc={
        $set:{
          status:'approved',
          approvedAt: new Date()
        }
      }
      const result=await petCollections.updateOne(filter,updatedDoc)
      res.send(result)

    })
    //BREED REALTED API
    app.post("/add-breeds", async (req, res) => {
      const breedData = req.body;
      const result = await breedCollections.insertOne(breedData);
      res.send(result);
    });
    app.get('/breeds',async(req,res)=>{
      const result=await breedCollections.find().toArray()
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

// Default  route
app.get("/", (req, res) => {
  res.send("Pet Shop Project Server is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

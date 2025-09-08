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
    const breedCollections = db.collection("Breeds");
    const cartCollections = db.collection("Carts");
    //DB AND COLLECTION ENDS

    //user REALATED API STARTS HERE

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

    // user role from the db
    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollections.findOne({ email });

      res.send({ role: user.role || "user" });
    });
    //getting all user info for admin panel
    app.get("/admin/users", async (req, res) => {
      const users = await usersCollections.find().toArray();
      res.send(users);
    });
    //make admin api starts here
    app.patch("/admin/users/:userId/make-admin", async (req, res) => {
      const userId = req.params.userId;
      const filter = { _id: new ObjectId(userId) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollections.updateOne(filter, updatedDoc);
      res.send(result);
    });

    //Remove  admin api starts here
    app.patch("/admin/users/:userId/remove-admin", async (req, res) => {
      const userId = req.params.userId;
      const filter = { _id: new ObjectId(userId) };
      const updatedDoc = {
        $set: {
          role: "user",
        },
      };
      const result = await usersCollections.updateOne(filter, updatedDoc);
      res.send(result);
    });
    //delte user
    app.delete("/admin/users/:userId", async (req, res) => {
      const userId = req.params.userId;
      const filter = { _id: new ObjectId(userId) };
      const result = await usersCollections.deleteOne(filter);
      res.send(result);
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

    app.delete("/admin/products/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid product id" });
      }
      const filter = { _id: new ObjectId(id) };
      const result = await productsCollections.deleteOne(filter);
      res.send(result);
    });

    //PET RELATED API HERE
    app.post("/add-pet", async (req, res) => {
      const petData = req.body;
      const result = await petCollections.insertOne(petData);
      res.send(result);
    });

    app.get("/pets", async (req, res) => {
      const result = await petCollections
        .find({ status: "approved" })
        .toArray();
      res.send(result);
    });

    app.get("/admin/pets", async (req, res) => {
      const result = await petCollections.find().toArray();
      res.send(result);
    });

    //pet status approve api
    app.patch("/admin/pets/:id/approve", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid pet id" });
      }
      const filter = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          status: "approved",
          approvedAt: new Date(),
        },
      };
      const result = await petCollections.updateOne(filter, updatedDoc);
      res.send(result);
    });

    //pet reject api
    app.patch("/admin/pets/:id/reject", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid pet id" });
      }
      const { rejectReason } = req.body;
      console.log(rejectReason, "reject reason");
      // filter:
      const filter = { _id: new ObjectId(id) };

      // updateDoc:
      const updatedDoc = {
        $set: {
          status: "rejected",
          rejectReason: rejectReason,
          rejectedAt: new Date(),
        },
      };
      const result = await petCollections.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.delete("/admin/pets/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid pet id" });
      }
      const filter = { _id: new ObjectId(id) };
      const result = await petCollections.deleteOne(filter);
      res.send(result);
    });

    //BREED REALTED API
    app.post("/add-breeds", async (req, res) => {
      const breedData = req.body;
      const result = await breedCollections.insertOne(breedData);
      res.send(result);
    });
    app.get("/breeds", async (req, res) => {
      const result = await breedCollections.find().toArray();
      res.send(result);
    });

    //CART RELATED API STARTS HERE
    //     app.post("/cart", async (req, res) => {
    //       const { email, item } = req.body;

    //       if (!email || !item) {
    //         return res
    //           .send(400)
    //           .json({ success: false, message: "Missing email or productId" });
    //       }
    //       const existingCart = await cartCollections.findOne({ email });

    //       if (existingCart) {
    //         // 3a️⃣ check if product already exists
    //         const existingItem = existingCart.items.find(
    //           (i) => i.petId === item.petId
    //         );
    // console.log(existingItem,"thjis is exsiting items here "
    // );
    //         if (existingItem) {
    //           // 3b️⃣ product already in cart → increase quantity
    //           existingItem.quantity += 1;
    //         } else {
    //           // 3c️⃣ product not in cart → push new item
    //           existingCart.items.push({
    //             ...item,
    //             quantity: 1,
    //           });
    //         }

    //         // 3d️⃣ update cart in DB
    //         await cartCollections.updateOne(
    //           { email },
    //           { $set: { items: existingCart.items } }
    //         );

    //         // 3e️⃣ send updated cart back to frontend
    //         return res.json(existingCart.items);
    //       } else {
    //         // 4️⃣ if user has no cart → create new cart
    //         const newCart = {
    //           email,
    //           items: [
    //             {
    //               ...item,
    //               quantity: 1,
    //             },
    //           ],
    //         };

    //         await cartCollections.insertOne(newCart);

    //         // 4a️⃣ send new cart to frontend
    //         return res.json(newCart.items);
    //       }
    //     });
    app.post("/cart", async (req, res) => {
      const { email, item } = req.body;

      if (!email || !item) {
        return res
          .status(400)
          .json({ success: false, message: "Missing email or item" });
      }

      const existingCart = await cartCollections.findOne({ email });

      if (existingCart) {
        // 3a️⃣ Check if pet already exists in the cart
        const existingPet = existingCart.items.find(
          (i) => i.petId === item.petId
        );

        if (existingPet) {
          // 3b️⃣ Pet already in cart → send a response without updating the cart
          return res.status(200).json({
            status: "exists",
            message: "Pet is already in your cart.",
          });
        } else {
          // 3c️⃣ Pet not in cart → push the new item to the cart
          existingCart.items.push(item);
        }

        // 3d️⃣ Update the cart in the database
        await cartCollections.updateOne(
          { email },
          { $set: { items: existingCart.items } }
        );

        // 3e️⃣ Send updated cart data back to the frontend
        return res
          .status(200)
          .json({ status: "added", items: existingCart.items });
      } else {
        // 4️⃣ If user has no cart → create a new cart
        const newCart = {
          email,
          items: [item],
        };

        await cartCollections.insertOne(newCart);

        // 4a️⃣ Send new cart to the frontend
        return res.status(200).json({ status: "added", items: newCart.items });
      }
    });

    //cart item delte api starts here
    
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

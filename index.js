require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const stripe = require("stripe")(process.env.STRIPE_KEY);

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
    const paymentCollections = db.collection("Payments");
    //DB AND COLLECTION ENDS

    //user REALATED API STARTS HERE

    // API endpoint to add user info
    app.post("/users", async (req, res) => {
      try {
        const userInfo = req.body;

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
    // New Arrival Pets API
    app.get("/pets/new-arrivals", async (req, res) => {
      try {
        const pets = await petCollections
          .find()
          .sort({ _id: -1 }) // latest first
          .limit(6)
          .toArray();

        res.send(pets);
      } catch (error) {
        res.status(500).send({ message: "Error fetching new arrivals", error });
      }
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
    app.post("/carts", async (req, res) => {
      const cartData = req.body;
      const { userEmail, cartItemInfo } = req.body;

      // Update existing cart document for user
      const result = await cartCollections.updateOne(
        { userEmail }, // filter by user
        { $set: { cartItemInfo: cartItemInfo } }, // overwrite existing cartItemInfo
        { upsert: true } // create if not exists
      );
      res.send(result);
    });
    //delte login user carts after payment success
    app.delete("/api/cart/clear/:userEmail", async (req, res) => {
      try {
        const userEmail = req.params.userEmail;
        const result = await cartCollections.deleteMany({ userEmail });

        res.json({
          success: true,
          message: `${result.deletedCount} cart item(s) deleted`,
        });
      } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
    //USERS CART ITEM GETTING API
    app.get("/carts", async (req, res) => {
      try {
        const userEmail = req.query.email;
        if (!userEmail)
          return res.status(400).json({ message: "Email query missing" });

        const cartItems = await cartCollections.find({ userEmail }).toArray();

        res.send(cartItems);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "this is error Server error" });
      }
    });

    //cart item delte api starts here
    app.delete("/carts/:email/:petId", async (req, res) => {
      try {
        const userEmail = req.params.email;
        const petId = req.params.petId;

        const result = await cartCollections.updateOne(
          { userEmail },
          { $pull: { cartItemInfo: { petId: petId } } }
        );

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    //STRIPE PAYMENT RELATED ALL API STARTS
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;
        if (!amount)
          return res.status(400).json({ message: "Amount is required" });
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });
    //saving payment info in the db
    app.post("/payments", async (req, res) => {
      try {
        const paymentData = req.body;
        const result = await paymentCollections.insertOne(paymentData);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.get("/payments/orders", async (req, res) => {
      const result = await paymentCollections.find().toArray();
      res.send(result);
    });
    //GETTING LOG IN USER PAYMENT/ORDER DATA
    app.get("/payments/specific/order", async (req, res) => {
      const email = req.query.email;
      console.log("thi sis user email", email);
      if (!email)
        return res.status(400).json({ message: "Email query missing" });
      const result = await paymentCollections.find({ email }).toArray();
      res.send(result);
    });
    // GET /users/orders/count?email=pet@admin.com
    app.get("/users/orders/count", async (req, res) => {
      try {
        const userEmail = req.query.email;

        if (!userEmail) {
          return res.status(400).json({ message: "Email query missing" });
        }

        // MongoDB aggregation
        const result = await paymentCollections
          .aggregate([
            { $match: { email: userEmail } }, // filter by user email
            { $count: "totalOrders" }, // count matching documents
          ])
          .toArray();

        // if no order
        const totalOrders = result.length > 0 ? result[0].totalOrders : 0;

        res.json({ totalOrders });
      } catch (error) {
        console.error("Error fetching total orders:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // Update Order Status API
    app.patch("/orders/:id/status", async (req, res) => {
      try {
        const orderId = req.params.id;
        const { status } = req.body;

        const validStatuses = [
          "Received",
          "Processing",
          "Shipped",
          "Delivered",
        ];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: "Invalid status value" });
        }

        const result = await paymentCollections.updateOne(
          { _id: new ObjectId(orderId) },
          { $set: { orderStatus: status } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Order not found" });
        }

        res.json({ message: "Order status updated successfully", status });
      } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app.delete("/orders/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await paymentCollections.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Order not found" });
        }

        res.json({ success: true, message: "Order deleted successfully" });
      } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
    //STRIPE PAYMENT RELATED ALL API ENDS
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

const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const User = require('./models/users');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');  
const Product = require('./models/Products');
const Razorpay = require('razorpay');

app.use(cors());

dotenv.config();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET =  process.env.JWT_SECRET;

app.get('/', (req, res, next) => {
    res.send("Welcome to Soni Store");
});


// Register Route
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Create and save the new user
        const user = new User({
            username: username,
            email: email,
            password: password,
        });

        await user.save(); // Save the user to the database
        res.send("User created successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating user");
    }
});

// Login Route
app.post('/login' ,async (req, res) => { // Changed from GET to POST for security
    try {
        const { email, password } = req.body;

        // Find user with matching email and password
        const user = await User.findOne({ email: email, password: password });
        
        if (user) {
            const token = jwt.sign({ id: user._id }, JWT_SECRET);
            res.status(200).json({ token: token });
        } else {
            res.status(401).send("Invalid email or password");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error logging in");
    }
});

app.post('/addproduct', async (req, res) => {

    const { title, description, price ,category, features ,images } = req.body;

    const product = new Product({

        title: title,
        description: description,
        price: price,
        category: category,
        features: features, 
        images: images

    });

    await product.save();
    res.send(product);

})

app.get('/products', async (req, res) => {

    const products = await Product.find();
    res.json(products);

})  

app.get('/products/:id', async (req, res) => {

    const product = await Product.findById(req.params.id);
    res.json(product);
});

app.put('/addtocart', auth, async (req, res) => {

    console.log("route accessed");
    const userId = req.user.id;
    console.log(userId);
    const {productId, title, price,image, itemquantity = 0} = req.body;
    

    console.log(image);
    
    try
    {
        const user = await User.findById(userId);

        if(!user)
        {
            return res.status(404).send("User not found");
        }

        console.log("user acceseed");

        const existingItem = user.cart.find(item => item.productId === productId);
        console.log("user acceseed again" );

        if(existingItem)
        {
            existingItem.quantity += 1 + itemquantity;
            await user.save();
            console.log("user acceseed again and again" );
            res.status(200).json({ message: 'Item added to cart', cart: user.cart });
        }
        else
        {
            const quantity = itemquantity + 1;
            user.cart.push({productId, title, price,image,quantity});
            res.status(200).json({ message: 'Item added to cart', cart: user.cart });
            await user.save();
        }

    }
    catch(error)
    {
        console.error(error);
        res.status(500).send("Error adding item to cart");
    }
});

app.get('/cart', auth, async (req, res) => {
    
        const userId = req.user.id;
    
        const user = await User.findById(userId);
        console.log(user);
    
        res.json(user.cart);
    });


app.delete('/cart/:id', auth, async (req, res) => {

    const userId = req.user.id;
    const productId = req.params.id;

    const user = await User.findById(userId);

    if(!user)
    {
        return res.status(404).send("User not found");
    }
    else
    {
        user.cart = user.cart.filter(item => item.productId !== productId);
        await user.save();
        res.json(user.cart);
    }

});

app.put('/cart/:id', auth, async (req, res) => {
    
        const userId = req.user.id;
        const productId = req.params.id;
        const { quantity } = req.body;
    
        const user = await User.findById(userId);

        if(!user)
        {
            return res.status(404).send("User not found");
        }
        else
        {
            const item = user.cart.find(item => item.productId === productId);
            console.log(item);
            item.quantity += quantity;

            if(item.quantity <= 0)
            {
                user.cart = user.cart.filter(item => item.productId !== productId);
            }

            await user.save();
            res.json(user.cart);
        }
    }
);

app.post('/orders', async(req, res) => {
    const razorpay = new Razorpay({
        key_id: "rzp_test_nuYNLFgh8yEQ3O",
        key_secret: "Pq7r3WHFy20p2N5kqRoGpU3x"
    })

    const options = {
        amount: req.body.amount,
        currency: req.body.currency,
        receipt: "receipt#1",
        payment_capture: 1
    }

    try {
        const response = await razorpay.orders.create(options)

        res.json({
            order_id: response.id,
            currency: response.currency,
            amount: response.amount
        })
    } catch (error) {
        res.status(500).send("Internal server error")
    }
})

app.get("/payment/:paymentId", async(req, res) => {
    const {paymentId} = req.params;

    const razorpay = new Razorpay({
        key_id: "rzp_test_nuYNLFgh8yEQ3O",

        key_secret: "Pq7r3WHFy20p2N5kqRoGpU3x"
    })
    
    try {
        const payment = await razorpay.payments.fetch(paymentId)

        if (!payment){
            return res.status(500).json("Error at razorpay loading")
        }

        res.json({
            status: payment.status,
            method: payment.method,
            amount: payment.amount,
            currency: payment.currency
        })
    } catch(error) {
        res.status(500).json("failed to fetch")
    }
})

app.get('/getorders', auth, async (req, res) => {

    const userId = req.user.id;
    console.log(userId);
    const user = await User.findById(userId);
    if(!user)
    {
        res.status(404).send("User not found");
    }
    else
    {
        res.json(user.orders);
    }



});

app.put('/setorders', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { orders } = req.body;
        console.log(orders);
        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Push the new order(s) into the orders array
        if (Array.isArray(orders)) {
            user.orders.push(...orders); // Spread to add each item in the array
        } else {
            user.orders.push(orders); // Add a single order ID
        }

        if(req.headers.orders !== "true")
        {

            user.cart = [];
        }
        // Save the updated user document
        await user.save();

        // Respond with the updated orders array
        res.send(user.orders);
    } catch (error) {
        console.error("Error updating orders:", error);
        res.status(500).send("An error occurred while updating orders.");
    }
});

app.get('/search', async (req, res) => {
    const { query } = req.query; 

    if (!query) {
        return res.status(400).send("Search query is required");
    }

    try {
        
        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } }, 
                { category: { $regex: query, $options: 'i' } }, 
                { description: { $regex: query, $options: 'i' } } 
            ]
        });

        if (products.length === 0) {
            return res.status(404).send("No products found");
        }

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while searching");
    }
});


app.post('/address', auth, async (req, res) => {

    const userId = req.user.id;
    const { name, addressLine1, addressLine2, city, state, pincode} = req.body;

    const user = await User.findById(userId);

    if(user)
    {
        user.address.push({name, addressLine1, addressLine2, city, state, pincode});
        await user.save();
        res.json(user.address);
    }
    else
    {
        res.status(404).send("User not found");
    }

});

app.get('/address', auth, async (req, res) => {
    
        const userId = req.user.id;
        const user = await User.findById(userId);
    
        if(user)
        {
            res.json(user.address);
        }
        else
        {
            res.status(404).send("User not found");
        }
    
    });

app.get('/profile', auth, async (req, res) => {

    const userId = req.user.id;
    const user = await User.findById(userId);

    if(user)
    {
        res.json(user);
    }
    else
    {
        res.status(404).send("User not found");
    }

});

app.put('/profile', auth, async (req, res) => {

    const userId = req.user.id;
    const { username, email } = req.body;

    const user = await User.findById(userId);

    if(user)
    {
        user.username = username;
        user.email = email;
        await user.save();
        res.json(user);
    }
    else
    {
        res.status(404).send("User not found");
    }

});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

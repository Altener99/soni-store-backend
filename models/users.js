const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({

    productId: String,
  title: String,
  price: Number,
  quantity: {
    type: Number,
    default: 1,
  },
  image: String,


});

const ordersSchema = new mongoose.Schema({

    productId: String,
    title: String,
    price: Number,
    quantity: Number,
    image: String,
    status: {

        type: String,
        default: "processing"

    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const addressSchema = new mongoose.Schema({

        name: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        pincode: String,
        country: {
            type:String, 
            default: "India"
        },
    });


const userSchema = new mongoose.Schema({

    username: {
            
            type: String,
            required: true,
    
        },

    email: {

        type: String,
        required: true,
        unique: true

    },

    password: {

        type: String,
        required: true,

    },

    cart: [cartItemSchema],
    orders: [ordersSchema],
    address: [addressSchema],
});

module.exports = mongoose.model('User', userSchema);
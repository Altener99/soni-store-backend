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
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    title: {

        type: String,
        required: true,

    },

    description: {

        type: String,
        required: true,

    },

    price: {

        type: Number,
        required: true,

    },

    category: {
            
            type: String,
            required: true,
    
        },

        features:{
            type: String,
            required: true,
        },

    images: {
                
                type: Array,
                required: true,
        
            }
});

module.exports = mongoose.model('Product', userSchema);
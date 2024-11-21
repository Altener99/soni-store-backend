pp.put('/addtocart', auth, async (req, res) => {

    const { title, price, productId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const productExists = user.cart.some(item => item.productId === productId);
    console.log(productExists);
   
    if(!user)
    {
        return res.status(404).send("User not found");
    }
    else
    {
        
        user.cart.push({ title, price, productId});
        user.save();
    }
    


    console.log(user);

    res.send("added to cart");
});

const addToCart = (product) => {

    const title = product.title;
    const price = product.price;
    const productId = product._id;
     const token = localStorage.getItem('authToken');
    console.log(title, price, productId, token);
 
    try
    {
     const response = axios.put('http://localhost:3000/addtocart', {title, price, productId},  { headers: { Authorization: `Bearer ${token}` } })
     .then((response) => {
       
       console.log(response.data);
     }
     );
    }
    catch (error)
    {
     console.error("error");
    }
     
   };
const express = require('express');
const axios = require('axios')

/*
 NodeJS application with two endpoints responsable to return and process the data from webservice. 

 Readme run instructions:
  1. Open project simple-nodejs-app
  2. npm install
  3. node server.js or nodemon server.js
*/

const app = express();

app.get('/', (req, res) => res.send('Hello world'));


/* 
 Endpoint that receives a brand_id as a query parameter and return a list of orders and its deliveries.
*/

app.get("/ordersByBrand", async (req, res, next) => {
    // validate query parameter from endpoint
    const brand_id = req.query.brand_id;

    // search all orders from webservices
    const orders = await getOrders();

    // filter all orders by brand_id 
    var orders_match_brand = orders.filter(order_element => order_element.brand_id == brand_id);

    // search all deliveries from webservices
    const deliveries = await getDeliveries();

    // loop through the array of orders with the respective brand_id
    orders_match_brand.forEach(order_element => {
        // filter all deliveries by order_id to return only the deliveries that contains the respective brand_id
        const deliveries_from_order = deliveries.filter(delivery_element => delivery_element.order_id == order_element.id);
        // save in object the respctive deliveries
        order_element.deliveries = deliveries_from_order;
    });

    // return response -> message + list of orders and its deliveries
    res.json({ message: `List of orders and its deliveries of a brand: ${brand_id}`, list_of_orders: orders_match_brand });
});

/* 
 Endpoint that receives a order_id as a query parameter and return a list of product that already has been shipped.
*/

app.get("/shippedProductsByOrder", async (req, res, next) => {
     // validate query parameter from endpoint
    const order_id = req.query.order_id;

    // search all orders from webservices
    const orders = await getOrders();

    // find order by order_id to get only the one with the respective id 
    var order_match_id = orders.find(order_element => order_element.id == order_id);

    // search all deliveries from webservices
    const deliveries = await getDeliveries();

    // filter all deliveries by order_id and shipped condition to get only the ones with the respective order id and that are already been shipped 
    const deliveries_from_order = deliveries.filter(delivery_element => delivery_element.order_id == order_match_id.id && delivery_element.shipped == true);

    // array of products to store the products and to return in response
    const list_of_products = [];

    // loop through the array of deliveries witch respective order_id and shipped = true
    deliveries_from_order.forEach(deliver_element => {
        // loop through the array of product from delivery
        deliver_element.products.forEach(product_element => {
            // find in array that stores the products if the respctive product already exists -> IF: exists sum the quantity | IF Not Exist: push product to array
            const index = list_of_products.findIndex(product_item => product_item.product_name == product_element.product_name);
            // Sum quantity
            if (index > -1) list_of_products[index].quantity += product_element.quantity;
            // push to array
            else list_of_products.push(product_element);
        });
    });

    // return response -> message + list of products with quantity
    res.json({ message: `List of product shipped by order with id: ${order_id}`, list_of_products: list_of_products });

});

/* 
 Function that return all orders from webservice.
*/

async function getOrders() {
    const response = await axios.get('https://case-study-challenges.s3-eu-west-1.amazonaws.com/BE/orders.json');
    return response.data.data;
}

/* 
 Function that return all deliveries from webservice.
*/

async function getDeliveries() {
    const response = await axios.get('https://case-study-challenges.s3-eu-west-1.amazonaws.com/BE/deliveries.json');
    return response.data.data;
}

const port = process.env.PORT || 3000;

app.listen(port, () => console.log("App listening at port:", port))

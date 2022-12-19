const express = require('express');
const path = require('path');
const app = express();

if (process.env.NODE_ENV !== "production"){
    require('dotenv').config({path:"backend/config/config.env"});
}

//Importing Routes
const post = require("./routes/post");

//using Routes
app.use("/api/v1", post);


module.exports = app;
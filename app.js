const express = require('express')
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require('path');

// require("dotenv").config({ path: "./config.env" });


const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  limit: '50mb',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '50mb' })); // Adjust '50mb' to the required limit
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


const port = 8080;


app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).send("VisionGPT Server working fine.");
});


app.use('/screenshot', express.static(path.join(__dirname, 'screenshots')));

const {screenshot} = require("./Provider/screenshot");
const {delete_image} = require("./Provider/delete_image");
const {getChatResponse} = require("./Provider/getChatResponse.js");

app.post("/api/screenshot" , screenshot);
app.post("/api/delete_img" , delete_image);

app.post("/api/getChatResponse" , getChatResponse);

app.listen(port, () => {
  console.log(`App listening on port http://localhost:${port}`)
})

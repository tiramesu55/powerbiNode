
let path = require('path');
let embedToken = require('./embedConfigService.js');
const utils = require("./utils.js");
const express = require("express");
const cors = require('cors')
const bodyParser = require("body-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
//const swaggerDocument = require('./swagger.json');

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            openapi: '3.0.0',
            title: "PowerBI",
            description: "This is a sample server for powerBI",
            servers: ['http://localhost:5300'],
            version: "1.0.1"
        }
    },
    apis: ['./src/server.js']
}

const swaggerDocument = swaggerJsDoc(swaggerOptions)

const app = express();
app.use(cors())
// Prepare server for Bootstrap, jQuery and PowerBI files
app.use('/js', express.static('./node_modules/bootstrap/dist/js/')); // Redirect bootstrap JS
app.use('/js', express.static('./node_modules/jquery/dist/')); // Redirect JS jQuery
app.use('/js', express.static('./node_modules/powerbi-client/dist/')) // Redirect JS PowerBI
app.use('/css', express.static('./node_modules/bootstrap/dist/css/')); // Redirect CSS bootstrap
app.use('/public', express.static('./public/')); // Use custom JS and CSS files
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.PORT || 5300;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

// //test for connection react 
// app.get('/test', (req,res) =>{
//     res.send({ express: 'Test from Express' });
// } );
/**
 * @swagger
 *
 * /getEmbedToken:
 *   get:
 *     description: Get token
 *     responses: 
 *       '200': 
 *          description: A successful response
 */
app.get('/getEmbedToken', async function (req, res) {

    // Validate whether all the required configurations are provided in config.json
    configCheckResult = utils.validateConfig();
    if (configCheckResult) {
        return {
            "status": 400,
            "error": configCheckResult
        };
    }
    // Get the details like Embed URL, Access token and Expiry
    let result = await embedToken.getEmbedInfo();

    // result.status specified the statusCode that will be sent along with the result object
    res.status(result.status).send(result);
});
//app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.listen(port, () => console.log(`Listening on port ${port}`));
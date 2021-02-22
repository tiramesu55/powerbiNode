
let path = require('path');
const fs = require('fs')
let embedToken = require('./embedConfigService.js');
const utils = require("./utils.js");
const express = require("express");
const cors = require('cors')
const bodyParser = require("body-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const config = require('../config/config.json')
const httpLogger = require('./httpLogger')
const logger = require('./logger')
const appInsights = require('applicationinsights');

appInsights.setup('56ef7020-f083-4c06-af79-824503358d56')
.setAutoCollectExceptions(true)
.setAutoCollectPerformance(true)
.setAutoCollectRequests(true)
.setSendLiveMetrics(true)
.start();

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

app.use(httpLogger)
  
const port = process.env.PORT || 5300;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

/**
 * @swagger
 *
 * /getReport/{reportId}:
 *   get:
 *     summary: Get report by id
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         description: String ID of the report.
 *         schema:
 *           type: string
 *     responses: 
 *       '200': 
 *          description: A successful response
 */
app.get('/getReport/:reportId', async function (req, res) {
    try {
        // Validate whether all the required configurations are provided in config.json
        configCheckResult = utils.validateConfig();
        if (configCheckResult) {
            logger.error('This broke with error: ', configCheckResult)
            return {
                "status": 400,
                "error": configCheckResult
            };
        }
        // Get the details like Embed URL, Access token and Expiry
        const result = await embedToken.getEmbedParamsForSingleReport(config.workspaceId, req.params.reportId);

        // result.status specified the statusCode that will be sent along with the result object
     //   res.status(500).send("Error");
        res.status(200).send({
            id: req.params.reportId,
            embedUrl: result.reportsDetail.embedUrl,
            accessToken: result.embedToken.token
        });
    } catch(err) {
        logger.error('This broke with error: ', err)
        res.status(502).send({
            error: err.toString()
        })
    }
});
/**
 * @swagger
 *
 * /getReportsByGroup:
 *   get:
 *     summary: Get reports by group
 *     responses: 
 *       '200': 
 *          description: A successful response
 */
app.get('/getReportsByGroup', async function (req, res) {
    try {
        // Validate whether all the required configurations are provided in config.json
        configCheckResult = utils.validateConfig();
        if (configCheckResult) {
            logger.error('This broke with error: ', configCheckResult)
            return {
                "status": 400,
                "error": configCheckResult
            };
        }
        // Get the details like Embed URL, Access token and Expiry
        let result = await embedToken.getReports(config.workspaceId);

        // result.status specified the statusCode that will be sent along with the result object
        res.status(200).send(result);
    } catch(err) {
        logger.error('This broke with error: ', err)
        res.status(500).send('Error!')
    }
});
/**
 * @swagger
 *
 * /getToken:
 *   get:
 *     summary: Get access token
 *     responses: 
 *       '200': 
 *          description: A successful response
 */
app.get('/getToken', async function (req, res) {
    try {
        // Validate whether all the required configurations are provided in config.json
        configCheckResult = utils.validateConfig();
        if (configCheckResult) {
            logger.error('This broke with error: ', configCheckResult)
            return {
                "status": 400,
                "error": configCheckResult
            };
        }
        // Get the details like Embed URL, Access token and Expiry
        let result = await embedToken.getToken();

        // result.status specified the statusCode that will be sent along with the result object
        res.status(200).send(result);
    } catch(err) {
        logger.error('This broke with error: ', err)
        res.status(500).send('Error!')
    }
});

app.listen(port, () => console.log(`Listening on port ${port}`));

let path = require('path');
var fs = require('fs')
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
 * /getReport:
 *   post:
 *     summary: Get report by id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: reportId
 *         in: formData
 *         required: true
 *         type: string
 *     responses: 
 *       '200': 
 *          description: A successful response
 */
app.post('/getReport', async function (req, res) {
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
        const result = await embedToken.getEmbedParamsForSingleReport(config.workspaceId, req.body.reportId);

        // result.status specified the statusCode that will be sent along with the result object
        res.status(200).send({
            id: req.body.reportId,
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
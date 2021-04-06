const auth = require( "./authentication.js");
const config = require("../config/config.json");
const utils = require( "./utils.js");
const PowerBiReportDetails = require("../models/embedReportConfig.js");
const EmbedConfig = require("../models/embedConfig.js");
const fetch = require('node-fetch');

const fs = require('fs')

/**
 * Generate embed token and embed urls for reports
 * @return Details like Embed URL, Access token and Expiry
 */
async function getEmbedInfo() {

    // Get the Report Embed details
    try {

        // Get report details and embed token
        const embedParams = await getEmbedParamsForSingleReport(config.workspaceId, config.reportId);

        return {
            'accessToken': embedParams.embedToken.token,
            'embedUrl': embedParams.reportsDetail,
            'expiry': embedParams.embedToken.expiration,
            'status': 200
        };
    } catch (err) {
        return {
            'status': err.status,
            'error': `Error while retrieving report embed details\r\n${err.statusText}\r\nRequestId: \n${err.headers.get('requestid')}`
        }
    }
}
/**
 * Get embed params for a single workspace
 * @param {string} workspaceId
 * @return EmbedConfig object
 */
 async function importReport(workspaceId) {
    try {
        const importInGroupApi = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/imports?datasetDisplayName=Report`;
        const headers = await getRequestHeader();

        // Get report info by calling the PowerBI REST API
        // console.log( headers )
        // console.log( __dirname + '/img/Report.pbix' )
        // fs.readFile(__dirname + '/img/Report.pbix', (err, data) => {
        //     console.log( err )
        //     console.log( data )
        // })
        const  options = {
            method: 'POST',
            headers: {
                ...headers,
               // 'Authorization': headers.Authorization
                'Content-Type': 'multipart/form-data'
            },
            body: fs.createReadStream(__dirname + '/img/Report.pbix'),
        }
  //      console.log( options )
        const result = await fetch(importInGroupApi, options)
      //  console.log(fs.createReadStream(__dirname + '/img/Report.pbix'))
        if (!result.ok) {
            throw result;
        }
        const data = await response.json();

        // Convert result in json to retrieve values
        return Promise.resolve(data);
    } catch(err){
        console.log( err )
        return Promise.reject("Error")
    }
}

/**
 * Get embed params for a single workspace
 * @param {string} workspaceId
 * @param {string} additionalDatasetId - Optional Parameter
 * @return EmbedConfig object
 */
async function getReports(workspaceId) {
    const reportInGroupApi = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports`;
    const headers = await getRequestHeader();

    // Get report info by calling the PowerBI REST API
    const result = await fetch(reportInGroupApi, {
        method: 'GET',
        headers: headers,
    })

    if (!result.ok) {
        throw result;
    }

    // Convert result in json to retrieve values
    const resultJson = await result.json();

    // Add report data for embedding
    const reportsDetails = [];
    if(Array.isArray(resultJson.value)) resultJson.value.forEach( el => reportsDetails.push({
        reportId: el.id,
        reportName: el.name
    }));
    return reportsDetails;
}


/**
 * Get embed params for a single report for a single workspace
 * @param {string} workspaceId
 * @param {string} reportId
 * @param {string} additionalDatasetId - Optional Parameter
 * @return EmbedConfig object
 */
async function getEmbedParamsForSingleReport(workspaceId, reportId, additionalDatasetId) {
    try{
        const reportInGroupApi = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`;
        const headers = await getRequestHeader();

        // Get report info by calling the PowerBI REST API
        const result = await fetch(reportInGroupApi, {
            method: 'GET',
            headers: headers,
        })

        if (!result.ok) {
            throw result;
        }

        // Convert result in json to retrieve values
        const resultJson = await result.json();

        // Add report data for embedding
        const reportDetails = new PowerBiReportDetails(resultJson.id, resultJson.name, resultJson.embedUrl);
        const reportEmbedConfig = new EmbedConfig();

        // Create mapping for report and Embed URL
        reportEmbedConfig.reportsDetail = {
            reportId: resultJson.id,
            reportName: resultJson.name,
            embedUrl: resultJson.embedUrl
        };

        // Create list of datasets
        let datasetIds = [resultJson.datasetId];

        // Append additional dataset to the list to achieve dynamic binding later
        if (additionalDatasetId) {
            datasetIds.push(additionalDatasetId);
        }

        // Get Embed token multiple resources
        reportEmbedConfig.embedToken = await getEmbedTokenForSingleReportSingleWorkspace(reportId, datasetIds, workspaceId);
        return reportEmbedConfig;
    } catch( err ){
        console.log(err)
        return {}
    }
}

/**
 * Get embed params for multiple reports for a single workspace
 * @param {string} workspaceId
 * @param {Array<string>} reportIds
 * @param {Array<string>} additionalDatasetIds - Optional Parameter
 * @return EmbedConfig object
 */
async function getEmbedParamsForMultipleReports(workspaceId, reportIds, additionalDatasetIds) {

    // EmbedConfig object 
    const reportEmbedConfig = new EmbedConfig();

    // Create array of embedReports for mapping
    reportEmbedConfig.reportsDetail = [];

    // Create Array of datasets
    let datasetIds = [];

    // Get datasets and Embed URLs for all the reports
    for (const reportId of reportIds) {
        const reportInGroupApi = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`;
        const headers = await getRequestHeader();

        // Get report info by calling the PowerBI REST API
        const result = await fetch(reportInGroupApi, {
            method: 'GET',
            headers: headers,
        })

        if (!result.ok) {
            throw result;
        }

        // Convert result in json to retrieve values
        const resultJson = await result.json();

        // Store result into PowerBiReportDetails object
        const reportDetails = new PowerBiReportDetails(resultJson.id, resultJson.name, resultJson.embedUrl);

        // Create mapping for reports and Embed URLs
        reportEmbedConfig.reportsDetail.push(reportDetails);

        // Push datasetId of the report into datasetIds array
        datasetIds.push(resultJson.datasetId);
    }

    // Append to existing list of datasets to achieve dynamic binding later
    if (additionalDatasetIds) {
        datasetIds.push(...additionalDatasetIds);
    }

    // Get Embed token multiple resources
    reportEmbedConfig.embedToken = await getEmbedTokenForMultipleReportsSingleWorkspace(reportIds, datasetIds, workspaceId);
    return reportEmbedConfig;
}

/**
 * Get Embed token for single report, multiple datasets, and an optional target workspace
 * @param {string} reportId
 * @param {Array<string>} datasetIds
 * @param {string} targetWorkspaceId - Optional Parameter
 * @return EmbedToken
 */
async function getEmbedTokenForSingleReportSingleWorkspace(reportId, datasetIds, targetWorkspaceId) {

    // Add report id in the request
    let formData = {
        'reports': [{
            'id': reportId,
            "allowEdit": true,
        }]
    };

    // Add dataset ids in the request
    formData['datasets'] = [];
    for (const datasetId of datasetIds) {
        formData['datasets'].push({
            'id': datasetId
        })
    }

    // Add targetWorkspace id in the request
    if (targetWorkspaceId) {
        formData['targetWorkspaces'] = [];
        formData['targetWorkspaces'].push({
            'id': targetWorkspaceId
        })
    }

    const embedTokenApi = "https://api.powerbi.com/v1.0/myorg/GenerateToken";
    const headers = await getRequestHeader();

    // Generate Embed token for single report, workspace, and multiple datasets. Refer https://aka.ms/MultiResourceEmbedToken
    const result = await fetch(embedTokenApi, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
    });

    if (!result.ok)
        throw result;
    return result.json();
}

/**
 * Get Embed token for multiple reports, multiple datasets, and an optional target workspace
 * @param {Array<string>} reportIds
 * @param {Array<string>} datasetIds
 * @param {String} targetWorkspaceId - Optional Parameter
 * @return EmbedToken
 */
async function getEmbedTokenForMultipleReportsSingleWorkspace(reportIds, datasetIds, targetWorkspaceId) {

    // Add dataset ids in the request
    let formData = { 'datasets': [] };
    for (const datasetId of datasetIds) {
        formData['datasets'].push({
            'id': datasetId
        })
    }

    // Add report ids in the request
    formData['reports'] = [];
    for (const reportId of reportIds) {
        formData['reports'].push({
            'id': reportId
        })
    }

    // Add targetWorkspace id in the request
    if (targetWorkspaceId) {
        formData['targetWorkspaces'] = [];
        formData['targetWorkspaces'].push({
            'id': targetWorkspaceId
        })
    }

    const embedTokenApi = "https://api.powerbi.com/v1.0/myorg/GenerateToken";
    const headers = await getRequestHeader();

    // Generate Embed token for multiple datasets, reports and single workspace. Refer https://aka.ms/MultiResourceEmbedToken
    const result = await fetch(embedTokenApi, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
    });

    if (!result.ok)
        throw result;
    return result.json();
}

/**
 * Get Embed token for multiple reports, multiple datasets, and optional target workspaces
 * @param {Array<string>} reportIds
 * @param {Array<string>} datasetIds
 * @param {Array<string>} targetWorkspaceIds - Optional Parameter
 * @return EmbedToken
 */
async function getEmbedTokenForMultipleReportsMultipleWorkspaces(reportIds, datasetIds, targetWorkspaceIds) {

    // Note: This method is an example and is not consumed in this sample app

    // Add dataset ids in the request
    let formData = { 'datasets': [] };
    for (const datasetId of datasetIds) {
        formData['datasets'].push({
            'id': datasetId
        })
    }

    // Add report ids in the request
    formData['reports'] = [];
    for (const reportId of reportIds) {
        formData['reports'].push({
            'id': reportId
        })
    }

    // Add targetWorkspace ids in the request
    if (targetWorkspaceIds) {
        formData['targetWorkspaces'] = [];
        for (const targetWorkspaceId of targetWorkspaceIds) {
            formData['targetWorkspaces'].push({
                'id': targetWorkspaceId
            })
        }
    }

    const embedTokenApi = "https://api.powerbi.com/v1.0/myorg/GenerateToken";
    const headers = await getRequestHeader();

    // Generate Embed token for multiple datasets, reports and workspaces. Refer https://aka.ms/MultiResourceEmbedToken
    const result = await fetch(embedTokenApi, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
    });

    if (!result.ok)
        throw result;
    return result.json();
}

/**
 * Get Request header
 * @return Request header with Bearer token
 */
async function getRequestHeader() {

    // Store authentication token
    let tokenResponse;

    // Store the error thrown while getting authentication token
    let errorResponse;

    // Get the response from the authentication request
    try {
        tokenResponse = await auth.getAccessToken();
    } catch (err) {
        if (err.hasOwnProperty('error_description') && err.hasOwnProperty('error')) {
            errorResponse = err.error_description;
        } else {

            // Invalid PowerBI Username provided
            errorResponse = err.toString();
        }
        return {
            'status': 401,
            'error': errorResponse
        };
    }

    // Extract AccessToken from the response
    const token = tokenResponse.accessToken;
    return {
        'Content-Type': "application/json",
        'Authorization': utils.getAuthHeader(token)
    };
}

/**
 * Get Request header
 * @return Request header with Bearer token
 */
async function getToken() {

    // Store authentication token
    let tokenResponse;

    // Store the error thrown while getting authentication token
    let errorResponse;

    // Get the response from the authentication request
    try {
        tokenResponse = await auth.getAccessToken();
    } catch (err) {
        if (err.hasOwnProperty('error_description') && err.hasOwnProperty('error')) {
            errorResponse = err.error_description;
        } else {

            // Invalid PowerBI Username provided
            errorResponse = err.toString();
        }
        return {
            'status': 401,
            'error': errorResponse
        };
    }

    // Extract AccessToken from the response
    const token = tokenResponse.accessToken;
    return {
        'token': utils.getAuthHeader(token)
    };
}

module.exports = {
    getEmbedInfo: getEmbedInfo,
    getToken: getToken,
    getReports: getReports,
    getEmbedParamsForSingleReport: getEmbedParamsForSingleReport,
    importReport: importReport
}
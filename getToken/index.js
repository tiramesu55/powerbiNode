let embedToken = require('../utils/embedConfigService.js');
const utils = require("../utils/utils.js");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    try {
        // Validate whether all the required configurations are provided in config.json
        configCheckResult = utils.validateConfig();
        if (configCheckResult) {
            context.log.error('This broke with error: ', configCheckResult)
            context.res = {
                status: 400,
                body: configCheckResult  
            };
            context.done();
        }
        // Get the details like Embed URL, Access token and Expiry
        let result = await embedToken.getToken();

        // result.status specified the statusCode that will be sent along with the result object

        context.res = {
            status: 200,
            body: result  
        };
        context.done();
    } catch(err) {
        context.log.error(err)
        context.res = {
            status: 400,
            body: `GetToken error: ${err.toString()}`  
        };
        context.done();
    }
}
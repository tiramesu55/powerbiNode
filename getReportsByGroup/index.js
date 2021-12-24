const embedToken = require('../utils/embedConfigService.js');
const utils = require("../utils/utils.js");
const config = require('../config/config.json');

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

        let result = await embedToken.getReports(config.workspaceId);

        context.res = {
            status: 200,
            body: result  
        };
        context.done();
    } catch(err) {
        context.log.error(err)
        context.res = {
            status: 502,
            body: `getReportsByGroup error: ${err.toString()}`  
        };
        context.done();
    }
}
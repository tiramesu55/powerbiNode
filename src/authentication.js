

const getAccessToken = async function () {

    // Use ADAL.js for authentication
    let adal = require("adal-node");

    let AuthenticationContext = adal.AuthenticationContext;

    // Create a config variable that store credentials from config.json
    let config = require(__dirname + "/../config/config.json");

    let authorityUrl = config.authorityUri;

if (config.authenticationMode.toLowerCase() === "serviceprincipal") {
        authorityUrl = authorityUrl.replace("common", config.tenantId);
        let context = new AuthenticationContext(authorityUrl);

        return new Promise(
            (resolve, reject) => {
                context.acquireTokenWithClientCredentials(config.scope, config.clientId, config.clientSecret, function (err, tokenResponse) {

                    // Function returns error object in tokenResponse
                    // Invalid Username will return empty tokenResponse, thus err is used
                    if (err) {
                        reject(tokenResponse == null ? err : tokenResponse);
                    }
                    resolve(tokenResponse);
                })
            }
        );
    }
}

module.exports.getAccessToken = getAccessToken;
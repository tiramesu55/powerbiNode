
// Properties for embedding the report 
class EmbedConfig {
    constructor(type, reportsDetail, embedToken) {
        this.type = type;
        this.reportsDetail = reportsDetail;
        this.embedToken = embedToken;
    }
}

module.exports = EmbedConfig;
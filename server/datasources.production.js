'use strict';

var cloudant_url = '';
if(process.env.VCAP_SERVICES) {
	var services = JSON.parse(process.env.VCAP_SERVICES);
	if(services.cloudantNoSQLDB) {
		cloudant_url = services.cloudantNoSQLDB[0].credentials.url;
	}
};

module.exports = {
  irdb: {
    url: cloudant_url || 'localhost',
    database: 'irdb',
    name: 'irdb',
    modelIndex: "",
    connector: 'cloudant',
    plugin: "retry",
    retryAttempts: 5,
    retryTimeout: 1000
  }
};

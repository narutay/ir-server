'use strict';

module.exports = function(app) {
  const debug = require('debug')('irserver:nlc');
  const NaturalLanguageClassifierV1 = require('watson-developer-cloud/natural-language-classifier/v1');
  const credentials = app.get('nlcCredentials');
  const classifierName = app.get('nlcClassifierName');
  const classifier = new NaturalLanguageClassifierV1(credentials);

  app.set('nlcEnabled', false);
  if (!credentials || !classifierName) {
    return;
  }
  classifier.listClassifiers({}, (err, response) => {
    if (err || !response) {
      debug(`not found classifier by name ${classifierName}`);
    } else {
      const classifiers = response.classifiers || [];
      classifiers.forEach((item) => {
        if (item.name === classifierName) {
          const classifierId = item.classifier_id;
          debug(`found classifier id: ${classifierId}`);
          app.set('nlcClassifierId', classifierId);
          app.set('nlcEnabled', true);
          return;
        }
      });
    }
  });
};

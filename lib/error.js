'use strict';

const ServiceUnavailableError = new Error();
ServiceUnavailableError.statusCode = 503;
ServiceUnavailableError.name = 'Error';
ServiceUnavailableError.message = 'Service Unavailable';

const InternalServerError = new Error();
InternalServerError.statusCode = 500;
InternalServerError.name = 'Error';
InternalServerError.message = 'Internal Server Error';

const NotFoundError = new Error();
NotFoundError.statusCode = 404;
NotFoundError.name = 'Error';
NotFoundError.message = 'Not Found';

const BadRequestError = new Error();
BadRequestError.statusCode = 400;
BadRequestError.name = 'Error';
BadRequestError.message = 'Bad Request';

const NotImplementedError = new Error();
NotImplementedError.statusCode = 501;
NotImplementedError.name = 'Error';
NotImplementedError.message = 'Not Implemented';

module.exports.ServiceUnavailableError = ServiceUnavailableError;
module.exports.InternalServerError = InternalServerError;
module.exports.NotFoundError = NotFoundError;
module.exports.BadRequestError = BadRequestError;
module.exports.NotImplementedError = NotImplementedError;

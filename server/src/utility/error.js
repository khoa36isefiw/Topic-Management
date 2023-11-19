function ServerError(status, code, message, details) {
    this.status = status;
    this.code = code;
    this.message = message;
    this.details = details;
    return this;
}

module.exports = ServerError;

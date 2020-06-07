"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = (req, resp, err, done) => {
    console.log(err);
    err.toJSON = () => {
        return {
            message: err.message
        };
    };
    switch (err.name) {
        case 'MongoError':
            if (err.code === 11000) {
                err.statusCode = 400;
            }
            break;
        case 'ValidationError':
            err.statusCode = 400;
            const messages = [];
            for (let name in err.errors) {
                messages.push({ message: err.errors[name].message });
            }
            err.toJSON = () => ({
                message: 'Validation error while processing your request',
                erros: messages
            });
            break;
    }
    done();
};

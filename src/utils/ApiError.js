
/**
 * @extends Error
 */
class ApiError extends Error{
    /**
     * 
     * @param {number} statusCode - the http status code of the error
     * @param {string} message -  the error message
     * @param {Array} errors  - an array of errors or aditional details
     * @param {string} stack - an error stack
     */
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.errors = errors
        this.message = message
        this.success = false
        this.data = null

        if (stack){
            this.stack = stack
        }else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export default ApiError
require('module-alias/register')

let {ExtendedLogger} = require("@logger");
let errorCodes       = require("@error-messages");
let logger           = new ExtendedLogger("api-body-validator");
const validator      = require('validator');

/**
 * @param {Object} validationCriteria => Validation Criteria
 *          @sample {
                "body" : [{
                    "email" : {
                    "$req" : true,
                    "$pattern" : "[a-z0-9]+@[a-z0-9]+\.com"
                    }
                }],
                "params" : [{
                    "exlOrPpt" : {
                    "$in" : ["xlsx", "pptx"]
                    }
                }]
                }
*/
module.exports.validate = function(validationCriteria) {
    return function (req, res, next) {
        for (let validationKey in validationCriteria) {
            if (!(validationCriteria[validationKey] instanceof Array)) {
                throw new Error(`Validation criteria for request ${validationKey} must be an array` )
            } else {
                let {isValid, errorMessage} = validateBody(req, validationCriteria[validationKey], validationKey, validationKey);
                if (!isValid) {
                    generateErrorResponse(res, errorMessage);return;
                }
            }

        }
        next();
    }
}
/**
 * Function that returns value of nested key
 * @param {Object} obj Object to get nested field from
 * @param {String} key Dot separated nested keys
 * @author Swapnil Kumar(techgenies.com)
 */
const getNestedField = (obj,key) => {
    logger.debug(key);
    let arr = key.split('.');
    for (let k of arr) {
        obj = obj[k];
        console.log(obj);
        logger.debug("key and object", k, obj);
        if(typeof obj === "undefined") {
            return obj;
        }
    }
    return obj;
}
/**
 * Function to perform type checking
 * @param {*} val Val to check type of
 * @param {*} type Type to check against
 * @returns {Boolean} Returns a boolean representing the type checking status
 * @author Swapnil Kumar(techgenies.com)
 */
const typeCheck = (val, type) => {

    if(typeof(val) == "undefined"){
        return false;
    }

    switch(type)
    {
        case "number":
            return validator.isNumeric(val.toString());
        case "boolean":
            return validator.isBoolean(val.toString());
        case "string":
            return typeof(val) == "string";
        case "object":
            return typeof(val) == "object";
        case "email":
            return validator.isEmail(val.toString());
        case "array":
            return Array.isArray(val);
    }
    return true;
}

/**
 *
 * @param {*} body => Object to validate
 * @param {*} whereInRequest  => Where the value is coming from body, query or params.
 * @author Swapnil Kumar(techgenies.com)
 */
const validateBody = function(req, body, whereInRequest, validationPath) {
    console.log(req);
    logger.debug(body, whereInRequest);
    let isValid = true;
    for (let i=0;i<body.length;i++) {
       let validationCriteria = body[i];
       for (let validationFeild in validationCriteria) {
           let validation = validationCriteria[validationFeild];
           logger.debug("validationField: ",validationFeild);
           let actualValue = getNestedField(req[whereInRequest], validationFeild);
           let isUndefined = (typeof(actualValue) === "undefined");
           logger.debug("isUndefined", isUndefined, actualValue);
           if (validation.$req === true) {
                if (!isUndefined) {
                    isValid = true;
                } else {
                    isValid = false;
                    return {
                        isValid,
                        errorMessage : `Data in  ${validationPath}.${validationFeild} is required`
                    }
                }
           }
           //for all fields inside the object which doesn't start with a $ is a nested criteria
           let onlyHasDollarReq = true;
           let hasNestedCondtion = false;
           let nonDollarRequestField = "";
           for (let key in validation) {
                if(isUndefined){
                    continue;
                }

                if (!key.startsWith("$")) {
                    hasNestedCondtion = true;
                    logger.debug("key", key, validation);
                    let criteria = {};
                    criteria[key] = validation[key];
                    let tempReq = {};
                    tempReq[validationFeild] = req[whereInRequest][validationFeild];
                    let temp = validateBody(tempReq, [criteria], validationFeild, `${validationPath}.${validationFeild}`);
                    isValid = temp.isValid;
                    if (!isValid) {
                        return temp;
                    }
                } else {
                    if (key != "$req") {
                        nonDollarRequestField = key;
                        onlyHasDollarReq = false;
                    }

                }
           }
           logger.debug(hasNestedCondtion, onlyHasDollarReq);
           if ((hasNestedCondtion && onlyHasDollarReq) || !hasNestedCondtion) {
            if (!isUndefined && validation.$type) {
                if (typeCheck(actualValue, validation.$type)) {
                    isValid = true;
                } else {
                    isValid = false;
                    return {
                         isValid,
                         errorMessage : `Data type mismatch for  ${validationPath}.${validationFeild} should be ${validation.$type}`
                     }
                }
            }
            if (!isUndefined && validation.$eq) {
                 if (validation.$eq === actualValue) {
                     isValid = true;
                 } else {
                     isValid = false;
                     return {
                         isValid,
                         errorMessage : `Data in  ${validationPath}.${validationFeild} cannot be ${actualValue}`
                     }
                 }
             }
             if (!isUndefined && validation.$in) {
                 if (validation.$in.indexOf(actualValue) > -1) {
                     isValid = true;
                 } else {
                     isValid = false;
                     return {
                         isValid,
                         errorMessage : `Data in  ${validationPath}.${validationFeild} cannot be ${actualValue}`
                     }
                 }
             }
             if (!isUndefined && validation.$pattern) {
                 let regExp = new RegExp(validation.$pattern);
                 if (actualValue.match(regExp) && actualValue.match(regExp).length > 0) {
                     isValid = true;
                 } else {
                     isValid = false;
                     return {
                         isValid,
                         errorMessage : `Data in  ${validationPath}.${validationFeild} does not match ${validation.$pattern}`
                     }
                 }
             }

        } else {
            if (!onlyHasDollarReq) {
                throw new Error(`Nested Criteria only validates $req for the parent found ${nonDollarRequestField}`);
            }

        }
       }
    }
    logger.debug("passed api validation!");
    return {isValid};
}
/**
 *
 * @param {*} errorMessage => errorMessage to send
 */
const generateErrorResponse = function(res, errorMessage) {

    res.status(400).send({
        "success" : false,
        "error" : {errorCode : "ERR002",   errorMessage }
    })
}

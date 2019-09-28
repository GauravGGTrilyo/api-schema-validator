# api-schema-validator

api-schema-validator is an express middleware designed to validate request body, params, cookies, tokens and query. If you care using special middleware which adds properties to request, this middleware can be used to validate that.

## Installation

> npm i api-schema-validator

## Usage
```
const {validate} = require("api-schema-validator");
req.post("/path", validate({
               "body" : [{
                   "email" : {
                     "$req" : true,
                     "$pattern" : "[a-z0-9]+@[a-z0-9]+\.com"
                   }
               }],
               "params" : [{
                   "fileType" : {
                    "$in" : ["xlsx", "pptx"]
                   }
               }]
               }),
               function(req, res) {
                  res.status(200).send({
                    "status" : "success",
                    "message" : "Request schema validated successfully"
                  })
               })
```
## Abbreviation used for this documentation

***body/param/query/cookie : bpqc***

## Available options

1. "$eq"     : Checks the value of any field in bpqc equals a value
2. "$in"     : Allows value in a bpqc field from a given option
3. "$req"    : Defines if parameter is required or not
4. "$type"   : accepts number|boolean|array|object|email
5. "$patter" : Validates bpqc field to be in a specific regular expression field
6. For nested body paramter validations refer to examples below

  __using dot notation__

  ***Below example ensures req.body.level1 and request.body.level1.level2 are present in the request body***
  ```
  req.post("/path", validate({
               "body" : [{
                      "level1.level2" : {
                        "$req" : true
                      }
                   }]
               }),
               function(req, res) {
                  res.status(200).send({
                    "status" : "success",
                    "message" : "Request schema validated successfully"
                  })
               })
  ```
  __using nested structure__

  ***Below example ensures if req.body.level1 is present, request.body.level1.level2 must be present in the request body***
  ```
  req.post("/path", validate({
               "body" : [{
                      "level1" : {
                        "$req" : false,
                        "level2" : {
                          "$req" : true
                        }
                      }
                   }]
               }),
               function(req, res) {
                  res.status(200).send({
                    "status" : "success",
                    "message" : "Request schema validated successfully"
                  })
               })
  ```
  > Note  : 1. Validation criteria that does not start with "$" is treated as request bpqc field.

  > 2. For nested criteria, the parent can only validate with "$req"***

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)

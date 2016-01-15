# obj-validation

## Usage
```javascript
var ObjValidation = require('obj-validation')

var rules = {
    name: {
        type: String,
        length:  8
    },
    age: {
        type: Number,
        max: 150
    }
}

var obj = {
    name: 'hal.zhong'
    age: 10000
}

var validator = new ObjValidation(rule, obj)
validator.validate()
var errors = validator.getErrors()

errors.forEach(function(msg){
    console.error(msg)
})
```


## Development
### install global tools
`npm install webpack mocha -g`

### install npm for development
`npm install`

### build
`npm run build`

### run a auto build service
`npm run dev`

### run test
`npm test`

var validation = require('./validator')
var validateForm  = require('./validateForm')
var checkers      = require('./checkers')

var objValidation          = validation
objValidation.checkers     = checkers
objValidation.validateForm = validateForm

window.objValidation = objValidation

module.exports = objValidation

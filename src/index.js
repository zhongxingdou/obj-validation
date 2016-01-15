import validation   from './validator'
import validateForm from './validateForm'
import checkers     from './checkers'

var objValidation          = validation
objValidation.checkers     = checkers
objValidation.validateForm = validateForm

if(typeof(window) !== 'undefined') {
  window.objValidation = objValidation
}

export default objValidation

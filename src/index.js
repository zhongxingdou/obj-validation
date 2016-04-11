import validation   from './validator'
import validateForm from './validateForm'
import checkers     from './checkers'

var objValidation = validation

if(typeof(window) !== 'undefined') {
  window.objValidation = objValidation
}

objValidation.install = function (option) {
  var jQuery = option.jQuery || window.jQuery
  objValidation.checkers     = checkers(jQuery)
  objValidation.validateForm = validateForm(jQuery)
}

export default objValidation

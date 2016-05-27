import validator   from './validator'
import validateForm from './validateForm'
import checkers     from './checkers'
import i18n         from './i18n'

var objValidation = validator
objValidation.i18n = i18n
objValidation.checkers = checkers

import zhLocales from './locales/zh'
i18n.addLocale('zh', zhLocales)

i18n.setCurrLocale('en')

if(typeof(window) !== 'undefined') {
  window.objValidation = objValidation
}

objValidation.install = function (option) {
  var jQuery = option.jQuery || window.jQuery
  objValidation.validateForm = validateForm(jQuery)
}

export default objValidation

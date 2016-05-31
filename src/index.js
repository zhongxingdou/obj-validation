import validator   from './validator'
import validateForm  from './validateForm'
import checkers    from './checkers'
import i18n        from './i18n'
import vueMixin    from './vueMixin'

var ObjValidation = validator
ObjValidation.i18n = i18n
ObjValidation.checkers = checkers

import zhLocales from './locales/zh'
i18n.addLocale('zh', zhLocales)

i18n.setCurrLocale('en')

ObjValidation.validateForm = validateForm

ObjValidation.vueMixin = vueMixin

export default ObjValidation

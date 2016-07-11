import validator    from './validator'
import validateForm from './validateForm'
import checkers     from './checkers'
import i18n         from './i18n'
import vueMixin     from './vueMixin'

var ObjValidation = validator

// add static member
ObjValidation.i18n = i18n
ObjValidation.validateForm = validateForm
ObjValidation.vueMixin = vueMixin

ObjValidation.addChecker(checkers)

// i18n
import zhLocales from './locales/zh'
i18n.addLocale('zh', zhLocales)

import enLocales from './locales/en'
i18n.addLocale('en', enLocales)

i18n.setCurrLocale('en')

export default ObjValidation

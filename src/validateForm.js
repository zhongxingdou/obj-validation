function ValidateForm() {
    if (this.constructor != ValidateForm) {
        return new ValidateForm.apply(this, arguments)
    }

    this.initialize.apply(this, arguments)
}

var proto = ValidateForm.prototype
var lastValue

proto.initialize = function(form, validator, option) {
    if (!option) option = {}

    var defaults = {
        immedicate: true,
        event: 'change',
        submit: true,
        validateOnSubmit: false,
        popupMessage: false,
        checkFully: true,
        excludes: ''
    }

    for (var p in defaults) {
        if (!(p in option)) {
            option[p] = defaults[p]
        }
    }

    var self = this

    this.errorElementCls = 'validator-error'
    this.form = form
    this.validator = validator
    this.option = option

    validator.onValidatedAll(function(isValid) {
        if (!isValid) {
            var invalidProps = validator.getInvalidProps()
            var alertMsges = []
            var popup = option.popupMessage
            var msg
            if (popup) {
                invalidProps.forEach(function(prop) {
                    msg = i18n(prop) + ':' + validator.getErrors(prop).join('<br>')
                    alertMsges.push(msg)
                })
            } else {
                invalidProps.forEach(function(prop) {
                    var msges = validator.getErrors(prop)

                    var el = $(form).find('[name=' + prop + ']')
                    if (el.length) {
                        if (option.excludes) {
                            var exWrap = $(option.excludes)[0]
                            if (exWrap && $.contains(exWrap, el[0])) return
                        }

                        self.toggleError(el, false, msges)
                    } else {
                        msg = i18n(prop) + ': ' + msges.join('<br>')
                        alertMsges.push(msg)
                    }
                })
            }

            if (alertMsges.length) bootbox.alert(alertMsges.join('<br>'))
        }
    })

    validator.onReset(function() {
        $('.has-error', self.form).removeClass('has-error')
        $('.' + self.errorElementCls, self.form).remove()
    })

    if (option.immedicate) {
        // @todo 仅处理那些声明了验证规则的
        $(form).on(option.event, ':input', function() {
            var el = $(this)

            if (this.hasAttribute('validelay')) return
                // .replace(/ +/g, ',').replace(/,,/g,',')

            var prop = el.attr('name')
            if (!prop) return

            if (option.excludes) {
                var exWrap = $(option.excludes)[0]
                if (exWrap && $.contains(exWrap, this)) return
            }

            if (!validator.hasRule(prop)) return

            if (validator.getProp(prop) === lastValue) return


            var relatedProps = validator.getRelatedProps(prop)
            var validateRelated = relatedProps.length > 0
            validator.validate(prop, function(isValid) {
                var msges
                if (!isValid) msges = validator.getErrors(prop)
                self.toggleError(el, isValid, msges)

                if (validateRelated) {
                    relatedProps.forEach(function(name) {
                        var rpError = validator.getErrors(name)

                        if (name === '') return
                        var rpEl = $(form).find('[name=' + name + ']')
                        if (rpEl.length) {
                            self.toggleError(rpEl, !rpError.length, rpError)
                        }
                    })
                }
            }, {
                checkFully: option.checkFully
            })

        }).on('focus', function() {
            lastValue = this.value
        })
    }

    if (option.submit && $(form).prop('tagName') === 'FORM') {
        $(form).submit(function(event) {
            if (option.validateOnSubmit) {
                event.preventDefault()
                self.validator.validate(function(isValid) {
                    if (isValid) {
                        //不会带上原来触发submit的button的值
                        $(form).submit()
                    }
                })
            } else {
                if (!validator.isValid()) {
                    event.preventDefault()
                }
            }
        })
    }
}

proto.toggleError = function(element, valid, msges) {
    var self = this

    self.removeError(element)

    if (!valid) {
        self.highlight(element)
        if (msges) {
            var errorEl = self.createErrorElement(msges)
            self.errorPlacement(errorEl, element)
        }
    } else {
        self.unhighlight(element)
    }
}

proto.createErrorElement = function(errorMsges) {
    return $('<span></span>').addClass('help-block').addClass(this.errorElementCls).html(errorMsges.join('<br>'))
}

proto.removeError = function(element) {
    var errorCls = '.' + this.errorElementCls

    if (element.parent('.input-group').length) {
        element.parent().parent().find(errorCls).remove()
    } else {
        element.parent().find(errorCls).remove()
    }
}

proto.highlight = function(element) {
    $(element).closest('.form-group').addClass('has-error')
}

proto.unhighlight = function(element) {
    $(element).closest('.form-group').removeClass('has-error')
}

proto.errorPlacement = function(error, element) {
    if (element.parent('.input-group').length) {
        error.insertAfter(element.parent())
    } else {
        error.insertAfter(element)
    }
}

module.exports = ValidateForm
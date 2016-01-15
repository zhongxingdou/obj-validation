import util from './util'

var utf8Length = function(str) {
    var s = str.length
    for (var i = str.length - 1; i >= 0; i--) {
        var code = str.charCodeAt(i)
        if (code > 0x7f && code <= 0x7ff) {
            s++
        } else if (code > 0x7ff && code <= 0xffff) {
            s += 2
        }
        if (code >= 0xDC00 && code <= 0xDFFF) {
            i--
        }
    }
    return s
}

function hasValue(value){
    return value !== undefined && value !== null && value !== ''
}

export default {
    depends: function(value, option, callback, props) {
        var dependsFilled = value.slice(1).every(function(v) {
            return hasValue(v)
        })

        var properties
        if (!dependsFilled) {
            properties = props.slice(1).map(function(p) {
                return ii8n(p)
            })
        }

        return dependsFilled || option.message || [props[0], 'depends', properties.join(', ')].join(' ')
    },

    uniq: function(value, option) {
        var getItem = option.getItem
        var checker = option.checker
        var list = option.collection || option.getCollection.call(this)

        var exists = false

        if (checker) {
            exists = list.some(function(item) {
                return checker(value, item)
            })
        } else {
            if (getItem) {
                exists = list.some(function(item) {
                    return getItem(item) === value
                })
            } else {
                exists = list.some(function(item) {
                    return value === item
                })
            }
        }

        return !exists || option.message || 'should be unique'
    },

    required: function(value, option) {
        if (option === false) return
        if (typeof option !== 'object') option = {}

        if (Array.prototype.isPrototypeOf(value)) {
            return value && value.length > 0 ? true : option.message || 'should have at least one'
        }
        return $.trim(value).length > 0 ? true : option.message || 'required'
    },

    chosed: function(value, option) {
        if (option === false) return
        if (typeof option !== 'object') option = {}

        return value != -1 ? true : option.message || 'required'
    },

    email: function(value, option) {
        if (option === false) return

        if (/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)) {
            return true
        } else {
            return option.message || 'invalid email'
        }
    },

    url: function(value, option) {
        if (option === false) return

        // contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
        if (/^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value)) {
            return true
        } else {
            return option.message || 'invalid url'
        }
    },

    date: function(value, option) {
        if (option === false) return
        return !/invalid|NaN/.test(new Date(value).toString()) ? true : (option.message || 'invalid date')
    },

    dateISO: function(value, option) {
        if (option === false) return
        return /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value) ? true : (option.message || 'invalid date ( ISO ')
    },

    number: function(value, option) {
        if (option === false) return
        return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value) ? true : (option.message || 'invalid number')
    },

    digits: function(value, option) {
        if (option === false) return
        return /^\d+$/.test(value) ? true : (option.message || 'invalid digits')
    },

    decimal: function(value, option) {
        if (typeof option === 'number') option = {
            precision: option
        }
        var result = new RegExp('^[0-9,]+(\\.\\d{0,' + option.precision + '})?$').test(value)
        return result || option.message || util.format('Please enter a correct {0} decimal', option.precision)
    },

    // based on http://en.wikipedia.org/wiki/Luhn/
    creditcard: function(value, option) {
        if (option === false) return
            // accept only spaces, digits and dashes
        if (/[^0-9 \-]+/.test(value)) {
            return false
        }
        var nCheck = 0,
            nDigit = 0,
            bEven = false,
            n, cDigit

        value = value.replace(/\D/g, '')

        // Basing min and max length on
        // http://developer.ean.com/general_info/Valid_Credit_Card_Types
        if (value.length < 13 || value.length > 19) {
            return false
        }

        for (n = value.length - 1; n >= 0; n--) {
            cDigit = value.charAt(n)
            nDigit = parseInt(cDigit, 10)
            if (bEven) {
                if ((nDigit *= 2) > 9) {
                    nDigit -= 9
                }
            }
            nCheck += nDigit
            bEven = !bEven
        }

        return (nCheck % 10) === 0 ? true : (option.message || 'invalid credit card number')
    },

    length: function(value, option) {
        if (typeof option === 'number') option = {
            max: option
        }

        var len = option.utf8Bytes ? utf8Length(value) : value.length

        if ('max' in option && 'min' in option) {
            return (len >= option.min && len <= option.max) ? true : (option.message || util.format('should between {0} and {1} characters long', option.min, option.max))
        }

        if ('max' in option) {
            return len <= option.max ? true : (option.message || util.format('should at least {0} characters', option.max))
        } else if ('min' in option) {
            return len >= option.min ? true : (option.message || util.format('should no more than {0} characters', option.min))
        }
    },

    count: function(value, option) {
        if (typeof option === 'number') option = {
            max: option
        }

        var valid = false
        if (option.max) {
            valid = value.length <= option.max ? true : (option.message || util.format('count should no more than {0}', option.max))
        }
        if (valid !== true) return valid

        if (option.min) {
            return value.length >= option.min ? true : (option.message || util.format('count should no less than {0}', option.min))
        }
    },

    min: function(value, option) {
        if (typeof option === 'number') option = {
            min: option
        }
        return value >= option.min ? true : (option.message || util.format('should less than or equal to {0}', option.min))
    },

    max: function(value, option) {
        if (typeof option === 'number') option = {
            max: option
        }
        return value <= option.max ? true : (option.message || util.format('should less than or equal to {0}', option.max))
    },

    range: function(value, option) {
        return (value >= option.min && value <= option.max) ? true : (option.message || util.format('should between {0} and {1}', option.min, option.max))
    },

    remote: function(value, option, callback) {
        var data = option.getData ? option.getData.call(this) : {}

        $.ajax($.extend(true, {
            type: 'post',
            dataType: 'json',
            data: data,
            success: function(data) {
                if(callback)callback(data.success || (option.message || data.error))
            }
        }, option.ajax))

        return 'pending'
    },

    greaterThan: function(value, option) {
        if (typeof option === 'number') option = {
            value: option
        }
        return Number(value) > option.value ? true : option.message || util.format('should greater than {0}', option.value)
    },

    lessThan: function(value, option) {
        if (typeof option === 'number') option = {
            value: option
        }
        return Number(value) < option.value ? true : option.message || util.format('should less than {0}', option.value)
    },

    compare: function(value, option, callback, props) {
        var p1 = value[0]
        var p2 = value[1]
        
        if(!hasValue(p1))return
        if(!hasValue(p2))return

        var result = false
        if (!option.type) option.type = Number
        var Type = option.type
        p1 = new Type(p1)
        p2 = new Type(p2)


        var msg = ''
        switch (option.operate) {
            case '>':
                result = p1 > p2
                msg = 'should greater than'
                break
            case '>=':
                result = p1 >= p2
                msg = 'should greater than or equal'
                break
            case '<':
                result = p1 < p2
                msg = 'should less than'
                break
            case '<=':
                result = p1 <= p2
                msg = 'should less than or equal'
                break
            case '=':
                result = p1 == p2
                msg = 'should equal'
                break
            case '!=':
                result = p1 != p2
                msg = 'should not equal'
                break
        }
        return result ? true : option.message || [props[0], msg, props[1]].join(' ')
    },

    pattern: function(value, option) {
        var regexp = ('regexp' in option) ? option.regexp : option
        if (typeof regexp === 'string') {
            regexp = new RegExp('^(?:' + regexp + ')$')
        }
        return regexp.test(value) ? true : (option.message || 'invalid format')
    },

    time: function(value, option) {
        if (option === false) return
        return /^([01]\d|2[0-3])(:[0-5]\d){1,2}$/.test(value) ? true : (option.message || 'should between 00:00 and 23:59')
    }
}
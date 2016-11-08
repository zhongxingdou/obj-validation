import util from './util'
import i18n from './i18n'

var hasValue = util.hasValue
var utf8Length = util.utf8Length
var format = util.format

function resultMaker(option, msgKey) {
  return function (valid) {
    if (valid) return valid
    if (option && option.message) return option.message

    var msg = i18n.getLocaleString(msgKey)

    if (arguments.length <= 1) {
      return msg
    }

    var params = util.arrayFrom(arguments).slice(1)
    params.unshift(msg)
    return util.format.apply(null, params)
  }
}

export default {
  depends: function(value, option, callback, props, labels) {
    var valid = value.slice(1).every(function(v) {
      return hasValue(v)
    })

    return resultMaker(option, 'depends')(valid, labels[0], labels.slice(1).join(' '))
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

    return resultMaker(option, 'uniq')(!exists)
  },

  required: function(value, option) {
    var m = resultMaker(option, 'required')

    if (!hasValue(value)) return m(false)

    if (Array.isArray(value)) {
      var m2 = resultMaker(option, 'required:array')
      return m2(value && value.length > 0)
    }

    if(typeof value === 'string') {
      return m(value.length > 0)
    }

    return true
  },

  chosed: function(value, option) {
    var unchosedValue = option && option.unchosedValue || -1
    return resultMaker(option, 'chosed')(value != unchosedValue)
  },

  email: function(value, option) {
    if (/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)) {
      return true
    } else {
      return resultMaker(option, 'email')(false)
    }
  },

  url: function(value, option) {
    // contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
    if (/^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value)) {
      return true
    } else {
      resultMaker(option, 'url')(false)
    }
  },

  date: function(value, option) {
    var valid = !/invalid|NaN/.test(new Date(value).toString())
    return resultMaker(option, 'url')(valid)
  },

  dateISO: function(value, option) {
    var valid = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value)
    return resultMaker(option, 'dateISO')(valid)
  },

  number: function(value, option) {
    var valid = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value)
    return resultMaker(option, 'number')(valid)
  },

  digits: function(value, option) {
    var valid = /^\d+$/.test(value)
    return resultMaker(option, 'digits')(valid)
  },

  decimal: function(value, option) {
    if (typeof option === 'number') {
      option = {
        precision: option
      }
    }
    var valid = new RegExp('^[0-9,]+(\\.\\d{0,' + option.precision + '})?$').test(value)
    return resultMaker(option, 'decimal')(valid, option.precision)
  },

  // based on http://en.wikipedia.org/wiki/Luhn/
  creditcard: function(value, option) {
    var m = resultMaker(option, 'creditcard')
      // accept only spaces, digits and dashes
    if (/[^0-9 \-]+/.test(value)) {
      return m(false)
    }
    var nCheck = 0,
      nDigit = 0,
      bEven = false,
      n, cDigit

    value = value.replace(/\D/g, '')

    // Basing min and max length on
    // http://developer.ean.com/general_info/Valid_Credit_Card_Types
    if (value.length < 13 || value.length > 19) {
      return m(false)
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

    return m((nCheck % 10) === 0)
  },

  length: function(value, option) {
    if (typeof option === 'number'){
      option = {
        max: option
      }
    }

    var len = option.utf8Bytes ? utf8Length(value) : value.length

    if ('max' in option && 'min' in option) {
      return resultMaker(option, 'length:between')(len >= option.min && len <= option.max, option.min, option.max)
    }

    if ('max' in option) {
      return resultMaker(option, 'length:max')(len <= option.max, option.max)
    } else if ('min' in option) {
      return resultMaker(option, 'length:min')(len >= option.min, option.min)
    }
  },

  count: function(value, option) {
    if (typeof option === 'number') {
      option = {
        max: option
      }
    }

    var valid = false
    if (option.max) {
      valid = value.length <= option.max
    }

    if (valid !== true) return resultMaker(option, 'count:max')(false, option.max)

    if (option.min) {
      return resultMaker(option, 'count:min')(value.length >= option.min, option.min)
    }
  },

  min: function(value, option) {
    if (typeof option === 'number') {
        option = {
        min: option
      }
    }
    return resultMaker(option, 'min')(value >= option.min, option.min)
  },

  max: function(value, option) {
    if (typeof option === 'number') {
        option = {
        max: option
      }
    }
    return resultMaker(option, 'max')(value <= option.max, option.max)
  },

  range: function(value, option) {
    return resultMaker(option, 'range')(value >= option.min && value <= option.max, option.min, option.max)
  },

  async: function(value, option, callback, props, labels) {
    option.validate(value, option, callback, props, labels)
    return 'pending'
  },

  greaterThan: function(value, option) {
    if (typeof option === 'number') {
      option = {
        value: option
      }
    }
    return resultMaker(option, 'greaterThan')(Number(value) > option.value, option.value)
  },

  lessThan: function(value, option) {
    if (typeof option === 'number') {
      option = {
        value: option
      }
    }
    return resultMaker(option, 'lessThan')(Number(value) < option.value, option.value)
  },

  compare: function(value, option, callback, props, labels) {
    if (typeof option === 'string') {
      option = {operate: option}
    }
    if (!option) option = {}

    var p1 = value[0]
    var p2 = value[1]

    if (!hasValue(p1)) return true
    if (!hasValue(p2)) return true

    var Type = option.type || Number
    p1 = new Type(p1)
    p2 = new Type(p2)

    var valid = false
    var key = ''
    switch (option.operate) {
      case '>':
        valid = p1 > p2
        key = 'compare:greaterThan'
        break
      case '>=':
        valid = p1 >= p2
        key = 'compare:greaterThanOrEqual'
        break
      case '<':
        valid = p1 < p2
        key = 'compare:lessThan'
        break
      case '<=':
        valid = p1 <= p2
        key = 'compare:lessThanOrEqual'
        break
      case '=':
        valid = p1 == p2
        key = 'compare:equal'
        break
      case '!=':
        valid = p1 != p2
        key = 'compare:notEqual'
        break
    }
    return resultMaker(option, key)(valid, labels[0], labels[1])
  },

  pattern: function(value, option) {
    var regexp = ('regexp' in option) ? option.regexp : option
    if (typeof regexp === 'string') {
      regexp = new RegExp('^(?:' + regexp + ')$')
    }
    return resultMaker(option, 'pattern')(regexp.test(value))
  },

  time: function(value, option) {
    var valid = /^([01]\d|2[0-3])(:[0-5]\d){1,2}$/.test(value)
    return resultMaker(option, 'time')(valid)
  }
}

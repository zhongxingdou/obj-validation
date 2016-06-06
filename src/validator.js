import EventObserver from './EventObserver'

var __checkers = {}
var __defaultParamOfRule = {}

// @todo
// 让checker按顺序号执行，这样的话，可以让远程验证在本地验证成功后再执行
// 错误消息多语言
function Validator(rules, obj, propLabels) {
  // init event
  var validEvent = ['pendingStart', 'pendingEnd', 'reset', 'validated']
  var _eventObserver = this._eventObserver = new EventObserver(validEvent)
  this.on = _eventObserver.on.bind(_eventObserver)
  this.off = _eventObserver.off.bind(_eventObserver)
  this._fire = _eventObserver.fire.bind(_eventObserver)

  this.validateErrors = {}
  this._pendingCount = 0
  this._propPendingCount = {}

  if (obj) this.setValidateTarget(obj, propLabels)

  this._validObservers = []
  this._inValidObservers = []
  this._pendingStartObservers = []
  this._pendingEndObservers = []
  this._validatedObservers = []
  this._resetObservers = []
  this.defaultParamOfRule = {}
  this.rules = rules || {}

  var myCheckers = {}
  var checkers = __checkers
  if (checkers) {
    for (var p in checkers) {
      myCheckers[p] = checkers[p]
    }
  }
  this.checkers = myCheckers

  for (var prop in rules) {
    this.addRule(prop, rules[prop])
  }
}

Validator.addChecker = function(name, checker) {
  if (typeof name === 'object') {
    Object.assign(__checkers, name)
    return
  }
  __checkers[name] = checker
}

Validator.setGlobalRuleOption = function(rule, param) {
  __defaultParamOfRule[rule] = param
}

var validateAllRunning = false
var proto = {
  setDefaultRuleOption: function(rule, param) {
    this.defaultParamOfRule[rule] = param
  },

  // 设置要验证的对象
  setTarget: function(obj, propLabels) {
    this.reset()
    if (obj) {
      this._validateTarget = obj
      this._propLabels = propLabels
    }
  },

  getPropValue: function(prop) {
    return this._validateTarget[prop]
  },

  isPropNeedCheck: function(prop) {
    return Object.keys(this._getPropRule(prop)).length > 0
  },

  _getTarget: function() {
    return this._validateTarget
  },

  _getCheckerByRule: function(name) {
    return this.checkers[name]
  },

  getInvalidProps: function() {
    var self = this
    var inValidProps = Object.keys(this.validateErrors).filter(function(prop) {
      return !self.isValid(prop)
    })
    return inValidProps
  },

  // @todo 当prop为数组时，如何让验证器，验证一次，将相关属性都标记为错误
  addRule: function(prop, name, option) {
    var self = this

    if (Array.isArray(prop)) {
      prop = prop.join(',')
    }

    if (typeof name === 'object') {
      var map = name
      for (var p in map) {
        this.addRule(prop, p, map[p])
      }
      return
    }

    if (name === 'type') {
      this._addTypeRule(prop, option)
    } else {
      this._getPropRule(prop)[name] = option
    }
  },

  _clearRules: function () {
    this.rules = {}
  },

  _addTypeRule: function(prop, type) {
    var typeRules = type.rules
    for (var rule in typeRules) {
      this.addRule(prop, rule, typeRules[rule])
    }
  },

  _getPropRule: function(prop) {
    return this.rules[prop] || (this.rules[prop] = {})
  },

  _addErrorTo: function(prop, rule, error) {
    if (arguments.length < 3 && typeof rule === 'object') {
      error = rule
      for (var aRule in error) {
        this._addErrorTo(prop, aRule, error[aRule])
      }
      return
    }

    if (!this.validateErrors[prop]) {
      this.validateErrors[prop] = {}
    }
    this.validateErrors[prop][rule] = error
  },

  _clearErrorsFor: function(prop, rule) {
    if (!rule) {
      delete this.validateErrors[prop]
    } else {
      var errors = this.validateErrors[prop]
      if (errors) {
        delete errors[rule]
        if (Object.keys(errors).length === 0) {
          delete this.validateErrors[prop]
        }
      }
    }
  },

  getErrors: function(prop) {
    if (!prop) return this._getAllErrors()

    var result = []
    var errors = this.validateErrors[prop]
    if (errors) {
      for (var rule in errors) {
        result.push(errors[rule])
      }
    }
    return result
  },

  _getAllErrors: function() {
    var result = []
    var errors = this.validateErrors
    for (var p in errors) {
      result = result.concat(this.getErrors(p))
    }
    return result
  },

  // 所有属性验证是否通过
  isValid: function() {
    if (arguments[0]) {
      return this.isPropValid(arguments[0])
    }

    var count = 0
    var errors = this.validateErrors
    for (var p in errors) {
      count += Object.keys(errors[p]).length
    }

    return count === 0
  },

  isPropValid: function(prop) {
    return !this.validateErrors[prop] || Object.keys(this.validateErrors[prop]).length === 0
  },

  validate: function(prop, callback, option) {
    var propType = typeof prop

    if (propType === 'function') {
      option = callback
      callback = prop
      prop = null
    } else if (propType === 'object') {
      option = prop
      prop = callback = null
    }

    if (callback && typeof callback === 'object') {
      option = callback
      callback = null
    }

    if (!option) option = {}

    if (prop) {
      return this._validateProp(prop, callback, option)
    } else {
      return this._validateAll(callback, option)
    }
  },

  _validateAll: function(callback, option) {
    var checkFully = option.checkFully

    if (validateAllRunning) return

    validateAllRunning = true

    if (typeof checkFully === 'function') {
      callback = checkFully
      checkFully = false
    }

    var self = this
    self.reset()

    if (callback) self._onceValidatedAll(callback)

    Object.keys(self.rules).forEach(function(prop) {
      self._validatePropExp(prop, null, option)
    })

    if (self._pendingCount === 0) {
      var result = self.isValid()

      validateAllRunning = false
      self._fire('validated', result)
      return result
    } else {
      return 'pending'
    }
  },

  _onceValidatedAll: function(observer) {
    var self = this

    var proxy = function() {
      self.unValidated(proxy)
      observer.apply(this, arguments)
    }

    self.onValidatedAll(proxy)
  },

  onPending: function(startObserver, endObserver) {
    if (startObserver) this.on('pendingStart', startObserver)
    if (endObserver) this.on('pendingEnd', endObserver)
  },

  reset: function() {
    this.validateErrors = {}
    this._pendingCount = 0
    this._propPendingCount = {}
    this._fire('reset')
  },

  _countingPending: function(props) {
    var self = this
    if (self._pendingCount === 0) {
      self._fire('pendingStart')
    }

    props.forEach(function(p) {
      if (!self._propPendingCount[p]) {
        self._propPendingCount[p] = 1
      } else {
        self._propPendingCount[p]++
      }
      self._pendingCount++
    })
  },

  _getSortedRuleNames: function(rules) {
    var ruleNames = Object.keys(rules)
    if (rules.remote) {
      var remoteAt = ruleNames.indexOf('remote')
      if (remoteAt !== ruleNames.length - 1) {
        ruleNames.splice(remoteAt, 1)
        ruleNames.push('remote')
      }
    }
    return ruleNames
  },

  _mergeRuleDefaultParam: function(rule, param) {
    var self = this
    if (param && Object.prototype.toString.call(param) === '[object Object]') {
      var globalDefault = __defaultParamOfRule[rule] || {}
      var defaultParam = self.defaultParamOfRule[rule] || {}
      param = this._deepMerge({}, globalDefault, defaultParam, param)
    }
    return param
  },

  _wrapCallback: function(props, rule, callback) {
    var self = this
    return function(result) {
      self._pendingCount--
        //props： p1+p2, 向rule相关所有属性添加错误
        props.forEach(function(p) {
          self._propPendingCount[p]--

            if (result !== true) {
              self._addErrorTo(p, rule, result)
            }

          if (self._propPendingCount[p] === 0) {
            if (self._pendingCount === 0) {
              var isValid = self.isValid()
              self._fire('pendingEnd', isValid)

              if (validateAllRunning) {
                validateAllRunning = false
                self._fire('validated', isValid)
              }
            }

            if (callback) callback(self.isValid(p))
          }
        })
    }
  },

  _getAllRuleKeyOfProp: function(prop, includeRelated) {
    var simpleExps = []
    var plusExps = []

    var rules = this.rules
    if (rules[prop]) {
      simpleExps.push(prop)
    }

    for (var exp in this.rules) {
      if (this._isGroupExp(exp)) {
        var names = this._parseGroupProps(exp)
        var i = names.indexOf(prop)
        if (i !== -1) {
          plusExps.push(exp)
        }
      }
    }

    return simpleExps.concat(plusExps)
  },

  _isGroupExp: function(exp) {
    return exp.indexOf(',') !== -1
  },

  _parseGroupProps: function(exp) {
    return exp.split(',').map(function(p) {
      return p.trim()
    })
  },

  getRelatedProps: function(prop) {
    var simpleExps = []
    var rules = this.rules

    for (var exp in this.rules) {
      if (this._isGroupExp(exp)) {
        var names = this._parseGroupProps(exp)
        var i = names.indexOf(prop)
        if (i !== -1) {
          names.splice(i, 1)
          names.forEach(function(n) {
            if (simpleExps.indexOf(n) === -1) {
              simpleExps.push(n)
            }
          })
        }
      }
    }

    return simpleExps
  },

  _validateProp: function(prop, callback, option) {
    var self = this
    var checkFully = option.checkFully

    this._clearErrorsFor(prop)

    var propExps = this._getAllRuleKeyOfProp(prop)
    var len = propExps.length
    if (!len) return

    if (len === 1) {
      return this._validatePropExp(propExps[0], callback, option)
    }

    var wrapCb = callback
    if (callback && len > 1) {
      wrapCb = function() {
        var isValid = self.isValid(prop)
        if (!isValid && !checkFully) {
          return callback(isValid)
        }

        len--
        if (len === 0) {
          callback(isValid)
        }
      }
    }

    var hasPending = false
    for (var i = 0, l = propExps.length; i < l; i++) {
      var result = this._validatePropExp(propExps[i], wrapCb, option)
      if (result === true) continue

      if (result === 'pending' && !hasPending) {
        hasPending = 'pending'
        continue
      }

      if (!checkFully) {
        return false
      }
    }

    return hasPending || self.isValid(prop)
  },

  _checkRule: function(props, rule, param, callback) {
    var self = this
    if (rule === 'type') return true

    // get value
    var value
    if (props.length > 1) {
      value = props.map(function(p) {
        return self.getPropValue(p)
      })
    } else {
      value = self.getPropValue(props[0])
      if (rule !== 'required' && (value === '' || value === null || value === undefined)) return true
    }

    var checker = self._getCheckerByRule(rule)

    //是自定义的checker， rule name也是自定义的
    if (!checker && param) {
      var pt = typeof param
      if (pt === 'function') {
        checker = param
        param = undefined
      } else if (pt === 'object' && param.checker) { //validator.addRule('p1,p2', 'check_p1_p2_sum', {checker: function(){...}, message: 'xxx'} )
        checker = param.checker
      }
    }

    if (!checker) return true

    // merge param
    param = self._mergeRuleDefaultParam(rule, param)
    if (param && param.checker) delete param.checker

    var wrapCb = self._wrapCallback(props, rule, callback)

    if (param && param.markRelatedProps) {
      props.forEach(function(p) {
        self._clearErrorsFor(p, rule)
      })
    } else {
      self._clearErrorsFor(props[0], rule)
    }

    var context = self._getTarget()

    var localeLabels = self._propLabels
    var labels = props
    if (localeLabels) {
      labels = props.map(function(p) {
        return localeLabels[p] || p
      })
    }

    var result = checker.apply(context, [value, param, wrapCb, props, labels])
    return result
  },

  //验证某个属性，callback仅用于异步验证器的回调，全是同步验证器的话，返回值即是验证结果
  _validatePropExp: function(prop, callback, option) {
    var checkFully = option.checkFully

    var self = this,
      props = self._parseGroupProps(prop),
      rules = self.rules[prop],
      errorsCount = 0

    if (!rules) {
      if (callback) callback(true)
      return true
    }

    // 把remote放到队尾
    var ruleNames = self._getSortedRuleNames(rules)

    for (var i = 0, l = ruleNames.length; i < l; i++) {
      var rule = ruleNames[i]
      var param = rules[rule]

      var result = this._checkRule(props, rule, param, callback)
      if (result === true) continue

      // counting pending
      if (result === 'pending') {
        self._countingPending(props)
      } else { // result is error message
        if (result) {
          errorsCount++

          if (param && param.markRelatedProps) {
            props.forEach(function(p) {
              self._addErrorTo(p, rule, result)
            })
          } else {
            self._addErrorTo(props[0], rule, result)
          }

          if (!checkFully) {
            break
          }
        }
      }
    }

    var valid = errorsCount === 0

    if (self._propPendingCount[props[0]] > 0) {
      return 'pending'
    }

    if (callback) {
      callback(valid)
    }

    return valid
  },

  _deepMerge: function(object) {
    var source, key, srcValue, objValue

    var isValidObj = function(o) {
      return o && typeof o === 'object'
    }

    for (var i = 1; i < arguments.length; i++) {
      source = arguments[i]
      for (key in source) {
        srcValue = source[key]
        objValue = object[key]
        if (isValidObj(srcValue) && isValidObj(objValue)) {
          this._deepMerge(objValue, srcValue)
        } else {
          object[key] = srcValue
        }
      }
    }
    return object
  }
}

// 兼容之前的版本
proto.setValidateTarget = proto.setTarget
proto.hasRule = proto.isPropNeedCheck
proto.getProp = proto.getPropValue
proto.getContext = proto._getTarget
proto.setDefaultParamForRule = proto.setDefaultRuleOption
Validator.setDefaultParamForRule = Validator.setGlobalRuleOption

// 兼容旧的事件绑定，解绑
proto.onReset = function(observer) {
  this.on('reset', observer)
}
proto.unReset = function(observer) {
  this.off('reset', observer)
}
proto.onValidatedAll = function(observer) {
  this.on('validated', observer)
}
proto.unValidated = function(observer) {
  this.off('validated', observer)
}

Validator.prototype = proto


export default Validator

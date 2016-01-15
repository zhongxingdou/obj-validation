/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var validation = __webpack_require__(1)
	var validateForm  = __webpack_require__(2)
	var checkers      = __webpack_require__(3)

	var objValidation          = validation
	objValidation.checkers     = checkers
	objValidation.validateForm = validateForm

	window.objValidation = objValidation

	module.exports = objValidation


/***/ },
/* 1 */
/***/ function(module, exports) {

	// @todo
	// 让checker按顺序号执行，这样的话，可以让远程验证在本地验证成功后再执行
	// 错误消息多语言
	function fire(self, eventType, param) {
	    var map = {
	        pendingStart: self._pendingStartObservers,
	        pendingEnd: self._pendingEndObservers,
	        validatedAll: self._validatedObservers,
	        reset: self._resetObservers
	    }

	    var observers = map[eventType]

	    if (!observers) return

	    observers.forEach(function(observer) {
	        observer(param)
	    })
	}

	function Validator(rules, obj) {
	    this.validateErrors = {}
	    this._pendingCount = 0
	    this._propPendingCount = {}

	    if(obj)this.setValidateTarget(obj)

	    this._validObservers = []
	    this._inValidObservers = []
	    this._pendingStartObservers = []
	    this._pendingEndObservers = []
	    this._validatedObservers = []
	    this._resetObservers = []
	    this.defaultParamOfRule = {}
	    this.rules = rules || {}

	    var myCheckers = {}
	    var checkers = Validator.checkers
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

	Validator.defaultParamOfRule = {}
	Validator.setDefaultParamForRule = function(rule, param) {
	    this.defaultParamOfRule[rule] = param
	}

	var validateAllRunning = false
	var proto = {
	    setDefaultParamForRule: function(rule, param) {
	        this.defaultParamOfRule[rule] = param
	    },

	    // 设置要验证的对象
	    setValidateTarget: function(obj) {
	        this.reset()
	        if (obj) this._validateTarget = obj
	    },

	    getProp: function(prop) {
	        return this._validateTarget[prop]
	    },

	    hasRule: function(prop) {
	        if (prop in this.getContext()) {
	            return Object.keys(this.getRule(prop)).length > 0
	        } else {
	            return false
	        }
	    },

	    getContext: function() {
	        return this._validateTarget
	    },

	    getCheckerByRule: function(name) {
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

	        if (Array.prototype.isPrototypeOf(prop)) {
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
	            this.getRule(prop)[name] = option
	        }
	    },

	    _addTypeRule: function(prop, type) {
	        var typeRules = type.rules
	        for (var rule in typeRules) {
	            this.addRule(prop, rule, typeRules[rule])
	        }
	    },

	    getRule: function(prop) {
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

	    isValid: function(prop) {
	        if (prop) {
	            return !this.validateErrors[prop] || Object.keys(this.validateErrors[prop]).length === 0
	        }

	        var count = 0
	        var errors = this.validateErrors
	        for (var p in errors) {
	            count += Object.keys(errors[p]).length
	        }

	        return count === 0
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

	        if(callback) self._onceValidatedAll(callback)

	        Object.keys(self.rules).forEach(function(prop) {
	            self._validatePropExp(prop, null, option)
	        })

	        if (self._pendingCount === 0) {
	            var result = self.isValid()

	            validateAllRunning = false
	            fire(self, 'validatedAll', result)
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
	        if (startObserver) {
	            this._pendingStartObservers.push(startObserver)
	        }

	        if (endObserver) {
	            this._pendingEndObservers.push(endObserver)
	        }
	    },

	    onReset: function(observer) {
	        this._resetObservers.push(observer)
	    },

	    onValidatedAll: function(observer) {
	        this._validatedObservers.push(observer)
	    },

	    unValidated: function(observer) {
	        var i = this._validatedObservers.indexOf(observer)
	        this._validatedObservers.splice(i, 1)
	    },

	    reset: function() {
	        this.validateErrors = {}
	        this._pendingCount = 0
	        this._propPendingCount = {}
	        fire(this, 'reset')
	    },

	    _countingPending: function(props) {
	        var self = this
	        if (self._pendingCount === 0) {
	            fire(self, 'pendingStart')
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
	            var globalDefault = Validator.defaultParamOfRule[rule] || {}
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
	                            fire(self, 'pendingEnd', isValid)

	                            if (validateAllRunning) {
	                                validateAllRunning = false
	                                fire(self, 'validatedAll', isValid)
	                            }
	                        }

	                        if(callback) callback(self.isValid(p))
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
	                return self.getProp(p)
	            })
	        } else {
	            value = self.getProp(props[0])
	            if (rule !== 'required' && (value === '' || value === null || value === undefined)) return true
	        }

	        var checker = self.getCheckerByRule(rule)

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

	        if (param && param.markAll) {
	            props.forEach(function(p) {
	                self._clearErrorsFor(p, rule)
	            })
	        } else {
	            self._clearErrorsFor(props[0], rule)
	        }

	        var context = self.getContext()
	        var result = checker.apply(context, [value, param, wrapCb, (props[1] ? props : props[0])])
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

	                    if (param && param.markAll) {
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

	Validator.prototype = proto

	module.exports = Validator

/***/ },
/* 2 */
/***/ function(module, exports) {

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

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(4)

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

	module.exports = {
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

/***/ },
/* 4 */
/***/ function(module, exports) {

	function format(temp) {
	    var data = Array.prototype.slice.call(arguments, 1)
	    for (var i = 0, l = data.length; i < l; i++) {
	        temp = temp.replace(new RegExp('\\{' + i + '\\}', 'g'), data[i])
	    }
	    return temp
	}

	module.exports = {
	    format: format
	}


/***/ }
/******/ ]);
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('jquery')) :
  typeof define === 'function' && define.amd ? define(['jquery'], factory) :
  (global.ObjValidation = factory(global.jQuery));
}(this, function (jQuery) { 'use strict';

  jQuery = 'default' in jQuery ? jQuery['default'] : jQuery;

  function EventObserver(validEvent) {
    this._observers = {};
    this._validEvent = validEvent;
  }

  EventObserver.prototype = {
    _isValidEvent: function _isValidEvent(eventType) {
      if (!this._validEvent) return true;
      return this._validEvent.indexOf(eventType) !== -1;
    },
    on: function on(eventType, handler) {
      if (!this._isValidEvent(eventType)) return;

      var observers = this._observers;
      var typeObservers = observers[eventType];
      if (!typeObservers) typeObservers = observers[eventType] = [];

      typeObservers.push(handler);
    },

    off: function off(eventType, handler) {
      if (!this._isValidEvent(eventType)) return;

      var observers = this._observers;
      var typeObservers = observers[eventType];
      if (!typeObservers) return;

      var i = typeObservers.indexOf(handler);
      if (i === -1) return;

      typeObservers.splice(handler, i);
    },

    fire: function fire(eventType) {
      if (!this._isValidEvent(eventType)) return;

      var observers = this._observers;
      var typeObservers = observers[eventType];
      if (!typeObservers) return;

      typeObservers.forEach(function (handler) {
        var args = Array.from(arguments).slice(1);
        handler.apply(null, args);
      });
    }
  };

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  var jsx = function () {
    var REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for && Symbol.for("react.element") || 0xeac7;
    return function createRawReactElement(type, props, key, children) {
      var defaultProps = type && type.defaultProps;
      var childrenLength = arguments.length - 3;

      if (!props && childrenLength !== 0) {
        props = {};
      }

      if (props && defaultProps) {
        for (var propName in defaultProps) {
          if (props[propName] === void 0) {
            props[propName] = defaultProps[propName];
          }
        }
      } else if (!props) {
        props = defaultProps || {};
      }

      if (childrenLength === 1) {
        props.children = children;
      } else if (childrenLength > 1) {
        var childArray = Array(childrenLength);

        for (var i = 0; i < childrenLength; i++) {
          childArray[i] = arguments[i + 3];
        }

        props.children = childArray;
      }

      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: type,
        key: key === undefined ? null : '' + key,
        ref: null,
        props: props,
        _owner: null
      };
    };
  }();

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  var __checkers = {};
  var __defaultParamOfRule = {};

  // @todo
  // 让checker按顺序号执行，这样的话，可以让远程验证在本地验证成功后再执行
  // 错误消息多语言
  function Validator(rules, obj, propLabels) {
    // init event
    var validEvent = ['pendingStart', 'pendingEnd', 'reset', 'validated'];
    var _eventObserver = this._eventObserver = new EventObserver(validEvent);
    this.on = _eventObserver.on.bind(_eventObserver);
    this.off = _eventObserver.off.bind(_eventObserver);
    this._fire = _eventObserver.fire.bind(_eventObserver);

    this.validateErrors = {};
    this._pendingCount = 0;
    this._propPendingCount = {};

    if (obj) this.setValidateTarget(obj, propLabels);

    this._validObservers = [];
    this._inValidObservers = [];
    this._pendingStartObservers = [];
    this._pendingEndObservers = [];
    this._validatedObservers = [];
    this._resetObservers = [];
    this.defaultParamOfRule = {};
    this.rules = rules || {};

    var myCheckers = {};
    var checkers = __checkers;
    if (checkers) {
      for (var p in checkers) {
        myCheckers[p] = checkers[p];
      }
    }
    this.checkers = myCheckers;

    for (var prop in rules) {
      this.addRule(prop, rules[prop]);
    }
  }

  Validator.addChecker = function (name, checker) {
    if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
      for (var p in name) {
        __checkers[p] = name[p];
      }
      return;
    }
    __checkers[name] = checker;
  };

  Validator.setGlobalRuleOption = function (rule, param) {
    __defaultParamOfRule[rule] = param;
  };

  var validateAllRunning = false;
  var proto = {
    setDefaultRuleOption: function setDefaultRuleOption(rule, param) {
      this.defaultParamOfRule[rule] = param;
    },

    // 设置要验证的对象
    setTarget: function setTarget(obj, propLabels) {
      this.reset();
      if (obj) {
        this._validateTarget = obj;
        this._propLabels = propLabels;
      }
    },

    getPropValue: function getPropValue(prop) {
      return this._validateTarget[prop];
    },

    isPropNeedCheck: function isPropNeedCheck(prop) {
      return Object.keys(this._getPropRule(prop)).length > 0;
    },

    _getTarget: function _getTarget() {
      return this._validateTarget;
    },

    _getCheckerByRule: function _getCheckerByRule(name) {
      return this.checkers[name];
    },

    getInvalidProps: function getInvalidProps() {
      var self = this;
      var inValidProps = Object.keys(this.validateErrors).filter(function (prop) {
        return !self.isValid(prop);
      });
      return inValidProps;
    },

    // @todo 当prop为数组时，如何让验证器，验证一次，将相关属性都标记为错误
    addRule: function addRule(prop, name, option) {
      var self = this;

      if (Array.isArray(prop)) {
        prop = prop.join(',');
      }

      if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
        var map = name;
        for (var p in map) {
          this.addRule(prop, p, map[p]);
        }
        return;
      }

      if (name === 'type') {
        this._addTypeRule(prop, option);
      } else {
        this._getPropRule(prop)[name] = option;
      }
    },

    _clearRules: function _clearRules() {
      this.rules = {};
    },

    _addTypeRule: function _addTypeRule(prop, type) {
      var typeRules = type.rules;
      for (var rule in typeRules) {
        this.addRule(prop, rule, typeRules[rule]);
      }
    },

    _getPropRule: function _getPropRule(prop) {
      return this.rules[prop] || (this.rules[prop] = {});
    },

    _addErrorTo: function _addErrorTo(prop, rule, error) {
      if (arguments.length < 3 && (typeof rule === 'undefined' ? 'undefined' : _typeof(rule)) === 'object') {
        error = rule;
        for (var aRule in error) {
          this._addErrorTo(prop, aRule, error[aRule]);
        }
        return;
      }

      if (!this.validateErrors[prop]) {
        this.validateErrors[prop] = {};
      }
      this.validateErrors[prop][rule] = error;
    },

    _clearErrorsFor: function _clearErrorsFor(prop, rule) {
      if (!rule) {
        delete this.validateErrors[prop];
      } else {
        var errors = this.validateErrors[prop];
        if (errors) {
          delete errors[rule];
          if (Object.keys(errors).length === 0) {
            delete this.validateErrors[prop];
          }
        }
      }
    },

    getErrors: function getErrors(prop) {
      if (!prop) return this._getAllErrors();

      var result = [];
      var errors = this.validateErrors[prop];
      if (errors) {
        for (var rule in errors) {
          result.push(errors[rule]);
        }
      }
      return result;
    },

    _getAllErrors: function _getAllErrors() {
      var result = [];
      var errors = this.validateErrors;
      for (var p in errors) {
        result = result.concat(this.getErrors(p));
      }
      return result;
    },

    // 所有属性验证是否通过
    isValid: function isValid() {
      if (arguments[0]) {
        return this.isPropValid(arguments[0]);
      }

      var count = 0;
      var errors = this.validateErrors;
      for (var p in errors) {
        count += Object.keys(errors[p]).length;
      }

      return count === 0;
    },

    isPropValid: function isPropValid(prop) {
      return !this.validateErrors[prop] || Object.keys(this.validateErrors[prop]).length === 0;
    },

    validate: function validate(prop, callback, option) {
      var propType = typeof prop === 'undefined' ? 'undefined' : _typeof(prop);

      if (propType === 'function') {
        option = callback;
        callback = prop;
        prop = null;
      } else if (propType === 'object') {
        option = prop;
        prop = callback = null;
      }

      if (callback && (typeof callback === 'undefined' ? 'undefined' : _typeof(callback)) === 'object') {
        option = callback;
        callback = null;
      }

      if (!option) option = {};

      if (prop) {
        return this._validateProp(prop, callback, option);
      } else {
        return this._validateAll(callback, option);
      }
    },

    _validateAll: function _validateAll(callback, option) {
      var checkFully = option.checkFully;

      if (validateAllRunning) return;

      validateAllRunning = true;

      if (typeof checkFully === 'function') {
        callback = checkFully;
        checkFully = false;
      }

      var self = this;
      self.reset();

      if (callback) self._onceValidatedAll(callback);

      Object.keys(self.rules).forEach(function (prop) {
        self._validatePropExp(prop, null, option);
      });

      if (self._pendingCount === 0) {
        var result = self.isValid();

        validateAllRunning = false;
        self._fire('validated', result);
        return result;
      } else {
        return 'pending';
      }
    },

    _onceValidatedAll: function _onceValidatedAll(observer) {
      var self = this;

      var proxy = function proxy() {
        self.unValidated(proxy);
        observer.apply(this, arguments);
      };

      self.onValidatedAll(proxy);
    },

    onPending: function onPending(startObserver, endObserver) {
      if (startObserver) this.on('pendingStart', startObserver);
      if (endObserver) this.on('pendingEnd', endObserver);
    },

    reset: function reset() {
      this.validateErrors = {};
      this._pendingCount = 0;
      this._propPendingCount = {};
      this._fire('reset');
    },

    _countingPending: function _countingPending(props) {
      var self = this;
      if (self._pendingCount === 0) {
        self._fire('pendingStart');
      }

      props.forEach(function (p) {
        if (!self._propPendingCount[p]) {
          self._propPendingCount[p] = 1;
        } else {
          self._propPendingCount[p]++;
        }
        self._pendingCount++;
      });
    },

    _getSortedRuleNames: function _getSortedRuleNames(rules) {
      var ruleNames = Object.keys(rules);
      if (rules.remote) {
        var remoteAt = ruleNames.indexOf('remote');
        if (remoteAt !== ruleNames.length - 1) {
          ruleNames.splice(remoteAt, 1);
          ruleNames.push('remote');
        }
      }
      return ruleNames;
    },

    _mergeRuleDefaultParam: function _mergeRuleDefaultParam(rule, param) {
      var self = this;
      if (param && Object.prototype.toString.call(param) === '[object Object]') {
        var globalDefault = __defaultParamOfRule[rule] || {};
        var defaultParam = self.defaultParamOfRule[rule] || {};
        param = this._deepMerge({}, globalDefault, defaultParam, param);
      }
      return param;
    },

    _wrapCallback: function _wrapCallback(props, rule, callback) {
      var self = this;
      return function (result) {
        self._pendingCount--;
        //props： p1+p2, 向rule相关所有属性添加错误
        props.forEach(function (p) {
          self._propPendingCount[p]--;

          if (result !== true) {
            self._addErrorTo(p, rule, result);
          }

          if (self._propPendingCount[p] === 0) {
            if (self._pendingCount === 0) {
              var isValid = self.isValid();
              self._fire('pendingEnd', isValid);

              if (validateAllRunning) {
                validateAllRunning = false;
                self._fire('validated', isValid);
              }
            }

            if (callback) callback(self.isValid(p));
          }
        });
      };
    },

    _getAllRuleKeyOfProp: function _getAllRuleKeyOfProp(prop, includeRelated) {
      var simpleExps = [];
      var plusExps = [];

      var rules = this.rules;
      if (rules[prop]) {
        simpleExps.push(prop);
      }

      for (var exp in this.rules) {
        if (this._isGroupExp(exp)) {
          var names = this._parseGroupProps(exp);
          var i = names.indexOf(prop);
          if (i !== -1) {
            plusExps.push(exp);
          }
        }
      }

      return simpleExps.concat(plusExps);
    },

    _isGroupExp: function _isGroupExp(exp) {
      return exp.indexOf(',') !== -1;
    },

    _parseGroupProps: function _parseGroupProps(exp) {
      return exp.split(',').map(function (p) {
        return p.trim();
      });
    },

    getRelatedProps: function getRelatedProps(prop) {
      var simpleExps = [];
      var rules = this.rules;

      for (var exp in this.rules) {
        if (this._isGroupExp(exp)) {
          var names = this._parseGroupProps(exp);
          var i = names.indexOf(prop);
          if (i !== -1) {
            names.splice(i, 1);
            names.forEach(function (n) {
              if (simpleExps.indexOf(n) === -1) {
                simpleExps.push(n);
              }
            });
          }
        }
      }

      return simpleExps;
    },

    _validateProp: function _validateProp(prop, callback, option) {
      var self = this;
      var checkFully = option.checkFully;

      this._clearErrorsFor(prop);

      var propExps = this._getAllRuleKeyOfProp(prop);
      var len = propExps.length;
      if (!len) return;

      if (len === 1) {
        return this._validatePropExp(propExps[0], callback, option);
      }

      var wrapCb = callback;
      if (callback && len > 1) {
        wrapCb = function wrapCb() {
          var isValid = self.isValid(prop);
          if (!isValid && !checkFully) {
            return callback(isValid);
          }

          len--;
          if (len === 0) {
            callback(isValid);
          }
        };
      }

      var hasPending = false;
      for (var i = 0, l = propExps.length; i < l; i++) {
        var result = this._validatePropExp(propExps[i], wrapCb, option);
        if (result === true) continue;

        if (result === 'pending' && !hasPending) {
          hasPending = 'pending';
          continue;
        }

        if (!checkFully) {
          return false;
        }
      }

      return hasPending || self.isValid(prop);
    },

    _checkRule: function _checkRule(props, rule, param, callback) {
      var self = this;
      if (rule === 'type') return true;

      // get value
      var value;
      if (props.length > 1) {
        value = props.map(function (p) {
          return self.getPropValue(p);
        });
      } else {
        value = self.getPropValue(props[0]);
        if (rule !== 'required' && (value === '' || value === null || value === undefined)) return true;
      }

      var checker = self._getCheckerByRule(rule);

      //是自定义的checker， rule name也是自定义的
      if (!checker && param) {
        var pt = typeof param === 'undefined' ? 'undefined' : _typeof(param);
        if (pt === 'function') {
          checker = param;
          param = undefined;
        } else if (pt === 'object' && param.checker) {
          //validator.addRule('p1,p2', 'check_p1_p2_sum', {checker: function(){...}, message: 'xxx'} )
          checker = param.checker;
        }
      }

      if (!checker) return true;

      // merge param
      param = self._mergeRuleDefaultParam(rule, param);
      if (param && param.checker) delete param.checker;

      var wrapCb = self._wrapCallback(props, rule, callback);

      if (param && param.markRelatedProps) {
        props.forEach(function (p) {
          self._clearErrorsFor(p, rule);
        });
      } else {
        self._clearErrorsFor(props[0], rule);
      }

      var context = self._getTarget();

      var localeLabels = self._propLabels;
      var labels = props;
      if (localeLabels) {
        labels = props.map(function (p) {
          return localeLabels[p] || p;
        });
      }

      var result = checker.apply(context, [value, param, wrapCb, props, labels]);
      return result;
    },

    //验证某个属性，callback仅用于异步验证器的回调，全是同步验证器的话，返回值即是验证结果
    _validatePropExp: function _validatePropExp(prop, callback, option) {
      var checkFully = option.checkFully;

      var self = this,
          props = self._parseGroupProps(prop),
          rules = self.rules[prop],
          errorsCount = 0;

      if (!rules) {
        if (callback) callback(true);
        return true;
      }

      // 把remote放到队尾
      var ruleNames = self._getSortedRuleNames(rules);

      for (var i = 0, l = ruleNames.length; i < l; i++) {
        var rule = ruleNames[i];
        var param = rules[rule];

        var result = this._checkRule(props, rule, param, callback);
        if (result === true) continue;

        // counting pending
        if (result === 'pending') {
          self._countingPending(props);
        } else {
          // result is error message
          if (result) {
            errorsCount++;

            if (param && param.markRelatedProps) {
              props.forEach(function (p) {
                self._addErrorTo(p, rule, result);
              });
            } else {
              self._addErrorTo(props[0], rule, result);
            }

            if (!checkFully) {
              break;
            }
          }
        }
      }

      var valid = errorsCount === 0;

      if (self._propPendingCount[props[0]] > 0) {
        return 'pending';
      }

      if (callback) {
        callback(valid);
      }

      return valid;
    },

    _deepMerge: function _deepMerge(object) {
      var source, key, srcValue, objValue;

      var isValidObj = function isValidObj(o) {
        return o && (typeof o === 'undefined' ? 'undefined' : _typeof(o)) === 'object';
      };

      for (var i = 1; i < arguments.length; i++) {
        source = arguments[i];
        for (key in source) {
          srcValue = source[key];
          objValue = object[key];
          if (isValidObj(srcValue) && isValidObj(objValue)) {
            this._deepMerge(objValue, srcValue);
          } else {
            object[key] = srcValue;
          }
        }
      }
      return object;
    }
  };

  // 兼容之前的版本
  proto.setValidateTarget = proto.setTarget;
  proto.hasRule = proto.isPropNeedCheck;
  proto.getProp = proto.getPropValue;
  proto.getContext = proto._getTarget;
  proto.setDefaultParamForRule = proto.setDefaultRuleOption;
  Validator.setDefaultParamForRule = Validator.setGlobalRuleOption;

  // 兼容旧的事件绑定，解绑
  proto.onReset = function (observer) {
    this.on('reset', observer);
  };
  proto.unReset = function (observer) {
    this.off('reset', observer);
  };
  proto.onValidatedAll = function (observer) {
    this.on('validated', observer);
  };
  proto.unValidated = function (observer) {
    this.off('validated', observer);
  };

  Validator.prototype = proto;

  var localeDict = {};
  var DEFAULT_LOCALE = 'en';
  var currLocale = DEFAULT_LOCALE;
  var currDict = {};

  var i18n = {
    setCurrLocale: function setCurrLocale(locale) {
      currLocale = locale;
      currDict = localeDict[currLocale] || {};
    },
    getLocaleString: function getLocaleString(key) {
      return currDict[key];
    },
    addLocale: function addLocale(locale, dict) {
      var currDict = localeDict[locale];
      if (!currDict) currDict = localeDict[locale] = {};
      for (var p in dict) {
        currDict[p] = dict[p];
      }

      this.setCurrLocale(locale);
    }
  };

  var $ = jQuery;

  function validateForm() {
    if (this.constructor != validateForm) {
      return new validateForm.apply(null, arguments);
    }

    this.initialize.apply(this, arguments);
  }

  var proto$1 = validateForm.prototype;
  var lastValue;

  proto$1.initialize = function (form, validator, option) {
    if (!option) option = {};

    var defaults = {
      immedicate: true,
      event: 'change',
      submit: true,
      validateOnSubmit: false,
      popupMessage: false,
      checkFully: true,
      excludes: '',
      i18n: function i18n(msg) {
        return msg;
      },
      alert: window.alert
    };

    for (var p in defaults) {
      if (!(p in option)) {
        option[p] = defaults[p];
      }
    }

    var self = this;

    var i18n = option.i18n;
    var myAlert = option.alert;

    this.errorElementCls = 'validator-error';
    this.form = form;
    this.validator = validator;
    this.option = option;

    validator.on('validated', function (isValid) {
      if (!isValid) {
        var invalidProps = validator.getInvalidProps();
        var alertMsges = [];
        var popup = option.popupMessage;
        var msg;
        if (popup) {
          invalidProps.forEach(function (prop) {
            msg = i18n(prop) + ':' + validator.getErrors(prop).join('<br>');
            alertMsges.push(msg);
          });
        } else {
          invalidProps.forEach(function (prop) {
            var msges = validator.getErrors(prop);

            var el = $(form).find('[name=' + prop + ']');
            if (el.length) {
              if (option.excludes) {
                var exWrap = $(option.excludes)[0];
                if (exWrap && $.contains(exWrap, el[0])) return;
              }

              self.toggleError(el, false, msges);
            } else {
              msg = i18n(prop) + ': ' + msges.join('<br>');
              alertMsges.push(msg);
            }
          });
        }

        if (alertMsges.length) myAlert(alertMsges.join('<br>'));
      }
    });

    validator.on('reset', function () {
      $('.has-error', self.form).removeClass('has-error');
      $('.' + self.errorElementCls, self.form).remove();
    });

    if (option.immedicate) {
      // @todo 仅处理那些声明了验证规则的
      $(form).on(option.event, ':input', function () {
        var el = $(this);

        if (this.hasAttribute('validelay')) return;
        // .replace(/ +/g, ',').replace(/,,/g,',')

        var prop = el.attr('name');
        if (!prop) return;

        if (option.excludes) {
          var exWrap = $(option.excludes)[0];
          if (exWrap && $.contains(exWrap, this)) return;
        }

        if (!validator.isPropNeedCheck(prop)) return;

        if (validator.getPropValue(prop) === lastValue) return;

        var relatedProps = validator.getRelatedProps(prop);
        var validateRelated = relatedProps.length > 0;
        validator.validate(prop, function (isValid) {
          var msges;
          if (!isValid) msges = validator.getErrors(prop);
          self.toggleError(el, isValid, msges);

          if (validateRelated) {
            relatedProps.forEach(function (name) {
              var rpError = validator.getErrors(name);

              if (name === '') return;
              var rpEl = $(form).find('[name=' + name + ']');
              if (rpEl.length) {
                self.toggleError(rpEl, !rpError.length, rpError);
              }
            });
          }
        }, {
          checkFully: option.checkFully
        });
      }).on('focus', function () {
        lastValue = this.value;
      });
    }

    if (option.submit && $(form).prop('tagName') === 'FORM') {
      $(form).submit(function (event) {
        if (option.validateOnSubmit) {
          event.preventDefault();
          self.validator.validate(function (isValid) {
            if (isValid) {
              //不会带上原来触发submit的button的值
              $(form).submit();
            }
          });
        } else {
          if (!validator.isValid()) {
            event.preventDefault();
          }
        }
      });
    }
  };

  proto$1.toggleError = function (element, valid, msges) {
    var self = this;

    self.removeError(element);

    if (!valid) {
      self.highlight(element);
      if (msges) {
        var errorEl = self.createErrorElement(msges);
        self.errorPlacement(errorEl, element);
      }
    } else {
      self.unhighlight(element);
    }
  };

  proto$1.createErrorElement = function (errorMsges) {
    return $('<span></span>').addClass('help-block').addClass(this.errorElementCls).html(errorMsges.join('<br>'));
  };

  proto$1.removeError = function (element) {
    var errorCls = '.' + this.errorElementCls;

    if (element.parent('.input-group').length) {
      element.parent().parent().find(errorCls).remove();
    } else {
      element.parent().find(errorCls).remove();
    }
  };

  proto$1.highlight = function (element) {
    $(element).closest('.form-group').addClass('has-error');
  };

  proto$1.unhighlight = function (element) {
    $(element).closest('.form-group').removeClass('has-error');
  };

  proto$1.errorPlacement = function (error, element) {
    if (element.parent('.input-group').length) {
      error.insertAfter(element.parent());
    } else {
      error.insertAfter(element);
    }
  };

  var vueMixin = {
    data: function data() {
      return {
        validateState: {},
        validateError: {}
      };
    },
    created: function created() {
      var vm = this;
      var option = this.$options.validate;
      if (!option) return;

      var target = option.target;
      var vmTarget = vm.$get(target);
      var labels = option.labels;
      var validator = option.validator;
      var rules = option.rules;

      // rules 优先于 validator
      if (rules) {
        validator = new Validator(rules);
      } else {
        if (typeof validator === 'function') {
          validator = validator();
        }
      }

      vm.$validator = validator;

      // set target
      vm.$watch(target, function (val) {
        validator.setTarget(val, labels);
      });
      validator.setTarget(vmTarget, labels);

      // do validate when any property of target changed
      function validateProp(watchExp, prop) {
        vm.$watch(watchExp, function () {
          validator.validate(prop, function (isValid) {
            vm.validateState[prop] = isValid;
            vm.validateError[prop] = validator.getErrors(prop).join('\n');
          });
        });

        vm.$set('validateState.' + prop, true);
        vm.$set('validateError.' + prop, '');
      }

      var props = option.targetProps || Object.keys(vmTarget);
      props.forEach(function (prop) {
        validateProp(target + '.' + prop, prop);
      });

      // handle validator reset
      var onReset = function onReset() {
        var state = vm.validateState;
        for (var p in state) {
          state[p] = true;
        }

        var error = vm.validateError;
        for (var _p in error) {
          error[_p] = '';
        }
      };
      vm._onValidatorReset = onReset;
      validator.on('reset', onReset);
      validator.on('validated', function (isValid) {
        if (!isValid) {
          props.forEach(function (prop) {
            vm.$set('validateError.' + prop, validator.getErrors(prop));
          });
        }
      });
    },
    beforeDestory: function beforeDestory() {
      if (!this.$validator) return;
      this.$validator.off('reset', this._onValidatorReset);
      this.$validator.setTarget(null);
    }
  };

  function format$1(temp) {
    var data = Array.prototype.slice.call(arguments, 1);
    for (var i = 0, l = data.length; i < l; i++) {
      temp = temp.replace(new RegExp('\\{' + i + '\\}', 'g'), data[i]);
    }
    return temp;
  }

  function utf8Length$1(str) {
    var s = str.length;
    for (var i = str.length - 1; i >= 0; i--) {
      var code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) {
        s++;
      } else if (code > 0x7ff && code <= 0xffff) {
        s += 2;
      }
      if (code >= 0xDC00 && code <= 0xDFFF) {
        i--;
      }
    }
    return s;
  }

  function hasValue$1(value) {
    return value !== undefined && value !== null && value !== '';
  }

  var util = {
    format: format$1,
    utf8Length: utf8Length$1,
    hasValue: hasValue$1
  };

  var hasValue = util.hasValue;
  var utf8Length = util.utf8Length;
  var format = util.format;

  function getLocaleMsg(rule, defaultMsg) {
    var localeMsg = i18n.getLocaleString(rule);
    return localeMsg || defaultMsg;
  }

  function makeErrorMsg(rule, defaultMsg) {
    var localeMsg = i18n.getLocaleString(rule);
    var msg = localeMsg || defaultMsg;

    var params = Array.from(arguments).slice(2);
    params.unshift(msg);

    return util.format.apply(null, params);
  }

  var checkers = {
    depends: function depends(value, option, callback, props, labels) {
      var dependsFilled = value.slice(1).every(function (v) {
        return hasValue(v);
      });

      return dependsFilled || option.message || makeErrorMsg('depends', '{0} depends {1}', labels[0], labels.slice(1).join(' '));
    },

    uniq: function uniq(value, option) {
      var getItem = option.getItem;
      var checker = option.checker;
      var list = option.collection || option.getCollection.call(this);

      var exists = false;

      if (checker) {
        exists = list.some(function (item) {
          return checker(value, item);
        });
      } else {
        if (getItem) {
          exists = list.some(function (item) {
            return getItem(item) === value;
          });
        } else {
          exists = list.some(function (item) {
            return value === item;
          });
        }
      }

      return !exists || option.message || getLocaleMsg('uniq', 'should be unique');
    },

    required: function required(value, option) {
      if (option === false) return;
      if ((typeof option === 'undefined' ? 'undefined' : _typeof(option)) !== 'object') option = {};

      if (Array.isArray(value)) {
        return value && value.length > 0 ? true : option.message || getLocaleMsg('required:leastOne', 'should have at least one');
      }
      return value.trim().length > 0 ? true : option.message || getLocaleMsg('required', 'required');
    },

    chosed: function chosed(value, option) {
      if (option === false) return;
      if ((typeof option === 'undefined' ? 'undefined' : _typeof(option)) !== 'object') option = {};

      return value != -1 ? true : option.message || getLocaleMsg('chosed', 'required');
    },

    email: function email(value, option) {
      if (option === false) return;

      if (/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)) {
        return true;
      } else {
        return option.message || getLocaleMsg('email', 'invalid email');
      }
    },

    url: function url(value, option) {
      if (option === false) return;

      // contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
      if (/^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value)) {
        return true;
      } else {
        return option.message || getLocaleMsg('url', 'invalid url');
      }
    },

    date: function date(value, option) {
      if (option === false) return;
      return !/invalid|NaN/.test(new Date(value).toString()) ? true : option.message || getLocaleMsg('date', 'invalid date');
    },

    dateISO: function dateISO(value, option) {
      if (option === false) return;
      return (/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value) ? true : option.message || getLocaleMsg('dateISO', 'invalid date ( ISO ')
      );
    },

    number: function number(value, option) {
      if (option === false) return;
      return (/^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value) ? true : option.message || getLocaleMsg('number', 'invalid number')
      );
    },

    digits: function digits(value, option) {
      if (option === false) return;
      return (/^\d+$/.test(value) ? true : option.message || getLocaleMsg('digits', 'invalid digits')
      );
    },

    decimal: function decimal(value, option) {
      if (typeof option === 'number') option = {
        precision: option
      };
      var result = new RegExp('^[0-9,]+(\\.\\d{0,' + option.precision + '})?$').test(value);
      return result || option.message || makeErrorMsg('decimal', 'Please enter a correct {0} decimal', option.precision);
    },

    // based on http://en.wikipedia.org/wiki/Luhn/
    creditcard: function creditcard(value, option) {
      if (option === false) return;
      // accept only spaces, digits and dashes
      if (/[^0-9 \-]+/.test(value)) {
        return false;
      }
      var nCheck = 0,
          nDigit = 0,
          bEven = false,
          n,
          cDigit;

      value = value.replace(/\D/g, '');

      // Basing min and max length on
      // http://developer.ean.com/general_info/Valid_Credit_Card_Types
      if (value.length < 13 || value.length > 19) {
        return false;
      }

      for (n = value.length - 1; n >= 0; n--) {
        cDigit = value.charAt(n);
        nDigit = parseInt(cDigit, 10);
        if (bEven) {
          if ((nDigit *= 2) > 9) {
            nDigit -= 9;
          }
        }
        nCheck += nDigit;
        bEven = !bEven;
      }

      return nCheck % 10 === 0 ? true : option.message || getLocaleMsg('creditcard', 'invalid credit card number');
    },

    length: function length(value, option) {
      if (typeof option === 'number') option = {
        max: option
      };

      var len = option.utf8Bytes ? utf8Length(value) : value.length;

      if ('max' in option && 'min' in option) {
        return len >= option.min && len <= option.max ? true : option.message || makeErrorMsg('length:between', 'should between {0} and {1} characters long', option.min, option.max);
      }

      if ('max' in option) {
        return len <= option.max ? true : option.message || makeErrorMsg('length:max', 'should at least {0} characters', option.max);
      } else if ('min' in option) {
        return len >= option.min ? true : option.message || makeErrorMsg('length:min', 'should no more than {0} characters', option.min);
      }
    },

    count: function count(value, option) {
      if (typeof option === 'number') option = {
        max: option
      };

      var valid = false;
      if (option.max) {
        valid = value.length <= option.max ? true : option.message || makeErrorMsg('count:max', 'count should no more than {0}', option.max);
      }
      if (valid !== true) return valid;

      if (option.min) {
        return value.length >= option.min ? true : option.message || makeErrorMsg('count:min', 'count should no less than {0}', option.min);
      }
    },

    min: function min(value, option) {
      if (typeof option === 'number') option = {
        min: option
      };
      return value >= option.min ? true : option.message || makeErrorMsg('min', 'should less than or equal to {0}', option.min);
    },

    max: function max(value, option) {
      if (typeof option === 'number') option = {
        max: option
      };
      return value <= option.max ? true : option.message || makeErrorMsg('max', 'should less than or equal to {0}', option.max);
    },

    range: function range(value, option) {
      return value >= option.min && value <= option.max ? true : option.message || makeErrorMsg('range', 'should between {0} and {1}', option.min, option.max);
    },

    async: function async(value, option, callback, props, labels) {
      option.validate(value, option, callback, props, labels);
      return 'pending';
    },

    greaterThan: function greaterThan(value, option) {
      if (typeof option === 'number') option = {
        value: option
      };
      return Number(value) > option.value ? true : option.message || makeErrorMsg('greaterThan', 'should greater than {0}', option.value);
    },

    lessThan: function lessThan(value, option) {
      if (typeof option === 'number') option = {
        value: option
      };
      return Number(value) < option.value ? true : option.message || makeErrorMsg('lessThan', 'should less than {0}', option.value);
    },

    compare: function compare(value, option, callback, props, labels) {
      var p1 = value[0];
      var p2 = value[1];

      if (!hasValue(p1)) return;
      if (!hasValue(p2)) return;

      var result = false;
      if (!option.type) option.type = Number;
      var Type = option.type;
      p1 = new Type(p1);
      p2 = new Type(p2);

      var msg = '';
      switch (option.operate) {
        case '>':
          result = p1 > p2;
          msg = getLocaleMsg('compare:greaterThan', '{0} should greater than {1}');
          break;
        case '>=':
          result = p1 >= p2;
          msg = getLocaleMsg('compare:greaterThanOrEqual', '{0} should greater than or equal {1}');
          break;
        case '<':
          result = p1 < p2;
          msg = getLocaleMsg('compare:lessThan', '{0} should less than {1}');
          break;
        case '<=':
          result = p1 <= p2;
          msg = getLocaleMsg('compare:lessThanOrEqual', '{0} should less than or equal {1}');
          break;
        case '=':
          result = p1 == p2;
          msg = getLocaleMsg('compare:equal', '{0} should equal {1}');
          break;
        case '!=':
          result = p1 != p2;
          msg = getLocaleMsg('compare:notEqual', '{0} should not equal {1}');
          break;
      }
      return result ? true : option.message || util.format(msg, labels[0], labels[1]);
    },

    pattern: function pattern(value, option) {
      var regexp = 'regexp' in option ? option.regexp : option;
      if (typeof regexp === 'string') {
        regexp = new RegExp('^(?:' + regexp + ')$');
      }
      return regexp.test(value) ? true : option.message || getLocaleMsg('pattern', 'invalid format');
    },

    time: function time(value, option) {
      if (option === false) return;
      return (/^([01]\d|2[0-3])(:[0-5]\d){1,2}$/.test(value) ? true : option.message || getLocaleMsg('time', 'should between 00:00 and 23:59')
      );
    }
  };

  /*
   * Translated default messages for the jQuery validation plugin.
   * Locale: ZH (Chinese, 中文 (Zhōngwén), 汉语, 漢語)
   */
  var zhLocales = {
    depends: '{0}依赖{1}，请先填写{1}',
    uniq: '你输入的内容已存在，此项必须唯一',
    required: '这是必填字段',
    chosed: '必选项',
    email: '请输入有效的电子邮件地址',
    url: '请输入有效的网址',
    date: '请输入有效的日期',
    dateISO: '请输入有效的日期 (YYYY-MM-DD)',
    number: '请输入有效的数字',
    digits: '只能输入数字',
    creditcard: '请输入有效的信用卡号码',
    equalTo: '你的输入不相同',
    'length:max': '最多可以输入 {0} 个字符',
    'length:min': '最少要输入 {0} 个字符',
    'length:between': '请输入长度在 {0} 到 {1} 之间的字符串',
    'count:max': '最多包含{0}项',
    'count:min': '最少包含{0}项',
    max: '请输入不大于 {0} 的数值',
    min: '请输入不小于 {0} 的数值',
    range: '请输入范围在 {0} 到 {1} 之间的数值',
    greaterThan: '请输入大于 {0} 的数值',
    lessThan: '请输入小于 {0} 的数值',
    extension: '请输入有效的后缀',
    pattern: '格式无效',
    time: '请输入有效的时间',
    'compare:greaterThan': '{0} 须大于 {1}',
    'compare:greaterThanOrEqual': '{0} 须大于等于 {1}',
    'compare:lessThan': '{0} 须小于 {1}',
    'compare:lessThanOrEqual': '{0} 须小于或等于 {1}',
    'compare:equal': '{0} 须等于 {1}',
    'compare:notEqual': '{0} 不能等于 {1}'
  };

  var ObjValidation = Validator;

  // add static member
  ObjValidation.i18n = i18n;
  ObjValidation.validateForm = validateForm;
  ObjValidation.vueMixin = vueMixin;

  ObjValidation.addChecker(checkers);

  i18n.addLocale('zh', zhLocales);
  i18n.setCurrLocale('en');

  return ObjValidation;

}));
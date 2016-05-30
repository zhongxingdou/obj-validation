(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.ObjValidation = factory());
}(this, function () { 'use strict';

  // @todo
  // 让checker按顺序号执行，这样的话，可以让远程验证在本地验证成功后再执行
  // 错误消息多语言
  function fire(self, eventType, param) {
    var map = {
      pendingStart: self._pendingStartObservers,
      pendingEnd: self._pendingEndObservers,
      validatedAll: self._validatedObservers,
      reset: self._resetObservers
    };

    var observers = map[eventType];

    if (!observers) return;

    observers.forEach(function (observer) {
      observer(param);
    });
  }

  function Validator(rules, obj, propLabels) {
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
    var checkers = Validator.checkers;
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

  Validator.defaultParamOfRule = {};
  Validator.setDefaultParamForRule = function (rule, param) {
    this.defaultParamOfRule[rule] = param;
  };

  var validateAllRunning = false;
  var proto = {
    setDefaultParamForRule: function (rule, param) {
      this.defaultParamOfRule[rule] = param;
    },

    // 设置要验证的对象
    setValidateTarget: function (obj, propLabels) {
      this.reset();
      if (obj) {
        this._validateTarget = obj;
        this._propLabels = propLabels;
      }
    },

    getProp: function (prop) {
      return this._validateTarget[prop];
    },

    hasRule: function (prop) {
      if (prop in this.getContext()) {
        return Object.keys(this.getRule(prop)).length > 0;
      } else {
        return false;
      }
    },

    getContext: function () {
      return this._validateTarget;
    },

    getCheckerByRule: function (name) {
      return this.checkers[name];
    },

    getInvalidProps: function () {
      var self = this;
      var inValidProps = Object.keys(this.validateErrors).filter(function (prop) {
        return !self.isValid(prop);
      });
      return inValidProps;
    },

    // @todo 当prop为数组时，如何让验证器，验证一次，将相关属性都标记为错误
    addRule: function (prop, name, option) {
      var self = this;

      if (Array.isArray(prop)) {
        prop = prop.join(',');
      }

      if (typeof name === 'object') {
        var map = name;
        for (var p in map) {
          this.addRule(prop, p, map[p]);
        }
        return;
      }

      if (name === 'type') {
        this._addTypeRule(prop, option);
      } else {
        this.getRule(prop)[name] = option;
      }
    },

    clearRules: function () {
      this.rules = {};
    },

    _addTypeRule: function (prop, type) {
      var typeRules = type.rules;
      for (var rule in typeRules) {
        this.addRule(prop, rule, typeRules[rule]);
      }
    },

    getRule: function (prop) {
      return this.rules[prop] || (this.rules[prop] = {});
    },

    _addErrorTo: function (prop, rule, error) {
      if (arguments.length < 3 && typeof rule === 'object') {
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

    _clearErrorsFor: function (prop, rule) {
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

    getErrors: function (prop) {
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

    _getAllErrors: function () {
      var result = [];
      var errors = this.validateErrors;
      for (var p in errors) {
        result = result.concat(this.getErrors(p));
      }
      return result;
    },

    isValid: function (prop) {
      if (prop) {
        return !this.validateErrors[prop] || Object.keys(this.validateErrors[prop]).length === 0;
      }

      var count = 0;
      var errors = this.validateErrors;
      for (var p in errors) {
        count += Object.keys(errors[p]).length;
      }

      return count === 0;
    },

    validate: function (prop, callback, option) {
      var propType = typeof prop;

      if (propType === 'function') {
        option = callback;
        callback = prop;
        prop = null;
      } else if (propType === 'object') {
        option = prop;
        prop = callback = null;
      }

      if (callback && typeof callback === 'object') {
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

    _validateAll: function (callback, option) {
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
        fire(self, 'validatedAll', result);
        return result;
      } else {
        return 'pending';
      }
    },

    _onceValidatedAll: function (observer) {
      var self = this;

      var proxy = function () {
        self.unValidated(proxy);
        observer.apply(this, arguments);
      };

      self.onValidatedAll(proxy);
    },

    onPending: function (startObserver, endObserver) {
      if (startObserver) {
        this._pendingStartObservers.push(startObserver);
      }

      if (endObserver) {
        this._pendingEndObservers.push(endObserver);
      }
    },

    onReset: function (observer) {
      this._resetObservers.push(observer);
    },

    unReset: function (observer) {
      var i = this._resetObservers.indexOf(observer);
      if (i !== -1) {
        this._resetObservers.splice(i);
      }
    },

    onValidatedAll: function (observer) {
      this._validatedObservers.push(observer);
    },

    unValidated: function (observer) {
      var i = this._validatedObservers.indexOf(observer);
      this._validatedObservers.splice(i, 1);
    },

    reset: function () {
      this.validateErrors = {};
      this._pendingCount = 0;
      this._propPendingCount = {};
      fire(this, 'reset');
    },

    _countingPending: function (props) {
      var self = this;
      if (self._pendingCount === 0) {
        fire(self, 'pendingStart');
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

    _getSortedRuleNames: function (rules) {
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

    _mergeRuleDefaultParam: function (rule, param) {
      var self = this;
      if (param && Object.prototype.toString.call(param) === '[object Object]') {
        var globalDefault = Validator.defaultParamOfRule[rule] || {};
        var defaultParam = self.defaultParamOfRule[rule] || {};
        param = this._deepMerge({}, globalDefault, defaultParam, param);
      }
      return param;
    },

    _wrapCallback: function (props, rule, callback) {
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
              fire(self, 'pendingEnd', isValid);

              if (validateAllRunning) {
                validateAllRunning = false;
                fire(self, 'validatedAll', isValid);
              }
            }

            if (callback) callback(self.isValid(p));
          }
        });
      };
    },

    _getAllRuleKeyOfProp: function (prop, includeRelated) {
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

    _isGroupExp: function (exp) {
      return exp.indexOf(',') !== -1;
    },

    _parseGroupProps: function (exp) {
      return exp.split(',').map(function (p) {
        return p.trim();
      });
    },

    getRelatedProps: function (prop) {
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

    _validateProp: function (prop, callback, option) {
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
        wrapCb = function () {
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

    _checkRule: function (props, rule, param, callback) {
      var self = this;
      if (rule === 'type') return true;

      // get value
      var value;
      if (props.length > 1) {
        value = props.map(function (p) {
          return self.getProp(p);
        });
      } else {
        value = self.getProp(props[0]);
        if (rule !== 'required' && (value === '' || value === null || value === undefined)) return true;
      }

      var checker = self.getCheckerByRule(rule);

      //是自定义的checker， rule name也是自定义的
      if (!checker && param) {
        var pt = typeof param;
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

      if (param && param.markAll) {
        props.forEach(function (p) {
          self._clearErrorsFor(p, rule);
        });
      } else {
        self._clearErrorsFor(props[0], rule);
      }

      var context = self.getContext();

      var localeLabels = self._propLabels;
      var labels = props;
      if (localeLabels) {
        labels = props.map(function (p) {
          return localeLabels[p] || p;
        });
      }

      var result = checker.apply(context, [value, param, wrapCb, labels]);
      return result;
    },

    //验证某个属性，callback仅用于异步验证器的回调，全是同步验证器的话，返回值即是验证结果
    _validatePropExp: function (prop, callback, option) {
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

            if (param && param.markAll) {
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

    _deepMerge: function (object) {
      var source, key, srcValue, objValue;

      var isValidObj = function (o) {
        return o && typeof o === 'object';
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

  Validator.prototype = proto;

  var localeDict = {};
  var DEFAULT_LOCALE = 'en';
  var currLocale = DEFAULT_LOCALE;
  var currDict = {};

  var i18n = {
    setCurrLocale: function (locale) {
      currLocale = locale;
      currDict = localeDict[currLocale] || {};
    },
    getLocaleString: function (key) {
      return currDict[key];
    },
    addLocale: function (locale, dict) {
      localeDict[locale] = Object.assign({}, localeDict[locale], dict);
      this.setCurrLocale(locale);
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
    depends: function (value, option, callback, props) {
      var dependsFilled = value.slice(1).every(function (v) {
        return hasValue(v);
      });

      return dependsFilled || option.message || makeErrorMsg('depends', '{0} depends {1}', props[0], props.slice(1).join(' '));
    },

    uniq: function (value, option) {
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

    required: function (value, option) {
      if (option === false) return;
      if (typeof option !== 'object') option = {};

      if (Array.isArray(value)) {
        return value && value.length > 0 ? true : option.message || getLocaleMsg('required:leastOne', 'should have at least one');
      }
      return value.trim().length > 0 ? true : option.message || getLocaleMsg('required', 'required');
    },

    chosed: function (value, option) {
      if (option === false) return;
      if (typeof option !== 'object') option = {};

      return value != -1 ? true : option.message || getLocaleMsg('chosed', 'required');
    },

    email: function (value, option) {
      if (option === false) return;

      if (/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)) {
        return true;
      } else {
        return option.message || getLocaleMsg('email', 'invalid email');
      }
    },

    url: function (value, option) {
      if (option === false) return;

      // contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
      if (/^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value)) {
        return true;
      } else {
        return option.message || getLocaleMsg('url', 'invalid url');
      }
    },

    date: function (value, option) {
      if (option === false) return;
      return !/invalid|NaN/.test(new Date(value).toString()) ? true : option.message || getLocaleMsg('date', 'invalid date');
    },

    dateISO: function (value, option) {
      if (option === false) return;
      return (/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value) ? true : option.message || getLocaleMsg('dateISO', 'invalid date ( ISO ')
      );
    },

    number: function (value, option) {
      if (option === false) return;
      return (/^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value) ? true : option.message || getLocaleMsg('number', 'invalid number')
      );
    },

    digits: function (value, option) {
      if (option === false) return;
      return (/^\d+$/.test(value) ? true : option.message || getLocaleMsg('digits', 'invalid digits')
      );
    },

    decimal: function (value, option) {
      if (typeof option === 'number') option = {
        precision: option
      };
      var result = new RegExp('^[0-9,]+(\\.\\d{0,' + option.precision + '})?$').test(value);
      return result || option.message || makeErrorMsg('decimal', 'Please enter a correct {0} decimal', option.precision);
    },

    // based on http://en.wikipedia.org/wiki/Luhn/
    creditcard: function (value, option) {
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

    length: function (value, option) {
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

    count: function (value, option) {
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

    min: function (value, option) {
      if (typeof option === 'number') option = {
        min: option
      };
      return value >= option.min ? true : option.message || makeErrorMsg('min', 'should less than or equal to {0}', option.min);
    },

    max: function (value, option) {
      if (typeof option === 'number') option = {
        max: option
      };
      return value <= option.max ? true : option.message || makeErrorMsg('max', 'should less than or equal to {0}', option.max);
    },

    range: function (value, option) {
      return value >= option.min && value <= option.max ? true : option.message || makeErrorMsg('range', 'should between {0} and {1}', option.min, option.max);
    },

    async: function (value, option, callback, props) {
      option.validate(value, option, callback, props);
      return 'pending';
    },

    greaterThan: function (value, option) {
      if (typeof option === 'number') option = {
        value: option
      };
      return Number(value) > option.value ? true : option.message || makeErrorMsg('greaterThan', 'should greater than {0}', option.value);
    },

    lessThan: function (value, option) {
      if (typeof option === 'number') option = {
        value: option
      };
      return Number(value) < option.value ? true : option.message || makeErrorMsg('lessThan', 'should less than {0}', option.value);
    },

    compare: function (value, option, callback, props) {
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
      return result ? true : option.message || util.format(msg, props[0], props[1]);
    },

    pattern: function (value, option) {
      var regexp = 'regexp' in option ? option.regexp : option;
      if (typeof regexp === 'string') {
        regexp = new RegExp('^(?:' + regexp + ')$');
      }
      return regexp.test(value) ? true : option.message || getLocaleMsg('pattern', 'invalid format');
    },

    time: function (value, option) {
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

  var vueValidate = {
    install: function (Vue) {
      Vue.mixin({
        data: function () {
          return {
            validateState: {},
            validateError: {}
          };
        },
        created: function () {
          let vm = this;
          let option = this.$options.validate;
          let validator = option.validator;
          if (!validator) return;

          let target = option.target;
          let vmTarget = vm.$get(target);
          let labels = option.labels;

          if (typeof validator === 'function') {
            validator = validator();
          } else if (!(validator instanceof Validator)) {
            validator = new Validator(validator);
          }
          vm.validator = validator;

          // set target
          vm.$watch(target, function (val) {
            validator.setValidateTarget(val, labels);
          });
          validator.setValidateTarget(vmTarget, labels);

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

            validator.validate(prop, function (isValid) {
              vm.validateState[prop] = isValid;
              vm.validateError[prop] = validator.getErrors(prop).join('\n');
            });
          }

          let props = option.targetProps || Object.keys(vmTarget);
          props.forEach(function (prop) {
            validateProp(target + '.' + prop, prop);
          });

          // handle validator reset
          let onReset = function () {
            let state = vm.validateState;
            for (let p in state) {
              state[p] = true;
            }

            let error = vm.validateError;
            for (let p in error) {
              error[p] = '';
            }
          };
          vm._onValidatorReset = onReset;
          validator.onReset(onReset);
        },
        beforeDestory: function () {
          if (!this.validator) return;
          this.validator.unReset(this._onValidatorReset);
          this.validator.setValidateTarget(null);
        }
      });
    }
  };

  function validateForm (jQuery) {
    var $ = jQuery;

    function ValidateForm() {
      if (this.constructor != ValidateForm) {
        return new ValidateForm.apply(this, arguments);
      }

      this.initialize.apply(this, arguments);
    }

    var proto = ValidateForm.prototype;
    var lastValue;

    proto.initialize = function (form, validator, option) {
      if (!option) option = {};

      var defaults = {
        immedicate: true,
        event: 'change',
        submit: true,
        validateOnSubmit: false,
        popupMessage: false,
        checkFully: true,
        excludes: '',
        i18n: function (msg) {
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

      validator.onValidatedAll(function (isValid) {
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

      validator.onReset(function () {
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

          if (!validator.hasRule(prop)) return;

          if (validator.getProp(prop) === lastValue) return;

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

    proto.toggleError = function (element, valid, msges) {
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

    proto.createErrorElement = function (errorMsges) {
      return $('<span></span>').addClass('help-block').addClass(this.errorElementCls).html(errorMsges.join('<br>'));
    };

    proto.removeError = function (element) {
      var errorCls = '.' + this.errorElementCls;

      if (element.parent('.input-group').length) {
        element.parent().parent().find(errorCls).remove();
      } else {
        element.parent().find(errorCls).remove();
      }
    };

    proto.highlight = function (element) {
      $(element).closest('.form-group').addClass('has-error');
    };

    proto.unhighlight = function (element) {
      $(element).closest('.form-group').removeClass('has-error');
    };

    proto.errorPlacement = function (error, element) {
      if (element.parent('.input-group').length) {
        error.insertAfter(element.parent());
      } else {
        error.insertAfter(element);
      }
    };

    return ValidateForm;
  }

  var objValidation = Validator;
  objValidation.i18n = i18n;
  objValidation.checkers = checkers;

  i18n.addLocale('zh', zhLocales);

  i18n.setCurrLocale('en');

  if (typeof window !== 'undefined') {
    window.objValidation = objValidation;
  }

  objValidation.install = function (option) {
    var jQuery = option.jQuery || window.jQuery;
    objValidation.validateForm = validateForm(jQuery);
  };

  objValidation.vueBinder = vueValidate;

  return objValidation;

}));
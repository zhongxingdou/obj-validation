import Validator from './validator'

export default {
  data: function () {
    return {
      validateState: {},
      validateError: {}
    }
  },
  created: function () {
    let vm = this
    let option = this.$options.validate
    if (!option) return

    let target = option.target
    let vmTarget = vm.$get(target)
    let labels = option.labels
    let validator = option.validator
    let rules = option.rules

    // rules 优先于 validator
    if (rules) {
      validator = new Validator(rules)
    } else {
      if (typeof validator === 'function') {
        validator = validator()
      }
    }

    vm.$validator = validator

    // set target
    vm.$watch(target, function (val) {
      validator.setTarget(val, labels)
    })
    validator.setTarget(vmTarget, labels)

    // do validate when any property of target changed
    function validateProp (watchExp, prop) {
      vm.$watch(watchExp, function () {
        validator.validate(prop, function (isValid) {
          vm.validateState[prop] = isValid
          vm.validateError[prop] = validator.getErrors(prop).join('\n')
        })
      })

      vm.$set('validateState.' + prop, true)
      vm.$set('validateError.' + prop, '')
    }

    let props = option.targetProps || Object.keys(vmTarget)
    props.forEach(function (prop) {
      validateProp(target + '.' + prop, prop)
    })

    // handle validator reset
    let onReset = function () {
      let state = vm.validateState
      for(let p in state) {
        state[p] = true
      }

      let error = vm.validateError
      for(let p in error) {
        error[p] = ''
      }
    }
    vm._onValidatorReset = onReset
    validator.onReset(onReset)
  },
  beforeDestory: function () {
    if (!this.validator) return
    this.validator.unReset(this._onValidatorReset)
    this.validator.setTarget(null)
  }
}

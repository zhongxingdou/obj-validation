import Validator from './validator'

export default {
  data: function () {
    return {
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
    validator.setTarget(vmTarget, labels)

    // validate prop when changed
    vm.$watch(target, function (val, oldVal) {
        validator.setTarget(val, labels)
    })

    function validateProp (watchExp, prop) {
      vm.$watch(watchExp, function () {
        validator.validate(prop, function (isValid) {
          vm.$set('validateError.' + prop, validator.getErrors(prop).join('\n'))

          // reset related props state
          let rProps= validator.getRelatedProps(prop)
          rProps.forEach(function (rprop) {
            vm.$set('validateError.' + rprop, validator.getErrors(rprop).join('\n'))
          })
        }, {deep: true})
      })
    }

    let props = option.targetProps || Object.keys(vmTarget)
    props.forEach(function (prop) {
      validateProp(target + '.' + prop, prop)
    })

    // handle validator reset
    validator.on('reset', function () {
      vm.validateError = {}
    })

    validator.on('validated', function (isValid) {
      if (!isValid) {
        vm.validateError = validator.getErrors()
      }
    })
  },

  beforeDestory: function () {
    if (!this.$validator) return
    this.$validator.off('reset', this._onValidatorReset)
    this.$validator.setTarget(null)
  }
}

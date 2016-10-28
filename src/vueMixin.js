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
    let lastTarget = {}
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
      if (val !== oldVal) {
        validator.setTarget(val, labels)
      }

      Object.keys(val).forEach((prop) => {
        if(val[prop] !== lastTarget[prop]) {
          lastTarget[prop] = val[prop]
          validator.validate(prop, function (isValid) {
            vm.$set('validateError.' + prop, validator.getErrors(prop).join('\n'))

            // reset related props state
            let rProps= validator.getRelatedProps(prop)
            rProps.forEach(function (rprop) {
              vm.$set('validateError.' + rprop, validator.getErrors(rprop).join('\n'))
            })
          })
        }
      })
    }, {deep: true})

    // handle validator reset
    let onReset = function () {
      vm.validateError = {}
    }
    vm._onValidatorReset = onReset
    validator.on('reset', onReset)

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

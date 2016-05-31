```javascript
import ObjValidation from 'obj-validation'

let rules = {
  name: {
    required: true,
    length: 20
  },
  birthday: {
    type: Date,
    // custom validate function
    minYear: function (value) {
      const HUMAN_MAXINUM_AGE = 120
      let msg = 'Human\'s age never over ' + HUMAN_MAXINUM_AGE + ' years'
      return (new Date()).getYear() - value.getYear() <= HUMAN_MAXINUM_AGE || msg
    }
  }
}

let user = {
  name: 'hal.zhong',
  birthday: new Date('1883/10/17')
}

let validator = new ObjValidation(rules, user)

validator.validate(function (isValid) {
  console.info('user is ' + isValid ? 'valid' : 'inValid')
  //=> user is in valid
  
  console.log('errors: ', validator.getErrors())
  //=> errors:  ["Human's age never over 120 years"]
})
```
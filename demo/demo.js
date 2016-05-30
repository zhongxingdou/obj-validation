var rules = {
    name: {
        type: String,
        length:  8,
        pattern: /.*\..*/
    },
    age: {
        type: Number,
        max: 150,
        min: 10
    }
}

var obj = {
    name: 'hal.zhong',
    age: 10000
}

var validator = new ObjValidation(rules, obj)
Vue.use(ObjValidation.vueBinder)
ObjValidation.i18n.setCurrLocale('zh')

function validate(){
  validator.validate()
  var errors = validator.getErrors()

  var output = document.getElementById('errors')

  output.innerHTML = '<ul>'
    + errors.map(function(msg){return '<li>' + msg +  '</li>'}).join('')
    + '</ul>'
}

function init(){
  document.getElementById('name').value = obj.name
  document.getElementById('age').value = obj.age

  var form = document.getElementById('validateForm')
  form.addEventListener('submit', function(event){
    event.preventDefault()

    obj.name = document.getElementById('name').value
    obj.age = document.getElementById('age').value

    validate()
  })

  new Vue({
    el: '#vueDemo',
    validate: {
      validator: rules, // validator
      target: 'user',
      targetProps: ['age', 'name'],
      label: {
        name: '用户名',
        age: '年龄'
      }
    },
    data: {
      user: obj
    }
  })
}

init()


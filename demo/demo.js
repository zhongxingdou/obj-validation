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
    mixins: [ObjValidation.vueMixin],
    validate: {
      // 验证规则
      rules: {
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
      },
      // 要验证的对象，可以通过 vm.$get('user') 获取
      target: 'user',
      // 可选项，只验证指定成员
      targetProps: ['age', 'name'],
      // 可选项，提供字段标签，方便展示给用户（字段名不容易理解）
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


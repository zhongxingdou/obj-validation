var rules = {
    name: {
        type: String,
        length:  8
    },
    age: {
        type: Number,
        max: 150
    }
}

var obj = {
    name: 'hal.zhong',
    age: 10000
}

var validator = new objValidation(rules, obj)

function validate(){
  validator.validate()
  var errors = validator.getErrors()

  var output = document.getElementById('errors') 

  output.innerHTML = '<ul>'
    + errors.map(function(msg){return '<li>' + msg +  '</li>'})
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
}

init()


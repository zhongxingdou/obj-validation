# 自定义验证函数
## 自定义异步规则函数
```javascript
import ObjValidation from 'obj-validation'
import $ from 'jquery'

let checkers = ObjValidation.checkers
checkers.remote = function (value, option, callback, props, labels) {
  if (typeof option === 'string') option = {url: option}

  let default = {
    dataType: 'json'
    url: option.url,
    data: Object.assign(
        {[option.dataKey || props[0]]: value },
        option.data
    )
  }

  let option = $.extend({}, default, option.ajax)

  $.ajax(option).done(function (res) {
    callback(res.result || res.message || option.message)
  }).fail(function () {
    callback('请求验证失败')
  })

  return 'pending'
}

// usage
let rules = {
  email: {
    remote: 'http://api.com/validateEmail'
  },
  code: {
    remote: {
      url: 'http://api.com/validateCode',
      dataKey: 'userCode',
      data: {
        action: 'vis'
      }
    }
  }
}
```


## 声明自定义验证规则时指定验证函数

```javascript
let rules = {
  name: {
    required: true,
    englishName: function (value) {
      const pattern = /\w+\.\w+/
      return pattern.test(value) || 'invalid format. format should like Jim.Green'
    }
  }
}
```

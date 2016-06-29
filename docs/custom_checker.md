# 自定义验证函数

## 自定义异步验证函数

```javascript
import ObjValidation from 'obj-validation'
import $ from 'jquery'

// 验证结果示例 {result: false, message: '您注册的邮箱已被占用'}
// 规则配置项 {
//   url: '/path/to/validate' // 要请求的 url
//   dataKey: 'email' // 可选，重命名当前验证字段发送给后台时使用的名字
//   data: {} // 可选，验证请求时要附带的其他数据
//   ajax: {} // 可选，验证请求的其他 ajax option，上面的 url 和 data 的优先级高于这里的
// }
ObjValidation.addChecker('remote', function (value, option, callback, props, labels) {
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
})

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

# 验证规则和验证函数

## 验证规则
验证规则 = 对象属性名 + 规则名 + 规则选项

### 对象属性名

指当前规则要验证的对象属性。如一个规则要同时验证多个属性，则用 ',' 分隔属性名，如 'firstName,lastName'


### 规则名

通过规则名找到全局验证函数。如果是自定义验证规则，则是该规则的唯一 Key，起到区别其他验证规则的作用。

### 规则选项

提供给验证函数使用，为验证函数提供除属性值外的其他参数，让验证函数更通用。

规则选项的类型为 Object 或其他类型。为其他类型时，验证函数则把它设为选项成员中默认项的值。此默认项往往是最经常使用的必须选项。为其他类型时还有一种情况就是验证函数只有单一选项，如 required 验证规则。

规则选项可设置全局默认值。

### 验证规则的示例
```json
let userRules = {
  name: {
    required: true,
    length: {
      min: 5,
      max: 20
    },
    // 自定义的规则名和验证函数
    englishName: function (value) {
      const pattern = /\w+\.\w+/
      return pattern.test(value) || 'Invalid format. format should like Jim.Green'
    }
  }
}
```

## 验证函数
执行验证的主体，具有统一的签名 function (value, option, callback, props, labels) : Boolean | String

## 验证函数的签名

### 形式参数

- value: Object | [Object]

  验证属性的值，如果是组合属性验证（如'firstName,lastName'），则为属性值数组

- option: Object

  验证函数提供的选项，用于存放除属性值外的其他参数

- callback: Function (result: Boolean | String)

  异步验证函数的回调，形式参数的意义同验证函数的返回值

- props: [String]

  属性名，可用于异步验证时传递属性值时指定属性名

- labels: [String]

  属性标签，一般用于告诉用户哪个属性出错

### 返回值
- 值类型为 Boolean

  只能为 true 值，表验证通过，无错误

- 值类型为 String

  验证失败，表错误消息，英文情况下建议格式为首单词首字母大写

- 异步验证函数的返回值始终为 'pending'

###  异步验证函数
异步验证函数的验证结果不能在执行结束时立即返回，它的验证结果以回调的形式返回。
Obj-Validation 要求异步规则的验证函数的返回结果总是字符串 'pending'。

常见的异步验证规则有远程验证，如远程验证用户注册邮箱是否唯一。

### 全局验证函数
全局验证规则可在任何规则声明中直接使用，它定义在 ObjValidation.checkers 中。

### 局部验证函数
局部验证函数是指在声明验证规则时直接指定的验证函数，它的签名应和全局验证函数一致。


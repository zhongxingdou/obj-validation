# `.validate()`

执行验证，它有两种签名

## `.validate([validateOption])`

验证目标对象

### 参数

- validateOption: ValidateOption

    可选，验证选项，参见 [ValidateOption](validateOption.md)

## `.validate([prop], [callback], [validateOption])`

验证目标对象的指定属性

### 参数

- prop: String

    可选，要验证的属性，如未提供，则验证所有规则

- callback: Function (isValid : Boolean, errors: [String])

    可选，验证完成后的回调，回调函数的参数 isValid 表验证是否通过，errors 表验证出错后的错误信息

- validateOption: ValidateOption

    可选，验证选项，参见 [ValidateOption](validateOption.md)

## 示例

```javascript
import ObjValidation from 'obj-validation'

let user = {name: 'hal', age: 20}

let rule = {
  name: {
    required: true
  },
  age: {
    type: Number
  }
}

let validator = new ObjValidation(rule, user)
validator.validate() // true

user.age = '20'
validator.validate('age') // false
```

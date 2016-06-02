# `.setTarget(obj, [propLabels])`

设置验证对象和它的属性标签

## 参数

- obj: Object

    要验证的对象

- propLabels: Object {prop: label}

    属性标签，未设置时等于属性名

## 示例

```javascript
import ObjValidation from 'obj-validation'

let user = {name: 'hal'}
let userLabels = {
  name: '姓名'
}

let userValidator = new ObjValidation()
userValidator.setTarget(user, userLabels)
```

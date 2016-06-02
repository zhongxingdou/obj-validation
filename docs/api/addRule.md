# `.addRule()`

为验证目标对象添加验证规则，它有两个签名

## `.addRule(prop, ruleName, ruleOption)`

### 参数

- prop: String

    此规则要验证的目标对象属性

- ruleName: String

    规则名

- ruleOption: Object {prop: label}

    规则选项，和该选项的全局默认值合并后，传给验证函数

## `.addRule(prop, rules)`

### 参数

- prop: String

    此规则要验证的目标对象属性

- rules: Object {ruleName: ruleOption}

    规则名和规则选项组成的对象

## 示例

```javascript
import ObjValidation from 'obj-validation'

let user = {name: 'hal'}

let userValidator = new ObjValidation(user)

userValidator.addRule('name', 'length',  {min: 5, max: 30})

userValidator.addRule('name', {
  'required': true,
  'pattern': /\w+\.\w+/
})
```

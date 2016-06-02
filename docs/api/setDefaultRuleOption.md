# `.setDefaultRuleOption(ruleName, ruleOption)`

设置验证对象和它的属性标签

## 参数

- ruleName: String

    规则名

- ruleOption: Object

    规则选项

## 示例

```javascript
import ObjValidation from 'obj-validation'

let price = {
  sold_price: '3.87',
  base_price: '3.25'
}

let rule = {
  sold_price: {
    decimal: {}
  },
  base_price: {
    decimal: {
      precision: 2
    }
  }
}

let validator = new ObjValidation(rule, price)

validator.setDefaultRuleOption('decimal', {
  precision: 1
})

validator.validate('sold_price') // 'Please enter a correct 1 decimal'
validator.validate('base_price') // true
```

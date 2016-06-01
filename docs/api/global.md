# 全局对象

## 全局属性

### `.vueMixin`

提供给 Vue组件使用的 mixin，[参见](vueMixin.md)

### `.i18n`

##### `.i18n.setCurrLocale(locale:String)`

  设置当前语言

##### `.i18n.getLocaleString(key:String)`

  获取当前语言的翻译

##### `.i18n.addLocale(locale:String, dict:Object)`

  添加语言字典

## 全局方法

### `.addChecker(name:String, checker:Function)`
### `.addChecker(checkers:Object)`
注册验证函数

### `.setDefaultParamForRule(rule:String, param:Object)`
为指定验证规则设置全局默认参数

### `.validateForm(form:HTMLFormElement, validator:ObjValidation, option:Object)`

验证表单，[参见](validateForm.md)

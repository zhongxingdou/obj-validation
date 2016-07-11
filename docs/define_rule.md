# 定义验证规则
## 对象属性名

验证规则的对象属性名有两种

- 单一属性

    如 'userName'

- 组合属性

    如 'firstName,lastName'

    **注意** 组合属性默认只对第一个对属性标记错误信息，如果要标记所有属性，需要设置规则选项 markRelatedProps 为 true

# Obj-Validation

Obj-Validation 是一个 JavaScript object validation 库。

它的验证规则声明看起来和 [jQueryValidation](https://jqueryvalidation.org/) 这类的表单验证很相似，这让你有熟悉的感觉，因此它很容易上手。

它的本质是对象验证，核心 API 都是围绕这个目标展开。它对表单的支持是通过适配器的形式支持，适配器通过调用核心库的 API 来验证表单值，但核心库并不知道表单的存在。

## 特性：

1. 支持对象成员间验证
2. 支持为验证器实例添加自定义规则
3. 支持异步验证
4. 支持验证规则组，减少声明重复的验证规则
5. 支持为验证函数设置全局默认参数
6. 支持多语言

## 对表单验证的支持

如果你的项目使用了 jQuery，Obj-Validation 提供了 ObjValidation.validateForm() 这个方法来实现表单验证。它会监听表单输入，在控件值改变后，通过控件的 name 属性，找到需要验证的规则并验证和显示错误信息。

如果你的项目使用了 Vue，Obj-Validation 提供了 ObjValidation.vueMixin 对象，你可以在 Vue 的组件中 mixin 它，它会监听组件的 data 选项中声明的指定数据，并在数据改变后自动的进行验证。验证的结果会保存在组件数据的 ValidateError 和 ValidateState 对象上。你也可在表单提交时调用 API 进行验证。



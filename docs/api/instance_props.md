# 实例属性
> 所有属性都不推荐直接访问，将来可能变私有，此出列出只为方便调试时查看

### `.validateErrors`

类型: Object，结构示例：

```javascript
{
  userName: {
    length: 'Should at least 5 characters',
    pattern: 'Invalid format',
    ...
  },
  ...
}
```

### `.rules`

类型: Object，结构示例:

```javascript
{
  userName: {
    required: true,
    length: {
      min:  5,
      max: 20
    }
    ...
  },
  ...
}
```

### `.checkers`

类型: Object，验证器的验证函数

### `._pendingCount`

类型: Number，表示有多少个异步验证正在执行

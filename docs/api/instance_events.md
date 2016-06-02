# 实例事件

## 所有事件

- pendingStart

    第一个异步验证函数开始执行时发生。pengindEnd 事件发生后，执行新的异步验证时，此事件将再将发生。

- pendingEnd

    所有已开始的异步验证都已结束。但是并不代表不会有新的异步验证发生。

- validated

    所有验证规则都验证完成后发生，包括需要异步执行的规则也已结束。

- reset

    调用 reset() 方法后发生，该方法将重设验证状态。具体请参见 [reset()](reset.md)

## 事件监听

-  监听事件

    参见 API [.on(event, handler)](on.md)

- 停止指定函数监听事件

    参见 API [.off(event, handler)](off.md)

- 监听 pendingStart 和 pendingEnd 事件

    参见 API [.onPending(startHandler, endHandler)](onPending.md)

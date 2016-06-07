export default function EventObserver(validEvent) {
  this._observers = {}
  this._validEvent = validEvent
}

EventObserver.prototype = {
  _isValidEvent: function (eventType) {
    if (!this._validEvent) return true
    return this._validEvent.indexOf(eventType) !== -1
  },
  on: function (eventType, handler) {
    if (!this._isValidEvent(eventType)) return

    var observers = this._observers
    var typeObservers = observers[eventType]
    if (!typeObservers) typeObservers = observers[eventType] = []

    typeObservers.push(handler)
  },

  once: function(eventType, handler) {
    var self = this
    var wrap = function () {
      self.off(eventType, wrap)
      handler.apply(null, arguments)
    }

    this.on(eventType, wrap)
  },

  off: function (eventType, handler) {
    if (!this._isValidEvent(eventType)) return

    var observers = this._observers
    var typeObservers = observers[eventType]
    if (!typeObservers) return

    var i = typeObservers.indexOf(handler)
    if (i === -1) {
      return
    }

    typeObservers.splice(i, 1)
  },

  fire: function (eventType) {
    if (!this._isValidEvent(eventType)) return

    var observers = this._observers
    var typeObservers = observers[eventType]
    if (!typeObservers) return

    var args = Array.from(arguments).slice(1)
    typeObservers.forEach(function (handler) {
      handler.apply(null, args)
    })
  }
}

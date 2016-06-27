import assert from 'better-assert'
import EventObserver from '../src/EventObserver'

describe('EventObserver', function() {
  it('once()', function () {
    var e = new EventObserver()

    var i = 0
    var spy = function (n) {
      i = n
    }

    e.once('myEvent', spy)

    e.fire('myEvent', 1)
    assert(i === 1)

    e.fire('myEvent', 4)
    assert(i === 1)
  })
})

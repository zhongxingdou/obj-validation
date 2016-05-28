var Validator = require("../dist/objValidation")
var sinon = require('sinon')
var assert = require('better-assert')

describe('checkers', function() {
  var v

  beforeEach(function(done) {
    v = new Validator()
    done()
  })

  afterEach(function(){
    v.clearRules()
  })

  it('depends', function() {
    var user = {
      gender: '',
      dressing: []
    }
    v.setValidateTarget(user)

    var rules = {
      'dressing,gender': {
        depends: true
      }
    }

    v.addRule('dressing,gender', rules['dressing,gender'])
    assert(v.validate() === false)
    assert(v.getErrors()[0] === 'dressing depends gender')
  })

  it('uniq', function() {
    var user = {
      name: 'hal'
    }
    v.setValidateTarget(user)

    v.addRule('name', 'uniq', {collection: ['hal', 'jerry']})

    assert(v.validate() === false)

    user.name = 'hal2'
    assert(v.validate() === true)
  })

  it('uniq specify how to get item', function() {
    var user = {
      name: 'hal'
    }
    v.setValidateTarget(user)

    v.addRule('name', 'uniq', {
      collection: [{name: 'hal'}, {name: 'jerry'}],
      getItem: function (item) {
        return item.name
      }
    })

    assert(v.validate() === false)

    user.name = 'hal2'
    assert(v.validate() === true)
  })

  it('required', function() {
    var user = {
      name: ''
    }
    v.setValidateTarget(user)

    v.addRule('name', 'required')

    assert(v.validate() === false)

    user.name = 'hal2'
    assert(v.validate() === true)
  })

  it('required for Array', function() {
    var user = {
      interest: []
    }
    v.setValidateTarget(user)

    v.addRule('interest', 'required')

    assert(v.validate() === false)

    user.interest.push('singing')
    assert(v.validate() === true)
  })

  it('compare', function() {
    var goods = {
      grossWeight: 300,
      netWeight: 350
    }
    v.setValidateTarget(goods, {
      grossWeight: '毛重',
      netWeight: '净重'
    })

    v.addRule('netWeight,grossWeight', 'compare', {operate: '<'})

    assert(v.validate() === false)
    assert(v.getErrors()[0] === '净重 should less than 毛重')

    goods.netWeight = 200
    assert(v.validate() === true)
  })

  it('async validate', function(done) {
    var user = {
      email: 'hal@g.com'
    }

    v.setValidateTarget(user)

    v.addRule('email', 'async', {
      validate: function(value, option, callback, props) {
        setTimeout(function() {
          callback(true)
          assert(v.getErrors().length === 0)
          done()
        })
      }
    })

    assert(v.validate() === 'pending')
  })

  it('async validate failed', function(done) {
    var user = {
      email: 'hal@g.com'
    }

    var invalidMsg = 'invalid email'

    v.setValidateTarget(user)

    v.addRule('email', 'async', {
      validate: function(value, option, callback, props) {
        setTimeout(function() {
          callback(invalidMsg)
          assert(v.getErrors()[0] === invalidMsg)
          done()
        })
      }
    })

    v.validate()
  })
})

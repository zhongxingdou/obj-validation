var Validator = require("../dist/objValidation");
var should = require('should');
var sinon = require('sinon');

describe('Validator', function() {
    var v;

    beforeEach(function(done) {
        v = new Validator();
        done();
    })

    it('new Validator(rules, obj)', function() {
        var validateTarget = {};
        var instance = new Validator({
            name: {
                required: true,
                decimal: 2
            }
        }, validateTarget);

        instance.getContext().should.equal(validateTarget);
        instance.getRule('name').should.have.property('required', true);
        instance.getRule('name').should.have.property('decimal', 2);
        instance.isValid().should.be.true;
    });

    it('add type rule', function() {
        var type = {
            rules: {
                required: true,
                number: true
            }
        }

        v.addRule('score', 'type', type);

        v.rules.should.have.property('score');
        v.rules.score.should.have.property('required', type.rules.required);
        v.rules.score.should.have.property('number', type.rules.number);
    });

    it('setDefaultParamForRule(rule, param)', function() {
        var ajaxOption = {
            type: 'post'
        }

        v.setDefaultParamForRule('remote', ajaxOption);

        v.defaultParamOfRule.should.have.property('remote', ajaxOption);
    });

    it('merge param', function() {
        Validator.setDefaultParamForRule('ajax', {
            type: 'json',
            dataType: 'json',
            data: {
                user: {
                    score: {
                        art: 18
                    }
                },
                app: 'web'
            }
        });

        v.setDefaultParamForRule('ajax', {
            dataType: 'text',
            data: {
                user: {
                    score: {
                        english: 60
                    }
                }
            }
        });

        var mergedParam;
        v.getCheckerByRule = function(name) {
            var checker = {
                ajax: function(value, param) {
                    mergedParam = param;
                    return true;
                }
            }
            return checker[name];
        }

        v.setValidateTarget({
            name: 'hal'
        });

        v.addRule('name', {
            ajax: {
                type: 'text',
                data: {
                    user: {
                        gender: 1
                    }
                }
            }
        });

        v.validate('name');

        mergedParam.should.eql({
            type: 'text', //rule
            dataType: 'text', //instance
            data: {
                app: 'web', //global
                user: {
                    gender: 1, //rule
                    score: {
                        english: 60, //instance
                        art: 18 //global
                    }
                }
            }
        });
    });

    describe('addRule(prop, ruleMap)', function () {
        it('addRule(prop, rule, option), getRule(prop)', function() {
            v.getRule('prop').should.not.null
            Object.keys(v.getRule('prop')).should.be.empty

            v.addRule('prop', 'required', true);
            v.addRule('prop', 'number', true);
            v.addRule('prop', 'decimal', 2);

            var rule = v.getRule('prop');
            rule.should.have.property('required', true);
            rule.should.have.property('number', true);
            rule.should.have.property('decimal', 2);
        });

        it('addRule(prop, ruleMap)', function() {
            v.addRule('prop', {
                'required': true,
                'number': true,
                'decimal': 2
            });

            var rule = v.getRule('prop');
            rule.should.have.property('required', true);
            rule.should.have.property('number', true);
            rule.should.have.property('decimal', 2);
        });

        it('addRule(prop, type, Type)', function () {
            v.addRule('prop', 'type', {
                rules: {
                    'required': true,
                    'decimal': 2
                }
            });

            var rule = v.getRule('prop');
            rule.should.have.property('required', true);
            rule.should.have.property('decimal', 2);
        });

        it('addRule([prop1, prop2], ruleMap)', function () {
            v.addRule(['p1', 'p2'], 'type', {
                rules: {
                    'required': true,
                    'decimal': 2
                }
            });

            var rule = v.getRule('p1,p2');
            rule.should.have.property('required', true);
            rule.should.have.property('decimal', 2);
        });


    });

    describe('setValidateTarget(obj)', function() {
        var obj = {
            'prop': 'value'
        }
        beforeEach(function(done) {
            v.setValidateTarget(obj);
            done();
        })

        it('getContext()', function() {
            v.getContext().should.equal(obj);
        });

        it('getProp(prop)', function() {
            v.getProp('prop').should.equal(obj.prop);
        });
    });

    describe('_addErrorTo(prop,errors)', function() {
        var errorOfName = {
            "rule1": "some error about name"
        }
        var errorOfAge = {
            "rule1": "less than 1",
            "rule2": "geater than 100"
        }

        beforeEach(function(done) {
            v._addErrorTo('name', errorOfName);
            v._addErrorTo('age', errorOfAge);
            done();
        })

        it('getErrorsOf(prop)', function() {
            v.getErrors('name').should.containEql(errorOfName["rule1"]);
            v.getErrors('age').should.containEql(errorOfAge["rule1"]);
            v.getErrors('age').should.containEql(errorOfAge["rule2"]);
        });

        it('getAllErrors()', function() {
            var allErrors = v.getErrors();
            allErrors.should.containEql(errorOfName["rule1"]);
            allErrors.should.containEql(errorOfAge["rule1"]);
            allErrors.should.containEql(errorOfAge["rule2"]);
        });

        it('isValid()', function() {
            v.isValid('name').should.be.false
            v.isValid('age').should.be.false

            v.isValid('other').should.be.true

            v.isValid().should.be.false
        });
    });

    describe('validate()', function() {
        beforeEach(function(done) {
            v.getCheckerByRule = function(name) {
                var checker = {
                    required: function(value) {
                        return value !== '' || 'required';
                    },
                    isUniq: function(value, param, callback) {
                        setTimeout(function() { //mock ajax
                            callback(true);
                        }, 0);
                        // request server validate if the value is unque.
                        return 'pending';
                    },
                    length: function(value, param) {
                        return value.length <= param || "length should less than or equal to " + param;
                    }
                }
                return checker[name];
            }
            done();
        });

        it('validate() use custom checker defined in option', function () {
            spy = sinon.spy();
            v.addRule('p1', 'rule1', {
                p1: 2,
                checker: spy
            });

            v.setValidateTarget({p1: "hal"});

            v.validate('p1');

            spy.called.should.be.true
        });

        it('validate(prop)->true', function() {
            v.setValidateTarget({
                name: "hal.zhong"
            });
            v.addRule('name', 'required', true);

            v.validate('name').should.be.true;
        });

        describe('validate(prop)->pending', function() {
            var cbCalled = false;
            var emailIsValid = null;
            var result = '';

            before(function(done) {
                v.setValidateTarget({
                    email: "name@domain.com"
                })
                v.addRule('email', 'isUniq', true);

                var cb = function(isValid) {
                    cbCalled = true;
                    emailIsValid = isValid;
                    done();
                }

                result = v.validate('email', cb)
            })


            it('normal', function() {
                cbCalled.should.be.true;
                emailIsValid.should.be.true;
                result.should.equal('pending');
            });
        });

        it('validate(prop)->false', function() {
            v.setValidateTarget({
                name: ""
            });
            v.addRule('name', 'required', true);

            v.validate('name').should.be.false;
        });

        it('with option.markAll', function () {
            v.addRule('fname,lname', 'fullname required', {
                checker: function(v) {
                    return (this.fname !== '' && this.lname !== '') || 'invalid fullname';
                },
                markAll: true
            });

            v.setValidateTarget({
                fname: '',
                lname: 'zhong'
            });
            var result = v.validate('lname');

            result.should.be.false;
            v.isValid('fname').should.be.false
            v.isValid('lname').should.be.false
        }); 

        it('validate(prop) should validate property related rules', function() {
            v.addRule('fname,lname', 'fullname required', function(v) {
                return (this.fname !== '' && this.lname !== '') || 'invalid fullname';
            })
            v.addRule('lname', 'required', true)

            v.setValidateTarget({
                fname: '',
                lname: 'zhong'
            });
            var result = v.validate('lname');

            result.should.be.false;
            v.isValid('fname').should.be.false
            v.isValid('lname').should.be.true
            v.getErrors('fname').should.containEql('invalid fullname');

            v.setValidateTarget({
                fname: 'hal',
                lname: 'zhong'
            });
            v.addRule('lname', {
                length: 4
            });

            var result = v.validate('fname');
            result.should.be.true;
            v.isValid('fname').should.be.true

            // 验证fname的时候不会因为fname+lname而去验证lname
            v.isValid('lname').should.be.true


            var result = v.validate('lname', {checkFully: true});
            result.should.be.false;

            // fname+lname会通过
            v.getErrors('lname').length.should.be.equal(1);

            var spy = sinon.spy()
            v.validate('lname', spy, {checkFully: true})
            spy.calledWith(false).should.true
        });

        it('onPending(observer)', function(done) {
            var spy = sinon.spy();
            v.onPending(spy);

            v.setValidateTarget({
                name: 'hal'
            });
            v.addRule('name', {
                isUniq: true
            });

            v.validate(function() {
                spy.called.should.true;
                done();
            });
        });

        it('onValidatedAll(observer)', function(done) {
            var spy = sinon.spy();
            v.onValidatedAll(spy);

            v.setValidateTarget({
                name: 'hal'
            });
            v.addRule('name', {
                isUniq: true
            });

            v.validate(function() {
                spy.calledWith(true).should.true;
                done();
            });
        });
    });

    it('getRelatedProps(prop)', function () {
        v.addRule('prop1,prop2', 'rule1', function(){});
        v.addRule('prop1,prop3', 'rule2', function(){});
        v.addRule('prop1,prop2,prop5', 'rule3', function(){})

        var prop1Relates = v.getRelatedProps('prop1');
        prop1Relates.should.containEql('prop2', 'prop3', 'prop5');
        prop1Relates.length.should.equal(3);

        var prop2Relates = v.getRelatedProps('prop2');
        prop2Relates.should.containEql('prop1', 'prop5');

        var prop3Relates = v.getRelatedProps('prop3');
        prop3Relates.should.containEql('prop1');

        var prop5Relates = v.getRelatedProps('prop5');
        prop5Relates.should.containEql('prop1');
    });
});

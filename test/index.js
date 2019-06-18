'use strict'

const test = require('tape')
const muta = require('..')
const { deepEquals } = require('./common.js')

test('wrap object', (t) => {
  let original = { foo: 5 }
  let wrapper = muta(original)
  wrapper.foo += 1
  t.equals(wrapper.foo, 6)
  t.equals(original.foo, 5)
  t.end()
})

test('wrap array', (t) => {
  let original = [ 1, 2 ]
  let wrapper = muta(original)
  wrapper.push(3)
  t.equals(wrapper[2], 3)
  t.equals(original[2], undefined)
  t.end()
})

test('commit', (t) => {
  let original = { foo: 5 }
  let wrapper = muta(original)
  wrapper.foo += 1
  muta.commit(wrapper)
  t.equals(original.foo, 6)
  t.end()
})

test('getPatch', (t) => {
  let original = { foo: 5 }
  let wrapper = muta(original)
  wrapper.foo += 1
  let patch = muta.getPatch(wrapper)
  deepEquals(t, patch, {
    'Symbol(assign)': { foo: 6 }
  })
  t.end()
})

test('isMuta', (t) => {
  let original = { foo: { bar: 5 } }
  let wrapper = muta(original)
  t.true(muta.isMuta(wrapper))
  t.true(muta.isMuta(wrapper.foo))
  t.false(muta.isMuta(wrapper.foo.bar))
  t.false(muta.isMuta(original))
  t.false(muta.isMuta(original.foo))
  t.false(muta.isMuta(original.foo.bar))
  t.false(muta.isMuta(null))
  t.end()
})

test('wasMutated', (t) => {
  let original = { foo: { bar: 5 } }
  let wrapper = muta(original)
  t.false(muta.wasMutated(wrapper))
  original.foo.bar += 1
  t.false(muta.wasMutated(wrapper))
  t.equal(original.foo.bar, 6)
  t.equal(wrapper.foo.bar, 6)
  wrapper.foo.bar += 1
  t.true(muta.wasMutated(wrapper))
  t.equal(original.foo.bar, 6)
  t.equal(wrapper.foo.bar, 7)
  t.end()
})

test('function class', (t) => {
  function Original () { this.b = 123 }
  Original.prototype.a = function () { this.b = 456 }
  const Copy = muta(Original)
  Copy.prototype.a = function () { this.b = 789 }

  const copy = new Copy()
  t.equal(copy.b, 123)
  copy.a()
  t.equal(copy.b, 789, 'uses new method for "a"')
  const original = new Original()
  t.equal(original.b, 123)
  original.a()
  t.equal(original.b, 456, 'original should be unmodified')

  t.end()
})

test('class syntax', (t) => {
  class Original {
    constructor () {
      this.b = 123
    }
    a () {
      this.b = 456
    }
  }
  const Copy = muta(Original)

  const copy = new Copy()
  t.equal(copy.b, 123)
  copy.a()
  t.equal(copy.b, 456)

  Original.prototype.a = function () { this.b = 789 }
  copy.a()
  t.equal(copy.b, 789)

  t.end()
})

test('class syntax subclass', (t) => {
  class Original {
    constructor () {
      this.b = 123
    }
    a () {
      this.b = 456
    }
  }
  const Copy = muta(Original)

  class NewClass extends Copy {
    constructor () {
      super()
      this.b = 789
    }
  }

  const inst = new NewClass()
  t.equal(inst.b, 789)
  inst.a()
  t.equal(inst.b, 456)

  t.end()
})

test('commit called on non-wrapper', (t) => {
  try {
    muta.commit({})
    t.fail()
  } catch (err) {
    t.equals(err.message, 'Argument must be a muta wrapped object')
  }
  t.end()
})

test('getPatch called on non-wrapper', (t) => {
  try {
    muta.getPatch({})
    t.fail()
  } catch (err) {
    t.equals(err.message, 'Argument must be a muta wrapped object')
  }
  t.end()
})

test('access buffer property', (t) => {
  let obj = muta({ foo: Buffer.from([ 1, 2, 3 ]) })
  t.equals(obj.foo.toString('hex'), '010203')
  t.end()
})

test('access buffer element', (t) => {
  let arr = muta([ Buffer.from([ 1, 2, 3 ]) ])
  t.equals(arr[0].toString('hex'), '010203')
  t.end()
})

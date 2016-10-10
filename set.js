var LazyWatcher = require('./lib/lazy-watcher')

module.exports = Set

function Set (defaultValues) {
  var instance = new ProtoSet(defaultValues)
  var observable = instance.MutantSet.bind(instance)
  observable.add = instance.add.bind(instance)
  observable.clear = instance.clear.bind(instance)
  observable.delete = instance.delete.bind(instance)
  observable.has = instance.has.bind(instance)
  observable.set = instance.set.bind(instance)
  observable.get = instance.get.bind(instance)
  observable.getLength = instance.getLength.bind(instance)
  return observable
}

// optimise memory usage
function ProtoSet (defaultValues) {
  var self = this
  self.object = []
  self.sources = []
  self.releases = []
  self.binder = LazyWatcher.call(self, self._update, self._listen, self._unlisten)
  self.binder.value = this.object

  if (defaultValues && defaultValues.length) {
    defaultValues.forEach(function (valueOrObs) {
      if (!~self.sources.indexOf(valueOrObs)) {
        self.sources.push(valueOrObs)
      }
    })
    this.update()
  }
}

ProtoSet.prototype.MutantSet = function (listener) {
  if (!listener) {
    return this.binder.getValue()
  }
  return this.binder.addListener(listener)
}

ProtoSet.prototype.add = function (valueOrObs) {
  if (!~this.sources.indexOf(valueOrObs)) {
    this.sources.push(valueOrObs)
    if (this.binder.live) {
      this.releases[this.sources.length - 1] = this._bind(valueOrObs)
    }
    this.binder.onUpdate()
  }
}

ProtoSet.prototype.clear = function () {
  this.releases.forEach(tryInvoke)
  this.sources.length = 0
  this.releases.length = 0
  this.binder.onUpdate()
}

ProtoSet.prototype.delete = function (valueOrObs) {
  var index = this.sources.indexOf(valueOrObs)
  if (~index) {
    this.sources.splice(index, 1)
    this.releases.splice(index, 1).forEach(tryInvoke)
    this.binder.onUpdate()
  }
}

ProtoSet.prototype.has = function (valueOrObs) {
  return !!~this.object.indexOf(valueOrObs)
}

ProtoSet.prototype.set = function (values) {
  var self = this
  self.sources.length = 0
  if (Array.isArray(values)) {
    values.forEach(function (value) {
      self.sources.push(value)
    })
  }
  self.binder.onUpdate()
}

ProtoSet.prototype.get = function (index) {
  return this.sources[index]
}

ProtoSet.prototype.getLength = function () {
  return this.sources.length
}

ProtoSet.prototype._bind = function (valueOrObs) {
  return typeof valueOrObs === 'function' ? valueOrObs(this.binder.onUpdate) : null
}

ProtoSet.prototype._listen = function () {
  var self = this
  self.sources.forEach(function (obs, i) {
    self.releases[i] = self._bind(obs)
  })
}

ProtoSet.prototype._unlisten = function () {
  this.releases.forEach(tryInvoke)
  this.releases.length = 0
}

ProtoSet.prototype._update = function () {
  var currentValues = this.object.map(get)
  var newValues = this.sources.map(resolve)
  currentValues.filter(notIncluded, newValues).forEach(removeFrom, this.object)
  newValues.filter(notIncluded, currentValues).forEach(addTo, this.object)
  return true
}

function get (value) {
  return value
}

function resolve (source) {
  return typeof source === 'function' ? source() : source
}

function notIncluded (value) {
  return !~this.indexOf(value)
}

function removeFrom (item) {
  var index = this.indexOf(item)
  if (~index) {
    this.splice(index, 1)
  }
}

function addTo (item) {
  this.push(item)
}

function tryInvoke (func) {
  if (typeof func === 'function') {
    func()
  }
}

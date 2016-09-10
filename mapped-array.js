var MutantMap = require('./map')
var MutantArray = require('./array')

module.exports = MutantMappedArray

function MutantMappedArray (defaultItems, lambda, opts) {
  opts = opts || {}

  var list = MutantArray(defaultItems, {
    comparer: opts.comparer,
    fixedIndexing: true
  })

  var obs = MutantMap(list, lambda, opts)
  obs.set = list.set

  obs.push = function (item) {
    list.push(item)
    return obs.get(obs.getLength() - 1)
  }

  obs.insert = function (item, at) {
    list.insert(item, at)
    return obs.get(at)
  }

  obs.remove = function (mappedItem) {
    var index = obs.indexOf(mappedItem)
    if (~index) {
      list.deleteAt(index)
      return true
    }
  }

  obs.move = function (mappedItem, targetIndex) {
    var currentIndex = obs.indexOf(mappedItem)
    if (~currentIndex) {
      var item = list.get(currentIndex)
      if (currentIndex < targetIndex) {
        list.insert(item, targetIndex + 1)
        list.deleteAt(currentIndex)
      } else {
        list.insert(item, targetIndex)
        list.deleteAt(currentIndex)
      }
    }
  }

  return obs
}

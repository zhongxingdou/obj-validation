function format(temp) {
  var data = Array.prototype.slice.call(arguments, 1)
  for (var i = 0, l = data.length; i < l; i++) {
    temp = temp.replace(new RegExp('\\{' + i + '\\}', 'g'), data[i])
  }
  return temp
}

function utf8Length(str) {
  var s = str.length
  for (var i = str.length - 1; i >= 0; i--) {
    var code = str.charCodeAt(i)
    if (code > 0x7f && code <= 0x7ff) {
      s++
    } else if (code > 0x7ff && code <= 0xffff) {
      s += 2
    }
    if (code >= 0xDC00 && code <= 0xDFFF) {
      i--
    }
  }
  return s
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== ''
}

export default {
  format: format,
  utf8Length: utf8Length,
  hasValue: hasValue
}

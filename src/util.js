function format(temp) {
    var data = Array.prototype.slice.call(arguments, 1)
    for (var i = 0, l = data.length; i < l; i++) {
        temp = temp.replace(new RegExp('\\{' + i + '\\}', 'g'), data[i])
    }
    return temp
}

export default {
    format: format
}

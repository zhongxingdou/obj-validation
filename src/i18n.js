var localeDict = {}
var DEFAULT_LOCALE = 'en'
var currLocale = DEFAULT_LOCALE
var currDict = {}

var i18n = {
  setCurrLocale: function (locale) {
    currLocale = locale
    currDict = localeDict[currLocale] || {}
  },
  getLocaleString: function (key) {
    return currDict[key]
  },
  addLocale: function (locale, dict) {
    let currDict = localeDict[locale]
    if (!currDict) currDict = localeDict[locale] = {}
    for(let p in dict) {
      currDict[p] = dict[p]
    }

    this.setCurrLocale(locale)
  }
}

export default i18n

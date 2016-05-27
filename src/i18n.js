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
    localeDict[locale] = Object.assign(
      {}, localeDict[locale], dict
    )
    this.setCurrLocale(locale)
  }
}

export default i18n

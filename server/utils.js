function parseDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : /^\d{2}\.\d{2}\.\d{4}$/.test(date)
            ? date.split('.').reverse().join('-')
            : null;
}

module.exports = {
    parseDate
}
const falseValues = ['0', 'false', 'no'];
const isQueryTrue = (value) => {
    if (typeof value === 'string') {
        if (falseValues.includes(value.toLowerCase())) {
            return false;
        }

        return !!value;
    } else if (typeof value === 'boolean') {
        return value;
    } else if (typeof value === 'number') {
        return value !== 0;
    } else {
        return !!value;
    }
}

module.exports = isQueryTrue;

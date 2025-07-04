class Utils {
    constructor() {
        console.log("✅ Utils class invoked");
    }
    formatNumberDec(number) {
        if (Number.isInteger(number)) {
            return number.toFixed(1);
        } else {
            return number.toFixed(2);
        }
    }
    formatNumberLen(number) {
        const numberStr = number.toString();

        if (numberStr.length === 1) {
            return '0' + numberStr;
        }

        return numberStr;
    }
}

module.exports = Utils
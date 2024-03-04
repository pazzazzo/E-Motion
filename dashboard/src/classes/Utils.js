class Utils {
    constructor(params) {
        
    }
    formatNumber(number) {
        if (Number.isInteger(number)) {
            return number.toFixed(1); // Ajoute un .0 aux nombres entiers
        } else {
            return number.toFixed(2); // Formate les nombres décimaux avec 2 décimales
        }
    }
}

module.exports = Utils
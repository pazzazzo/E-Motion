class Utils {
    constructor(params) {
        console.log("✅ Utils class invoked");
    }
    formatNumberDec(number) {
        if (Number.isInteger(number)) {
            return number.toFixed(1); // Ajoute un .0 aux nombres entiers
        } else {
            return number.toFixed(2); // Formate les nombres décimaux avec 2 décimales
        }
    }
    formatNumberLen(number) {
        // Convertir le nombre en chaîne de caractères
        const numberStr = number.toString();
      
        // Ajouter un zéro devant les nombres à un seul chiffre
        if (numberStr.length === 1) {
          return '0' + numberStr;
        }
      
        // Retourner le nombre d'origine s'il contient plusieurs chiffres
        return numberStr;
      }
}

module.exports = Utils
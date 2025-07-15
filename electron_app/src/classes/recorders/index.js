/**
 * @author Gilles De Mey
 * @copyright Copyright 2019 Gilles De Mey
 * Modified by pazzazzo 2025
 */

const path = require('path')

function load (recorderName) {
  try {
    const recoderPath = path.resolve(__dirname, recorderName)
    return require(recoderPath)
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`No such recorder found: ${recorderName}`)
    }

    throw err
  }
}

module.exports = {
  load
}

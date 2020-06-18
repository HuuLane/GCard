const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const fs = require('fs').promises

const invoke = function (action, version, params = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.addEventListener('error', () => reject('failed to issue request'))
    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText)
        if (Object.getOwnPropertyNames(response).length != 2) {
          throw 'response has an unexpected number of fields'
        }
        if (!response.hasOwnProperty('error')) {
          throw 'response is missing required error field'
        }
        if (!response.hasOwnProperty('result')) {
          throw 'response is missing required result field'
        }
        if (response.error) {
          throw response.error
        }
        resolve(response.result)
      } catch (e) {
        reject(e)
      }
    })

    xhr.open('POST', 'http://127.0.0.1:8765')
    xhr.send(JSON.stringify({ action, version, params }))
  })
}

const r = async path => fs.readFile(path, 'utf8')

const main = async () => {
  // const t = await r('./GCard/Back.html')
  // console.log(t)
  invoke('updateModelTemplates', 6, {
    model: {
      name: 'GCard',
      templates: {
        card1: {
          Front: await r('./GCard/Front.html'),
          Back: await r('./GCard/Back.html')
        }
      }
    }
  })
  invoke('updateModelStyling', 6, {
    model: {
      name: 'GCard',
      css: await r('./GCard/styling.css')
    }
  })
}

try {
  main()
} catch (err) {
  console.error(err)
}

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const fs = require('fs').promises
const path = require('path')

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

// return the contents of the specified file.
const R = async path => fs.readFile(path, 'utf8')

const replace = async modelName => {
  // filepath
  const f = path.join('.', modelName, 'Front.html')
  const b = path.join('.', modelName, 'Back.html')
  const s = path.join('.', modelName, 'styling.css')

  const tn = await getTemplateNames(modelName)
  console.log(`Try to replace ${modelName}/${tn}`)

  invoke('updateModelTemplates', 6, {
    model: {
      name: modelName,
      templates: {
        [tn]: {
          Front: await R(f),
          Back: await R(b)
        }
      }
    }
  })
  invoke('updateModelStyling', 6, {
    model: {
      name: modelName,
      css: await R(s)
    }
  })
}

// The return value means: which models can be replaced(or updated) from the working dir.
const getLocalModelNames = async () => {
  const modelNames = await invoke('modelNames', 6)
  const localModelNames = []
  for (const mn of modelNames) {
    try {
      await fs.access(path.join('.', mn))
      localModelNames.push(mn)
    } catch (error) {
      // that's fine
    }
  }
  return localModelNames
}

// Currently, all my models have only one template, generally named'card1', except the 'Cloze'.
const getTemplateNames = async modelName => {
  const result = await invoke('modelTemplates', 6, {
    modelName
  })
  return Object.keys(result)[0]
}

;(async () => {
  const mns = await getLocalModelNames()

  for (const mn of mns) {
    try {
      replace(mn)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
})()

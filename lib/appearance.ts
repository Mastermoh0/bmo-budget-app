export const appearanceKey = 'bimo-appearance-v1'
export const appearanceBoot = `(()=>{let mode='light';try{if(localStorage.getItem('${appearanceKey}')==='dark')mode='dark'}catch{}document.documentElement.dataset.appearance=mode})()`

export const appearanceKey = 'bimo-appearance-v1'
export const appearanceBoot = `(()=>{let mode='light';try{if(localStorage.getItem('${appearanceKey}')==='dark')mode='dark'}catch{}document.documentElement.dataset.appearance=mode})()`

export function toggleAppearance() {
  const mode = document.documentElement.dataset.appearance === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.appearance = mode
  try { localStorage.setItem(appearanceKey, mode) } catch { /* A blocked store must not prevent switching this page. */ }
  window.dispatchEvent(new Event('bimo-appearance'))
}

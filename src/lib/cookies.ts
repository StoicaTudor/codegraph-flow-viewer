export const writeCookie = (name: string, value: string, maxAgeSeconds = 31536000) => {
  document.cookie = `${name}=${encodeURIComponent(value)} max-age=${maxAgeSeconds} path=/ SameSite=Lax`
}

export const clearCookiesWithPrefix = (prefix: string) => {
  document.cookie
  .split(' ')
  .map((part) => part.split('=')[0])
  .filter((name) => name.startsWith(prefix))
  .forEach((name) => {
    document.cookie = `${name}= max-age=0 path=/`
  })
}

export const readCookiesWithPrefix = (prefix: string) => {
  return document.cookie
  .split(' ')
  .filter((part) => part.split('=')[0].startsWith(prefix) && part.split('=')[0] !== prefix)
  .sort((a, b) => Number(a.split('=')[0].slice(prefix.length)) - Number(b.split('=')[0].slice(prefix.length)))
  .map((part) => part.slice(part.indexOf('=') + 1))
  .join('')
}

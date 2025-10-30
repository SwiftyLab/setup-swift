import {ClientRequest, IncomingMessage, IncomingHttpHeaders} from 'http'

let urls: (string | URL)[] = []
let content: Content

export interface Content {
  statusCode: number
  data: string
  headers: IncomingHttpHeaders
}

export function __setContent(newContent: Content) {
  content = newContent
}

export function get(
  url: string | URL,
  callback: ((res: IncomingMessage) => void) | undefined
) {
  urls.push(url)
  let res = {
    statusCode: content.statusCode,
    url: url,
    headers: content.headers,
    data: content.data,
    on: (event: string, listener: (...args: any[]) => void) => {
      if (event === 'data') {
        listener(content.data)
      } else if (event === 'end') {
        listener()
      }
    },
    setEncoding: () => {},
    resume: () => {}
  } as unknown as IncomingMessage
  if (callback) {
    callback(res)
  }
  return new ClientRequest(url, callback)
}

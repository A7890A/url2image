import steg from './steg.wasm'

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url)
    
    if (pathname === '/api/generate' && request.method === 'POST') {
      const { image, url } = await request.json()
      
      const output = steg.embedQR(
        new Uint8Array(atob(image).split('').map(c => c.charCodeAt(0))),
        new TextEncoder().encode(url)
      )
      
      return new Response(output, {
        headers: { 
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    return new Response('欢迎使用网址转化图片服务')
  }
}

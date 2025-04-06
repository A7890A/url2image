import steg from './wasm_steg_bg.wasm'

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url)
    
    if (pathname === '/api/generate' && request.method === 'POST') {
      const { image, url } = await request.json()
      
      const output = steg.embedQR(
        new Uint8Array(atob(image).split('').map(c => c.charCodeAt(0))),
        new TextEncoder().encode(url)
      )
      
     if (request.method === 'OPTIONS') {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
    
    return new Response('欢迎使用网址转化图片服务')
  }
}

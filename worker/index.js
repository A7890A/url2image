// 导入 WASM 隐写模块
import steg from 'wasm_steg_bg.wasm'

// 响应头配置
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    try {
      // 处理生成请求
      if (pathname === '/api/generate' && request.method === 'POST') {
        const contentType = request.headers.get('content-type') || ''
        
        // 解析 JSON 数据
        if (!contentType.includes('application/json')) {
          throw new Error('Invalid content type. Expected JSON.')
        }
        const { image, url } = await request.json()

        // 提取 Base64 数据部分（去除 DataURL 前缀）
        const base64Data = image.split(',')[1]
        if (!base64Data) {
          throw new Error('Invalid image data format.')
        }

        // 解码 Base64 并转换为 Uint8Array
        const decodedImage = new Uint8Array(
          atob(base64Data).split('').map(c => c.charCodeAt(0))
        )

        // 调用 WASM 隐写方法
        const output = steg.embedQR(
          decodedImage,
          new TextEncoder().encode(url)
        )

        // 返回生成的图片
        return new Response(output, {
          headers: { 
            ...CORS_HEADERS,
            'Content-Type': 'image/png'
          }
        })
      }

      // 默认响应
      return new Response('欢迎使用网址转化图片服务', {
        headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain' }
      })

    } catch (error) {
      // 错误处理
      return new Response(
        JSON.stringify({ error: error.message || 'Internal Server Error' }), 
        { 
          status: 500,
          headers: { 
            ...CORS_HEADERS,
            'Content-Type': 'application/json' 
          }
        }
      )
    }
  }
}

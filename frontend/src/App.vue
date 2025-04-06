<template>
  <div class="container">
    <h1>网址转化图片</h1>
    <input 
      type="url" 
      v-model="targetUrl" 
      placeholder="输入目标网址（需包含 http:// 或 https://）"
      class="input-url"
    >
    <div class="file-upload">
      <label>
        <input 
          type="file" 
          @change="handleFile" 
          accept="image/png, image/jpeg"
          class="input-file"
        >
        选择载体图片（PNG/JPG）
      </label>
      <span v-if="selectedFile">{{ selectedFile.name }}</span>
    </div>
    
    <button 
      @click="generate" 
      :disabled="!isFormValid"
      class="generate-btn"
    >
      {{ isLoading ? '生成中...' : '生成隐写图片' }}
    </button>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="preview" class="preview-section">
      <h2>生成结果预览</h2>
      <div class="image-wrapper">
        <img :src="preview" alt="隐写结果" class="preview-image">
        <div class="download-section">
          <a 
            :href="preview" 
            download="stealth-image.png"
            class="download-btn"
          >
            下载图片
          </a>
          <p class="hint">右键另存为效果更佳</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import QRCode from 'qrcode'
import steganography from 'steganography.js'

// 响应式状态
const targetUrl = ref('')
const selectedFile = ref(null)
const preview = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

// 表单验证
const isFormValid = computed(() => {
  return targetUrl.value.trim() !== '' && selectedFile.value !== null
})

// 处理文件上传
const handleFile = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.match(/image\/(png|jpeg)/)) {
    errorMessage.value = '仅支持 PNG 或 JPG 格式'
    event.target.value = '' // 清空输入
    return
  }

  selectedFile.value = file
  errorMessage.value = ''
}

// 生成隐写图片
const generate = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // Step 1: 生成二维码
    const qrOptions = {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      type: 'image/png'
    }
    const qrDataURL = await QRCode.toDataURL(targetUrl.value, qrOptions)

    // Step 2: 读取载体图片
    const carrierImageBuffer = await readFileAsArrayBuffer(selectedFile.value)

    // Step 3: 执行隐写操作
    const resultBuffer = await steganography.encode(
      carrierImageBuffer,
      dataURLToArrayBuffer(qrDataURL)
    )

    // Step 4: 生成预览
    preview.value = arrayBufferToDataURL(resultBuffer, 'image/png')

  } catch (error) {
    console.error('生成失败:', error)
    errorMessage.value = `生成失败: ${error.message || '未知错误'}`
  } finally {
    isLoading.value = false
  }
}

// 工具函数
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

const dataURLToArrayBuffer = (dataURL) => {
  const base64 = dataURL.split(',')[1]
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const arrayBufferToDataURL = (buffer, mimeType) => {
  const bytes = new Uint8Array(buffer)
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
  return `data:${mimeType};base64,${btoa(binary)}`
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
  font-family: 'Segoe UI', system-ui;
}

.input-url {
  display: block;
  width: 100%;
  padding: 0.8rem;
  margin: 1rem 0;
  border: 2px solid #007bff;
  border-radius: 4px;
  font-size: 1rem;
}

.file-upload {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.input-file {
  display: none;
}

label {
  cursor: pointer;
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border-radius: 4px;
  transition: background 0.3s;
}

label:hover {
  background: #0056b3;
}

.generate-btn {
  display: block;
  width: 100%;
  padding: 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.generate-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.generate-btn:not(:disabled):hover {
  background: #218838;
}

.preview-section {
  margin-top: 2rem;
  padding: 1rem;
  border-top: 2px solid #eee;
}

.preview-image {
  max-width: 100%;
  height: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 4px;
}

.download-btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.8rem 1.5rem;
  background: #17a2b8;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.3s;
}

.download-btn:hover {
  background: #138496;
}

.error-message {
  color: #dc3545;
  margin: 1rem 0;
  padding: 0.8rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.hint {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>

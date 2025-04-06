<template>
  <div class="container">
    <h1>网址隐写图片生成器</h1>
    
    <!-- URL输入区 -->
    <div class="input-group">
      <label>目标网址：</label>
      <input
        type="url"
        v-model="targetUrl"
        placeholder="请输入包含 http:// 或 https:// 的完整网址"
        class="url-input"
      >
    </div>

    <!-- 文件上传区 -->
    <div class="file-upload-group">
      <label class="file-label">
        <input
          type="file"
          @change="handleFile"
          accept="image/png, image/jpeg"
          class="file-input"
        >
        <span class="upload-button">{{ selectedFile ? '已选择文件' : '点击选择载体图片' }}</span>
        <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
      </label>
    </div>

    <!-- 控制按钮 -->
    <button
      class="generate-button"
      @click="generate"
      :disabled="!isFormValid || isLoading"
    >
      <span v-if="isLoading">生成中...</span>
      <span v-else>生成隐写图片</span>
    </button>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      ⚠️ {{ errorMessage }}
    </div>

    <!-- 预览区 -->
    <div v-if="preview" class="preview-container">
      <h2>生成结果预览</h2>
      <div class="image-preview">
        <img :src="preview" alt="隐写结果" class="preview-image">
        <a
          :href="preview"
          download="stealth-image.png"
          class="download-button"
        >
          ⬇️ 下载图片
        </a>
      </div>
      <p class="hint-text">右键图片选择「另存为」可获得最佳效果</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import QRCode from 'qrcode'
import Jimp from 'jimp'

// 响应式状态
const targetUrl = ref('')
const selectedFile = ref(null)
const preview = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

// 表单验证
const isFormValid = computed(() => {
  return /^https?:\/\//.test(targetUrl.value) && selectedFile.value !== null
})

// 处理文件选择
const handleFile = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.match(/image\/(png|jpeg)/)) {
    errorMessage.value = '仅支持 PNG 或 JPEG 格式的图片'
    event.target.value = ''
    return
  }

  selectedFile.value = file
  errorMessage.value = ''
}

// LSB隐写核心逻辑
const embedDataWithJimp = async (carrierBuffer, hiddenBuffer) => {
  try {
    // 读取载体图片
    const image = await Jimp.read(Buffer.from(carrierBuffer))
    
    // 将隐藏数据转换为二进制字符串
    const hiddenData = Array.from(new Uint8Array(hiddenBuffer))
      .map(byte => byte.toString(2).padStart(8, '0'))
      .join('')

    let dataIndex = 0
    
    // 遍历像素修改最低有效位
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
      if (dataIndex >= hiddenData.length) return
      
      // 修改RGB通道（跳过Alpha通道）
      for (let i = 0; i < 3; i++) {
        if (dataIndex >= hiddenData.length) break
        const bit = parseInt(hiddenData[dataIndex])
        image.bitmap.data[idx + i] = (image.bitmap.data[idx + i] & 0xFE) | bit
        dataIndex++
      }
    })

    // 返回处理后的Buffer
    return await image.getBufferAsync(Jimp.MIME_PNG)
  } catch (error) {
    throw new Error(`隐写失败: ${error.message}`)
  }
}

// 生成主流程
const generate = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 步骤1：生成二维码
    const qrOptions = {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      type: 'image/png'
    }
    const qrDataURL = await QRCode.toDataURL(targetUrl.value, qrOptions)

    // 步骤2：准备数据
    const [carrierBuffer, hiddenBuffer] = await Promise.all([
      readFileAsArrayBuffer(selectedFile.value),
      dataURLToArrayBuffer(qrDataURL)
    ])

    // 步骤3：执行隐写
    const resultBuffer = await embedDataWithJimp(carrierBuffer, hiddenBuffer)

    // 步骤4：生成预览
    preview.value = arrayBufferToDataURL(resultBuffer, 'image/png')
  } catch (error) {
    console.error('生成失败:', error)
    errorMessage.value = error.message || '发生未知错误'
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
  padding: 2rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.input-group {
  margin-bottom: 1.5rem;
}

.url-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #4a90e2;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.url-input:focus {
  outline: none;
  border-color: #2c6db1;
}

.file-upload-group {
  margin: 2rem 0;
}

.file-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
}

.upload-button {
  padding: 0.8rem 1.5rem;
  background: #4a90e2;
  color: white;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.upload-button:hover {
  background: #2c6db1;
}

.file-name {
  color: #666;
  font-size: 0.9em;
}

.generate-button {
  width: 100%;
  padding: 1rem;
  background: #34c759;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.generate-button:disabled {
  background: #a0a0a0;
  cursor: not-allowed;
}

.generate-button:not(:disabled):hover {
  background: #248b3d;
}

.error-message {
  margin: 1rem 0;
  padding: 1rem;
  background: #ff3b30;
  color: white;
  border-radius: 6px;
}

.preview-container {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #eee;
}

.preview-image {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.download-button {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.8rem 1.5rem;
  background: #5856d6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.download-button:hover {
  background: #3a3896;
}

.hint-text {
  color: #666;
  font-size: 0.9em;
  margin-top: 0.5rem;
}
</style>

<template>
  <div class="container">
    <h1>网址转化图片</h1>
    <input type="url" v-model="targetUrl" placeholder="输入目标网址">
    <input type="file" @change="handleFile" accept="image/*">
    <button @click="generate" :disabled="loading">
      {{ loading ? '生成中...' : '开始转换' }}
    </button>
    <canvas ref="canvas" style="display:none;"></canvas>
    <div v-if="preview">
      <img :src="preview" alt="生成结果">
      <a :href="preview" download="stealth-qr.png">下载图片</a>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import QRCode from 'qrcode'
import LSBSteg from 'lsb-steg'

const targetUrl = ref('')
const selectedFile = ref(null)
const preview = ref(null)
const loading = ref(false)

const handleFile = (e) => {
  selectedFile.value = e.target.files[0]
}

const generate = async () => {
  loading.value = true
  try {
    // 生成二维码
    const qrData = await QRCode.toDataURL(targetUrl.value, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512
    })

    // 使用隐写术
    const steg = new LSBSteg()
    const result = await steg.hide(
      await selectedFile.value.arrayBuffer(),
      await (await fetch(qrData)).arrayBuffer()
    )

    preview.value = URL.createObjectURL(new Blob([result]))
  } finally {
    loading.value = false
  }
}
</script>

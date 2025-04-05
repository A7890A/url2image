<template>
  <div class="container">
    <h1>网址转化图片</h1>
    <input type="url" v-model="targetUrl" placeholder="输入目标网址">
    <input type="file" @change="handleFile" accept="image/*">
    <button @click="generate">生成图片</button>
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

const generate = async () => {
  const qrData = await QRCode.toDataURL(targetUrl.value, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 512
  })
  
  const steg = new LSBSteg()
  const result = await steg.hide(
    await selectedFile.value.arrayBuffer(),
    await (await fetch(qrData)).arrayBuffer()
  )
  
  preview.value = URL.createObjectURL(new Blob([result]))
}
</script>

<style>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
input, button {
  margin: 10px 0;
  padding: 8px;
}
</style>

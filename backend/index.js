const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = 3000;

const TEXT_FILE = path.join(__dirname, 'text.txt');

// 允许跨域
app.use(cors());

// 允许解析json
app.use(express.json());

function getBaseUrl(req) {
  const host = req.query.host || process.env.VOICE_HOST || '172.31.27.59';
  const port = process.env.VOICE_PORT || '8774';
  return `http://${host}:${port}`;
}

// 语音列表接口转发
app.get('/api/voices', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    console.log(`本次请求的目标语音服务：${baseUrl}`);
    const result = await axios.get(`${baseUrl}/voices`);
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: '获取语音列表失败', detail: err.message });
  }
});

// 语音合成接口转发
app.get('/api/forward', async (req, res) => {
  try {
    const { text, speed, volume, pitch, voice } = req.query;
    const baseUrl = getBaseUrl(req);
    const url = `${baseUrl}/forward`;
    const response = await axios.get(url, {
      params: { text, speed, volume, pitch, voice },
      responseType: 'arraybuffer', // 返回音频流
    });
    res.set('Content-Type', response.headers['content-type'] || 'audio/mpeg');
    res.send(response.data);
  } catch (err) {
    console.error('语音合成失败:', err?.response?.data || err.message, err?.response?.status);
    res.status(500).json({ error: '语音合成失败', detail: err?.message, backend: err?.response?.data });
  }
});

// 保存文本到本地txt
app.post('/api/save-text', (req, res) => {
  const { text } = req.body;
  fs.writeFile(TEXT_FILE, text || '', 'utf-8', err => {
    if (err) return res.status(500).json({ error: '保存失败', detail: err.message });
    res.json({ success: true });
  });
});

// 读取本地txt内容
app.get('/api/load-text', (req, res) => {
  fs.readFile(TEXT_FILE, 'utf-8', (err, data) => {
    if (err) return res.json({ text: '' });
    res.json({ text: data });
  });
});

// 用指定编辑器打开txt
app.post('/api/open-editor', (req, res) => {
  const { editor } = req.body;
  let cmd = '';
  if (editor === 'notepad') {
    cmd = `notepad "${TEXT_FILE}"`;
  } else if (editor === 'vscode') {
    cmd = `code "${TEXT_FILE}"`;
  } else if (editor === 'emeditor') {
    cmd = `"C:\\Program Files (x86)\\EmEditor\\EmEditor.exe" "${TEXT_FILE}"`;
  } else {
    return res.status(400).json({ error: '不支持的编辑器' });
  }
  exec(cmd, err => {
    if (err) return res.status(500).json({ error: '打开编辑器失败', detail: err.message });
    res.json({ success: true });
  });
});

// 检查语音服务连通性
app.get('/api/ping', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    // 只请求 /voices 路由，判断服务是否在线
    await axios.get(`${baseUrl}/voices`, { timeout: 2000 });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: '无法连接到语音服务', detail: err.message });
  }
});

app.listen(port, () => {
  const host = process.env.VOICE_HOST || '未指定（由前端传递）';
  const voicePort = process.env.VOICE_PORT || '8774';
  console.log(`后端服务已启动：http://localhost:${port}`);
  console.log(`目标语音服务（仅默认值，实际以前端输入为准）：http://${host}:${voicePort}`);
  console.log('实际请求时，目标语音服务地址会根据前端页面输入的IP动态变化。');
}); 
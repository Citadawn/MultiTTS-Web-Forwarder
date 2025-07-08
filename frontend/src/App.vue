<script setup>
import { ref, reactive, onMounted, nextTick, watch } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";

const form = reactive({
  host: "",
  text: "",
  speed: 50,
  volume: 50,
  pitch: 50,
  voice: "",
});
const rules = {
  host: [{ required: true, message: "请输入语音服务IP", trigger: "blur" }],
  text: [{ required: true, message: "请输入要合成的文本", trigger: "blur" }],
};
const voices = ref([]);
const loading = ref(false);
const audioUrl = ref("");
const audioRef = ref(null);
const formRef = ref(null);
const voiceCount = ref(0);
const voiceCatalogs = ref([]);
const voiceCatalogMap = ref({});
const cascaderOptions = ref([]);
const cascaderValue = ref([]);

const DEFAULTS = {
  speed: 50,
  volume: 50,
  pitch: 50,
};

function getBackendBaseUrl() {
  // 前端通过后端代理，host传给后端
  return `/api`;
}

function handleFileChange(e) {
  const file = e.target.files[0];
  if (file && file.type === "text/plain") {
    const reader = new FileReader();
    reader.onload = function (evt) {
      form.text = evt.target.result;
    };
    reader.readAsText(file, "utf-8");
  }
}

function isValidIP(ip) {
  // 简单IPv4校验
  return /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.|$)){4}$/.test(ip);
}

async function handleRefresh() {
  if (!isValidIP(form.host)) {
    ElMessage.error("请输入合法的IPv4地址，如 192.168.1.100");
    return;
  }
  // 新增：先检测连通性
  try {
    await axios.get(`${getBackendBaseUrl()}/ping`, { params: { host: form.host } });
  } catch (e) {
    ElMessage.error("无法连接到语音服务，请检查IP和服务是否开启");
    return;
  }
  await fetchVoices();
}

async function fetchVoices() {
  if (!form.host) {
    voices.value = [];
    voiceCount.value = 0;
    voiceCatalogs.value = [];
    voiceCatalogMap.value = {};
    cascaderOptions.value = [];
    return;
  }
  try {
    const res = await axios.get(`${getBackendBaseUrl()}/voices`, {
      params: { host: form.host },
    });
    // 兼容 catalog 嵌套结构
    let arr = [];
    if (res.data && res.data.data && res.data.data.catalog) {
      const catalogs = res.data.data.catalog;
      for (const key in catalogs) {
        arr = arr.concat(catalogs[key]);
      }
      voiceCatalogs.value = Object.keys(catalogs);
      voiceCatalogMap.value = catalogs;
    } else {
      voiceCatalogs.value = [];
      voiceCatalogMap.value = {};
    }
    voices.value = arr;
    voiceCount.value = res.data?.data?.count || arr.length;
    if (!voices.value.find((v) => v.id === form.voice)) {
      form.voice = voices.value[0]?.id || "";
    }
  } catch (e) {
    voices.value = [];
    voiceCount.value = 0;
    voiceCatalogs.value = [];
    voiceCatalogMap.value = {};
  }
}

async function synthesize() {
  // 先校验表单，未通过则不继续
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  audioUrl.value = "";
  try {
    const params = {
      text: form.text,
      speed: form.speed,
      volume: form.volume,
      pitch: form.pitch,
      voice: form.voice,
      host: form.host,
    };
    const res = await axios.get(`${getBackendBaseUrl()}/forward`, {
      params,
      responseType: "blob",
    });
    audioUrl.value = URL.createObjectURL(res.data);
    nextTick(() => {
      if (audioRef.value) {
        audioRef.value.load();
        audioRef.value.play();
      }
    });
  } finally {
    loading.value = false;
  }
}

async function openEditor() {
  // 先保存当前文本
  await axios.post("/api/save-text", { text: form.text });
  // 只用记事本打开
  await axios.post("/api/open-editor", { editor: "notepad" });
}

async function syncText() {
  const res = await axios.get("/api/load-text");
  form.text = res.data.text || "";
}

function updateCascaderOptions() {
  cascaderOptions.value = Object.entries(voiceCatalogMap.value).map(([engine, list]) => ({
    value: engine,
    label: engine,
    children: list.map(v => ({
      value: v.id,
      label: v.name
    }))
  }));
}

watch(voiceCatalogMap, updateCascaderOptions, { immediate: true });
watch(cascaderValue, (val) => {
  if (val && val.length === 2) {
    form.voice = val[1];
  }
});

onMounted(() => {
  document.title = "MultiTTS网页转发器";
  // 不自动 fetchVoices
});
</script>

<template>
  <el-container
    style="height: 100vh; align-items: center; justify-content: center"
  >
    <el-main style="max-width: 650px; margin: auto">
      <el-card>
        <h2 style="text-align: center">MultiTTS网页转发器</h2>
        <p style="color:#888; font-size:14px; margin-bottom:16px; text-align:center;">
          请确保手机MultiTTS已开启转发服务，并输入手机IP地址
        </p>
        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          label-width="100px"
          style="margin-top: 20px"
        >
          <el-form-item label="语音服务IP" prop="host" required>
            <div
              style="display: flex; align-items: center; gap: 8px; width: 100%"
            >
              <el-input
                v-model="form.host"
                placeholder="请输入语音服务的IP地址，如 10.58.61.115"
                style="flex: 1"
              />
              <el-button type="primary" size="small" @click="handleRefresh"
                >刷新</el-button
              >
            </div>
          </el-form-item>
          <el-form-item label="合成文本" prop="text" required>
            <el-input
              v-model="form.text"
              type="textarea"
              :rows="3"
              placeholder="请输入要合成的文本，或导入txt文件"
            />
            <input
              type="file"
              accept=".txt"
              @change="handleFileChange"
              style="margin-top: 8px"
            />
            <div style="margin-top: 15px">
              <el-button
                size="small"
                @click="openEditor"
                style="margin-left: 0;"
                >用记事本编辑文本</el-button
              >
              <el-button size="small" @click="syncText">同步内容</el-button>
            </div>
          </el-form-item>
          <el-form-item label="语速">
            <div
              style="display: flex; align-items: center; gap: 12px; width: 100%"
            >
              <el-slider
                v-model="form.speed"
                :min="0"
                :max="100"
                style="flex: 1"
              />
              <el-input-number
                v-model="form.speed"
                :min="0"
                :max="100"
                size="small"
                style="width: 90px; height: 36px"
              />
              <el-button size="small" @click="form.speed = DEFAULTS.speed"
                >重置</el-button
              >
            </div>
          </el-form-item>
          <el-form-item label="音量">
            <div
              style="display: flex; align-items: center; gap: 12px; width: 100%"
            >
              <el-slider
                v-model="form.volume"
                :min="0"
                :max="100"
                style="flex: 1"
              />
              <el-input-number
                v-model="form.volume"
                :min="0"
                :max="100"
                size="small"
                style="width: 90px; height: 36px"
              />
              <el-button size="small" @click="form.volume = DEFAULTS.volume"
                >重置</el-button
              >
            </div>
          </el-form-item>
          <el-form-item label="音高">
            <div
              style="display: flex; align-items: center; gap: 12px; width: 100%"
            >
              <el-slider
                v-model="form.pitch"
                :min="0"
                :max="100"
                style="flex: 1"
              />
              <el-input-number
                v-model="form.pitch"
                :min="0"
                :max="100"
                size="small"
                style="width: 90px; height: 36px"
              />
              <el-button size="small" @click="form.pitch = DEFAULTS.pitch"
                >重置</el-button
              >
            </div>
          </el-form-item>
          <el-form-item label="发音人">
            <div style="margin-bottom: 8px; color: #666; font-size: 14px;">
              <span v-if="voiceCount > 0">
                共 {{ voiceCatalogs.length }} 个引擎，{{ voiceCount }} 个发音人
              </span>
              <span v-else>
                请先输入语音服务IP并点击刷新
              </span>
            </div>
            <el-cascader
              v-model="cascaderValue"
              :options="cascaderOptions"
              :props="{ expandTrigger: 'hover' }"
              placeholder="请选择引擎和发音人"
              style="width: 100%;"
              clearable
            />
          </el-form-item>
        </el-form>
        <el-button
          type="primary"
          @click="synthesize"
          :loading="loading"
          class="synthesize-btn"
          >合成并播放</el-button
        >
        <audio
          ref="audioRef"
          :src="audioUrl"
          controls
          style="width: 100%; margin-top: 10px"
          v-if="audioUrl"
        ></audio>
      </el-card>
    </el-main>
  </el-container>
</template>

<style>
body {
  background: #f5f7fa;
}
.el-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px #e5e5e533;
  max-width: 650px;
}
h2 {
  font-family: "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
  font-weight: bold;
  color: #222;
  letter-spacing: 1px;
  margin-bottom: 20px;
}
.el-form-item__label {
  color: #333 !important;
  font-weight: bold;
  font-family: "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
}
.el-main {
  padding: 0;
}
.el-form-item .el-input-number {
  width: 110px;
  margin-right: 10px;
  vertical-align: middle;
}
.el-input-number__decrease,
.el-input-number__increase {
  height: 36px;
  line-height: 36px;
  border-radius: 4px 0 0 4px;
  font-size: 18px;
}
.el-input-number__increase {
  border-radius: 0 4px 4px 0;
}
.el-input-number__inner {
  height: 36px !important;
  line-height: 36px !important;
  font-size: 18px;
  text-align: center;
  padding: 0 !important;
  box-sizing: border-box;
}
.el-form-item .el-button {
  height: 36px;
  min-width: 64px;
  font-size: 16px;
  border-radius: 4px;
  margin-left: 6px;
  background: #f5f7fa;
  color: #409eff;
  border: 1px solid #d9ecff;
  transition: background 0.2s, color 0.2s;
  line-height: 36px;
  padding: 0;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
.el-form-item .el-button:hover {
  background: #409eff;
  color: #fff;
}
.el-button--primary,
.el-form-item .el-button {
  background: #409eff !important;
  color: #fff !important;
  border-radius: 8px !important;
  font-weight: 500;
  box-shadow: 0 2px 8px #409eff22;
  border: none;
  transition: background 0.2s, color 0.2s;
  padding: 0 22px !important;
}
.el-button--primary:hover,
.el-form-item .el-button:hover {
  background: #337ecc !important;
  color: #fff !important;
}
.el-button--default {
  background: #f5f7fa !important;
  color: #409eff !important;
  border-radius: 8px !important;
  border: 1px solid #d9ecff !important;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}
.el-button--default:hover {
  background: #409eff !important;
  color: #fff !important;
}
.el-button.synthesize-btn {
  width: 100%;
  max-width: 360px;
  height: 48px;
  font-size: 20px;
  margin: 0 auto;
  display: block;
  border-radius: 10px !important;
  padding: 0 !important;
}
</style>

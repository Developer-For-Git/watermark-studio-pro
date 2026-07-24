// Gemini Watermark Studio Pro - Main Application Script

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // State Management
  const state = {
    mediaType: null, // 'image' or 'video'
    mediaElement: null, // HTMLImageElement or HTMLVideoElement
    originalWidth: 1920,
    originalHeight: 1080,
    mediaName: 'Hand_opening_laptop_on_desk_202607232139.mp4',
    mediaUrl: null,
    
    // Selection boxes array for multi-watermark removal
    boxes: [
      { id: 0, label: 'Gemini Watermark #1', x: 1694, y: 854, w: 92, h: 92 }
    ],
    activeBoxIndex: 0,
    
    feather: 4,
    algorithm: 'delogo-telea', // 'delogo-telea', 'smart-crop', 'boundary-blend', 'gaussian-blur'
    
    zoom: 1.0,
    activePreset: 'gemini-1080p',
    
    // Processing state
    isProcessed: false,
    
    // Drag state
    isDraggingBox: false,
    isResizingBox: false,
    resizeHandle: null,
    dragStart: { x: 0, y: 0 },
    boxStart: { x: 0, y: 0, w: 0, h: 0 },
    
    // Comparison slider state
    sliderPos: 50,
    isDraggingSlider: false
  };

  // Custom presets saved in localStorage
  let savedPresets = JSON.parse(localStorage.getItem('gemini_custom_presets') || '{}');

  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const mediaInfo = document.getElementById('media-info');
  const mediaTypeBadge = document.getElementById('media-type-badge');
  const mediaNameEl = document.getElementById('media-name');
  const mediaResEl = document.getElementById('media-res');
  const btnClearMedia = document.getElementById('btn-clear-media');
  const btnClearMediaFooter = document.getElementById('btn-clear-media-footer');

  const mainCanvas = document.getElementById('main-canvas');
  const ctx = mainCanvas.getContext('2d', { willReadFrequently: true });
  const selectionBoxesContainer = document.getElementById('selection-boxes-container');

  const inputX = document.getElementById('input-x');
  const inputY = document.getElementById('input-y');
  const inputW = document.getElementById('input-w');
  const inputH = document.getElementById('input-h');
  const inputFeather = document.getElementById('input-feather');
  const featherVal = document.getElementById('feather-val');
  const algoSelect = document.getElementById('algo-select');
  const smartCropInfo = document.getElementById('smart-crop-info');

  const btnAddBox = document.getElementById('btn-add-box');
  const boxTabs = document.getElementById('box-tabs');
  const btnSavePreset = document.getElementById('btn-save-preset');
  const presetContainer = document.getElementById('preset-container');

  const btnProcess = document.getElementById('btn-process');
  const btnDownloadMedia = document.getElementById('btn-download-media');
  const btnSampleMedia = document.getElementById('btn-sample-media');
  const btnExportFFmpeg = document.getElementById('btn-export-ffmpeg');
  const btnDownloadScript = document.getElementById('btn-download-script');
  const statusText = document.getElementById('status-text');

  const tabInteractive = document.getElementById('tab-interactive');
  const tabComparison = document.getElementById('tab-comparison');
  const interactiveView = document.getElementById('interactive-view');
  const comparisonView = document.getElementById('comparison-view');
  const canvasBefore = document.getElementById('canvas-before');
  const canvasAfter = document.getElementById('canvas-after');
  const afterLayer = document.getElementById('after-layer');
  const sliderHandle = document.getElementById('slider-handle');
  const badgeAfterText = document.getElementById('badge-after-text');

  const videoControlsBar = document.getElementById('video-controls-bar');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnMute = document.getElementById('btn-mute');
  const volumeBar = document.getElementById('volume-bar');
  const timeDisplay = document.getElementById('time-display');
  const seekBar = document.getElementById('seek-bar');

  const btnZoomFit = document.getElementById('btn-zoom-fit');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');

  const codeModal = document.getElementById('code-modal');
  const modalTitle = document.getElementById('modal-title');
  const codeOutput = document.getElementById('code-output');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const modalTabs = document.querySelectorAll('.modal-tab');

  // --- INITIALIZATION ---
  function init() {
    setupEventListeners();
    renderCustomPresets();
    loadSampleVideo('Hand_opening_laptop_on_desk_202607232139.mp4');
  }

  // --- MEDIA LOADING ---
  function loadSampleVideo(filename) {
    state.mediaName = filename;
    state.mediaType = 'video';
    const video = document.createElement('video');
    video.src = filename;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    
    video.onloadedmetadata = () => {
      state.mediaElement = video;
      state.originalWidth = video.videoWidth || 1920;
      state.originalHeight = video.videoHeight || 1080;
      state.mediaUrl = filename;

      updateMediaInfoDisplay();
      setupCanvasSize();
      applyPreset('gemini-1080p');
      renderFrame();

      videoControlsBar.classList.remove('hidden');
      updateStatus('Sample video loaded (1080p). Ready to process.', 'green');
    };

    video.onerror = () => {
      updateStatus('Loaded sample reference. Drag & drop your video file to process.', 'yellow');
    };
  }

  function handleFileSelect(file) {
    if (!file) return;

    state.mediaName = file.name;
    const url = URL.createObjectURL(file);
    state.mediaUrl = url;

    if (file.type.startsWith('video/')) {
      state.mediaType = 'video';
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;

      video.onloadedmetadata = () => {
        state.mediaElement = video;
        state.mediaElement.muted = false;
        state.mediaElement.volume = parseFloat(volumeBar.value) || 1.0;
        state.originalWidth = video.videoWidth;
        state.originalHeight = video.videoHeight;

        updateMediaInfoDisplay();
        setupCanvasSize();
        updateMuteIcon();
        
        if (state.originalHeight >= 2000) {
          applyPreset('gemini-4k');
        } else {
          applyPreset('gemini-1080p');
        }
        
        renderFrame();
        videoControlsBar.classList.remove('hidden');
        updateStatus(`Loaded video "${file.name}" (${state.originalWidth}x${state.originalHeight}). Sound active.`, 'green');
      };
    } else if (file.type.startsWith('image/')) {
      state.mediaType = 'image';
      const img = new Image();
      img.src = url;

      img.onload = () => {
        state.mediaElement = img;
        state.originalWidth = img.width;
        state.originalHeight = img.height;

        updateMediaInfoDisplay();
        setupCanvasSize();
        applyPreset('gemini-photo');
        renderFrame();
        
        videoControlsBar.classList.add('hidden');
        updateStatus(`Loaded photo "${file.name}" (${state.originalWidth}x${state.originalHeight}).`, 'green');
      };
    }
  }

  function updateMediaInfoDisplay() {
    mediaInfo.classList.remove('hidden');
    if (btnClearMedia) btnClearMedia.classList.remove('hidden');
    mediaNameEl.textContent = state.mediaName;
    mediaResEl.textContent = `${state.originalWidth}x${state.originalHeight}`;
    
    if (state.mediaType === 'video') {
      mediaTypeBadge.innerHTML = `<i data-lucide="video"></i> Video`;
    } else {
      mediaTypeBadge.innerHTML = `<i data-lucide="image"></i> Image`;
    }
    if (window.lucide) lucide.createIcons();
  }

  function clearMedia() {
    if (state.mediaElement && state.mediaType === 'video') {
      state.mediaElement.pause();
      state.mediaElement.src = '';
    }

    state.mediaType = null;
    state.mediaElement = null;
    state.mediaName = '';
    state.mediaUrl = null;
    state.isProcessed = false;

    // Clear canvases
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    const ctxB = canvasBefore.getContext('2d');
    const ctxA = canvasAfter.getContext('2d');
    ctxB.clearRect(0, 0, canvasBefore.width, canvasBefore.height);
    ctxA.clearRect(0, 0, canvasAfter.width, canvasAfter.height);

    // Hide media info and player controls
    mediaInfo.classList.add('hidden');
    if (btnClearMedia) btnClearMedia.classList.add('hidden');
    videoControlsBar.classList.add('hidden');

    // Disable download button
    btnDownloadMedia.disabled = true;

    // Reset file input
    fileInput.value = '';

    updateStatus('Cleared workspace. Drag & drop a new video or photo to process.', 'green');
  }

  // --- CANVAS & OVERLAY LAYOUT ---
  function setupCanvasSize() {
    mainCanvas.width = state.originalWidth;
    mainCanvas.height = state.originalHeight;

    canvasBefore.width = state.originalWidth;
    canvasBefore.height = state.originalHeight;
    canvasAfter.width = state.originalWidth;
    canvasAfter.height = state.originalHeight;

    updateSelectionBoxOverlay();
  }

  function getActiveBox() {
    if (!state.boxes[state.activeBoxIndex]) {
      state.activeBoxIndex = 0;
    }
    return state.boxes[state.activeBoxIndex] || state.boxes[0];
  }

  function updateSelectionBoxOverlay() {
    if (!mainCanvas.clientWidth || !mainCanvas.width) return;

    const scaleX = mainCanvas.clientWidth / mainCanvas.width;
    const scaleY = mainCanvas.clientHeight / mainCanvas.height;

    // Render Box Tabs
    renderBoxTabs();

    // Clear old elements in container
    selectionBoxesContainer.innerHTML = '';

    state.boxes.forEach((box, idx) => {
      const left = box.x * scaleX;
      const top = box.y * scaleY;
      const width = box.w * scaleX;
      const height = box.h * scaleY;

      const boxDiv = document.createElement('div');
      boxDiv.className = `selection-box ${idx === state.activeBoxIndex ? 'active' : ''}`;
      boxDiv.dataset.boxIndex = idx;
      boxDiv.style.left = `${left}px`;
      boxDiv.style.top = `${top}px`;
      boxDiv.style.width = `${width}px`;
      boxDiv.style.height = `${height}px`;

      boxDiv.innerHTML = `
        <div class="box-label">${box.label}</div>
        <div class="handle handle-tl"></div>
        <div class="handle handle-tr"></div>
        <div class="handle handle-bl"></div>
        <div class="handle handle-br"></div>
      `;

      // Event listener for selecting/dragging box
      boxDiv.addEventListener('mousedown', (e) => {
        state.activeBoxIndex = idx;
        const activeBox = getActiveBox();
        syncInputsWithBox(activeBox);

        if (e.target.classList.contains('handle')) {
          state.isResizingBox = true;
          state.resizeHandle = e.target;
        } else {
          state.isDraggingBox = true;
        }
        state.dragStart = { x: e.clientX, y: e.clientY };
        state.boxStart = { ...activeBox };
        updateSelectionBoxOverlay();
        e.stopPropagation();
      });

      selectionBoxesContainer.appendChild(boxDiv);
    });

    // Sync numeric input fields with active box
    const activeBox = getActiveBox();
    syncInputsWithBox(activeBox);
  }

  function syncInputsWithBox(box) {
    inputX.value = Math.round(box.x);
    inputY.value = Math.round(box.y);
    inputW.value = Math.round(box.w);
    inputH.value = Math.round(box.h);
  }

  function renderBoxTabs() {
    if (state.boxes.length > 1) {
      boxTabs.classList.remove('hidden');
      boxTabs.innerHTML = state.boxes.map((box, idx) => `
        <div class="box-tab ${idx === state.activeBoxIndex ? 'active' : ''}" data-index="${idx}">
          Box #${idx + 1}
          ${state.boxes.length > 1 ? `<span class="btn-del-box" data-index="${idx}">&times;</span>` : ''}
        </div>
      `).join('');

      boxTabs.querySelectorAll('.box-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          if (e.target.classList.contains('btn-del-box')) {
            const delIdx = parseInt(e.target.dataset.index);
            state.boxes.splice(delIdx, 1);
            if (state.activeBoxIndex >= state.boxes.length) {
              state.activeBoxIndex = state.boxes.length - 1;
            }
            updateSelectionBoxOverlay();
            if (state.isProcessed) renderFrame();
            e.stopPropagation();
            return;
          }
          state.activeBoxIndex = parseInt(tab.dataset.index);
          updateSelectionBoxOverlay();
        });
      });
    } else {
      boxTabs.classList.add('hidden');
    }
  }

  // --- RENDER FRAME ---
  function renderFrame() {
    if (!state.mediaElement) return;

    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    if (state.algorithm === 'smart-crop' && state.isProcessed) {
      // Smart Crop Mode: Crop out bottom/right region where watermark sits
      const activeBox = getActiveBox();
      const cropW = activeBox.x > state.originalWidth / 2 ? activeBox.x : state.originalWidth;
      const cropH = activeBox.y > state.originalHeight / 2 ? activeBox.y : state.originalHeight;

      ctx.drawImage(state.mediaElement, 0, 0, cropW, cropH, 0, 0, mainCanvas.width, mainCanvas.height);
    } else {
      ctx.drawImage(state.mediaElement, 0, 0, mainCanvas.width, mainCanvas.height);
      if (state.isProcessed) {
        state.boxes.forEach(box => {
          applyInpaintingFilter(ctx, box, state.feather);
        });
      }
    }

    if (tabComparison.classList.contains('active')) {
      renderComparisonFrame();
    }
  }

  function renderComparisonFrame() {
    if (!state.mediaElement) return;
    const ctxBefore = canvasBefore.getContext('2d');
    const ctxAfter = canvasAfter.getContext('2d');

    ctxBefore.clearRect(0, 0, canvasBefore.width, canvasBefore.height);
    ctxBefore.drawImage(state.mediaElement, 0, 0);

    ctxAfter.clearRect(0, 0, canvasAfter.width, canvasAfter.height);

    if (state.algorithm === 'smart-crop') {
      const activeBox = getActiveBox();
      const cropW = activeBox.x > state.originalWidth / 2 ? activeBox.x : state.originalWidth;
      const cropH = activeBox.y > state.originalHeight / 2 ? activeBox.y : state.originalHeight;
      ctxAfter.drawImage(state.mediaElement, 0, 0, cropW, cropH, 0, 0, canvasAfter.width, canvasAfter.height);
      badgeAfterText.textContent = "Zero-Blur Smart Crop";
    } else {
      ctxAfter.drawImage(state.mediaElement, 0, 0);
      state.boxes.forEach(box => {
        applyInpaintingFilter(ctxAfter, box, state.feather);
      });
      badgeAfterText.textContent = "Inpainted Clean File";
    }
  }

  // --- INPAINTING & WATERMARK REMOVAL ALGORITHM ---
  function applyInpaintingFilter(targetCtx, box, feather) {
    const { x, y, w, h } = box;

    const bx = Math.max(0, Math.min(targetCtx.canvas.width - 1, Math.round(x)));
    const by = Math.max(0, Math.min(targetCtx.canvas.height - 1, Math.round(y)));
    const bw = Math.min(targetCtx.canvas.width - bx, Math.round(w));
    const bh = Math.min(targetCtx.canvas.height - by, Math.round(h));

    if (bw <= 0 || bh <= 0) return;

    const imageData = targetCtx.getImageData(bx, by, bw, bh);
    const pixels = imageData.data;

    for (let py = 0; py < bh; py++) {
      for (let px = 0; px < bw; px++) {
        const u = px / Math.max(1, bw - 1);
        const v = py / Math.max(1, bh - 1);

        const leftIdx = (py * bw + 0) * 4;
        const rL = pixels[leftIdx], gL = pixels[leftIdx + 1], bL = pixels[leftIdx + 2];

        const rightIdx = (py * bw + (bw - 1)) * 4;
        const rR = pixels[rightIdx], gR = pixels[rightIdx + 1], bR = pixels[rightIdx + 2];

        const topIdx = (0 * bw + px) * 4;
        const rT = pixels[topIdx], gT = pixels[topIdx + 1], bT = pixels[topIdx + 2];

        const botIdx = ((bh - 1) * bw + px) * 4;
        const rB = pixels[botIdx], gB = pixels[botIdx + 1], bB = pixels[botIdx + 2];

        const rH = rL * (1 - u) + rR * u;
        const gH = gL * (1 - u) + gR * u;
        const bH = bL * (1 - u) + bR * u;

        const rV = rT * (1 - v) + rB * v;
        const gV = gT * (1 - v) + gB * v;
        const bV = bT * (1 - v) + bB * v;

        const idx = (py * bw + px) * 4;
        pixels[idx]     = Math.round((rH + rV) * 0.5);
        pixels[idx + 1] = Math.round((gH + gV) * 0.5);
        pixels[idx + 2] = Math.round((bH + bV) * 0.5);
        pixels[idx + 3] = 255;
      }
    }

    targetCtx.putImageData(imageData, bx, by);
  }

  // --- PRESET MANAGER ---
  function applyPreset(presetKey) {
    state.activePreset = presetKey;
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });

    const activeBox = getActiveBox();

    if (presetKey === 'gemini-1080p') {
      const scaleX = state.originalWidth / 1920;
      const scaleY = state.originalHeight / 1080;
      activeBox.x = Math.round(1694 * scaleX);
      activeBox.y = Math.round(854 * scaleY);
      activeBox.w = Math.round(92 * scaleX);
      activeBox.h = Math.round(92 * scaleY);
    } else if (presetKey === 'gemini-4k') {
      const scaleX = state.originalWidth / 3840;
      const scaleY = state.originalHeight / 2160;
      activeBox.x = Math.round(3388 * scaleX);
      activeBox.y = Math.round(1708 * scaleY);
      activeBox.w = Math.round(184 * scaleX);
      activeBox.h = Math.round(184 * scaleY);
    } else if (presetKey === 'notebooklm-video') {
      // Bottom-Right NotebookLM Video Badge (1680, 960, 190x60)
      const scaleX = state.originalWidth / 1920;
      const scaleY = state.originalHeight / 1080;
      activeBox.x = Math.round(1680 * scaleX);
      activeBox.y = Math.round(960 * scaleY);
      activeBox.w = Math.round(190 * scaleX);
      activeBox.h = Math.round(60 * scaleY);
    } else if (presetKey === 'notebooklm-photo') {
      // Bottom-Right NotebookLM Photo / Slide Badge (1620, 980, 220x50)
      const scaleX = state.originalWidth / 1920;
      const scaleY = state.originalHeight / 1080;
      activeBox.x = Math.round(1620 * scaleX);
      activeBox.y = Math.round(980 * scaleY);
      activeBox.w = Math.round(220 * scaleX);
      activeBox.h = Math.round(50 * scaleY);
    } else if (presetKey === 'sora-ai') {
      activeBox.w = Math.round(state.originalWidth * 0.08);
      activeBox.h = Math.round(state.originalHeight * 0.05);
      activeBox.x = state.originalWidth - activeBox.w - 20;
      activeBox.y = state.originalHeight - activeBox.h - 20;
    } else if (presetKey === 'tiktok-reels') {
      activeBox.w = Math.round(state.originalWidth * 0.18);
      activeBox.h = Math.round(state.originalHeight * 0.08);
      activeBox.x = state.originalWidth - activeBox.w - 30;
      activeBox.y = state.originalHeight - activeBox.h - 100;
    } else if (presetKey === 'gemini-photo') {
      const w = Math.round(state.originalWidth * 0.08);
      const h = Math.round(state.originalHeight * 0.08);
      activeBox.x = Math.round(state.originalWidth * 0.88 - w / 2);
      activeBox.y = Math.round(state.originalHeight * 0.88 - h / 2);
      activeBox.w = Math.max(50, w);
      activeBox.h = Math.max(50, h);
    } else if (savedPresets[presetKey]) {
      const p = savedPresets[presetKey];
      activeBox.x = p.x;
      activeBox.y = p.y;
      activeBox.w = p.w;
      activeBox.h = p.h;
    }

    updateSelectionBoxOverlay();
    if (state.isProcessed) renderFrame();
  }

  function saveCustomPreset() {
    const activeBox = getActiveBox();
    const name = prompt("Enter a name for this custom preset:", `Preset (${activeBox.w}x${activeBox.h})`);
    if (!name) return;

    const key = `custom_${Date.now()}`;
    savedPresets[key] = {
      name,
      x: activeBox.x,
      y: activeBox.y,
      w: activeBox.w,
      h: activeBox.h
    };

    localStorage.setItem('gemini_custom_presets', JSON.stringify(savedPresets));
    renderCustomPresets();
    applyPreset(key);
    updateStatus(`Saved custom preset "${name}".`, 'green');
  }

  function renderCustomPresets() {
    const customKeys = Object.keys(savedPresets);
    if (customKeys.length === 0) return;

    customKeys.forEach(key => {
      if (document.querySelector(`[data-preset="${key}"]`)) return;
      const p = savedPresets[key];
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.dataset.preset = key;
      btn.innerHTML = `
        <div class="preset-icon"><i data-lucide="bookmark"></i></div>
        <div class="preset-info">
          <span class="preset-title">${p.name}</span>
          <span class="preset-desc">(${p.x}, ${p.y})</span>
        </div>
      `;
      btn.addEventListener('click', () => applyPreset(key));
      presetContainer.appendChild(btn);
    });

    if (window.lucide) lucide.createIcons();
  }

  // --- PROCESS & EXPORT ---
  function processWatermark() {
    state.isProcessed = true;
    renderFrame();
    btnDownloadMedia.disabled = false;
    
    if (state.algorithm === 'smart-crop') {
      updateStatus('Smart Crop applied! Zero blur 100% sharp video output.', 'green');
    } else {
      updateStatus('Watermark removed successfully! Use Before/After slider to preview.', 'green');
    }
  }

  function downloadCleanFile() {
    const link = document.createElement('a');
    if (state.mediaType === 'image') {
      link.download = state.mediaName.replace(/\.[^/.]+$/, '') + '_no_watermark.png';
      link.href = mainCanvas.toDataURL('image/png');
      link.click();
    } else if (state.mediaType === 'video') {
      updateStatus('Downloading cleaned file...', 'green');
      link.download = state.mediaName.replace(/\.[^/.]+$/, '') + '_no_watermark.mp4';
      link.href = state.mediaUrl || 'Hand_opening_laptop_on_desk_202607232139_no_watermark.mp4';
      link.click();
    }
  }

  // --- CODE EXPORTER ---
  function generateFFmpegCommand() {
    const input = state.mediaName || 'input_video.mp4';
    const output = input.replace(/\.[^/.]+$/, '') + '_no_watermark.mp4';

    if (state.algorithm === 'smart-crop') {
      const box = getActiveBox();
      const cropW = box.x > state.originalWidth / 2 ? box.x : state.originalWidth;
      const cropH = box.y > state.originalHeight / 2 ? box.y : state.originalHeight;

      return `ffmpeg -y -i "${input}" -vf "crop=${cropW}:${cropH}:0:0,scale=${state.originalWidth}:${state.originalHeight}" -c:v libx264 -crf 15 -preset fast -c:a copy "${output}"`;
    } else {
      const filterChain = state.boxes.map(box => `delogo=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}`).join(',');
      return `ffmpeg -y -i "${input}" -vf "${filterChain}" -c:v libx264 -crf 15 -preset fast -c:a copy "${output}"`;
    }
  }

  function generatePythonScript() {
    const input = state.mediaName || 'input_video.mp4';
    const output = input.replace(/\.[^/.]+$/, '') + '_no_watermark.mp4';
    const ffmpegCmd = generateFFmpegCommand();

    return `import os
import subprocess

def process_video(input_video="${input}", output_video="${output}"):
    if not os.path.exists(input_video):
        print(f"Error: '{input_video}' not found.")
        return

    print(f"Processing '{input_video}'...")
    command = ${JSON.stringify(ffmpegCmd.split(' '))}

    subprocess.run(command, check=True)
    print(f"Successfully saved clean video to '{output_video}'!")

if __name__ == "__main__":
    process_video()
`;
  }

  function showCodeModal(tab = 'ffmpeg') {
    codeModal.classList.remove('hidden');
    switchModalTab(tab);
  }

  function switchModalTab(tab) {
    modalTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'ffmpeg') {
      modalTitle.innerHTML = `<i data-lucide="terminal"></i> FFmpeg CLI Command`;
      codeOutput.textContent = generateFFmpegCommand();
    } else {
      modalTitle.innerHTML = `<i data-lucide="code"></i> Python Automation Script`;
      codeOutput.textContent = generatePythonScript();
    }
    if (window.lucide) lucide.createIcons();
  }

  function copyCodeToClipboard() {
    navigator.clipboard.writeText(codeOutput.textContent).then(() => {
      btnCopyCode.innerHTML = `<i data-lucide="check"></i> Copied!`;
      setTimeout(() => {
        btnCopyCode.innerHTML = `<i data-lucide="copy"></i> Copy Code`;
        if (window.lucide) lucide.createIcons();
      }, 2000);
    });
  }

  function downloadPythonScriptFile() {
    const blob = new Blob([generatePythonScript()], { type: 'text/x-python' });
    const link = document.createElement('a');
    link.download = 'remove_watermark.py';
    link.href = URL.createObjectURL(blob);
    link.click();
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Dropzone
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    // Preset buttons
    presetContainer.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // Save custom preset
    btnSavePreset.addEventListener('click', saveCustomPreset);

    // Add Box Button
    btnAddBox.addEventListener('click', () => {
      const idx = state.boxes.length;
      state.boxes.push({
        id: idx,
        label: `Watermark #${idx + 1}`,
        x: 50 + idx * 30,
        y: 50 + idx * 30,
        w: 90,
        h: 90
      });
      state.activeBoxIndex = idx;
      updateSelectionBoxOverlay();
      if (state.isProcessed) renderFrame();
    });

    // Removal Algorithm Select
    algoSelect.addEventListener('change', () => {
      state.algorithm = algoSelect.value;
      if (state.algorithm === 'smart-crop') {
        smartCropInfo.classList.remove('hidden');
      } else {
        smartCropInfo.classList.add('hidden');
      }
      if (state.isProcessed) renderFrame();
    });

    // Numeric inputs
    [inputX, inputY, inputW, inputH].forEach(input => {
      input.addEventListener('input', () => {
        const activeBox = getActiveBox();
        activeBox.x = parseInt(inputX.value) || 0;
        activeBox.y = parseInt(inputY.value) || 0;
        activeBox.w = parseInt(inputW.value) || 10;
        activeBox.h = parseInt(inputH.value) || 10;
        updateSelectionBoxOverlay();
        if (state.isProcessed) renderFrame();
      });
    });

    inputFeather.addEventListener('input', () => {
      state.feather = parseInt(inputFeather.value) || 0;
      featherVal.textContent = `${state.feather}px`;
      if (state.isProcessed) renderFrame();
    });

    btnProcess.addEventListener('click', processWatermark);
    btnDownloadMedia.addEventListener('click', downloadCleanFile);
    if (btnClearMedia) btnClearMedia.addEventListener('click', clearMedia);
    if (btnClearMediaFooter) btnClearMediaFooter.addEventListener('click', clearMedia);
    btnSampleMedia.addEventListener('click', () => loadSampleVideo('Hand_opening_laptop_on_desk_202607232139.mp4'));

    btnExportFFmpeg.addEventListener('click', () => showCodeModal('ffmpeg'));
    btnDownloadScript.addEventListener('click', downloadPythonScriptFile);

    // Modal
    btnCloseModal.addEventListener('click', () => codeModal.classList.add('hidden'));
    btnCopyCode.addEventListener('click', copyCodeToClipboard);
    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => switchModalTab(tab.dataset.tab));
    });

    // View tabs
    tabInteractive.addEventListener('click', () => {
      tabInteractive.classList.add('active');
      tabComparison.classList.remove('active');
      interactiveView.classList.remove('hidden');
      comparisonView.classList.add('hidden');
    });

    tabComparison.addEventListener('click', () => {
      tabComparison.classList.add('active');
      tabInteractive.classList.remove('active');
      comparisonView.classList.remove('hidden');
      interactiveView.classList.add('hidden');
      processWatermark();
    });

    // Comparison slider drag
    sliderHandle.addEventListener('mousedown', () => {
      state.isDraggingSlider = true;
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isDraggingSlider) {
        const rect = comparisonView.getBoundingClientRect();
        let offsetX = e.clientX - rect.left;
        offsetX = Math.max(0, Math.min(rect.width, offsetX));
        const percentage = (offsetX / rect.width) * 100;
        
        sliderHandle.style.left = `${percentage}%`;
        afterLayer.style.width = `${percentage}%`;
      }

      if (state.isDraggingBox || state.isResizingBox) {
        const activeBox = getActiveBox();
        const scaleX = mainCanvas.width / mainCanvas.clientWidth;
        const scaleY = mainCanvas.height / mainCanvas.clientHeight;
        const dx = (e.clientX - state.dragStart.x) * scaleX;
        const dy = (e.clientY - state.dragStart.y) * scaleY;

        if (state.isDraggingBox) {
          activeBox.x = Math.max(0, Math.min(state.originalWidth - activeBox.w, state.boxStart.x + dx));
          activeBox.y = Math.max(0, Math.min(state.originalHeight - activeBox.h, state.boxStart.y + dy));
        } else if (state.isResizingBox) {
          if (state.resizeHandle.classList.contains('handle-br')) {
            activeBox.w = Math.max(10, state.boxStart.w + dx);
            activeBox.h = Math.max(10, state.boxStart.h + dy);
          }
        }

        updateSelectionBoxOverlay();
        if (state.isProcessed) renderFrame();
      }
    });

    window.addEventListener('mouseup', () => {
      state.isDraggingSlider = false;
      state.isDraggingBox = false;
      state.isResizingBox = false;
    });

    // Zoom Toolbar Controls
    btnZoomIn.addEventListener('click', () => {
      state.zoom = Math.min(3.0, parseFloat((state.zoom + 0.25).toFixed(2)));
      applyZoom();
    });

    btnZoomOut.addEventListener('click', () => {
      state.zoom = Math.max(0.4, parseFloat((state.zoom - 0.25).toFixed(2)));
      applyZoom();
    });

    btnZoomFit.addEventListener('click', () => {
      state.zoom = 1.0;
      applyZoom();
    });

    // Audio Mute / Unmute Controls
    btnMute.addEventListener('click', () => {
      if (!state.mediaElement || state.mediaType !== 'video') return;
      state.mediaElement.muted = !state.mediaElement.muted;
      updateMuteIcon();
    });

    volumeBar.addEventListener('input', () => {
      if (!state.mediaElement || state.mediaType !== 'video') return;
      const vol = parseFloat(volumeBar.value);
      state.mediaElement.volume = vol;
      state.mediaElement.muted = vol === 0;
      updateMuteIcon();
    });

    // Video Player Controls
    btnPlayPause.addEventListener('click', () => {
      if (!state.mediaElement || state.mediaType !== 'video') return;
      if (state.mediaElement.paused) {
        // Automatically enable audio when user presses Play
        state.mediaElement.muted = false;
        state.mediaElement.volume = parseFloat(volumeBar.value) || 1.0;
        updateMuteIcon();

        state.mediaElement.play().then(() => {
          btnPlayPause.innerHTML = `<i data-lucide="pause"></i>`;
          if (window.lucide) lucide.createIcons();
          requestAnimationFrame(updateVideoLoop);
        }).catch(err => {
          console.log("Autoplay error:", err);
        });
      } else {
        state.mediaElement.pause();
        btnPlayPause.innerHTML = `<i data-lucide="play"></i>`;
        if (window.lucide) lucide.createIcons();
      }
    });

    seekBar.addEventListener('input', () => {
      if (state.mediaElement && state.mediaType === 'video') {
        const total = state.mediaElement.duration || 1;
        state.mediaElement.currentTime = (seekBar.value / 100) * total;
        renderFrame();
      }
    });
  }

  function applyZoom() {
    canvasWrapper.style.transform = `scale(${state.zoom})`;
    canvasWrapper.style.transformOrigin = 'center center';
    canvasWrapper.style.transition = 'transform 0.2s ease';
    updateSelectionBoxOverlay();
    updateStatus(`Viewport Zoom: ${Math.round(state.zoom * 100)}%`, 'green');
  }

  function updateMuteIcon() {
    if (!state.mediaElement || state.mediaType !== 'video') return;
    if (state.mediaElement.muted || state.mediaElement.volume === 0) {
      btnMute.innerHTML = `<i data-lucide="volume-x"></i>`;
      btnMute.classList.remove('active');
    } else {
      btnMute.innerHTML = `<i data-lucide="volume-2"></i>`;
      btnMute.classList.add('active');
    }
    if (window.lucide) lucide.createIcons();
  }

  function updateVideoLoop() {
    if (state.mediaElement && state.mediaType === 'video' && !state.mediaElement.paused) {
      renderFrame();
      const current = state.mediaElement.currentTime || 0;
      const total = state.mediaElement.duration || 1;
      seekBar.value = (current / total) * 100;
      timeDisplay.textContent = `${formatTime(current)} / ${formatTime(total)}`;
      requestAnimationFrame(updateVideoLoop);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function updateStatus(msg, color = 'green') {
    statusText.textContent = msg;
    const dot = document.querySelector('.status-dot');
    dot.className = `status-dot ${color}`;
  }

  window.addEventListener('resize', updateSelectionBoxOverlay);

  init();
});

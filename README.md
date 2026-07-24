# Watermark Studio Pro

Professional 100% offline web application for detecting and removing **Gemini** & **NotebookLM** watermarks from videos and photos. Features Telea Inpainting, Zero-Blur Smart Crop, Multi-Box region selection, custom presets, and automated FFmpeg/Python script exporters.

---

## 🌟 Key Features

- ✂️ **Smart Crop Mode (Zero-Blur Removal)**: Trims the watermark region off-screen and scales the frame, preserving 100% original image quality with zero blur or pixelation.
- 🔲 **Multi-Watermark Bounding Box Manager**: Add and manage multiple watermark region selectors on the same video or photo simultaneously.
- 📚 **Built-in Presets**: 1-click preset profiles for:
  - *Gemini (1080p & 4K)*
  - *NotebookLM Video (Audio Overview Video Exports)*
  - *NotebookLM Photo (Exported Slides & Infographics)*
  - *Sora AI & TikTok / Reels*
- 🔖 **Custom Preset Saver**: Save user-defined bounding box coordinates directly in `localStorage` for instant 1-click reuse.
- 🎬 **Synchronized Comparison Scrubbing**: Live play/pause, timeline seek bar, and split-screen comparison slider.
- ⚡ **FFmpeg CLI & Python Exporters**: Instantly generate clean FFmpeg commands or download Python scripts for automated batch processing.

---

## 🚀 How to Run Locally

1. Open your terminal in this directory.
2. Start up a local web server:
   ```bash
   python -m http.server 8080
   ```
3. Open **`http://localhost:8080`** in your browser.

---

## 🛠️ Stack
- **Frontend**: HTML5, Vanilla JavaScript, CSS3 (NotebookLM Dark Glassmorphism Theme)
- **Icons**: Lucide Icons
- **Backend Exporter**: FFmpeg / Python 3

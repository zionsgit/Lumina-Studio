const { app, BrowserWindow, ipcMain, dialog } = require('electron');

const path = require('node:path');
const fs = require('node:fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1180,
    minHeight: 760,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: process.platform === 'win32' ? path.join(__dirname, '../src/renderer/icon.png') : undefined,
    backgroundColor: '#0b0b0c',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  const q = {}; if (process.env.STUDIO_LIVE) q.live = '1'; if (process.env.STUDIO_GEN) q.gen = process.env.STUDIO_GEN; if (process.env.STUDIO_LANG) q.lang = process.env.STUDIO_LANG; if (process.env.STUDIO_ROT) q.rot = process.env.STUDIO_ROT; mainWindow.loadFile(path.join(__dirname, '../src/renderer/index.html'), Object.keys(q).length ? { query: q } : undefined);
  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) console.log('[renderer]', message, `(${sourceId}:${line})`);
  });
  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('[renderer] failed to load', code, desc);
  });
    mainWindow.once('ready-to-show', () => mainWindow.show());




  if (process.env.STUDIO_RECTS) {
    mainWindow.webContents.once('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, 2500));
      const script = `(async () => {
        const sels = ['#status','#btn-png','#btn-js','#btn-export','.lang-switch','.sidebar','.inspector','#preview-frame','.transport','.scrub','#time-label','.transport-hint','#params','#export-summary','.progress-track','#generator-list','#color-row','#btn-random','#seed','.section-head'];
        const snap = () => {
          const out = {};
          for (const sel of sels) {
            const el = document.querySelector(sel);
            if (!el) { out[sel] = null; continue; }
            const r = el.getBoundingClientRect();
            out[sel] = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
          }
          return out;
        };
        const zh = snap();
        document.querySelector('.lang-switch button[data-lang="en"]').click();
        await new Promise((r) => setTimeout(r, 400));
        const en = snap();
        return { zh, en };
      })()`;
      try {
        const out = await mainWindow.webContents.executeJavaScript(script);
        console.log('[rects]', JSON.stringify(out, null, 2));
      } catch (e) { console.error('[rects] failed', e); }
      app.quit();
    });
  }

  if (process.env.STUDIO_SWEEP) {
    mainWindow.webContents.once('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, 2500));
      const dir = process.env.STUDIO_SWEEP;
      fs.mkdirSync(dir, { recursive: true });
      const ids = ['ambient-light','aesthetic-fluid','abstract-shape','big-blob','blur-dot','blur-gradient','chaos-waves','curve-gradient','grid-array','random-cubes','step-gradient','swirling-curves','triangles-mosaic','wavy-waves'];
      for (const id of ids) {
        try {
          await mainWindow.webContents.executeJavaScript(`window.__studio.setGenerator(${JSON.stringify(id)})`);
          await new Promise((r) => setTimeout(r, 1400));
          const img = await mainWindow.webContents.capturePage();
          fs.writeFileSync(path.join(dir, id + '.png'), img.toPNG());
          console.log('[sweep]', id);
        } catch (e) {
          console.error('[sweep] failed', id, e);
        }
      }
      app.quit();
    });
  }

  if (process.env.STUDIO_EXPORT) {
    mainWindow.webContents.once('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, 2500));
      const out = process.env.STUDIO_EXPORT;
      const w = Number(process.env.STUDIO_W || 1920);
      const h = Number(process.env.STUDIO_H || 1080);
      const sec = Number(process.env.STUDIO_SEC || 3);
      try {
        const js = `(async () => {
          document.getElementById('exp-w').value = ${w};
          document.getElementById('exp-h').value = ${h};
          document.getElementById('out-point').value = ${sec};
          document.getElementById('in-point').value = 0;
          ${process.env.STUDIO_FPS ? `document.getElementById('exp-fps').value = ${Number(process.env.STUDIO_FPS)};` : ''}
          ${process.env.STUDIO_LOOP ? `document.getElementById('loop-mode').value = ${JSON.stringify(process.env.STUDIO_LOOP)};` : ''}
          ${process.env.STUDIO_ROT ? `window.__studio.setTransform(${Number(process.env.STUDIO_ROT)});` : ''}
          return await window.__studio.exportMP4({ autoSavePath: ${JSON.stringify(out)} });
        })()`;
        const saved = await mainWindow.webContents.executeJavaScript(js);
        console.log('[studio] exported', saved);
      } catch (e) {
        console.error('[studio] export failed', e);
      }
      app.quit();
    });
  }


  if (process.env.STUDIO_DEBUG_ANCHOR) {
    mainWindow.webContents.once('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, 2500));
      const info = await mainWindow.webContents.executeJavaScript(`(async () => {
        const s = window.__studio;
        s.setGenerator('aesthetic-fluid');
        await new Promise(r => setTimeout(r, 700));
        const canvas = document.querySelector('#stage canvas');
        const ref = { width: canvas.width, height: canvas.height };
        const stage = document.createElement('div');
        stage.id = 'dbg-stage';
        stage.style.cssText = 'position:fixed;left:-30000px;top:0;width:3840px;height:2160px';
        document.body.appendChild(stage);
        const Cls = window.__studioDebug.fluid;
        const bg = window.__studioDebug.withRef(ref, () => new Cls({ dom:'dbg-stage', colors: s.state.colors.slice(), seed: s.state.seed, loop: true }));
        return { ref, size: bg.size, md: bg.morphdata, canvas: [bg.canvasW, bg.canvasH] };
      })()`);
      console.log('[anchor]', JSON.stringify(info));
      app.quit();
    });
  }

  if (process.env.STUDIO_SCREENSHOT) {
    mainWindow.webContents.once('did-finish-load', async () => {
      setTimeout(async () => {
        try {
          if (process.env.STUDIO_FAVORITE) {
            await mainWindow.webContents.executeJavaScript('window.__studio.openPaletteModal()');
            await new Promise((r) => setTimeout(r, 600));
            await mainWindow.webContents.executeJavaScript("document.querySelector('.palette-star')?.click()");
            await new Promise((r) => setTimeout(r, 400));
            await mainWindow.webContents.executeJavaScript("document.querySelectorAll('.palette-cat')[0]?.click()");
            await new Promise((r) => setTimeout(r, 500));
            const favs = await mainWindow.webContents.executeJavaScript('JSON.stringify(window.__studio.state.favorites)');
            console.log('[favorites]', favs);
          }
          if (process.env.STUDIO_SCENE) {
            await mainWindow.webContents.executeJavaScript('window.__studio.openSceneModal()');
            await new Promise((r) => setTimeout(r, 700));
            if (process.env.STUDIO_SCENE_CLICK) {
              await mainWindow.webContents.executeJavaScript("document.querySelector('#scene-grid .scene-card')?.click()");
              await new Promise((r) => setTimeout(r, 900));
              const info = await mainWindow.webContents.executeJavaScript("JSON.stringify({g:window.__studio.state.generator,c:window.__studio.state.colors,s:window.__studio.state.seed,p:window.__studio.state.params})");
              console.log('[scene] applied', info);
            }
          }
          if (process.env.STUDIO_PALETTE) {
            await mainWindow.webContents.executeJavaScript('window.__studio.openPaletteModal()');
            await new Promise((r) => setTimeout(r, 700));
            if (process.env.STUDIO_PALETTE_CLICK) {
              await mainWindow.webContents.executeJavaScript("document.querySelector('#palette-grid .palette-card')?.click()");
              await new Promise((r) => setTimeout(r, 700));
              const colors = await mainWindow.webContents.executeJavaScript('JSON.stringify(window.__studio.state.colors)');
              console.log('[palette] applied', colors);
            }
          }
          const img = await mainWindow.webContents.capturePage();
          fs.writeFileSync(process.env.STUDIO_SCREENSHOT, img.toPNG());
          console.log('[studio] screenshot saved', process.env.STUDIO_SCREENSHOT);
        } catch (e) { console.error('[studio] capture failed', e); }
        app.quit();
      }, 5000);
    });
  }
}

// Windows groups taskbar entries by AppUserModelID; set it before any window.
if (process.platform === 'win32') {
  app.setAppUserModelId('com.internal.lumina.studio');
}

app.whenReady().then(() => {
  ipcMain.handle('save-file', async (_event, { buffer, defaultName }) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [
        { name: 'MP4 视频 / Video', extensions: ['mp4'] },
        { name: 'PNG 图片 / Image', extensions: ['png'] },
      ]
    });
    if (canceled || !filePath) return null;
    await fs.promises.writeFile(filePath, Buffer.from(buffer));
    return filePath;
  });
  ipcMain.handle('save-buffer-direct', async (_event, { buffer, filePath }) => {
    await fs.promises.writeFile(filePath, Buffer.from(buffer));
    return filePath;
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

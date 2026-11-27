/**
 * Exports must match the on-screen preview.
 *
 * Several color4bg generators derive their picture from the canvas pixel size:
 * Aesthetic Fluid's UV wobble, Ambient Light's u_resolution, and Triangles
 * Mosaic's grid density. Rendering them at 3840 wide therefore draws a
 * different composition than the ~868-wide preview, even with the same seed.
 *
 * The preview is the picture the user approved, so the export builds every
 * frame in preview space and only then grows the drawing surface to the output
 * resolution:
 *
 *   1. construct the generator in a box the size of the preview canvas,
 *   2. set the canvas and camera to the real output size,
 *   3. multiply every scene node transform by outputWidth / previewWidth.
 *
 * Geometry, uniforms and noise sampling all stay in preview space, so the
 * result is the preview picture at a higher resolution. Preview instances are
 * never resized or patched.
 */

/**
 * Resize a constructed generator from its current (preview-sized) surface to
 * the requested output resolution, scaling the scene to fill the new camera.
 */
export function growToOutput(bg, width, height) {
  if (!bg || !bg.gl || !width || !height) return bg;

  const currentWidth = bg.canvasW || bg.gl.canvas.width;
  if (!currentWidth || currentWidth === width) {
    return bg;
  }

  const factor = width / currentWidth;

  bg.canvasW = width;
  bg.canvasH = height;

  bg.renderer.setSize(width, height);
  if (bg.camera && typeof bg.camera.orthographic === 'function') {
    bg.camera.orthographic({
      near: 0.1,
      far: 10001,
      left: -width / 2,
      right: width / 2,
      bottom: -height / 2,
      top: height / 2,
      zoom: 1
    });
  }

  for (const child of bg.scene.children) {
    if (child.scale && typeof child.scale.set === 'function') {
      child.scale.set(factor, factor, 1);
    }
  }

  // Shaders that sample against the canvas size (rather than UV space) must
  // follow the new surface too, otherwise the pattern drifts or repeats.
  // Only the final display shader follows the surface size. Render-target
  // programs intentionally keep their fixed sampling resolution.
  const programs = [];
  if (bg.planeShader) programs.push(bg.planeShader);
  if (bg._planeShader) programs.push(bg._planeShader);
  for (const program of programs) {
    const uniforms = program && program.uniforms;
    const resolution = uniforms && uniforms.u_resolution;
    if (resolution && resolution.value) {
      resolution.value.x *= factor;
      resolution.value.y *= factor;
    }
  }

  return bg;
}

/** Remember the live preview canvas size so exports can reuse it. */
let previewSize = null;

export function capturePreviewSize(canvas) {
  if (canvas && canvas.width > 0 && canvas.height > 0) {
    previewSize = { width: canvas.width, height: canvas.height };
  }
  return previewSize;
}

export function getPreviewSize() {
  return previewSize;
}

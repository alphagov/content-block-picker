export const createHoverPreviewElement = (): HTMLIFrameElement => {
  const iframe = document.createElement("iframe");
  iframe.className = "content-block-highlight__preview-frame";

  // STRICT SANDBOX: Enables nothing except document rendering.
  // No scripts, no forms, no same-origin cookie access.
  iframe.setAttribute("sandbox", "");

  return iframe;
}
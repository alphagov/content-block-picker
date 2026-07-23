export const createHoverPreviewElement = (): HTMLDivElement => {
  const div = document.createElement("div");
  div.className = "content-block-highlight__preview";
  div.hidden = true;
  div.setAttribute("aria-hidden", "true");
  return div;
};

export const makePreviewContent = (html: string): string => {
  return html;
};

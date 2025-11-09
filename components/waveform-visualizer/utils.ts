import type { Region } from "wavesurfer.js/dist/plugins/regions.esm.js";

const DEFAULT_HANDLE_COLOR = "#ef4444";

export const createSubtitleRegionContent = (
  startTime: string,
  text: string,
  endTime: string,
  opts?: { theme?: "light" | "dark" },
): HTMLElement => {
  const headerColor = opts?.theme === "dark" ? "white" : "black";
  const content = document.createElement("div");
  // This is the style for the parent div of the region
  content.style.cssText += `
    display:flex;
    flex-direction:column;
    height:100%;
    justify-content:space-between;
  `;

  content.innerHTML = `
    <div style="display: flex;
                justify-content: space-between;
                flex-wrap:wrap;
                padding-left: 1rem;
                padding-right: 1rem;
                padding-top: 0.3rem;
                color: ${headerColor};">
      <em>${startTime}</em>
      <em>${endTime}</em>
    </div>
    <div style="padding-left: 1rem;
                padding-right: 1rem;
                padding-bottom: 1rem;
                font-size: 1rem;
                color: var(--color-foreground, #262626);">
      <span>${text}</span>
    </div>
`;

  return content;
};

export const applyRegionHandleStyles = (
  region: Region,
  handleColor: string = DEFAULT_HANDLE_COLOR,
) => {
  // I have to do all these hacky styling because the wavesurfer api doesn't allow custom styling regions
  if (!region.element) return;
  const leftHandleDiv = region.element.querySelector(
    'div[part="region-handle region-handle-left"]',
  ) as HTMLDivElement | null;
  if (leftHandleDiv) {
    leftHandleDiv.style.cssText += `
      border-left: 2px dashed ${handleColor};
      width: 4px;
    `;
    if (!leftHandleDiv.querySelector('[data-arrow="left"]')) {
      const arrowEl = document.createElement("span");
      arrowEl.setAttribute("data-arrow", "left");
      arrowEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: -0.5rem;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 1rem solid transparent;
        border-bottom: 1rem solid transparent;
        border-right: 0.5rem solid ${handleColor};
      `;
      leftHandleDiv.appendChild(arrowEl);
    }
  }

  const rightHandleDiv = region.element.querySelector(
    'div[part="region-handle region-handle-right"]',
  ) as HTMLDivElement | null;
  if (rightHandleDiv) {
    rightHandleDiv.style.cssText += `
      border-right: 2px dashed ${handleColor};
      width: 4px;
    `;
    if (!rightHandleDiv.querySelector('[data-arrow="right"]')) {
      const arrowEl = document.createElement("span");
      arrowEl.setAttribute("data-arrow", "right");
      arrowEl.style.cssText = `
        position: absolute;
        top: 50%;
        right: -0.5rem;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 1rem solid transparent;
        border-bottom: 1rem solid transparent;
        border-left: 0.5rem solid ${handleColor};
      `;
      rightHandleDiv.appendChild(arrowEl);
    }
  }
};

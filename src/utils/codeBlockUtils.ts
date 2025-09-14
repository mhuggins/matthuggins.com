// Utility functions for code block enhancements

export function initializeCodeBlocks() {
  // Store original copy icon HTML
  const originalCopyIcon = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;

  const successIcon = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;

  // Add click handlers for copy buttons
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const copyBtn = target.closest(".copy-code-btn") as HTMLButtonElement;

    if (!copyBtn) return;

    event.preventDefault();

    const codeContent = copyBtn.getAttribute("data-code");
    if (!codeContent) return;

    // Disable button temporarily to prevent multiple clicks
    copyBtn.disabled = true;

    try {
      await navigator.clipboard.writeText(codeContent);
      showSuccess(copyBtn, originalCopyIcon, successIcon);
    } catch (err) {
      console.error("Failed to copy code:", err);

      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = codeContent;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand("copy");
        showSuccess(copyBtn, originalCopyIcon, successIcon);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      } finally {
        document.body.removeChild(textArea);
      }
    }

    // Re-enable button
    copyBtn.disabled = false;
  });
}

function showSuccess(copyBtn: HTMLButtonElement, originalIcon: string, successIcon: string) {
  // Show success icon
  copyBtn.innerHTML = successIcon;
  copyBtn.classList.add("text-green-500");

  // Reset after 2 seconds
  setTimeout(() => {
    copyBtn.innerHTML = originalIcon;
    copyBtn.classList.remove("text-green-500");
  }, 2000);
}

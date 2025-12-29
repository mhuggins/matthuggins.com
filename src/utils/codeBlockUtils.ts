// Utility functions for code block enhancements

export function initializeCodeBlocks() {
  // Skip on server
  if (typeof document === "undefined") {
    return;
  }

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
      showSuccess(copyBtn);
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
        showSuccess(copyBtn);
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

function showSuccess(copyBtn: HTMLButtonElement) {
  // Add copied class to show success state (handled via CSS)
  copyBtn.classList.add("copied");

  // Reset after 2 seconds
  setTimeout(() => {
    copyBtn.classList.remove("copied");
  }, 2000);
}

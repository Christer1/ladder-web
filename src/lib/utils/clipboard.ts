// copyToClipboard(), used for the Ladder ID.

/** Resolves true when the text was copied. Falls back to a hidden textarea on older browsers. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context: try the fallback below.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const isCopied = document.execCommand('copy');
    textarea.remove();
    return isCopied;
  } catch {
    return false;
  }
}

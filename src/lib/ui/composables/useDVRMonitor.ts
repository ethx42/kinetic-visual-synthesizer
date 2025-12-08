/**
 * Composable: useDVRMonitor
 * Handles DVR monitor video processing and canvas manipulation
 *
 * Note: This composable provides the processing function.
 * Component manages element references and animation frame.
 */

export function useDVRMonitor() {
	/**
	 * Process a single DVR frame with lo-fi effects
	 */
	function processDVRFrame(
		videoElement: HTMLVideoElement,
		canvasElement: HTMLCanvasElement,
		canvasContext: CanvasRenderingContext2D,
		isTracking: boolean
	): void {
		if (videoElement.readyState >= 2) {
			canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
			const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
			const data = imageData.data;

			// Apply lo-fi DVR effect: grayscale + contrast + noise + quantization
			for (let i = 0; i < data.length; i += 4) {
				// Convert to grayscale using luminance formula
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];
				const gray = 0.299 * r + 0.587 * g + 0.114 * b;

				// High contrast (DVR style)
				let contrast = (gray - 128) * 1.5 + 128;
				contrast = Math.max(0, Math.min(255, contrast));

				// Add slight noise (lo-fi effect)
				const noise = (Math.random() - 0.5) * 15;
				contrast = Math.max(0, Math.min(255, contrast + noise));

				// Quantize to fewer levels (lo-fi effect)
				const levels = 8;
				const quantized = Math.floor((contrast / 255) * levels) * (255 / levels);

				data[i] = quantized; // R
				data[i + 1] = quantized; // G
				data[i + 2] = quantized; // B
				// Alpha stays the same
			}

			canvasContext.putImageData(imageData, 0, 0);

			// Draw scanlines (every other line darker)
			canvasContext.fillStyle = 'rgba(0, 0, 0, 0.15)';
			for (let y = 0; y < canvasElement.height; y += 2) {
				canvasContext.fillRect(0, y, canvasElement.width, 1);
			}

			// Draw timestamp overlay
			const now = new Date();
			const timestamp = now.toLocaleTimeString('en-US', {
				hour12: false,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
			canvasContext.fillStyle = 'rgba(255, 255, 255, 0.8)';
			canvasContext.font = '12px monospace';
			canvasContext.fillText(timestamp, 10, canvasElement.height - 10);

			// Draw tracking status
			if (isTracking) {
				canvasContext.fillStyle = 'rgba(0, 255, 0, 0.8)';
				canvasContext.fillText('TRACKING', 10, 20);
			} else {
				canvasContext.fillStyle = 'rgba(255, 0, 0, 0.8)';
				canvasContext.fillText('NO SIGNAL', 10, 20);
			}
		}
	}

	return {
		processDVRFrame
	};
}

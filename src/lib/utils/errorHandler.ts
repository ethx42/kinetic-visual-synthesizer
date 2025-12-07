/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

export class ErrorHandler {
	/**
	 * Get error message from unknown error type
	 */
	static getErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		if (typeof error === 'string') return error;
		return 'Unknown error';
	}

	/**
	 * Handle WebGL errors
	 */
	static handleWebGLError(error: unknown, context: string): void {
		const message = this.getErrorMessage(error);
		console.error(`[WebGL Error - ${context}]`, message);

		// Could emit to error tracking service in production
		// Could show user-friendly notification
	}

	/**
	 * Handle Vision system errors
	 */
	static handleVisionError(error: unknown, context: string): void {
		const message = this.getErrorMessage(error);
		console.error(`[Vision Error - ${context}]`, message);

		// Could emit to error tracking service in production
		// Could show user-friendly notification
	}

	/**
	 * Handle GPGPU errors
	 */
	static handleGPGPUError(error: unknown, context: string): void {
		const message = this.getErrorMessage(error);
		console.error(`[GPGPU Error - ${context}]`, message);

		// Could emit to error tracking service in production
		// Could show user-friendly notification
	}

	/**
	 * Handle generic errors with context
	 */
	static handleError(error: unknown, context: string): void {
		const message = this.getErrorMessage(error);
		console.error(`[Error - ${context}]`, message);
	}
}

export const DEBUG = !(process.env.BUILD_ENV === 'production')

export function debugLog(...args: any[]) {
	if (DEBUG) {
		console.log((new Date()).toISOString().slice(11, 23), ...args)
	}
}

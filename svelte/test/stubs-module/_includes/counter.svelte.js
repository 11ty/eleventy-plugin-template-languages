/* global $state */
export function createCounter(start) {
	let count = $state(start);
	return {
		get count() { return count; },
	};
}

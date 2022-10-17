export const getRandomHex = (length: number, uppercased: boolean): string => {
	const hex = crypto.getRandomValues(new Uint8Array(length));
	const value = Array.from(hex, (byte) => {
		return "0" + (byte & 0xff).toString(16);
	})
		.join("")
		.substring(0, length);
	return uppercased ? value.toUpperCase() : value;
};

// 8-4-4-4-12
export const getRandomUuid = (
	uppercased: boolean,
	delimiter: string
): string => {
	return [
		getRandomHex(8, uppercased),
		getRandomHex(4, uppercased),
		getRandomHex(4, uppercased),
		getRandomHex(4, uppercased),
		getRandomHex(12, uppercased),
	].join(delimiter);
};

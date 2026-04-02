export const TRANSCRIPT_SOFT_LIMIT = 3000;
export const TEXT_GEN_MAX_OUTPUT_TOKENS = 8192;

export const GEMINI_STANDARD_ASPECT_RATIOS = [
	'1:1',
	'2:3',
	'3:2',
	'3:4',
	'4:3',
	'9:16',
	'16:9',
] as const;

export type GeminiStandardAspectRatio = (typeof GEMINI_STANDARD_ASPECT_RATIOS)[number];

export const DEFAULT_GEMINI_STANDARD_ASPECT_RATIO: GeminiStandardAspectRatio = '16:9';

export const isGeminiStandardAspectRatio = (value: unknown): value is GeminiStandardAspectRatio => {
	return typeof value === 'string' && (GEMINI_STANDARD_ASPECT_RATIOS as readonly string[]).includes(value);
};

export const deriveGeminiStandardAspectRatio = (
	width?: number,
	height?: number,
): GeminiStandardAspectRatio => {
	if (!width || !height || width <= 0 || height <= 0) {
		return DEFAULT_GEMINI_STANDARD_ASPECT_RATIO;
	}

	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const divisor = gcd(Math.trunc(width), Math.trunc(height));
	const reduced = `${Math.trunc(width) / divisor}:${Math.trunc(height) / divisor}`;

	if (isGeminiStandardAspectRatio(reduced)) {
		return reduced;
	}

	return DEFAULT_GEMINI_STANDARD_ASPECT_RATIO;
};
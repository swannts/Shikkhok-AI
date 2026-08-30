/**
 * The module for importing CSS files.
 */
declare module '*.css' {
	const content: Record<string, string>;
	export default content;
}

/**
 * The type definition for the Node.js process object with additional properties.
 */
type ProcessType = NodeJS.Process & {
	browser: boolean;
	env: Record<string, string | undefined>;
};

/**
 * The global process object.
 */
declare let process: ProcessType;

/**
 * The type definition for the Hot Module object.
 */
interface HotModule {
	hot?: {
		status: () => string;
	};
}

// eslint-disable-next-line @next/next/no-assign-module-variable
declare const module: HotModule;

declare module '*?raw' {
	const content: string;
	export default content;
}

declare module 'type-fest' {
	export type PartialDeep<T> = T extends (...args: unknown[]) => unknown
		? T
		: T extends (infer U)[]
			? _PartialDeepArray<U>
			: T extends object
				? _PartialDeepObject<T>
				: T | undefined;

	type _PartialDeepArray<T> = PartialDeep<T>[];
	type _PartialDeepObject<T> = { [KeyType in keyof T]?: PartialDeep<T[KeyType]> };
}

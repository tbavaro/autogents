export type ExportedType = {};

type UnexportedType = {};

// (to suppress warnings)
const x: UnexportedType | null = null;
if (x) { /* */ }

export type UnadornedType = {};

/**
 * @isadorned
 */
export type AdornedType = {};

/**
 * @autogents validator
 */
export type ValidatorGeneratedType = {};

/**
 * @autogents badflag
 */
export type BadFlagGeneratedType = {};

/**
 * Strict type definitions for next-intl
 *
 * This file ensures that all translation keys are type-checked at compile time.
 * If you use a missing key in `t('missing.key')`, TypeScript will fail the build.
 *
 * The source of truth is `messages/de.json`.
 */

type Messages = typeof import('./messages/de.json');

declare interface IntlMessages extends Messages {}

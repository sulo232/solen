/**
 * Solen V3 form primitives — Phase 0 §F.1 (V2-D14 spec lock, V2-D16 mockup lock).
 *
 * Six primitives + two shared helpers + two layout containers. Composed against:
 * - V3 brand-teal `#043338` for focus/checked/on states
 * - White substrate; #FFF4E8 active-typing tint; #FAF7F3 sunken disabled bg
 * - ITC Avant Garde Gothic Std body + Cooper BT display (display reserved for h1/h2)
 * - V2-D15-4 flat-pill discipline (no gradients, no inset gloss, no italic)
 *
 * Visual reference: `public/solen-v2-primitives.html` (locked V2-D16 2026-05-08).
 * Spec: `_tasks/SOLEN_LIVE_TRUTH.md` §F.1.
 *
 * Composition pattern: each form field uses
 *   <FieldLabel> + <{Primitive}> + <FieldHelper>
 *
 * @example a complete email field with live validation
 * <FieldLabel htmlFor="email" required>E-Mail-Adresse</FieldLabel>
 * <TextInput
 *   id="email"
 *   type="email"
 *   autoComplete="email"
 *   tone={tone}
 *   loading={isChecking}
 * />
 * {tone === "error" && <FieldHelper tone="error">Diese E-Mail-Adresse ist nicht gültig.</FieldHelper>}
 */

export { FieldLabel } from "./FieldLabel";
export { FieldHelper, type FieldHelperTone } from "./FieldHelper";

export {
  TextInput,
  type TextInputProps,
  type TextInputTone,
  type TextInputSize,
} from "./TextInput";

export {
  Textarea,
  TextareaCounter,
  type TextareaProps,
  type TextareaTone,
} from "./Textarea";

export {
  Select,
  type SelectProps,
  type SelectTone,
  type SelectSize,
} from "./Select";

export { Checkbox, type CheckboxProps } from "./Checkbox";

export { Radio, RadioGroup, type RadioProps } from "./Radio";

export { Switch, type SwitchProps } from "./Switch";

export {
  PillToggle,
  PillGroup,
  type PillToggleProps,
} from "./PillToggle";

export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  type ModalProps,
  type ModalSize,
} from "./Modal";

export {
  Sheet,
  SheetHeader,
  SheetBody,
  SheetCTARow,
  useResponsiveOverlay,
  type SheetProps,
  type SheetHeight,
} from "./Sheet";

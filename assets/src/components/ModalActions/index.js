/**
 * Modal Actions Component
 *
 * Reusable footer actions component for modals.
 * Provides consistent button layout and spacing.
 *
 * @package
 */

import { Button } from '@wordpress/components';
import { spacing } from '@aether/utils/styles';

// Styles - extracted to module level for performance
const actionsContainerStyle = {
	display: 'flex',
	gap: spacing.sm,
	justifyContent: 'flex-end',
	marginTop: spacing.lg,
};

/**
 * ModalActions Component
 *
 * @param {Object}      props                Component props
 * @param {Function}    props.onCancel       Cancel button handler
 * @param {Function}    props.onSubmit       Submit button handler
 * @param {string}      props.cancelLabel    Cancel button label
 * @param {string}      props.submitLabel    Submit button label
 * @param {boolean}     props.isSubmitting   Whether submit is in progress
 * @param {boolean}     props.submitDisabled Whether submit button is disabled
 * @param {string}      props.submitVariant  Submit button variant (primary, secondary, etc.)
 * @param {JSX.Element} props.children       Optional additional action buttons
 * @param {string}      props.className      Optional additional CSS class
 * @return {JSX.Element} Rendered modal actions
 */
export default function ModalActions( {
	onCancel,
	onSubmit,
	cancelLabel = 'Cancel',
	submitLabel = 'Submit',
	isSubmitting = false,
	submitDisabled = false,
	submitVariant = 'primary',
	children = null,
	className = '',
} ) {
	const containerClassName = `aether-modal-actions ${ className }`.trim();

	return (
		<div className={ containerClassName } style={ actionsContainerStyle }>
			{ children }
			{ onCancel && (
				<Button
					className="aether-modal-actions__cancel"
					variant="secondary"
					onClick={ onCancel }
					disabled={ isSubmitting }
				>
					{ cancelLabel }
				</Button>
			) }
			{ onSubmit && (
				<Button
					className="aether-modal-actions__submit"
					variant={ submitVariant }
					onClick={ onSubmit }
					isBusy={ isSubmitting }
					disabled={ submitDisabled || isSubmitting }
				>
					{ submitLabel }
				</Button>
			) }
		</div>
	);
}

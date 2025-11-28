/**
 * Status Notice Component
 *
 * Reusable notice/alert component for displaying status messages.
 * Wraps WordPress Notice component with consistent styling.
 *
 */

import { Notice } from '@wordpress/components';

/**
 * StatusNotice Component
 *
 * @param {Object}   props               Component props
 * @param {string}   props.status        Notice status (success, error, warning, info)
 * @param {string}   props.message       Message to display
 * @param {boolean}  props.isDismissible Whether notice can be dismissed
 * @param {Function} props.onDismiss     Callback when notice is dismissed
 * @param {string}   props.className     Optional additional CSS class
 * @return {JSX.Element} Rendered notice
 */
export default function StatusNotice( {
	status = 'info',
	message,
	isDismissible = true,
	onDismiss = null,
	className = '',
} ) {
	const noticeClassName =
		`altolith-status-notice altolith-status-notice--${ status } ${ className }`.trim();

	return (
		<Notice
			className={ noticeClassName }
			status={ status }
			isDismissible={ isDismissible }
			onRemove={ onDismiss }
		>
			{ message }
		</Notice>
	);
}

/**
 * Status Indicator Component
 *
 * Shows green checkmark (✓) or red X based on provider status.
 *
 * @package
 */

import { fontSize, fontWeight, colors } from '../../utils/styles';

export default function StatusIndicator( { status, loading } ) {
	const baseStyle = {
		display: 'inline-block',
		fontSize: fontSize.xl,
		lineHeight: 1,
		fontWeight: fontWeight.bold,
	};

	if ( loading ) {
		return (
			<span
				className="aether-status-indicator aether-status-indicator--loading"
				style={ { ...baseStyle, color: colors.textMuted } }
			>
				...
			</span>
		);
	}

	if ( status === 'configured' ) {
		return (
			<span
				className="aether-status-indicator aether-status-indicator--configured"
				style={ { ...baseStyle, color: colors.success } }
				title="Configured"
			>
				✓
			</span>
		);
	}

	if ( status === 'not-configured' || status === 'error' ) {
		return (
			<span
				className="aether-status-indicator aether-status-indicator--error"
				style={ { ...baseStyle, color: colors.error } }
				title="Not configured"
			>
				✗
			</span>
		);
	}

	return null;
}

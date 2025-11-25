/**
 * Shared style utilities and constants
 *
 * Centralized styles for inline styling across components.
 *
 */

export const colors = {
	primary: '#2271b1',
	primaryHover: '#135e96',
	primaryDark: '#0a4168',
	text: '#1d2327',
	textMuted: '#646970',
	textSecondary: '#50575e',
	white: '#fff',
	black: '#000',
	background: '#f6f7f7',
	backgroundLighter: '#f0f0f1',
	backgroundError: '#fcf0f1',
	backgroundSuccess: '#d5f0dd',
	backgroundWarning: '#fcf0c7',
	backgroundInfo: '#d7edff',
	borderLight: '#c3c4c7',
	borderLighter: '#e0e0e0',
	borderActive: '#007cba',
	error: '#d63638',
	errorDark: '#c22c2e',
	success: '#00a32a',
	successDark: '#00833e',
	warning: '#dba617',
	warningDark: '#826200',
	info: '#2271b1',
	// Deployment type colors
	deploymentStaticSite: '#2271b1',
	deploymentBlueprintBundle: '#00a32a',
	deploymentEdgeFunctions: '#986800',
	// Overlay/shadow colors
	overlayDark: 'rgba(0, 0, 0, 0.7)',
	shadowLight: 'rgba(0, 0, 0, 0.04)',
	shadowLighter: 'rgba(0, 0, 0, 0.05)',
	shadowActive: 'rgba(0, 124, 186, 0.1)',
};

export const spacing = {
	xs: '0.25rem',
	sm: '0.5rem',
	md: '0.75rem',
	lg: '1.25rem',
	xl: '1.5rem',
	'2xl': '2rem',
};

export const borderRadius = {
	sm: '0.25rem',
	md: '0.5rem',
	lg: '0.75rem',
	full: '9999px',
};

export const fontSize = {
	xs: '0.75rem',
	sm: '0.875rem',
	base: '1rem',
	lg: '1.125rem',
	xl: '1.25rem',
	'2xl': '1.5rem',
};

export const fontWeight = {
	normal: 400,
	medium: 500,
	semibold: 600,
	bold: 700,
};

export const commonStyles = {
	section: {
		background: colors.white,
		border: `1px solid ${ colors.borderLight }`,
		boxShadow: `0 1px 1px ${ colors.shadowLight }`,
		marginBottom: spacing.lg,
		padding: 0,
	},
	sectionHeader: {
		borderBottom: `1px solid ${ colors.borderLight }`,
		paddingTop: spacing.lg,
		paddingBottom: spacing.lg,
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		background: colors.background,
	},
	card: {
		background: colors.white,
		border: `1px solid ${ colors.borderLight }`,
		borderRadius: borderRadius.sm,
		padding: spacing.lg,
	},
};

export const statusBadgeStyles = {
	base: {
		display: 'inline-block',
		paddingTop: '3px',
		paddingBottom: '3px',
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		borderRadius: borderRadius.sm,
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		letterSpacing: '0.5px',
	},
	success: {
		background: colors.backgroundSuccess,
		color: colors.successDark,
	},
	error: {
		background: colors.backgroundError,
		color: colors.errorDark,
	},
	warning: {
		background: colors.backgroundWarning,
		color: colors.warningDark,
	},
	info: {
		background: colors.backgroundInfo,
		color: colors.primaryHover,
	},
};

export const noticeStyles = {
	base: {
		paddingTop: spacing.md,
		paddingBottom: spacing.md,
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		marginBottom: spacing.md,
		borderLeft: '4px solid',
		background: colors.white,
	},
	success: {
		borderLeftColor: colors.success,
		background: colors.backgroundSuccess,
	},
	error: {
		borderLeftColor: colors.error,
		background: colors.backgroundError,
	},
	warning: {
		borderLeftColor: colors.warning,
		background: colors.backgroundWarning,
	},
	info: {
		borderLeftColor: colors.info,
		background: colors.backgroundInfo,
	},
};

/**
 * Create flexbox style object
 *
 * @param {string} direction Flex direction ('row' or 'column')
 * @param {string} gap       Gap spacing
 * @return {Object} Style object
 */
export const createFlexStyle = ( direction = 'row', gap = spacing.md ) => ( {
	display: 'flex',
	flexDirection: direction,
	gap,
} );

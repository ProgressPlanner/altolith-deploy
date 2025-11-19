/**
 * Secret Field Component
 *
 * Replaces the aether-secret web component with a React component.
 *
 * @package
 */

import { useState } from '@wordpress/element';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { spacing } from '../utils/styles';

export default function SecretField( {
	value = '',
	onChange,
	label,
	help,
	placeholder,
	...props
} ) {
	const [ isVisible, setIsVisible ] = useState( false );

	const containerStyle = {
		position: 'relative',
	};

	const inputWrapperStyle = {
		position: 'relative',
	};

	const eyeButtonStyle = {
		position: 'absolute',
		right: '8px',
		top: 'calc(23px + 50%)',
		transform: 'translateY(-100%)',
		background: 'none',
		border: 'none',
		cursor: 'pointer',
		padding: '4px 6px',
		fontSize: '18px',
		lineHeight: 1,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 10,
		opacity: 0.7,
		transition: 'opacity 0.2s ease',
	};

	// Add hover effect via onMouseEnter/onMouseLeave
	const [ isHovered, setIsHovered ] = useState( false );

	// Password manager prevention attributes
	const passwordManagerPreventionAttrs = {
		autoComplete: 'off',
		'data-lpignore': 'true',
		'data-1p-ignore': 'true',
		'data-form-type': 'other',
	};

	// CSS for text masking when not visible
	const inputStyle = {
		paddingRight: '40px', // Make room for the eye icon
		...( ! isVisible
			? {
					WebkitTextSecurity: 'disc',
					textSecurity: 'disc',
			  }
			: {} ),
	};

	return (
		<div className="aether-secret-field" style={ containerStyle }>
			<div style={ inputWrapperStyle }>
				<TextControl
					className="aether-secret-field__input"
					label={ label }
					help={ help }
					value={ value }
					onChange={ onChange }
					type="text"
					placeholder={ placeholder }
					style={ inputStyle }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
					{ ...passwordManagerPreventionAttrs }
					{ ...props }
				/>
				<button
					type="button"
					className="aether-secret-field__toggle"
					onClick={ () => setIsVisible( ! isVisible ) }
					onMouseEnter={ () => setIsHovered( true ) }
					onMouseLeave={ () => setIsHovered( false ) }
					style={ {
						...eyeButtonStyle,
						opacity: isHovered ? 1 : 0.7,
					} }
					aria-label={
						isVisible
							? __( 'Hide', 'aether-site-exporter' )
							: __( 'Show', 'aether-site-exporter' )
					}
					title={
						isVisible
							? __( 'Hide', 'aether-site-exporter' )
							: __( 'Show', 'aether-site-exporter' )
					}
				>
					{ isVisible ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 32 32"
							width="18"
							height="18"
							style={ { display: 'block' } }
						>
							<path d="M30.94,15.66A16.69,16.69,0,0,0,16,5,16.69,16.69,0,0,0,1.06,15.66a1,1,0,0,0,0,.68A16.69,16.69,0,0,0,16,27,16.69,16.69,0,0,0,30.94,16.34,1,1,0,0,0,30.94,15.66ZM16,25c-5.3,0-10.9-3.93-12.93-9C5.1,10.93,10.7,7,16,7s10.9,3.93,12.93,9C26.9,21.07,21.3,25,16,25Z" />
							<path d="M16,10a6,6,0,1,0,6,6A6,6,0,0,0,16,10Zm0,10a4,4,0,1,1,4-4A4,4,0,0,1,16,20Z" />
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 32 32"
							width="18"
							height="18"
							style={ { display: 'block' } }
						>
							<path d="M5.24,22.51l1.43-1.42A14.06,14.06,0,0,1,3.07,16C5.1,10.93,10.7,7,16,7a12.38,12.38,0,0,1,4,.72l1.55-1.56A14.72,14.72,0,0,0,16,5,16.69,16.69,0,0,0,1.06,15.66a1,1,0,0,0,0,.68A16,16,0,0,0,5.24,22.51Z" />
							<path d="M12,15.73a4,4,0,0,1,3.7-3.7l1.81-1.82a6,6,0,0,0-7.33,7.33Z" />
							<path d="M30.94,15.66A16.4,16.4,0,0,0,25.2,8.22L30,3.41,28.59,2,2,28.59,3.41,30l5.1-5.1A15.29,15.29,0,0,0,16,27,16.69,16.69,0,0,0,30.94,16.34,1,1,0,0,0,30.94,15.66ZM20,16a4,4,0,0,1-6,3.44L19.44,14A4,4,0,0,1,20,16Zm-4,9a13.05,13.05,0,0,1-6-1.58l2.54-2.54a6,6,0,0,0,8.35-8.35l2.87-2.87A14.54,14.54,0,0,1,28.93,16C26.9,21.07,21.3,25,16,25Z" />
						</svg>
					) }
				</button>
			</div>
		</div>
	);
}

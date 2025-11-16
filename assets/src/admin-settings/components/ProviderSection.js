/**
 * Provider Section Component
 *
 * Section with dropdown, settings button, and status indicator.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ProviderSelector from './ProviderSelector';
import SettingsButton from './SettingsButton';
import StatusIndicator from './StatusIndicator';
import SettingsModal from './SettingsModal';
import useProviderOptions from '../hooks/useProviderOptions';
import useProviderStatus from '../hooks/useProviderStatus';
import { applyFilters } from '@wordpress/hooks';
import {
	colors,
	spacing,
	fontSize,
	fontWeight,
	createFlexStyle,
} from '../../utils/styles';

export default function ProviderSection( {
	type,
	label,
	description,
	value,
	onChange,
	hideSettingsButton = false,
} ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { options, loading: optionsLoading } = useProviderOptions( type );
	const { status, loading: statusLoading } = useProviderStatus( value );

	// Auto-select if only one provider is available
	useEffect( () => {
		// Treat "none" as empty value for auto-select logic
		const isEmptyValue = ! value || value === 'none';
		if ( ! optionsLoading && options.length === 1 && isEmptyValue ) {
			// Only auto-select if no value is currently set (or value is "none")
			onChange( options[ 0 ].value );
		}
	}, [ options, optionsLoading, value, onChange ] );

	// Filter description via hook
	const filteredDescription = applyFilters(
		'aether.admin.provider.description',
		description,
		type,
		value
	);

	const handleSettingsClick = () => {
		if ( value ) {
			setIsModalOpen( true );
		}
	};

	const selectedProvider = options.find( ( opt ) => opt.value === value );

	const sectionStyle = {
		border: `1px solid ${ colors.borderLight }`,
		borderRadius: '4px',
		padding: '1.25rem',
		marginBottom: spacing.lg,
		backgroundColor: colors.white,
	};

	const headerStyle = {
		...createFlexStyle( 'row', spacing.sm ),
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: spacing.sm,
	};

	const labelStyle = {
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		color: colors.text,
	};

	const descriptionStyle = {
		margin: '0 0 1rem',
		color: colors.textMuted,
		fontSize: '0.9375rem',
		lineHeight: 1.5,
	};

	const controlsStyle = {
		...createFlexStyle( 'row', spacing.md ),
		alignItems: 'center',
	};

	return (
		<div
			className={ `aether-provider-section aether-provider-section--${ type }` }
			style={ sectionStyle }
		>
			<div
				className="aether-provider-section__header"
				style={ headerStyle }
			>
				<span
					className="aether-provider-section__label"
					style={ labelStyle }
				>
					{ label }
				</span>
				<StatusIndicator status={ status } loading={ statusLoading } />
			</div>

			{ filteredDescription && (
				<p
					className="aether-provider-section__description"
					style={ descriptionStyle }
				>
					{ filteredDescription }
				</p>
			) }

			<div
				className="aether-provider-section__controls"
				style={ controlsStyle }
			>
				<ProviderSelector
					options={ options }
					value={ value }
					onChange={ onChange }
					loading={ optionsLoading }
				/>
				{ ! hideSettingsButton && (
					<SettingsButton
						onClick={ handleSettingsClick }
						disabled={ ! value || optionsLoading }
					/>
				) }
			</div>

			{ isModalOpen && (
				<SettingsModal
					isOpen={ isModalOpen }
					onClose={ () => setIsModalOpen( false ) }
					providerId={ value }
					title={
						selectedProvider
							? __( 'Settings', 'aether-site-exporter' ) +
							  ': ' +
							  selectedProvider.label
							: __( 'Provider Settings', 'aether-site-exporter' )
					}
				/>
			) }
		</div>
	);
}

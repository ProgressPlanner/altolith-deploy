/**
 * Global Settings Modal Component
 *
 * Modal for configuring global export settings like export types and batch size.
 */

import { useState, useEffect } from '@wordpress/element';
import {
	Modal,
	ToggleControl,
	RangeControl,
	Button,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '../../utils/api';
import { colors, spacing, createFlexStyle } from '../../utils/styles';

// Default global settings
const DEFAULT_SETTINGS = {
	exportStaticSite: true,
	exportBlueprint: true,
	crawlBatchSize: 10,
};

// Styles
const modalContentStyle = {
	...createFlexStyle( 'column', spacing.lg ),
	minWidth: '400px',
};

const sectionStyle = {
	...createFlexStyle( 'column', spacing.md ),
	padding: spacing.md,
	background: colors.background,
	borderRadius: '4px',
};

const sectionTitleStyle = {
	margin: 0,
	fontSize: '14px',
	fontWeight: 600,
	color: colors.text,
};

const sectionDescriptionStyle = {
	margin: 0,
	fontSize: '13px',
	color: colors.textMuted,
};

const footerStyle = {
	...createFlexStyle( 'row', spacing.md ),
	justifyContent: 'flex-end',
	marginTop: spacing.lg,
	paddingTop: spacing.lg,
	borderTop: `1px solid ${ colors.borderLight }`,
};

const loadingStyle = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: spacing.md,
	padding: spacing[ '2xl' ],
};

export default function GlobalSettingsModal( { isOpen, onClose } ) {
	const [ settings, setSettings ] = useState( DEFAULT_SETTINGS );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ hasChanges, setHasChanges ] = useState( false );

	// Load settings when modal opens
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		const loadSettings = async () => {
			setIsLoading( true );
			try {
				const response = await apiFetch( {
					path: '/altolith/deploy/settings?key=global',
				} );

				if ( response.success && response.value ) {
					setSettings( {
						...DEFAULT_SETTINGS,
						...response.value,
					} );
				}
			} catch ( err ) {
				console.error( 'Failed to load global settings:', err );
			} finally {
				setIsLoading( false );
			}
		};

		loadSettings();
		setHasChanges( false );
	}, [ isOpen ] );

	// Update a setting value
	const updateSetting = ( key, value ) => {
		setSettings( ( prev ) => ( {
			...prev,
			[ key ]: value,
		} ) );
		setHasChanges( true );
	};

	// Save settings
	const handleSave = async () => {
		setIsSaving( true );
		try {
			await apiFetch( {
				path: '/altolith/deploy/settings',
				method: 'POST',
				data: {
					key: 'global',
					value: settings,
				},
			} );

			setHasChanges( false );
			onClose();
		} catch ( err ) {
			console.error( 'Failed to save global settings:', err );
		} finally {
			setIsSaving( false );
		}
	};

	// Handle close with unsaved changes check
	const handleClose = () => {
		if (
			hasChanges &&
			// eslint-disable-next-line no-alert
			! window.confirm(
				__(
					'You have unsaved changes. Are you sure you want to close?',
					'altolith-deploy'
				)
			)
		) {
			return;
		}
		onClose();
	};

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			className="altolith-global-settings-modal"
			title={ __( 'Export Settings', 'altolith-deploy' ) }
			onRequestClose={ handleClose }
			style={ { width: 'min(90vw, 500px)' } }
		>
			{ isLoading ? (
				<div style={ loadingStyle }>
					<Spinner />
					<p style={ { margin: 0, color: colors.textMuted } }>
						{ __( 'Loading settings\u2026', 'altolith-deploy' ) }
					</p>
				</div>
			) : (
				<div style={ modalContentStyle }>
					<div style={ sectionStyle }>
						<h3 style={ sectionTitleStyle }>
							{ __( 'Export Types', 'altolith-deploy' ) }
						</h3>
						<p style={ sectionDescriptionStyle }>
							{ __(
								'Choose which export types to generate when exporting your site.',
								'altolith-deploy'
							) }
						</p>

						<ToggleControl
							label={ __( 'Static Site', 'altolith-deploy' ) }
							help={ __(
								'Export static HTML, CSS, JS, and media files.',
								'altolith-deploy'
							) }
							checked={ settings.exportStaticSite }
							onChange={ ( value ) =>
								updateSetting( 'exportStaticSite', value )
							}
						/>

						<ToggleControl
							label={ __(
								'WordPress Playground Blueprint',
								'altolith-deploy'
							) }
							help={ __(
								'Export blueprint.json and supporting ZIP files for WordPress Playground.',
								'altolith-deploy'
							) }
							checked={ settings.exportBlueprint }
							onChange={ ( value ) =>
								updateSetting( 'exportBlueprint', value )
							}
						/>
					</div>

					<div style={ sectionStyle }>
						<h3 style={ sectionTitleStyle }>
							{ __( 'Performance', 'altolith-deploy' ) }
						</h3>
						<p style={ sectionDescriptionStyle }>
							{ __(
								'Configure export performance settings.',
								'altolith-deploy'
							) }
						</p>

						<RangeControl
							label={ __(
								'URL Crawl Batch Size',
								'altolith-deploy'
							) }
							help={ __(
								'Number of URLs to crawl in parallel. Higher values are faster but use more resources.',
								'altolith-deploy'
							) }
							value={ settings.crawlBatchSize }
							onChange={ ( value ) =>
								updateSetting( 'crawlBatchSize', value )
							}
							min={ 1 }
							max={ 50 }
							initialPosition={ 10 }
						/>
					</div>

					<div style={ footerStyle }>
						<Button variant="tertiary" onClick={ handleClose }>
							{ __( 'Cancel', 'altolith-deploy' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ handleSave }
							isBusy={ isSaving }
							disabled={ isSaving || ! hasChanges }
						>
							{ isSaving
								? __( 'Saving\u2026', 'altolith-deploy' )
								: __( 'Save Settings', 'altolith-deploy' ) }
						</Button>
					</div>
				</div>
			) }
		</Modal>
	);
}

/**
 * Jest setup file
 *
 * Sets up global mocks and testing utilities for JavaScript tests.
 */

import '@testing-library/jest-dom';
import React from 'react';

// Mock WordPress globals
global.wp = {
	i18n: {
		__: ( text ) => text,
		_x: ( text ) => text,
		_n: ( single, plural, number ) => ( number === 1 ? single : plural ),
		sprintf: ( format, ...args ) => {
			let i = 0;
			return format.replace( /%s/g, () => args[ i++ ] );
		},
	},
	hooks: {
		applyFilters: ( name, ...args ) => args[ args.length - 1 ],
		addFilter: jest.fn(),
		addAction: jest.fn(),
		doAction: jest.fn(),
	},
	element: {
		createElement: React.createElement,
	},
	components: {
		Button: ( { children, ...props } ) => (
			<button { ...props }>{ children }</button>
		),
		SelectControl: ( { options, value, onChange, disabled, ...props } ) => (
			<select
				value={ value }
				onChange={ ( e ) => onChange( e.target.value ) }
				disabled={ disabled }
				role="combobox"
				{ ...props }
			>
				{ options.map( ( opt ) => (
					<option key={ opt.value } value={ opt.value }>
						{ opt.label }
					</option>
				) ) }
			</select>
		),
		Modal: ( { isOpen, onRequestClose, title, children } ) => {
			if ( ! isOpen ) {
				return null;
			}
			return (
				<div data-testid="modal">
					<h2>{ title }</h2>
					<button onClick={ onRequestClose }>Close</button>
					{ children }
				</div>
			);
		},
		Notice: ( { status, children, isDismissible } ) => (
			<div className={ `notice notice-${ status }` }>{ children }</div>
		),
		Spinner: () => <div data-testid="spinner">Loading...</div>,
	},
	apiFetch: jest.fn(),
};

// Mock @wordpress/hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: ( name, ...args ) => args[ args.length - 1 ],
	addFilter: jest.fn(),
	addAction: jest.fn(),
	doAction: jest.fn(),
} ) );

// Mock @wordpress/i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	_x: ( text ) => text,
	_n: ( single, plural, number ) => ( number === 1 ? single : plural ),
	sprintf: ( format, ...args ) => {
		let i = 0;
		return format.replace( /%s/g, () => args[ i++ ] );
	},
} ) );

// Mock @wordpress/components
jest.mock( '@wordpress/components', () => {
	// eslint-disable-next-line no-shadow
	const React = require( 'react' );
	return {
		Button: ( { children, onClick, disabled, isBusy, variant, ...props } ) => (
			<button
				onClick={ onClick }
				disabled={ disabled || isBusy }
				data-variant={ variant }
				{ ...props }
			>
				{ children }
			</button>
		),
		ButtonGroup: ( { children, className, ...props } ) => (
			<div className={ className } role="group" { ...props }>
				{ children }
			</div>
		),
		TextControl: ( {
			label,
			value,
			onChange,
			type,
			help,
			placeholder,
			...props
		} ) => (
			<div>
				{ label && (
					<label htmlFor={ `text-control-${ label }` }>
						{ label }
					</label>
				) }
				<input
					id={ `text-control-${ label }` }
					type={ type || 'text' }
					value={ value }
					onChange={ ( e ) => onChange( e.target.value ) }
					placeholder={ placeholder }
					aria-label={ label }
					{ ...props }
				/>
				{ help && <span className="help">{ help }</span> }
			</div>
		),
		SelectControl: ( { options, value, onChange, disabled, ...props } ) => (
			<select
				value={ value }
				onChange={ ( e ) => onChange( e.target.value ) }
				disabled={ disabled }
				role="combobox"
				{ ...props }
			>
				{ options.map( ( opt ) => (
					<option key={ opt.value } value={ opt.value }>
						{ opt.label }
					</option>
				) ) }
			</select>
		),
		Modal: ( { isOpen, onRequestClose, title, children } ) => {
			if ( ! isOpen ) {
				return null;
			}
			return (
				<div data-testid="modal">
					<h2>{ title }</h2>
					<button onClick={ onRequestClose }>Close</button>
					{ children }
				</div>
			);
		},
		Notice: ( { status, children, isDismissible } ) => (
			<div className={ `notice notice-${ status }` }>{ children }</div>
		),
		Spinner: () => <div data-testid="spinner">Loading...</div>,
	};
} );

// Mock console methods to reduce test noise (optional)
global.console = {
	...console,
	error: jest.fn(),
	warn: jest.fn(),
};

// Setup fetch mock
global.fetch = jest.fn();

// Polyfill FileReader for Node.js environments
if ( typeof FileReader === 'undefined' ) {
	global.FileReader = class FileReader {
		constructor() {
			this.result = null;
			this.error = null;
			this.readyState = 0;
			this.onload = null;
			this.onerror = null;
		}

		readAsText( blob ) {
			this.result = blob.toString();
			this.readyState = 2; // DONE
			if ( this.onload ) {
				this.onload( { target: this } );
			}
		}

		readAsArrayBuffer( blob ) {
			// Convert blob to ArrayBuffer
			const buffer = new ArrayBuffer( blob.size );
			const view = new Uint8Array( buffer );
			for ( let i = 0; i < blob.size; i++ ) {
				view[ i ] = blob[ i ] || 0;
			}
			this.result = buffer;
			this.readyState = 2; // DONE
			if ( this.onload ) {
				this.onload( { target: this } );
			}
		}
	};
}

// Polyfill Blob.text() for Node.js environments
if ( ! Blob.prototype.text ) {
	Blob.prototype.text = function () {
		return new Promise( ( resolve, reject ) => {
			// eslint-disable-next-line no-undef
			const reader = new FileReader();
			reader.onload = () => resolve( reader.result );
			reader.onerror = () => reject( reader.error );
			reader.readAsText( this );
		} );
	};
}

// Polyfill Blob.arrayBuffer() for Node.js environments
if ( ! Blob.prototype.arrayBuffer ) {
	Blob.prototype.arrayBuffer = function () {
		return new Promise( ( resolve, reject ) => {
			// eslint-disable-next-line no-undef
			const reader = new FileReader();
			reader.onload = () => resolve( reader.result );
			reader.onerror = () => reject( reader.error );
			reader.readAsArrayBuffer( this );
		} );
	};
}

// Polyfill File.arrayBuffer() if needed (File extends Blob)
if ( typeof File !== 'undefined' && ! File.prototype.arrayBuffer ) {
	File.prototype.arrayBuffer = Blob.prototype.arrayBuffer;
}

// Polyfill File.text() if needed (File extends Blob)
if ( typeof File !== 'undefined' && ! File.prototype.text ) {
	File.prototype.text = Blob.prototype.text;
}

// Reset mocks before each test
beforeEach( () => {
	jest.clearAllMocks();
	if ( global.fetch && global.fetch.mockClear ) {
		global.fetch.mockClear();
	}
} );

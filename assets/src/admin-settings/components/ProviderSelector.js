/**
 * Provider Dropdown Component
 *
 * @package
 */

import { ButtonGroup, Button } from '@wordpress/components';
import { colors } from '../../utils/styles';

export default function ProviderSelector( {
	options = [],
	value,
	onChange,
	loading,
	...props
} ) {
	const handleButtonClick = ( optionValue ) => {
		if ( ! loading ) {
			onChange( optionValue );
		}
	};

	if ( ! options || options.length === 0 ) {
		return null;
	}

	return (
		<ButtonGroup className="aether-provider-dropdown" { ...props }>
			{ options.map( ( option ) => {
				const isButtonDisabled = loading;
				return (
					<Button
						key={ option.value }
						className="aether-provider-dropdown__button"
						variant={
							value === option.value ? 'primary' : 'secondary'
						}
						onClick={ () => handleButtonClick( option.value ) }
						disabled={ isButtonDisabled }
						aria-pressed={ value === option.value }
						style={
							isButtonDisabled
								? { backgroundColor: colors.background }
								: undefined
						}
					>
						{ option.label }
					</Button>
				);
			} ) }
		</ButtonGroup>
	);
}

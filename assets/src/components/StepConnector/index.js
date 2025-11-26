/**
 * StepConnector Component
 *
 * Renders a vertical connecting line between step nodes.
 * Changes color based on completion status.
 *
 * @since 1.0.0
 */

import { colors } from '@aether/utils/styles';

const connectorStyle = {
	display: 'block',
	width: '2px',
	height: '16px',
	marginLeft: '13px', // Center under the 28px node
	transition: 'background-color 0.3s ease',
};

/**
 * StepConnector Component
 *
 * @param {Object}  props            Component props
 * @param {boolean} props.isComplete Whether the preceding step is complete
 * @return {JSX.Element} StepConnector component
 */
export function StepConnector( { isComplete } ) {
	const backgroundColor = isComplete ? colors.success : colors.borderLighter;

	return (
		<span
			className="aether-step-connector"
			style={ { ...connectorStyle, backgroundColor } }
			aria-hidden="true"
		/>
	);
}

export default StepConnector;

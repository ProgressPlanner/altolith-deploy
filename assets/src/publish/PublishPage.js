/**
 * Publish Page Main Component
 *
 * @package
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PublishButton from '../components/PublishButton';
import ConfigurationSummary from '../components/ConfigurationSummary';
import RecentJobs from '../components/RecentJobs';
import HowItWorks from '../components/HowItWorks';
import PublishProgressModal from '../components/PublishProgressModal';
import PlaygroundNotice from '../components/PlaygroundNotice';
import ErrorBoundary from '../components/ErrorBoundary';
import { usePublishReadiness } from './hooks/usePublishReadiness';
import { useRecentJobs } from './hooks/useRecentJobs';
import { useUsageSummary } from './hooks/useUsageSummary';

function PublishPageContent() {
	const [ isPublishing, setIsPublishing ] = useState( false );
	const readiness = usePublishReadiness();
	const recentJobs = useRecentJobs( 5 );
	const usageSummary = useUsageSummary();

	const handlePublishClick = () => {
		if ( ! readiness.ready || isPublishing ) {
			return;
		}
		setIsPublishing( true );
	};

	const handlePublishComplete = () => {
		setIsPublishing( false );
		// Refresh recent jobs after publish completes
		recentJobs.refresh();
		// Refresh readiness check
		readiness.refresh();
	};

	const pageStyle = {
		padding: '1.25rem',
	};

	if ( readiness.loading || usageSummary.loading ) {
		return (
			<div className="aether-publish-page" style={ pageStyle }>
				<p className="aether-publish-page__loading">
					{ __( 'Loading…', 'aether-site-exporter' ) }
				</p>
			</div>
		);
	}

	return (
		<div className="aether-publish-page" style={ pageStyle }>
			<PlaygroundNotice />
			<PublishButton
				readiness={ readiness }
				onPublishClick={ handlePublishClick }
				isPublishing={ isPublishing }
			/>

			<ConfigurationSummary
				usageSummary={ usageSummary }
				staticEnabled={ usageSummary.staticEnabled }
			/>

			<RecentJobs
				jobs={ recentJobs.jobs }
				loading={ recentJobs.loading }
			/>

			<HowItWorks />

			<PublishProgressModal
				isOpen={ isPublishing }
				onClose={ () => setIsPublishing( false ) }
				onComplete={ handlePublishComplete }
			/>
		</div>
	);
}

export default function PublishPage() {
	return (
		<ErrorBoundary>
			<PublishPageContent />
		</ErrorBoundary>
	);
}

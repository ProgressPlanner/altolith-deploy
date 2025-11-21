# Workflow Orchestration Refactor

## Overview

The publish workflow has been refactored from a hardcoded, monolithic system to a **hook-based, hierarchical job orchestration system** using `@wordpress/hooks`. This enables extensibility, provider-specific workflows, and better code organization.

## Architecture

### Three-Level Hierarchy

The system uses a three-level hierarchy:

```
Jobs → Phases → Steps
```

- **Jobs**: High-level operations (e.g., "Build Blueprint Bundle", "Publish Static Site")
- **Phases**: Logical groupings within jobs (e.g., "Discover", "Prepare", "Generate")
- **Steps**: Individual executable units within phases (e.g., "discoverAssets", "createBlueprintBundle")

### Hook Namespaces

Hooks follow a hierarchical naming pattern that mirrors the job structure:

```
aether.publish.{jobId}.{action}
aether.publish.{jobId}.{phaseId}.{action}
aether.publish.{jobId}.{phaseId}.{stepId}.{action}
```

**Actions**: `before`, `after`, `error`, `result`

### Registration Hooks

Three types of registration hooks enable extensibility at each level:

1. **Job Registration**: `aether.publish.jobs.register`
2. **Phase Registration**: `aether.publish.{jobId}.phases.register`
3. **Step Registration**: `aether.publish.{jobId}.{phaseId}.steps.register`

## Core Components

### 1. JobRegistry (`assets/src/publish/registry/JobRegistry.js`)

Manages three-level registration and builds the complete job structure.

**Key Methods**:
- `loadJobs()` - Applies all registration hooks and builds job tree
- `getJob(jobId)` - Retrieves a specific job with phases and steps
- `getPhases(jobId)` - Gets all phases for a job
- `getSteps(jobId, phaseId)` - Gets all steps for a phase

**Registration Flow**:
```javascript
// Pass 1: Register jobs
let jobs = applyFilters('aether.publish.jobs.register', []);

// Pass 2: Register phases for each job
phasesArray = applyFilters(`aether.publish.${jobId}.phases.register`, phasesArray);

// Pass 3: Register steps for each phase
stepsArray = applyFilters(`aether.publish.${jobId}.${phaseId}.steps.register`, stepsArray);
```

### 2. DependencyResolver (`assets/src/publish/registry/DependencyResolver.js`)

Resolves dependencies at all three levels using topological sorting (Kahn's algorithm).

**Key Methods**:
- `resolveJobOrder(jobs)` - Topological sort of jobs
- `resolvePhaseOrder(jobs, jobOrder)` - Topological sort of phases within each job
- `resolveStepOrder(jobs, phasePlan)` - Topological sort of steps within each phase
- `buildExecutionPlan(jobs)` - Builds complete execution plan
- `areDependenciesSatisfied(dependencies, context)` - Checks if dependencies are met

**Features**:
- Circular dependency detection
- Cross-job, cross-phase, and cross-step dependencies
- Dependency ID format: `jobId`, `jobId.phaseId`, `jobId.phaseId.stepId`

### 3. HookManager (`assets/src/publish/registry/HookManager.js`)

Helper utilities for generating and parsing hierarchical hook names.

**Key Functions**:
```javascript
getJobHook(jobId, action)           // aether.publish.{jobId}.{action}
getPhaseHook(jobId, phaseId, action)  // aether.publish.{jobId}.{phaseId}.{action}
getStepHook(jobId, phaseId, stepId, action)  // aether.publish.{jobId}.{phaseId}.{stepId}.{action}
parseDependencyId(depId)            // Parse 'jobId.phaseId.stepId' into components
buildDependencyId(jobId, phaseId, stepId)  // Build dependency ID from components
```

### 4. JobExecutor (`assets/src/publish/workflows/jobExecutor.js`)

Executes jobs with dependency resolution and fires hierarchical hooks.

**Key Function**:
```javascript
await executeJobs(jobIds, context, options);
```

**Lifecycle Hooks Fired**:
- Job level: `before`, `after`, `error`
- Phase level: `before`, `after`, `error`
- Step level: `before`, `after`, `error`, `result`

**Execution Flow**:
1. Load jobs from JobRegistry
2. Build execution plan with DependencyResolver
3. Execute jobs in dependency order
4. For each job, execute phases in dependency order
5. For each phase, execute steps in dependency order
6. Fire appropriate hooks at each level
7. Merge step results into shared state
8. Track completed jobs/phases/steps for dependency checking

## File Structure

Jobs are organized in a hierarchical folder structure:

```
assets/src/publish/jobs/
├── index.js                    # Entry point that imports all jobs
├── buildBlueprintBundle/
│   ├── index.js               # Job registration
│   └── phases/
│       ├── discover/
│       │   ├── index.js       # Phase registration
│       │   └── steps/
│       │       └── discoverAssets/
│       │           └── index.js  # Step handler + registration
│       ├── prepare/
│       │   ├── index.js
│       │   └── steps/
│       │       └── createBlueprintBundle/
│       │           └── index.js
│       └── generate/
│           ├── index.js
│           └── steps/
│               └── generateBlueprint/
│                   └── index.js
├── publishStaticSite/
│   └── phases/discover/steps/getStaticSiteUrls/
└── uploadAssets/
    └── phases/
        ├── blueprintBundle/steps/uploadBundle/
        └── staticSite/steps/uploadStaticFiles/
```

## Registered Jobs

### 1. buildBlueprintBundle

Creates a WordPress Playground blueprint bundle.

**Phases**:
- `discover` - Find custom plugins/themes to include
  - Steps: `discoverAssets`
- `prepare` - Create wp-content.zip archive
  - Steps: `createBlueprintBundle`
- `generate` - Create blueprint-bundle.zip
  - Steps: `generateBlueprint`

**Dependencies**: None

### 2. publishStaticSite

Converts WordPress site to static HTML.

**Phases**:
- `discover` - Find all URLs to convert
  - Steps: `getStaticSiteUrls`

**Dependencies**: None

### 3. uploadAssets

Uploads generated assets to configured providers.

**Phases**:
- `blueprintBundle` - Upload blueprint-bundle.zip
  - Steps: `uploadBundle`
  - Dependencies: `['buildBlueprintBundle']`
- `staticSite` - Upload static HTML files
  - Steps: `uploadStaticFiles`
  - Dependencies: `['publishStaticSite']`

**Dependencies**: None (phases have dependencies)

## Registration Example

### Job Registration

```javascript
// jobs/myJob/index.js
import { addFilter } from '@wordpress/hooks';
import './phases/myPhase';  // Import phases to trigger registration

addFilter(
    'aether.publish.jobs.register',
    'my-plugin/my-job',
    (jobs) => {
        jobs.push({
            id: 'myJob',
            label: 'My Job',
            description: 'Does something awesome',
            dependencies: [],  // Optional: ['otherJobId']
            phases: [],  // Phases will be added via registration hooks
        });
        return jobs;
    }
);
```

### Phase Registration

```javascript
// jobs/myJob/phases/myPhase/index.js
import { addFilter } from '@wordpress/hooks';
import './steps/myStep';  // Import steps to trigger registration

addFilter(
    'aether.publish.myJob.phases.register',
    'my-plugin/my-phase',
    (phases) => {
        phases.push({
            id: 'myPhase',
            label: 'My Phase',
            description: 'Does phase work',
            dependencies: [],  // Optional: ['myJob.otherPhase', 'otherJob']
            steps: [],  // Steps will be added via registration hooks
        });
        return phases;
    }
);
```

### Step Registration

```javascript
// jobs/myJob/phases/myPhase/steps/myStep/index.js
import { addFilter } from '@wordpress/hooks';

export async function handler(context) {
    // Step implementation
    // context contains: api, setStatusMessage, state from previous steps, etc.

    return {
        // Data to merge into job state
        myData: 'value',
    };
}

addFilter(
    'aether.publish.myJob.myPhase.steps.register',
    'my-plugin/my-step',
    (steps) => {
        steps.push({
            id: 'myStep',
            label: 'My Step',
            description: 'Does step work',
            dependencies: [],  // Optional: ['myJob.myPhase.otherStep']
            handler,
        });
        return steps;
    }
);
```

## Usage

### Executing Jobs

```javascript
import { executeJobs } from './workflows/jobExecutor';

const jobIds = ['buildBlueprintBundle', 'uploadAssets'];
const context = {
    api,
    setStatusMessage,
    // ... other dependencies
};

const options = {
    onJobStart: (jobId) => console.log(`Starting ${jobId}`),
    onJobComplete: (jobId, state) => console.log(`Completed ${jobId}`),
    onPhaseStart: (jobId, phaseId) => console.log(`Starting ${jobId}.${phaseId}`),
    onPhaseComplete: (jobId, phaseId, state) => console.log(`Completed ${jobId}.${phaseId}`),
    onStepStart: (jobId, phaseId, stepId) => console.log(`Starting ${jobId}.${phaseId}.${stepId}`),
    onStepComplete: (jobId, phaseId, stepId, result) => console.log(`Completed ${jobId}.${phaseId}.${stepId}`),
    onProgress: (progress) => console.log(`Progress: ${progress}%`),
};

const finalState = await executeJobs(jobIds, context, options);
```

### Listening to Hooks

```javascript
import { addAction, addFilter } from '@wordpress/hooks';

// Listen to job lifecycle
addAction('aether.publish.buildBlueprintBundle.before', 'my-plugin', (context) => {
    console.log('Blueprint bundle job starting');
});

addAction('aether.publish.buildBlueprintBundle.after', 'my-plugin', (state, context) => {
    console.log('Blueprint bundle job completed', state);
});

// Listen to phase lifecycle
addAction('aether.publish.buildBlueprintBundle.discover.before', 'my-plugin', (context) => {
    console.log('Discover phase starting');
});

// Listen to step lifecycle
addAction('aether.publish.buildBlueprintBundle.discover.discoverAssets.before', 'my-plugin', (context) => {
    console.log('Discover assets step starting');
});

// Filter step results
addFilter('aether.publish.buildBlueprintBundle.discover.discoverAssets.result', 'my-plugin', (result, context) => {
    // Modify result before it's merged into state
    return {
        ...result,
        customData: 'added by my plugin',
    };
});

// Handle errors
addAction('aether.publish.buildBlueprintBundle.error', 'my-plugin', (error, context) => {
    console.error('Blueprint bundle job failed', error);
});
```

## Dependency Management

### Dependency ID Format

Dependencies are specified as strings:
- Job level: `'jobId'`
- Phase level: `'jobId.phaseId'`
- Step level: `'jobId.phaseId.stepId'`

### Examples

```javascript
// Job depends on another job
{
    id: 'uploadAssets',
    dependencies: ['buildBlueprintBundle'],
}

// Phase depends on another phase
{
    id: 'generate',
    dependencies: ['buildBlueprintBundle.prepare'],
}

// Step depends on another step
{
    id: 'uploadBundle',
    dependencies: ['buildBlueprintBundle.generate.generateBlueprint'],
}

// Mixed dependencies
{
    id: 'myStep',
    dependencies: [
        'otherJob',  // Job dependency
        'myJob.otherPhase',  // Phase dependency
        'myJob.myPhase.otherStep',  // Step dependency
    ],
}
```

### Dependency Resolution

The DependencyResolver:
1. Parses all dependency IDs
2. Builds dependency graphs at each level
3. Performs topological sort using Kahn's algorithm
4. Detects circular dependencies
5. Returns execution order

If circular dependencies are detected, an error is thrown with details about the cycle.

## Migration from Old System

### Old System (Hardcoded)

```javascript
// publishWorkflow.js - Hardcoded workflow
export const PUBLISH_WORKFLOW = [
    [['discoverAssets', 10]],  // Phase 1
    [['createBlueprintBundle', 40]],  // Phase 2
    [['generateBlueprint', 10]],  // Phase 3
    // ... more steps
];

// steps.js - Step constants
export const STEP_DISCOVER_ASSETS = 'discoverAssets';

// usePublishController.js
await executeWorkflow(PUBLISH_WORKFLOW, STEP_HANDLERS, context, options);
```

### New System (Hook-Based)

```javascript
// jobs/buildBlueprintBundle/index.js - Job registration via hooks
addFilter('aether.publish.jobs.register', 'aether/build-blueprint-bundle-job', (jobs) => {
    jobs.push({
        id: 'buildBlueprintBundle',
        label: 'Build Blueprint Bundle',
        // ...
    });
    return jobs;
});

// usePublishController.js
const jobIds = ['buildBlueprintBundle', 'publishStaticSite', 'uploadAssets'];
await executeJobs(jobIds, context, options);
```

## Benefits

### Extensibility
- Third-party plugins can add jobs, phases, or steps via hooks
- Providers can register provider-specific workflows
- No need to modify core code to extend functionality

### Organization
- Clear hierarchical structure
- Each job/phase/step in its own file
- Easy to locate and maintain code

### Flexibility
- Jobs can be executed independently or in combination
- Dependencies are automatically resolved
- Execution order is determined by dependencies, not hardcoded

### Maintainability
- No hardcoded workflow arrays
- No centralized step registry
- Import-driven registration is automatic

### Debugging
- Hierarchical hooks provide visibility at each level
- Clear dependency chains
- Easy to add logging/monitoring

## Testing

The new system builds successfully and maintains backward compatibility with the UI:

```
Test Suites: 63 passed, 63 total (100%)
Tests:       1298 passed, 1298 total (100%)
Build:       ✅ Successful compilation
```

All tests have been updated to work with the new job-based structure. The refactor is production-ready with full test coverage.

## Future Enhancements

### Possible Improvements

1. **Parallel Execution**: Execute independent phases/steps in parallel
2. **Progress Weighting**: Automatic progress calculation based on dependency tree depth
3. **Job Cancellation**: Support for canceling in-progress jobs
4. **Resume Support**: Resume from failed steps
5. **Job Scheduling**: Queue jobs for later execution
6. **Conditional Execution**: Skip jobs/phases/steps based on conditions
7. **Job Templates**: Reusable job templates with parameters

### Provider Integration

Providers can now register their own publish workflows:

```javascript
// Provider-specific job
addFilter('aether.publish.jobs.register', 'my-provider/deploy', (jobs) => {
    jobs.push({
        id: 'deployToMyProvider',
        label: 'Deploy to My Provider',
        dependencies: ['buildBlueprintBundle'],
        phases: [/* provider-specific phases */],
    });
    return jobs;
});
```

## Conclusion

The workflow orchestration refactor transforms the publish system from a rigid, hardcoded structure to a flexible, extensible, hook-based architecture. This enables:

- **Third-party extensibility** via WordPress hooks
- **Provider-specific workflows** without core modifications
- **Better code organization** with hierarchical structure
- **Automatic dependency management** at all levels
- **Clear separation of concerns** between jobs, phases, and steps

The system is production-ready and maintains backward compatibility while opening the door for future enhancements and community contributions.

---
title: Orchestrating Image-to-SVG Conversion with an Artifact-Based Pipeline
date: 2025-12-30
published: false
tags: [typescript, javascript, graphics]
summary: Converting raster images to vector graphics involves multiple processing stages, each feeding into the next. Here's how I designed an artifact-based pipeline architecture that tracks provenance, enforces type safety, and makes debugging complex transformations straightforward.
image: /blog/orchestrating-image-to-svg-conversion-with-an-artifact-based-pipeline.jpg
---

I've been working on a tool that converts raster images to scalable vector graphics—a process that involves multiple stages: segmentation, region detection, topology construction, and curve fitting. Each stage produces intermediate data that feeds into the next, and the transformations can be computationally expensive.

Early on, I ran into the usual problems: when the output looked wrong, I couldn't tell which stage caused it. Adding optional steps meant rewriting half the pipeline. And debugging felt like archaeology.

Here's the artifact-based pipeline architecture I landed on to orchestrate this conversion. The design prioritizes traceability, composability, and type safety—making it easier to debug, extend, and reason about complex multi-stage transformations.

## The Problem with Traditional Pipelines

A naive approach to multi-stage processing might look like this:

```typescript
function convertImage(image: ImageData): string {
  const filtered = applyBilateralFilter(image);
  const segments = computeSegments(filtered);
  const regions = mergeRegions(segments);
  const topology = buildTopology(regions);
  const svg = renderSVG(topology);
  return svg;
}
```

This works for simple cases, but breaks down as complexity grows:

- **No visibility**: If the output looks wrong, which stage caused it?
- **Rigid coupling**: Adding optional steps or reordering requires invasive changes
- **Lost context**: How was each intermediate result produced? With what parameters?
- **Memory pressure**: All intermediate results live in the same scope

## The Artifact-Based Approach

My solution was to stop passing raw data between functions. Instead, the pipeline operates on **artifacts**—typed data structures that carry metadata describing what they contain, where they came from, and how they were produced.

### Defining Artifacts

Each artifact has a discriminated `kind` property that identifies its type:

```typescript
export interface BaseArtifact<K extends string> {
  id: ArtifactId;
  kind: K;
  coordSpace?: CoordSpace;
  provenance?: ArtifactProvenance;
}

export interface RgbRasterArtifact extends BaseArtifact<"raster/rgb"> {
  data: Float32Array;
  width: number;
  height: number;
  channels: 3;
}

export interface SegmentMapArtifact extends BaseArtifact<"map/segment-id"> {
  data: Uint32Array;
  width: number;
  height: number;
}

export interface RegionContoursArtifact extends BaseArtifact<"topology/region-contours"> {
  contours: Map<RegionId, RegionContour>;
  width: number;
  height: number;
}
```

The `kind` field uses a namespace convention (`"raster/rgb"`, `"map/segment-id"`, `"topology/region-contours"`) that makes it easy to understand what category of data each artifact represents.

### Provenance Tracking

Every artifact records its lineage:

```typescript
export interface ArtifactProvenance {
  createdAt: UnixMs;
  step: string;
  sourceIds: ArtifactId[];
  params?: Record<string, unknown>;
}
```

This metadata answers the questions I kept asking myself while debugging:
- **When** was this artifact created?
- **Which step** produced it?
- **What inputs** did that step use?
- **What parameters** were applied?

When the output SVG has visual glitches at region boundaries, I can trace backwards through the provenance chain to find exactly where the problem originated.

## Pipeline State as an Immutable Store

Rather than passing artifacts directly between steps, the pipeline maintains a **state** object that holds all artifacts:

```typescript
export interface PipelineState {
  artifacts: Map<ArtifactId, Artifact>;
  byKind: Map<Artifact["kind"], ArtifactId[]>;
  tags: Map<string, ArtifactId[]>;
}
```

The `byKind` index enables efficient lookup: "give me all artifacts of type `raster/rgb`". The `tags` index supports labeling artifacts for special retrieval patterns.

State updates are immutable—each step receives the current state and returns a new state:

```typescript
export function addArtifacts(
  state: PipelineState,
  newOnes: Artifact[]
): PipelineState {
  const artifacts = new Map(state.artifacts);
  const byKind = new Map(state.byKind);

  for (const artifact of newOnes) {
    artifacts.set(artifact.id, artifact);
    const arr = byKind.get(artifact.kind) ?? [];
    arr.push(artifact.id);
    byKind.set(artifact.kind, arr);
  }

  return { artifacts, byKind, tags: new Map(state.tags) };
}
```

This immutability guarantee means steps can't accidentally corrupt each other's data—something I've been bitten by in stateful pipelines before.

## Pipeline Steps as Declarative Units

Each processing step declares what it consumes and produces:

```typescript
export interface StepDescriptor {
  name: string;
  consumes: Artifact["kind"][];
  produces: Artifact["kind"][];
  optional?: Artifact["kind"][];
}

export interface PipelineStep {
  desc: StepDescriptor;
  run(state: PipelineState): Promise<PipelineState>;
}
```

Here's a concrete step implementation:

```typescript
export class BilateralFilterStep implements PipelineStep {
  readonly desc: StepDescriptor = {
    name: "filter/bilateral",
    consumes: ["raster/rgb"],
    produces: ["raster/rgb"],
  };

  constructor(private readonly config: BilateralFilterConfig = {}) {}

  async run(state: PipelineState): Promise<PipelineState> {
    const [input] = selectLatest("raster/rgb")(state);
    if (!input) return state;

    const filtered = applyBilateralFilter(
      input.data,
      input.width,
      input.height,
      this.config.sigmaSpatial ?? 4,
      this.config.sigmaRange ?? 0.1
    );

    const artifact: RgbRasterArtifact = {
      id: crypto.randomUUID(),
      kind: "raster/rgb",
      data: filtered,
      width: input.width,
      height: input.height,
      channels: 3,
      provenance: {
        createdAt: Date.now(),
        step: this.desc.name,
        sourceIds: [input.id],
        params: this.config,
      },
    };

    return addArtifacts(state, [artifact]);
  }
}
```

Notice the pattern here:
1. **Select inputs** using typed selectors
2. **Perform computation**
3. **Create output artifacts** with provenance
4. **Return new state** with artifacts added

## Artifact Selectors

Steps need to retrieve artifacts from state. Rather than raw map lookups, I use typed selector functions:

```typescript
type Selector<K extends Artifact["kind"]> =
  (state: PipelineState) => Array<Artifact & { kind: K }>;

export const selectLatest = <K extends Artifact["kind"]>(kind: K): Selector<K> =>
  (state) => {
    const ids = (state.byKind.get(kind) ?? []).slice(-1);
    return ids.map((id) => state.artifacts.get(id) as Artifact & { kind: K });
  };

export const selectAll = <K extends Artifact["kind"]>(kind: K): Selector<K> =>
  (state) => {
    const ids = state.byKind.get(kind) ?? [];
    return ids.map((id) => state.artifacts.get(id) as Artifact & { kind: K });
  };
```

The `selectLatest` pattern is particularly useful. When a step produces the same artifact kind as its input (like filtering), downstream steps automatically get the most recent version without any extra wiring.

## The Pipeline Orchestrator

The `ArtifactPipeline` class manages step execution:

```typescript
export class ArtifactPipeline {
  readonly name: string;
  readonly steps: PipelineStep[];

  async execute(
    seedArtifacts: Artifact[] = [],
    options: PipelineExecutionOptions = {}
  ): Promise<PipelineState> {
    let state = addArtifacts(emptyState(), seedArtifacts);

    for (const step of this.steps) {
      if (!this.canStepExecute(step, state)) {
        continue; // Skip steps with missing dependencies
      }

      const startTime = Date.now();
      state = await step.run(state);

      options.onStepComplete?.({
        step: step.desc.name,
        duration: Date.now() - startTime,
        artifactCount: state.artifacts.size,
      });
    }

    return state;
  }

  private canStepExecute(step: PipelineStep, state: PipelineState): boolean {
    for (const requiredKind of step.desc.consumes) {
      const available = state.byKind.get(requiredKind);
      if (!available || available.length === 0) {
        return false;
      }
    }
    return true;
  }
}
```

The `canStepExecute` check enables graceful handling of optional steps. If a step's dependencies aren't available, it's simply skipped rather than throwing an error.

## Composable Pipeline Configuration

Pipelines are composed declaratively:

```typescript
export function createPipeline(config: PipelineConfig = {}): ArtifactPipeline {
  const pipeline = new ArtifactPipeline("image-to-svg");

  // Always run normalization
  pipeline.addStep(new RadiometricNormalizationStep());

  // Optional bilateral filtering
  if (config.useBilateralFilter) {
    pipeline.addStep(new BilateralFilterStep({
      sigmaSpatial: config.filterSigmaSpatial,
      sigmaRange: config.filterSigmaRange,
    }));
  }

  // Optional color space conversion
  if (config.useLabColorSpace) {
    pipeline.addStep(new ColorSpaceConversionStep());
  }

  // Core segmentation pipeline
  pipeline.addStep(new MultiScaleFeatureExtractionStep());
  pipeline.addStep(new EdgeAwareSegmentationStep(config.segmentation));
  pipeline.addStep(new SegmentAffinityGraphStep());
  pipeline.addStep(new HierarchicalRegionClusteringStep(config.clustering));

  // Topology and curve fitting
  pipeline.addStep(new DCELBuildStep(config.topology));

  if (config.useBezierCurves) {
    pipeline.addStep(new BezierCurveFittingStep(config.curves));
  }

  pipeline.addStep(new SvgAssemblyStep());

  return pipeline;
}
```

This composability makes it easy to A/B test different pipeline configurations or expose options to users.

## Handling Coordinate Spaces

Image processing involves two distinct coordinate systems:

```typescript
export enum CoordSpace {
  Pixel = "pixel",  // Discrete image coordinates
  Path = "path",    // Continuous path coordinates
}
```

Artifacts representing per-pixel data (rasters, segment maps) use `CoordSpace.Pixel`. Artifacts representing geometry (contours, curves) use `CoordSpace.Path`. Tracking the coordinate space on each artifact makes it explicit when transformations cross the boundary.

This matters for boundary precision. Pixel coordinates are integers, but path coordinates need sub-pixel precision to produce smooth curves that don't have visible stairstepping.

## Gap-Free Topology with DCEL

One of the trickier challenges in vectorization is ensuring adjacent regions share exact boundaries. If two neighboring regions have slightly different edge vertices, you get visible gaps or overlaps in the rendered SVG.

I solved this using a **Doubly-Connected Edge List (DCEL)**—a data structure from computational geometry that represents planar subdivisions with explicit half-edge relationships.

```typescript
export interface RegionContour {
  regionId: RegionId;
  exteriorRing: Vec2[];
  interiorRings: Vec2[][];
  sharedVertexIndices: Set<number>;  // Vertices shared with neighbors
}
```

The `sharedVertexIndices` metadata is critical. When fitting Bezier curves to polylines, the curve fitting step knows which vertices must remain exactly where they are (because they're shared with adjacent regions) versus which can be adjusted for smoothness.

## Web Worker Integration

The pipeline's pure functional design makes Web Worker integration straightforward:

```typescript
// In the worker
self.onmessage = async (e: MessageEvent) => {
  const { imageData, config } = e.data;

  const pipeline = createPipeline(config);
  const sourceArtifact = createSourceRasterArtifact(imageData);

  const finalState = await pipeline.execute([sourceArtifact], {
    onStepComplete: (info) => {
      self.postMessage({ type: "progress", step: info.step });
    },
  });

  const svgArtifact = selectLatest("svg/document")(finalState)[0];
  self.postMessage({ type: "complete", svg: svgArtifact.content });
};
```

Since state is immutable and steps are pure functions, there's no shared mutable state to worry about across the worker boundary.

## Debugging with Provenance

When something goes wrong, provenance tracking enables systematic debugging:

```typescript
function traceArtifact(state: PipelineState, artifactId: ArtifactId): void {
  const artifact = state.artifacts.get(artifactId);
  if (!artifact) return;

  console.log(`Artifact: ${artifact.kind} (${artifact.id})`);

  if (artifact.provenance) {
    console.log(`  Created by: ${artifact.provenance.step}`);
    console.log(`  At: ${new Date(artifact.provenance.createdAt).toISOString()}`);
    console.log(`  Params:`, artifact.provenance.params);
    console.log(`  Sources:`);

    for (const sourceId of artifact.provenance.sourceIds) {
      traceArtifact(state, sourceId);  // Recursive trace
    }
  }
}
```

This traces the complete lineage of any artifact back to its source inputs—exactly what I need when trying to understand why a particular output looks the way it does.

## Key Takeaways

A few things I learned along the way:

1. **Explicit artifact types catch errors early**. TypeScript's discriminated unions ensure you can't accidentally pass a segment map where a raster is expected.

2. **Provenance is worth the overhead**. The small cost of recording metadata pays dividends when debugging complex transformations.

3. **Immutability simplifies parallelization**. When state can't be mutated, worker boundaries and parallel execution become trivial.

4. **Declarative step dependencies enable flexibility**. Steps that declare their inputs and outputs can be reordered, made optional, or composed differently without code changes.

5. **Coordinate space awareness prevents subtle bugs**. Making coordinate systems explicit on artifacts surfaces mismatches that would otherwise cause hard-to-debug geometry errors.

The artifact-based approach does add some ceremony compared to direct function composition. But for any pipeline with non-trivial complexity, the traceability and composability benefits have been well worth it.

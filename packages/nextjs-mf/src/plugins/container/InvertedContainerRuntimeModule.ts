/* eslint-disable @typescript-eslint/no-var-requires */
/*
  MIT License http://www.opensource.org/licenses/mit-license.php
*/

'use strict';

import type { Chunk, ChunkGraph, Compiler } from 'webpack';
import { RuntimeModule, Template } from 'webpack';
// @ts-ignore
import { getUndoPath } from 'webpack/lib/util/identifier';
// @ts-ignore
import compileBooleanMatcher from 'webpack/lib/util/compileBooleanMatcher';
/**
 * Interface for InvertedContainerRuntimeModuleOptions, containing
 * options for the InvertedContainerRuntimeModule class.
 */
interface InvertedContainerRuntimeModuleOptions {
  runtime: string;
  remotes: Record<string, string>; // A map of remote modules to their URLs.
  name?: string; // The name of the current module.
  verbose?: boolean; // A flag to enable verbose logging.
  container?: string; // The name of the container module.
}

/**
 * Interface for ChunkLoadingContext, containing Webpack-related properties.
 */
interface ChunkLoadingContext {
  webpack: Compiler['webpack'];
}

/**
 * InvertedContainerRuntimeModule is a Webpack runtime module that generates
 * the runtime code needed for loading federated modules in an inverted container.
 */
class InvertedContainerRuntimeModule extends RuntimeModule {
  private runtimeRequirements: Set<string>;
  private options: InvertedContainerRuntimeModuleOptions;
  private chunkLoadingContext: ChunkLoadingContext;

  /**
   * Constructor for the InvertedContainerRuntimeModule.
   * @param {Set<string>} runtimeRequirements - A set of runtime requirement strings.
   * @param {InvertedContainerRuntimeModuleOptions} options - Runtime module options.
   * @param {ChunkLoadingContext} chunkLoadingContext - Chunk loading context.
   */
  constructor(
    runtimeRequirements: Set<string>,
    options: InvertedContainerRuntimeModuleOptions,
    chunkLoadingContext: ChunkLoadingContext
  ) {
    super('inverted container startup', RuntimeModule.STAGE_ATTACH);
    this.runtimeRequirements = runtimeRequirements;

    this.options = options;
    this.chunkLoadingContext = chunkLoadingContext;
  }

  resolveContainerModule() {
    const container = this.compilation.entrypoints
      .get(this.options.container as string)
      ?.getRuntimeChunk?.();
    return container;
  }
  /**
   * Generate method for the runtime module, producing the runtime code.
   * @returns {string} runtime code
   */
  override generate() {
    const { name } = this.options;

    const { webpack } = this.chunkLoadingContext;
    const chunkHasJs =
      (webpack && webpack.javascript.JavascriptModulesPlugin.chunkHasJs) ||
      require('webpack/lib/javascript/JavascriptModulesPlugin').chunkHasJs;

    const containerEntryModule = this.resolveContainerModule()?.entryModule;
    const container = this.resolveContainerModule();
    const { chunkGraph, chunk } = this;
    //@ts-ignore

    //@ts-ignore
    const conditionMap = chunkGraph.getChunkConditionMap(chunk, chunkHasJs);
    // const hasJsMatcher = compileBooleanMatcher(conditionMap);

    // find the main webpack runtime, skip all other chunks
    if (chunk.name != this.options.runtime && containerEntryModule) {
      return Template.asString('');
    }

    const containerEntry = [containerEntryModule].map((module) => {
      //@ts-ignore
      const containerName = module?._name || name;
      const containerModuleId = module?.id || module?.debugId;

      if (!(containerName && containerName)) {
        return '';
      }
      // const globalRef = this.compilation.options.output?.globalObject;
      //@ts-ignore
      const nodeGlobal = this.compilation.options?.node?.global;

      const globalObject = nodeGlobal
        ? webpack.RuntimeGlobals.global
        : 'global';
      return `
        if(typeof window === 'undefined') {
          ${globalObject}['__remote_scope__'] = ${globalObject}['__remote_scope__'] || {_config: {}};
          // if(!__webpack_require__.S.default) {
          //   __webpack_require__.S = __webpack_require__.S || global.webpackShareScope
          //   }
         global.__remote_scope__[${JSON.stringify(
           container?.name
         )}]  = __webpack_require__(${JSON.stringify(container?.name)});
        } else {


        ${webpack.RuntimeGlobals.shareScopeMap}['default'] = ${
        webpack.RuntimeGlobals.shareScopeMap
      }['default'] || {};
}
        try {
        var containerAttachObject = typeof window !== 'undefined' ? window : ${globalObject}['__remote_scope__']


        console.log('containerAttachObject', containerAttachObject)

      } catch (e) {
        console.error('host runtime was unable to initialize its own remote', e);
      }`;
    });
    return Template.asString(containerEntry);
  }
}

export default InvertedContainerRuntimeModule;

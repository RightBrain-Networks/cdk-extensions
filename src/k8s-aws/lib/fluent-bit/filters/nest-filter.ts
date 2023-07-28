import { IConstruct } from 'constructs';
import { FluentBitFilterPluginBase, FluentBitFilterPluginCommonOptions } from './filter-plugin-base';
import { ResolvedFluentBitConfiguration } from '../resolved-fluent-bit-configuration';


export interface LiftOptions {
  /**
     * Lift records nested under the this key.
     */
  readonly nestedUnder: string;
}

export interface NestOptions {
  /**
     * Nest records matching `wildcard` under this key.
     */
  readonly nestUnder: string;

  /**
     * Nest records which field matches this wildcard,
     */
  readonly wildcards: string[];
}

/**
 * The modes that the Fluent Bit Nest filter plugin can work in.
 */
export enum NestFilterOperationType {
  /**
     * Lift data from a nested object.
     */
  LIFT = 'lift',

  /**
     * Nest data into a specified object.
     */
  NEST = 'nest',
}

/**
 * Represents an operation with excludive options that can be performed by the
 * Fluent Bit Nest filter plugin.
 */
export interface INestFilterOperation {
  readonly fields: {[key: string]: string[]};
  readonly operation: NestFilterOperationType;
}

/**
 * Operations with exclusive options that can be performed by the Fluent Bit
 * Nest filter plugin.
 */
export class NestFilterOperation implements INestFilterOperation {
  public static lift(options: LiftOptions): INestFilterOperation {
    return new NestFilterOperation(NestFilterOperationType.LIFT, {
      Nested_under: [
        options.nestedUnder,
      ],
    });
  }

  public static nest(options: NestOptions): INestFilterOperation {
    return new NestFilterOperation(NestFilterOperationType.NEST, {
      Nest_under: [
        options.nestUnder,
      ],
      Wildcard: options.wildcards,
    });
  }


  /**
     * The fields representing configuration options for the operation.
     */
  readonly fields: {[key: string]: string[]};

  /**
     * The type of operation to be performed.
     */
  readonly operation: NestFilterOperationType;

  /**
     * Creates a new instance of the NestFilterOperation class.
     *
     * @param operation The type of operation to be performed.
     * @param fields The fields representing configuration options for the
     * operation.
     */
  private constructor(operation: NestFilterOperationType, fields: {[key: string]: string[]}) {
    this.fields = fields;
    this.operation = operation;
  }
}


/**
 * Options for configuring the Nest Fluent Bit filter plugin.
 *
 * @see [Nest Plugin Documention](https://docs.fluentbit.io/manual/pipeline/filters/nest)
 */
export interface FluentBitNestFilterOptions extends FluentBitFilterPluginCommonOptions {
  /**
     * Prefix affected keys with this string.
     */
  readonly addPrefix?: string;

  /**
     * The operation the filter will perform.
     */
  readonly operation: NestFilterOperation;

  /**
     * Remove prefix from affected keys if it matches this string.
     */
  readonly removePrefix?: string;
}

/**
 * A Fluent Bit filter that allows operating on or with nested data.
 */
export class FluentBitNestFilter extends FluentBitFilterPluginBase {
  /**
     * Prefix affected keys with this string.
     */
  readonly addPrefix?: string;

  /**
     * Operation specific details for the plugin.
     */
  readonly operation: NestFilterOperation;

  /**
     * Remove prefix from affected keys if it matches this string.
     */
  readonly removePrefix?: string;


  /**
     * Creates a new instance of the FluentBitNestFilter class.
     *
     * @param options The configuration options for the plugin.
     */
  public constructor(options: FluentBitNestFilterOptions) {
    super('nest', options);

    this.addPrefix = options.addPrefix;
    this.operation = options.operation;
    this.removePrefix = options.removePrefix;
  }

  /**
     * Builds a configuration for this plugin and returns the details for
     * consumtion by a resource that is configuring logging.
     *
     * @param _scope The construct configuring logging using Fluent Bit.
     * @returns A configuration for the plugin that con be used by the resource
     * configuring logging.
     */
  public bind(_scope: IConstruct): ResolvedFluentBitConfiguration {
    return {
      configFile: this.renderConfigFile({
        Add_prefix: this.addPrefix,
        Operation: this.operation.operation,
        Remove_prefix: this.removePrefix,
        ...this.operation.fields,
      }),
    };
  }
}
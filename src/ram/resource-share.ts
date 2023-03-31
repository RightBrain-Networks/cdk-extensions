import { ArnFormat, Aspects, IResource, Lazy, Names, Resource, ResourceProps, Stack, Stage, Token } from 'aws-cdk-lib';
import { CfnResourceShare } from 'aws-cdk-lib/aws-ram';
import { Construct, IConstruct } from 'constructs';
import { ISharedPrincipal, SharedPrincipal } from './lib/shared-principal';


/**
 * Represents an AWS resource that can be shared via AWS Resource Access
 * Manager (RAM).
 */
export interface ISharable {
  /**
   * Configures resource sharing for the associated resource.
   *
   * @param scope The construct implementing the resource share that will be
   * used to expose the associated resource to external principals.
   */
  share(scope: IConstruct): string;
}

/**
 * Represents an AWS Resource Access Manager (RAM) resource share in AWS.
 */
export interface IResourceShare extends IResource {
  /**
   * The Amazon Resource Name (ARN) of the RAM resource share.
   */
  readonly resourceShareArn: string;

  /**
   * The ID of the RAM resource share.
   */
  readonly resourceShareId: string;

  /**
   * Adds a new principal to the resource share.
   *
   * The principal will have access to all the resources associated with the
   * resource share.
   *
   * @param principal The principal to with resources belonging to the resource
   * share will be shared.
   */
  addPrincipal(principal: ISharedPrincipal): void;

  /**
   * Adds a new resource to the resource share.
   *
   * The resource will be accessible to all pricipals associated with the
   * resource share.
   *
   * @param resource The resource to make accessible to the pricipals
   * associated with the resource share.
   */
  addResource(resource: ISharable): void;
}

/**
 * Base class that provides common functionality for both managed and imported
 * resource shares.
 */
abstract class ResourceShareBase extends Resource implements IResourceShare {
  /**
   * {@inheritdoc IResourceShare.resourceShareArn}
   */
  public abstract readonly resourceShareArn: string;

  /**
   * {@inheritdoc IResourceShare.resourceShareId}
   */
  public abstract readonly resourceShareId: string;

  /**
   * {@inheritdoc IResourceShare.addPrincipal}
   *
   * @param _principal The principal to with resources belonging to the
   * resource share will be shared.
   */
  public addPrincipal(_principal: ISharedPrincipal): void {
    throw new Error([
      'Adding new principals is not supported for imported resource shares.',
    ].join(' '));
  }

  /**
   * {@inheritdoc IResourceShare.addResource}
   *
   * @param _resource The resource to make accessible to the pricipals
   * associated with the resource share.
   */
  public addResource(_resource: ISharable): void {
    throw new Error([
      'Adding new resources is not supported for imported resource shares.',
    ].join(' '));
  }
}

/**
 * Configuration for importing an existing RAM resource share.
 */
export interface ResourceShareAttributes {
  /**
   * The Amazon Resource Name (ARN) of the RAM resource share.
   */
  readonly resourceShareArn?: string;

  /**
   * The ID generated by AWS for the RAM resource share.
   */
  readonly resourceShareId?: string;
}

/**
 * Configuration for ResourceShare resource.
 */
export interface ResourceShareProps extends ResourceProps {
  /**
   * Specifies whether principals outside your organization in AWS
   * Organizations can be associated with a resource share. A value of `true`
   * lets you share with individual AWS accounts that are not in your
   * organization. A value of `false` only has meaning if your account is a
   * member of an AWS Organization.
   *
   * @default true
   *
   * @see [ResourceShare.AllowExternalPrinicpals](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ram-resourceshare.html#cfn-ram-resourceshare-allowexternalprincipals)
   */
  readonly allowExternalPrincipals?: boolean;

  /**
   * Controls whether the resource share should attempt to search for AWS
   * accounts that are part of the same CDK application. Any accounts is finds
   * will be added to the resource automatically and will be able to use the
   * shared resources.
   */
  readonly autoDiscoverAccounts?: boolean;

  /**
   * Specifies the name of the resource share.
   *
   * @see [ResourceShare.Name](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ram-resourceshare.html#cfn-ram-resourceshare-name)
   */
  readonly name?: string;

  /**
   * Specifies a list of one or more principals to associate with the resource share.
   *
   * @see [ResourceShare.Prinicipals](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ram-resourceshare.html#cfn-ram-resourceshare-principals)
   */
  readonly principals?: ISharedPrincipal[];

  /**
   * Specifies a list of AWS resources to share with the configured principal
   * accounts and organizations.
   *
   * @see [ResourceShare.ResourceArns](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ram-resourceshare.html#cfn-ram-resourceshare-resourcearns)
   */
  readonly resources?: ISharable[];
}

/**
 * Creates a resource share that can used to share AWS resources with other AWS
 * accounts, organizations, or organizational units (OU's).
 *
 * @see [AWS::RAM::ResourceShare](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ram-resourceshare.html)
 */
export class ResourceShare extends ResourceShareBase {
  public static readonly ARN_FORMAT: ArnFormat = ArnFormat.SLASH_RESOURCE_NAME;

  /**
   * Imports an existing RAM resource share by specifying its Amazon Resource
   * Name (ARN).
   *
   * @param scope A CDK Construct that will serve as this resources's parent in
   * the construct tree.
   * @param id A name to be associated with the stack and used in resource
   * naming. Must be unique within the context of 'scope'.
   * @param resourceShareArn The ARN of the existing RAM resource share to be
   * imported.
   * @returns An object representing the imported RAM resource share.
   */
  public static fromResourceShareArn(scope: IConstruct, id: string, resourceShareArn: string): IResourceShare {
    return ResourceShare.fromResourceShareAttributes(scope, id, {
      resourceShareArn: resourceShareArn,
    });
  }

  /**
   * Imports an existing RAM resource share by explicitly specifying its
   * attributes.
   *
   * @param scope A CDK Construct that will serve as this resources's parent in
   * the construct tree.
   * @param id A name to be associated with the stack and used in resource
   * naming. Must be unique within the context of 'scope'.
   * @param attrs The attributes of the existing RAM resource share to be
   * imported.
   * @returns An object representing the imported RAM resource share.
   */
  public static fromResourceShareAttributes(scope: IConstruct, id: string, attrs: ResourceShareAttributes): IResourceShare {
    const stack = Stack.of(scope);
    let buildId = attrs.resourceShareId;
    let buildArn = attrs.resourceShareArn;

    if (buildId === undefined && buildArn) {
      buildId = stack.splitArn(buildArn, ResourceShare.ARN_FORMAT).resourceName!;
    }

    if (buildId === undefined) {
      throw new Error([
        "At least one of 'resourceShareId' or 'resourceShareArn' must be",
        'specified when importing a RAM resource share.',
      ].join(' '));
    }

    const resourceShareId = buildId;
    const resourceShareArn = buildArn ?? stack.formatArn({
      arnFormat: ResourceShare.ARN_FORMAT,
      resource: 'resource-share',
      resourceName: buildId,
      service: 'ram',
    });

    class Import extends ResourceShareBase {
      public readonly resourceShareArn: string = resourceShareArn;
      public readonly resourceShareId: string = resourceShareId;
    }

    return new Import(scope, id);
  }

  /**
   * Imports an existing RAM resource share by specifying its AWS generated ID.
   *
   * @param scope A CDK Construct that will serve as this resources's parent in
   * the construct tree.
   * @param id A name to be associated with the stack and used in resource
   * naming. Must be unique within the context of 'scope'.
   * @param resourceShareId The AWS generated ID of the existing APS workspace
   * to be imported.
   * @returns An object representing the imported RAM resource share.
   */
  public static fromResourceShareId(scope: IConstruct, id: string, resourceShareId: string): IResourceShare {
    return ResourceShare.fromResourceShareAttributes(scope, id, {
      resourceShareId: resourceShareId,
    });
  }


  // Internal properties
  private _autoDiscovery: boolean = false;
  private readonly _principals: ISharedPrincipal[] = [];
  private readonly _resources: ISharable[] = [];

  /**
   * Specifies whether principals outside your organization in AWS
   * Organizations can be associated with a resource share. A value of `true`
   * lets you share with individual AWS accounts that are not in your
   * organization. A value of `false` only has meaning if your account is a
   * member of an AWS Organization.
   *
   * In order for an account to be auto discovered it must be part of the same
   * CDK application. It must also be an explicitly defined environment and not
   * environment agnostic.
   *
   * @group Inputs
   *
   * @see [ResourceShare.AllowExternalPrinicpals](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ram-resourceshare.html#cfn-ram-resourceshare-allowexternalprincipals)
   * @see [CDK Environments](https://docs.aws.amazon.com/cdk/v2/guide/environments.html)
   */
  public readonly allowExternalPrincipals?: boolean;

  /**
   * Specifies the name of the resource share.
   *
   * @group Inputs
   *
   * @see [ResourceShare.Name](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ram-resourceshare.html#cfn-ram-resourceshare-name)
   */
  public readonly name: string;

  /**
   * The underlying ResourceShare CloudFormation resource.
   *
   * @see [AWS::RAM::ResourceShare](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ram-resourceshare.html)
   *
   * @group Resources
   */
  public readonly resource: CfnResourceShare;

  /**
   * {@inheritdoc IResourceShare.resourceShareArn}
   */
  public readonly resourceShareArn: string;

  /**
   * {@inheritdoc IResourceShare.resourceShareId}
   */
  public readonly resourceShareId: string;

  /**
   *
   */
  public get autoDiscovery(): boolean {
    return this._autoDiscovery;
  }


  /**
   * Creates a new instance of the ResourceShare class.
   *
   * @param scope A CDK Construct that will serve as this stack's parent in the construct tree.
   * @param id A name to be associated with the stack and used in resource naming. Must be unique
   * within the context of 'scope'.
   * @param props Arguments related to the configuration of the resource.
   */
  public constructor(scope: Construct, id: string, props: ResourceShareProps = {}) {
    super(scope, id, props);

    this.allowExternalPrincipals = props.allowExternalPrincipals;
    this.name = props.name ?? Names.uniqueId(this);

    this.resource = new CfnResourceShare(this, 'Resource', {
      allowExternalPrincipals: this.allowExternalPrincipals,
      name: this.name,
      principals: Lazy.uncachedList({
        produce: () => {
          return this._principals.map((x) => {
            return x.bind(this);
          });
        },
      }),
      resourceArns: Lazy.uncachedList({
        produce: () => {
          return this._resources.map((x) => {
            return x.share(this);
          });
        },
      }),
    });

    this.resourceShareArn = this.resource.attrArn;
    this.resourceShareId = this.resource.ref;

    props.principals?.forEach((x) => {
      this.addPrincipal(x);
    });

    props.resources?.forEach((x) => {
      this.addResource(x);
    });
  }

  public addPrincipal(principal: ISharedPrincipal): void {
    this._principals.push(principal);
  }

  public addResource(resource: ISharable): void {
    this._resources.push(resource);
  }

  private autoDiscover(): void {
    const accounts = new Set(this.node.root.node.findAll().reduce((prev, cur) => {
      if (cur instanceof Stage && cur.account && !Token.isUnresolved(cur.account)) {
        prev.push(cur.account);
      } else if (cur instanceof Stack && !Token.isUnresolved(cur.account)) {
        prev.push(cur.account);
      }

      return prev;
    }, [] as string[]).filter((x) => {
      return x !== this.stack.account;
    }));

    accounts.forEach((x) => {
      this.addPrincipal(SharedPrincipal.fromAccountId(x));
    });
  }

  public enableAutoDiscovery(): void {
    if (!this.autoDiscovery) {
      Aspects.of(this).add({
        visit: (node: IConstruct) => {
          if (node === this) {
            this.autoDiscover();
          }
        },
      });
      this._autoDiscovery = true;
    }
  }
}
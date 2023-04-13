import { ArnFormat, Lazy, Resource, ResourceProps, Token } from 'aws-cdk-lib';
import { CfnIPAM } from 'aws-cdk-lib/aws-ec2';
import { IConstruct } from 'constructs';
import { IIpamResourceDiscovery } from './ipam-resource-discovery';
import { IIpamResourceDiscoveryAssociation, IpamResourceDiscoveryAssociation } from './ipam-resource-discovery-association';
import { IPrivateIpamScope, PrivateIpamScope, PrivateIpamScopeOptions } from './private-ipam-scope';
import { IPublicIpamScope, PublicIpamScope } from './public-ipam-scope';
import { DynamicReference } from '../core/dynamic-reference';
import { ResourceImporter } from '../utils/importer';


/**
 * Represents an IPAM in AWS.
 */
export interface IIpam {
  /**
   * The ARN of the IPAM.
   */
  readonly ipamArn: string;

  /**
   * The ID of the IPAM.
   */
  readonly ipamId: string;

  /**
   * The ID of the IPAM's default private scope.
   */
  readonly ipamPrivateDefaultScopeId: string;

  /**
   * The ID of the IPAM's default public scope.
   */
  readonly ipamPublicDefaultScopeId: string;

  /**
   * The number of scopes in the IPAM. The scope quota is 5.
   */
  readonly ipamScopeCount: number;

  /**
   * Adds an IPAM scope to the IPAM.
   *
   * In IPAM, a scope is the highest-level container within IPAM. Scopes enable
   * you to reuse IP addresses across multiple unconnected networks without
   * causing IP address overlap or conflict.
   *
   * @see [How IPAM works](https://docs.aws.amazon.com/vpc/latest/ipam/how-it-works-ipam.html)
   *
   * @param id A name to be associated to the scope being added. A unique id
   * must be used each time this method is invoked.
   * @param options Arguments specifying the details of the scope being added.
   * @returns The scope that was added to the IPAM.
   */
  addScope(id: string, options: PrivateIpamScopeOptions): IPrivateIpamScope;

  /**
   * Associates an existing IPAM resource discovery with the IPAM.
   *
   * IPAM aggregates the resource CIDRs discovered by the associated resource
   * discovery.
   *
   * @param resourceDiscovery The IPAM resource discovery to associate with the
   * IPAM.
   * @returns The association resource that handles the association between the
   * IPAM and the resource discovery.
   */
  associateResourceDiscovery(resourceDiscovery: IIpamResourceDiscovery): IIpamResourceDiscoveryAssociation;
}

/**
 * A base class providing common functionality between created and imported
 * IPAM's.
 */
abstract class IpamBase extends Resource implements IIpam {
  /**
   * The ARN of the IPAM.
   */
  public abstract readonly ipamArn: string;

  /**
   * The ID of the IPAM.
   */
  public abstract readonly ipamId: string;

  /**
   * The ID of the IPAM's default private scope.
   */
  public abstract readonly ipamPrivateDefaultScopeId: string;

  /**
   * The ID of the IPAM's default public scope.
   */
  public abstract readonly ipamPublicDefaultScopeId: string;

  /**
   * The number of scopes in the IPAM. The scope quota is 5.
   */
  public abstract readonly ipamScopeCount: number;


  /**
   * Adds an IPAM scope to the IPAM.
   *
   * In IPAM, a scope is the highest-level container within IPAM. Scopes enable
   * you to reuse IP addresses across multiple unconnected networks without
   * causing IP address overlap or conflict.
   *
   * @see [How IPAM works](https://docs.aws.amazon.com/vpc/latest/ipam/how-it-works-ipam.html)
   *
   * @param id A name to be associated to the scope being added. A unique id
   * must be used each time this method is invoked.
   * @param options Arguments specifying the details of the scope being added.
   * @returns The scope that was added to the IPAM.
   */
  public addScope(id: string, options: PrivateIpamScopeOptions): PrivateIpamScope {
    return new PrivateIpamScope(this, `scope-${id}`, {
      ...options,
      ipam: this,
    });
  }

  /**
   * Associates an existing IPAM resource discovery with the IPAM.
   *
   * IPAM aggregates the resource CIDRs discovered by the associated resource
   * discovery.
   *
   * @param resourceDiscovery The IPAM resource discovery to associate with the
   * IPAM.
   * @returns The association resource that handles the association between the
   * IPAM and the resource discovery.
   */
  public associateResourceDiscovery(resourceDiscovery: IIpamResourceDiscovery): IIpamResourceDiscoveryAssociation {
    return new IpamResourceDiscoveryAssociation(this, `resource-discovery-${resourceDiscovery.node.addr}`, {
      ipam: this,
      ipamResourceDiscovery: resourceDiscovery,
    });
  }
}

/**
 * Configuration for importing an existing IPAM.
 */
export interface IpamAttributes {
  /**
   * The Amazon Resource Name (ARN) of the IPAM.
   */
  readonly ipamArn?: string;

  /**
   * The ID generated by AWS for the IPAM.
   */
  readonly ipamId?: string;

  /**
   * The IPAM's default private scope.
   */
  readonly privateDefaultScope?: IPrivateIpamScope;

  /**
   * The IPAM's default public scope.
   */
  readonly publicDefaultScope?: IPublicIpamScope;

  /**
   * The number of scopes in the IPAM.
   */
  readonly scopeCount?: number;
}

/**
 * Configuration for the IPAM resource.
 */
export interface IpamProps extends ResourceProps {
  /**
   * The description for the IPAM.
   *
   * @see [IPAM Description](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-ipam.html#cfn-ec2-ipam-description)
   */
  readonly description?: string;

  /**
   * The operating Regions for an IPAM. Operating Regions are AWS Regions where
   * the IPAM is allowed to manage IP address CIDRs. IPAM only discovers and
   * monitors resources in the AWS Regions you select as operating Regions.
   *
   * @see [IPAM OperatingRegions](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-ipam.html#cfn-ec2-ipam-operatingregions)
   * @see [Create an IPAM](https://docs.aws.amazon.com/vpc/latest/ipam/create-ipam.html)
   */
  readonly regions?: string[];
}

/**
 * Represents an AWS IP Address Manager.
 *
 * IPAM is a VPC feature that you can use to automate your IP address
 * management workflows including assigning, tracking, troubleshooting, and
 * auditing IP addresses across AWS Regions and accounts throughout your AWS
 * Organization.
 *
 * @see [AWS::EC2::IPAM](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-ipam.html)
 */
export class Ipam extends IpamBase {
  /**
   * The format for Amazon Resource Names (ARN's) for IPAM resources.
   */
  public static readonly ARN_FORMAT: ArnFormat = ArnFormat.SLASH_RESOURCE_NAME;

  /**
   * Imports an existing IPAM by specifying its Amazon Resource Name (ARN).
   *
   * @param scope A CDK Construct that will serve as this resources's parent in
   * the construct tree.
   * @param id A name to be associated with the stack and used in resource
   * naming. Must be unique within the context of 'scope'.
   * @param ipamArn The ARN of the existing IPAM to be imported.
   * @returns An object representing the imported IPAM.
   */
  public static fromIpamArn(scope: IConstruct, id: string, ipamArn: string): IIpam {
    return Ipam.fromIpamAttributes(scope, id, {
      ipamArn: ipamArn,
    });
  }

  /**
   * Imports an existing IAPM by explicitly specifying its attributes.
   *
   * @param scope A CDK Construct that will serve as this resources's parent in
   * the construct tree.
   * @param id A name to be associated with the stack and used in resource
   * naming. Must be unique within the context of 'scope'.
   * @param attrs The attributes of the existing IPAM to be imported.
   * @returns An object representing the imported IPAM.
   */
  public static fromIpamAttributes(scope: IConstruct, id: string, attrs: IpamAttributes): IIpam {
    const importer = new ResourceImporter(scope, id, {
      arnFormat: Ipam.ARN_FORMAT,
      service: 'ec2',
      resource: 'ipam',
    });

    const identities = importer.resolveIdentities(attrs.ipamArn, attrs.ipamId);
    const props = importer.resolveProperties({
      ipamPrivateDefaultScopeId: attrs.privateDefaultScope?.ipamScopeId,
      ipamPublicDefaultScopeId: attrs.publicDefaultScope?.ipamScopeId,
      ipamScopeCount: attrs.scopeCount,
    });

    class Import extends IpamBase {
      public readonly ipamArn: string = identities.arn;
      public readonly ipamId: string = identities.id;
      public readonly ipamPrivateDefaultScopeId: string = Token.asString(props.ipamPrivateDefaultScopeId);
      public readonly ipamPublicDefaultScopeId: string = Token.asString(props.ipamPublicDefaultScopeId);
      public readonly ipamScopeCount: number = Token.asNumber(props.ipamScopeCount);
    }

    return new Import(scope, id);
  }

  /**
   * Imports an existing IPAM by explicitly specifying its AWS generated ID.
   *
   * @param scope A CDK Construct that will serve as this resources's parent in
   * the construct tree.
   * @param id A name to be associated with the stack and used in resource
   * naming. Must be unique within the context of 'scope'.
   * @param ipamId The AWS generated ID of the existing IPAM to be imported.
   * @returns An object representing the imported IPAM.
   */
  public static fromIpamId(scope: IConstruct, id: string, ipamId: string): IIpam {
    return Ipam.fromIpamAttributes(scope, id, {
      ipamId: ipamId,
    });
  }

  /**
   * Internal collection of operating Regions for an IPAM.
   *
   * Operating Regions are AWS Regions where the IPAM is allowed to manage IP
   * address CIDRs. IPAM only discovers and monitors resources in the AWS
   * Regions you select as operating Regions.
   *
   * @group Internal
   */
  private readonly _regions: string[];

  /**
   * The description for the IPAM.
   *
   * @see [IPAM Description](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-ipam.html#cfn-ec2-ipam-description)
   *
   * @group Inputs
   */
  public readonly description?: string;

  /**
   * An immutable collection of operating Regions for an IPAM.
   *
   * Operating Regions are AWS Regions where the IPAM is allowed to manage IP
   * address CIDRs. IPAM only discovers and monitors resources in the AWS
   * Regions you select as operating Regions.
   *
   * @see [IPAM OperatingRegions](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-ipam.html#cfn-ec2-ipam-operatingregions)
   * @see [Create an IPAM](https://docs.aws.amazon.com/vpc/latest/ipam/create-ipam.html)
   *
   * @group Inputs
   */
  public get regions(): string[] {
    return [...this._regions];
  }

  /**
   * The underlying IPAM CloudFormation resource.
   *
   * @see [AWS::EC2::IPAM](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-ipam.html)
   *
   * @group Resources
   */
  public readonly resource: CfnIPAM;

  /**
   * The IPAM's default private scope.
   */
  public readonly defaultPrivateScope: IPrivateIpamScope;

  /**
   * The IPAM's default public scope.
   */
  public readonly defaultPublicScope: IPublicIpamScope;

  /**
   * The ARN of the IPAM.
   */
  public readonly ipamArn: string;

  /**
   * The ID of the IPAM.
   */
  public readonly ipamId: string;

  /**
   * The ID of the IPAM's default private scope.
   */
  public readonly ipamPrivateDefaultScopeId: string;

  /**
   * The ID of the IPAM's default public scope.
   */
  public readonly ipamPublicDefaultScopeId: string;

  /**
   * The number of scopes in the IPAM. The scope quota is 5.
   */
  public readonly ipamScopeCount: number;


  /**
   * Creates a new instance of the Ipam class.
   *
   * @param scope A CDK Construct that will serve as this resource's parent in
   * the construct tree.
   * @param id A name to be associated with the stack and used in resource
   * naming. Must be unique within the context of 'scope'.
   * @param props Arguments related to the configuration of the resource.
   */
  public constructor(scope: IConstruct, id: string, props: IpamProps = {}) {
    super(scope, id, props);

    this._regions = [];

    this.description = props.description;

    this.resource = new CfnIPAM(this, 'Resource', {
      //defaultResourceDiscoveryAssociationId: ,
      //defaultResourceDiscoveryId: ,
      description: this.description,
      operatingRegions: Lazy.uncachedAny(
        {
          produce: () => {
            return this._regions.map((x): CfnIPAM.IpamOperatingRegionProperty => {
              return {
                regionName: x,
              };
            });
          },
        },
        {
          omitEmptyArray: true,
        },
      ),
      //resourceDiscoveryAssociationCount:
    });

    this.ipamArn = DynamicReference.string(this, this.resource.attrArn);
    this.ipamId = DynamicReference.string(this, this.resource.ref);
    this.ipamPrivateDefaultScopeId = DynamicReference.string(this, this.resource.attrPrivateDefaultScopeId);
    this.ipamPublicDefaultScopeId = DynamicReference.string(this, this.resource.attrPublicDefaultScopeId);
    this.ipamScopeCount = DynamicReference.number(this, this.resource.attrScopeCount);

    this.defaultPrivateScope = PrivateIpamScope.fromIpamScopeAttributes(this, 'default-private-scope', {
      ipam: this,
      ipamScopeId: this.ipamPrivateDefaultScopeId,
      isDefault: true,
      scopeType: 'private',
    });

    this.defaultPublicScope = PublicIpamScope.fromIpamScopeAttributes(this, 'default-public-scope', {
      ipam: this,
      ipamScopeId: this.ipamPublicDefaultScopeId,
      isDefault: true,
      scopeType: 'public',
    });

    props.regions?.forEach((x) => {
      this.addRegion(x);
    });
  }

  /**
   * Adds an operating region to the IPAM.
   *
   * The operating Regions for an IPAM. Operating Regions are AWS Regions where
   * the IPAM is allowed to manage IP address CIDRs. IPAM only discovers and
   * monitors resources in the AWS Regions you select as operating Regions.
   *
   * @param region The region to add to the IPAM.
   */
  public addRegion(region: string): void {
    if (this._regions.includes(region)) {
      throw new Error([
        `Region '${region}' is already registered with IPAM`,
        `${this.node.path}.`,
      ].join(' '));
    }

    this._regions.push(region);
  }
}
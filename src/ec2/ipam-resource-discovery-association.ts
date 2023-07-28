import { IResolvable, Resource, ResourceProps } from 'aws-cdk-lib';
import { CfnIPAMResourceDiscoveryAssociation } from 'aws-cdk-lib/aws-ec2';
import { IConstruct } from 'constructs';
import { IIpam } from './ipam';
import { IIpamResourceDiscovery } from './ipam-resource-discovery';
import { DynamicReference } from '../core/dynamic-reference';


export interface IIpamResourceDiscoveryAssociation {
  readonly ipamResourceDiscoveryAssociationArn: string;
  readonly ipamResourceDiscoveryAssociationId: string;
  readonly ipamResourceDiscoveryAssociationIpamArn: string;
  readonly ipamResourceDiscoveryAssociationIpamRegion: string;
  readonly ipamResourceDiscoveryAssociationIsDefault: IResolvable;
  readonly ipamResourceDiscoveryAssociationOwnerId: string;
  readonly ipamResourceDiscoveryAssociationResourceDiscoveryId: string;
  readonly ipamResourceDiscoveryAssociationResourceDiscoveryStatus: string;
  readonly ipamResourceDiscoveryAssociationState: string;
}

abstract class IpamResourceDiscoveryAssociationBase extends Resource implements IIpamResourceDiscoveryAssociation {
  public abstract readonly ipamResourceDiscoveryAssociationArn: string;
  public abstract readonly ipamResourceDiscoveryAssociationId: string;
  public abstract readonly ipamResourceDiscoveryAssociationIpamArn: string;
  public abstract readonly ipamResourceDiscoveryAssociationIpamRegion: string;
  public abstract readonly ipamResourceDiscoveryAssociationIsDefault: IResolvable;
  public abstract readonly ipamResourceDiscoveryAssociationOwnerId: string;
  public abstract readonly ipamResourceDiscoveryAssociationResourceDiscoveryId: string;
  public abstract readonly ipamResourceDiscoveryAssociationResourceDiscoveryStatus: string;
  public abstract readonly ipamResourceDiscoveryAssociationState: string;
}

export interface IpamResourceDiscoveryAssociationProps extends ResourceProps {
  readonly ipam: IIpam;
  readonly ipamResourceDiscovery: IIpamResourceDiscovery;
}

export class IpamResourceDiscoveryAssociation extends IpamResourceDiscoveryAssociationBase {
  // Input properties
  public readonly ipam: IIpam;
  public readonly ipamResourceDiscovery: IIpamResourceDiscovery;

  // Resource properties
  public readonly resource: CfnIPAMResourceDiscoveryAssociation;

  public readonly ipamResourceDiscoveryAssociationArn: string;
  public readonly ipamResourceDiscoveryAssociationId: string;
  public readonly ipamResourceDiscoveryAssociationIpamArn: string;
  public readonly ipamResourceDiscoveryAssociationIpamRegion: string;
  public readonly ipamResourceDiscoveryAssociationIsDefault: IResolvable;
  public readonly ipamResourceDiscoveryAssociationOwnerId: string;
  public readonly ipamResourceDiscoveryAssociationResourceDiscoveryId: string;
  public readonly ipamResourceDiscoveryAssociationResourceDiscoveryStatus: string;
  public readonly ipamResourceDiscoveryAssociationState: string;


  public constructor(scope: IConstruct, id: string, props: IpamResourceDiscoveryAssociationProps) {
    super(scope, id, props);

    this.ipam = props.ipam;
    this.ipamResourceDiscovery = props.ipamResourceDiscovery;

    this.resource = new CfnIPAMResourceDiscoveryAssociation(this, 'Resource', {
      ipamId: this.ipam.ipamId,
      ipamResourceDiscoveryId: this.ipamResourceDiscovery.ipamResourceDiscoveryId,
    });

    this.ipamResourceDiscoveryAssociationArn = DynamicReference.string(this, this.resource.attrIpamResourceDiscoveryAssociationArn);
    this.ipamResourceDiscoveryAssociationId = DynamicReference.string(this, this.resource.attrIpamResourceDiscoveryAssociationId);
    this.ipamResourceDiscoveryAssociationIpamArn = DynamicReference.string(this, this.resource.attrIpamArn);
    this.ipamResourceDiscoveryAssociationIpamRegion = DynamicReference.string(this, this.resource.attrIpamRegion);
    this.ipamResourceDiscoveryAssociationIsDefault = DynamicReference.any(this, this.resource.attrIsDefault);
    this.ipamResourceDiscoveryAssociationOwnerId = DynamicReference.string(this, this.resource.attrOwnerId);
    this.ipamResourceDiscoveryAssociationResourceDiscoveryId = DynamicReference.string(this, this.resource.ref);
    this.ipamResourceDiscoveryAssociationResourceDiscoveryStatus = DynamicReference.string(this, this.resource.attrResourceDiscoveryStatus);
    this.ipamResourceDiscoveryAssociationState = DynamicReference.string(this, this.resource.attrState);
  }
}
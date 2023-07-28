import { PhysicalName, ResourceProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RawBucket } from './private/raw-bucket';
import { IWorkGroup } from '../athena';
import { Database } from '../glue';
import { CloudfrontLogsTable } from '../glue-tables';


/**
 * Configuration for objects bucket
 */
export interface CloudfrontLogsBucketProps extends ResourceProps {
  readonly bucketName?: string;
  readonly createQueries?: boolean;
  readonly database?: Database;
  readonly friendlyQueryNames?: boolean;
  readonly tableName?: string;
  readonly workGroup?: IWorkGroup;
}

export class CloudfrontLogsBucket extends RawBucket {
  // Input properties
  public readonly createQueries?: boolean;
  public readonly friendlyQueryNames?: boolean;
  public readonly workGroup?: IWorkGroup;

  // Resource properties
  public readonly database: Database;
  public readonly table: CloudfrontLogsTable;


  /**
   * Creates a new instance of the ElbLogsBucket class.
   *
   * @param scope A CDK Construct that will serve as this stack's parent in the
   * construct tree.
   * @param id A name to be associated with the stack and used in resource
   * naming. Must be unique within the context of 'scope'.
   * @param props Arguments related to the configuration of the resource.
   */
  public constructor(scope: Construct, id: string, props: CloudfrontLogsBucketProps = {}) {
    super(scope, id, {
      ...props,
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          {
            serverSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      bucketName: props.bucketName ?? PhysicalName.GENERATE_IF_NEEDED,
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    this.createQueries = props.createQueries;
    this.friendlyQueryNames = props.friendlyQueryNames;
    this.workGroup = props.workGroup;

    this.database = props.database ?? new Database(this, 'database', {
      description: 'Database for storing ELB access logs',
    });

    this.table = new CloudfrontLogsTable(this, 'table', {
      bucket: this,
      createQueries: this.createQueries,
      database: this.database,
      friendlyQueryNames: this.friendlyQueryNames,
      name: props.tableName,
      workGroup: this.workGroup,
    });
  }
}

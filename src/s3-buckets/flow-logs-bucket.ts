import { PhysicalName, ResourceProps } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { RawBucket } from './private/raw-bucket';
import { IWorkGroup } from '../athena';
import { FlowLogFormat } from '../ec2';
import { ConfigurationVersion, Crawler, Database, PartitionUpdateBehavior, S3Target, UpdateBehavior } from '../glue';
import { FlowLogsTable } from '../glue-tables';


/**
 * Configuration for objects bucket
 */
export interface FlowLogsBucketProps extends ResourceProps {
  readonly bucketName?: string;
  readonly crawlerSchedule?: Schedule;
  readonly createQueries?: boolean;
  readonly database?: Database;
  readonly format?: FlowLogFormat;
  readonly friendlyQueryNames?: boolean;
  readonly tableName?: string;
  readonly workGroup?: IWorkGroup;
}

export class FlowLogsBucket extends RawBucket {
  // Input properties
  public readonly crawlerSchedule?: Schedule;
  public readonly createQueries?: boolean;
  public readonly format: FlowLogFormat;
  public readonly friendlyQueryNames?: boolean;
  public readonly workGroup?: IWorkGroup;

  // Resource properties
  public readonly crawler: Crawler;
  public readonly database: Database;
  public readonly table: FlowLogsTable;


  /**
   * Creates a new instance of the FlowLogsBucket class.
   *
   * @param scope A CDK Construct that will serve as this stack's parent in the
   * construct tree.
   * @param id A name to be associated with the stack and used in resource
   * naming. Must be unique within the context of 'scope'.
   * @param props Arguments related to the configuration of the resource.
   */
  public constructor(scope: Construct, id: string, props: FlowLogsBucketProps = {}) {
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

    this.crawlerSchedule = props.crawlerSchedule ?? Schedule.cron({
      hour: '0',
      minute: '5',
    });
    this.createQueries = props.createQueries;
    this.format = props.format ?? FlowLogFormat.V2;
    this.friendlyQueryNames = props.friendlyQueryNames;
    this.workGroup = props.workGroup;

    this.database = props.database ?? new Database(this, 'database', {
      description: 'Database for storing flow log information',
    });

    this.table = new FlowLogsTable(this, 'table', {
      bucket: this,
      createQueries: this.createQueries,
      database: this.database,
      format: this.format,
      friendlyQueryNames: this.friendlyQueryNames,
      name: props.tableName,
      workGroup: this.workGroup,
    });

    this.crawler = new Crawler(this, 'crawler', {
      configuration: {
        partitionUpdateBehavior: PartitionUpdateBehavior.INHERIT_FROM_TABLE,
        version: ConfigurationVersion.V1_0,
      },
      database: this.database,
      description: `Crawls the ${this.bucketName} bucket for Flow Logs.`,
      scheduleExpression: this.crawlerSchedule,
      targets: [
        new S3Target(this, {
          keyPrefix: 'AWSLogs/',
        }),
      ],
      updateBehavior: UpdateBehavior.LOG,
    });
  }
}

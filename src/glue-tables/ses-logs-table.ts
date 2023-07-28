import { ResourceProps } from 'aws-cdk-lib';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { IWorkGroup, NamedQuery } from '../athena';
import { ArrayColumn, BasicColumn, Database, InputFormat, OutputFormat, SerializationLibrary, StructColumn, Table, TableType } from '../glue';


/**
 * Configuration for SesLogsTable
 */
export interface SesLogsTableProps extends ResourceProps {
  /**
   * A bucket where logs will be stored
   *
   * @see [AWS S3 iBucket](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.IBucket.html)
   */
  readonly bucket: IBucket;

  /**
   * Boolean indicating whether to create default Athena queries for the Ses Logs
   *
   * @see [`CfnNamedQueries`](https://docs.aws.amazon.com/cdk/api/v1/python/aws_cdk.aws_athena/CfnNamedQuery.html)
   */
  readonly createQueries?: boolean;

  /**
   * A cdk-extensions/glue {@link aws-glue!Database } object that the table should be created in.
   *
   * @see [AWS::Glue::Database](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-database.html)
   */
  readonly database: Database;

  /**
   * Boolean for adding "friendly names" for the created Athena queries.
   */
  readonly friendlyQueryNames?: boolean;

  /**
   * Name for SES Logs Table
   */
  readonly name?: string;

  /**
   * Set a custom prefix for the S3 Bucket
   */
  readonly s3Prefix?: string;

  /**
   * The name of the workgroup where namedqueries should be created.
   *
   * @see [NamedQuery WorkGroup](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-workgroup)
   * @see [Setting up workgroups](https://docs.aws.amazon.com/athena/latest/ug/workgroups-procedure.html)
   */
  readonly workGroup?: IWorkGroup;
}

export class SesLogsTable extends Table {
  /**
   * Boolean indicating whether to create default Athena queries for the Ses Logs
   *
   * @see [`CfnNamedQueries`](https://docs.aws.amazon.com/cdk/api/v1/python/aws_cdk.aws_athena/CfnNamedQuery.html)
   */
  public readonly createQueries: boolean;

  /**
   * Boolean for adding "friendly names" for the created Athena queries.
   */
  public readonly friendlyQueryNames: boolean;

  /**
   * The name of the workgroup where namedqueries should be created.
   *
   * @see [NamedQuery WorkGroup](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-athena-namedquery.html#cfn-athena-namedquery-workgroup)
   * @see [Setting up workgroups](https://docs.aws.amazon.com/athena/latest/ug/workgroups-procedure.html)
   */
  public readonly workGroup?: IWorkGroup;

  // Resource properties
  public readonly bouncesQuery?: NamedQuery;
  public readonly complaintsQuery?: NamedQuery;


  /**
   * Creates a new instance of the SesLogsTable class.
   *
   * @param scope A CDK Construct that will serve as this stack's parent in the construct tree.
   * @param id A name to be associated with the stack and used in resource naming. Must be unique
   * within the context of 'scope'.
   * @param props Arguments related to the configuration of the resource.
   */
  public constructor(scope: Construct, id: string, props: SesLogsTableProps) {
    const projectionYear = new Date().getFullYear() - 1;

    super(scope, id, {
      columns: [
        new BasicColumn({
          name: 'eventType',
          type: 'string',
        }),
        new StructColumn({
          name: 'complaint',
          data: [
            new BasicColumn({
              name: 'arrivaldate',
              type: 'string',
            }),
            new ArrayColumn({
              name: 'complainedrecipients',
              data: new StructColumn({
                data: [
                  new BasicColumn({
                    name: 'emailaddress',
                    type: 'string',
                  }),
                ],
              }),
            }),
            new BasicColumn({
              name: 'complaintfeedbacktype',
              type: 'string',
            }),
            new BasicColumn({
              name: 'feedbackid',
              type: 'string',
            }),
            new BasicColumn({
              name: 'timestamp',
              type: 'string',
            }),
            new BasicColumn({
              name: 'useragent',
              type: 'string',
            }),
          ],
        }),
        new StructColumn({
          name: 'bounce',
          data: [
            new ArrayColumn({
              name: 'bouncedrecipients',
              data: new StructColumn({
                data: [
                  new BasicColumn({
                    name: 'action',
                    type: 'string',
                  }),
                  new BasicColumn({
                    name: 'diagnosticcode',
                    type: 'string',
                  }),
                  new BasicColumn({
                    name: 'emailaddress',
                    type: 'string',
                  }),
                  new BasicColumn({
                    name: 'status',
                    type: 'string',
                  }),
                ],
              }),
            }),
            new BasicColumn({
              name: 'bouncesubtype',
              type: 'string',
            }),
            new BasicColumn({
              name: 'bouncetype',
              type: 'string',
            }),
            new BasicColumn({
              name: 'feedbackid',
              type: 'string',
            }),
            new BasicColumn({
              name: 'reportingmta',
              type: 'string',
            }),
            new BasicColumn({
              name: 'timestamp',
              type: 'string',
            }),
          ],
        }),
        new StructColumn({
          name: 'mail',
          data: [
            new BasicColumn({
              name: 'timestamp',
              type: 'string',
            }),
            new BasicColumn({
              name: 'source',
              type: 'string',
            }),
            new BasicColumn({
              name: 'sourceArn',
              type: 'string',
            }),
            new BasicColumn({
              name: 'sendingAccountId',
              type: 'string',
            }),
            new BasicColumn({
              name: 'messageId',
              type: 'string',
            }),
            new BasicColumn({
              name: 'destination',
              type: 'string',
            }),
            new BasicColumn({
              name: 'headersTruncated',
              type: 'string',
            }),
            new ArrayColumn({
              name: 'headers',
              data: new StructColumn({
                data: [
                  new BasicColumn({
                    name: 'name',
                    type: 'string',
                  }),
                  new BasicColumn({
                    name: 'value',
                    type: 'string',
                  }),
                ],
              }),
            }),
            new StructColumn({
              name: 'commonHeaders',
              data: [
                new ArrayColumn({
                  name: 'from',
                  data: new BasicColumn({
                    type: 'string',
                  }),
                }),
                new ArrayColumn({
                  name: 'to',
                  data: new BasicColumn({
                    type: 'string',
                  }),
                }),
                new BasicColumn({
                  name: 'messageId',
                  type: 'string',
                }),
                new BasicColumn({
                  name: 'subject',
                  type: 'string',
                }),
              ],
            }),
            new StructColumn({
              name: 'tags',
              data: [
                new BasicColumn({
                  name: 'ses_configurationset',
                  type: 'string',
                }),
                new BasicColumn({
                  name: 'ses_source_ip',
                  type: 'string',
                }),
                new BasicColumn({
                  name: 'ses_outgoing_ip',
                  type: 'string',
                }),
                new BasicColumn({
                  name: 'ses_from_domain',
                  type: 'string',
                }),
                new BasicColumn({
                  name: 'ses_caller_identity',
                  type: 'string',
                }),
              ],
            }),
          ],
        }),
        new BasicColumn({
          name: 'send',
          type: 'string',
        }),
        new StructColumn({
          name: 'delivery',
          data: [
            new BasicColumn({
              name: 'processingtimemillis',
              type: 'int',
            }),
            new ArrayColumn({
              name: 'recipients',
              data: new BasicColumn({
                type: 'string',
              }),
            }),
            new BasicColumn({
              name: 'reportingmta',
              type: 'string',
            }),
            new BasicColumn({
              name: 'smtpresponse',
              type: 'string',
            }),
            new BasicColumn({
              name: 'timestamp',
              type: 'string',
            }),
          ],
        }),
        new StructColumn({
          name: 'open',
          data: [
            new BasicColumn({
              name: 'ipaddress',
              type: 'string',
            }),
            new BasicColumn({
              name: 'timestamp',
              type: 'string',
            }),
            new BasicColumn({
              name: 'userAgent',
              type: 'string',
            }),
          ],
        }),
        new StructColumn({
          name: 'reject',
          data: [
            new BasicColumn({
              name: 'reason',
              type: 'string',
            }),
          ],
        }),
        new StructColumn({
          name: 'click',
          data: [
            new BasicColumn({
              name: 'ipAddress',
              type: 'string',
            }),
            new BasicColumn({
              name: 'timestamp',
              type: 'string',
            }),
            new BasicColumn({
              name: 'userAgent',
              type: 'string',
            }),
            new BasicColumn({
              name: 'link',
              type: 'string',
            }),
          ],
        }),
      ],
      compressed: false,
      dataFormat: {
        inputFormat: InputFormat.TEXT,
        outputFormat: OutputFormat.HIVE_IGNORE_KEY_TEXT,
        serializationLibrary: SerializationLibrary.OPENX_JSON,
      },
      database: props.database,
      description: 'Table used for querying SES event logs.',
      location: `s3://${props.bucket.bucketName}/${props.s3Prefix ?? ''}`,
      name: props.name,
      owner: 'hadoop',
      parameters: {
        'EXTERNAL': 'TRUE',
        'projection.day.format': 'yyyy/MM/dd',
        'projection.day.interval': '1',
        'projection.day.range': `${projectionYear}/01/01,NOW`,
        'projection.day.type': 'date',
        'projection.day.interval.unit': 'DAYS',
        'projection.enabled': 'true',
        'storage.location.template': `s3://${props.bucket.bucketName}/${props.s3Prefix ?? ''}\${day}`,
      },
      partitionKeys: [
        new BasicColumn({
          name: 'day',
          type: 'string',
        }),
      ],
      serdeParameters: {
        'mapping.ses_configurationset': 'ses:configuration-set',
        'mapping.ses_source_ip': 'ses:source-ip',
        'mapping.ses_from_domain': 'ses:from-domain',
        'mapping.ses_caller_identity': 'ses:caller-identity',
        'mapping.ses_outgoing_ip': 'ses:outgoing-ip',
      },
      storedAsSubDirectories: false,
      tableType: TableType.EXTERNAL_TABLE,
    });

    this.createQueries = props.createQueries ?? true;
    this.friendlyQueryNames = props.friendlyQueryNames ?? false;
    this.workGroup = props.workGroup;

    if (this.createQueries) {
      this.bouncesQuery = new NamedQuery(this, 'bounces-query', {
        database: this.database,
        description: 'Gets the 100 most recent bounces from the last day.',
        name: this.friendlyQueryNames ? 'ses-bounces' : undefined,
        queryString: [
          "SELECT FROM_ISO8601_TIMESTAMP(bounce.timestamp) AT TIME ZONE 'UTC' AS time,",
          "    CONCAT(bounce.bouncetype, ' (', bounce.bouncesubtype, ')') AS type,",
          '    mail.commonheaders.subject AS subject,',
          '    failed.emailaddress AS failed,',
          '    failed.diagnosticcode AS reason,',
          '    ARRAY_JOIN(mail.commonheaders."from", \',\') AS sender,',
          '    ARRAY_JOIN(mail.commonheaders."to", \',\') AS recipient,',
          '    bounce.feedbackid AS id',
          `FROM ${this.tableName}`,
          'CROSS JOIN UNNEST(bounce.bouncedrecipients) AS t(failed)',
          "WHERE eventtype = 'Bounce'",
          "    AND day >= DATE_FORMAT(NOW() - PARSE_DURATION('1d'), '%Y/%m/%d')",
          'ORDER BY time DESC LIMIT 100;',
        ].join('\n'),
        workGroup: this.workGroup,
      });

      this.complaintsQuery = new NamedQuery(this, 'complaints-query', {
        database: this.database,
        description: 'Gets the 100 most recent complaints from the last day.',
        name: this.friendlyQueryNames ? 'ses-complaints' : undefined,
        queryString: [
          "SELECT FROM_ISO8601_TIMESTAMP(complaint.arrivaldate) AT TIME ZONE 'UTC' AS time,",
          '    complaint.complaintfeedbacktype AS type,',
          '    mail.commonheaders.subject AS subject,',
          '    reporters.emailaddress AS reporter,',
          '    ARRAY_JOIN(mail.commonheaders."from", \',\') AS sender,',
          '    ARRAY_JOIN(mail.commonheaders."to", \',\') AS recipient,',
          '    complaint.useragent,',
          '    complaint.feedbackid AS id',
          `FROM ${this.tableName}`,
          'CROSS JOIN UNNEST(complaint.complainedrecipients) AS t(reporters)',
          "WHERE eventtype = 'Complaint'",
          "    AND day >= DATE_FORMAT(NOW() - PARSE_DURATION('1d'), '%Y/%m/%d')",
          'ORDER BY time DESC LIMIT 100;',
        ].join('\n'),
        workGroup: this.workGroup,
      });
    }
  }
}

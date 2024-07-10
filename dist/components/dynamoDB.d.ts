import { DocumentClient } from 'aws-sdk/clients/dynamodb';
type IValueFilterExpression = {
    condition: ICondition;
    value: string | number;
};
type ICondition = '=' | '<' | '<=' | '>' | '>=' | 'begins_with' | 'contains';
type UpdateSubParams = {
    UpdateExpression: string;
    ExpressionAttributeValues: any;
    ExpressionAttributeNames: any;
};
declare const dynamodbQuery: (db: DocumentClient, params: DocumentClient.QueryInput) => Promise<DocumentClient.QueryOutput>;
declare const dynamodbScan: (db: DocumentClient, params: DocumentClient.ScanInput) => Promise<DocumentClient.ScanOutput>;
declare const dynamodbDelete: (db: DocumentClient, params: DocumentClient.DeleteItemInput) => Promise<DocumentClient.DeleteItemOutput>;
declare const dynamodbUpdate: (db: DocumentClient, params: DocumentClient.UpdateItemInput) => Promise<DocumentClient.UpdateItemOutput>;
declare const dynamodbPut: (db: DocumentClient, params: DocumentClient.PutItemInput) => Promise<DocumentClient.PutItemOutput>;
declare const dynamodbBatchGetItems: (db: DocumentClient, TableName: string, pkName: string | null, pkVal: any | null, skName: string, skValIDs: string[]) => Promise<DocumentClient.ItemList>;
declare const getSingleItem: <Type>(db: DocumentClient, TableName: string, IndexName: (string | null) | undefined, partitionKeyName: string, partitionKeyValue: string | number, sortKeyName?: string | null, sortKeyValue?: string | number | null) => Promise<Type>;
declare const getMultipleItems: (dynamoDb: DocumentClient, TableName: string, IndexName: (string | null) | undefined, nextToken: string, pageSize: number, partitionKeyName: string, partitionKeyValue: string | number, sortKeyName?: string | null, sortKeyValue?: string | number | null, sortKeyCondition?: ICondition | null, filterExpression?: Record<string, IValueFilterExpression> | null, scanIndexForward?: boolean | null) => Promise<{
    items: DocumentClient.ItemList;
    newNextToken: string;
}>;
declare const scanMultipleItems: (dynamoDb: DocumentClient, TableName: string, nextToken: string, pageSize: number, filterExpression?: Record<string, IValueFilterExpression> | null) => Promise<{
    items: DocumentClient.ItemList;
    newNextToken: string;
}>;
declare const queryUntilDone: (dynamoDb: DocumentClient, TableName: string, IndexName: (string | null) | undefined, partitionKeyName: string, partitionKeyValue: string | number, sortKeyName?: string | null, sortKeyValue?: string | number | null, sortKeyCondition?: ICondition | null, filterExpression?: Record<string, IValueFilterExpression> | null, scanIndexForward?: boolean | null) => Promise<DocumentClient.ItemList>;
declare const deleteSingleItem: (dynamoDb: DocumentClient, TableName: string, partitionKeyName: string, partitionKeyValue: string | number, sortKeyName?: string | null, sortKeyValue?: string | number | null) => Promise<DocumentClient.DeleteItemOutput>;
declare const transactWrite: (dynamoDb: DocumentClient, params: DocumentClient.TransactWriteItemsInput) => Promise<void>;
declare const dynamoDBUpdateFromAttributes: (input: any, ignoreKeyList?: string[]) => UpdateSubParams;
export { dynamodbQuery, dynamodbScan, dynamodbDelete, dynamodbUpdate, dynamodbPut, dynamodbBatchGetItems, getSingleItem, getMultipleItems, scanMultipleItems, queryUntilDone, deleteSingleItem, transactWrite, dynamoDBUpdateFromAttributes, };

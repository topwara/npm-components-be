// ================================================================
// ====================== DynamoDB Functions ======================
// ================================================================

// lib
import { encode, decode } from 'js-base64'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { PromiseResult } from 'aws-sdk/lib/request'
import { AWSError } from 'aws-sdk'

// =========================================================== Types

type IValueFilterExpression = { condition: ICondition; value: string | number }

type ICondition = '=' | '<' | '<=' | '>' | '>=' | 'begins_with' | 'contains'

type UpdateSubParams = { UpdateExpression: string; ExpressionAttributeValues: any; ExpressionAttributeNames: any }

// ================================================= Basic Functions

// Query
const dynamodbQuery = async (
  db: DocumentClient,
  params: DocumentClient.QueryInput,
): Promise<DocumentClient.QueryOutput> => {
  const results = await db.query(params).promise()
  return results
}

// Scan
const dynamodbScan = async (
  db: DocumentClient,
  params: DocumentClient.ScanInput,
): Promise<DocumentClient.ScanOutput> => {
  const results = await db.scan(params).promise()
  return results
}

// Delete
const dynamodbDelete = async (
  db: DocumentClient,
  params: DocumentClient.DeleteItemInput,
): Promise<DocumentClient.DeleteItemOutput> => {
  const results = await db.delete(params).promise()
  return results
}

// Update
const dynamodbUpdate = async (
  db: DocumentClient,
  params: DocumentClient.UpdateItemInput,
): Promise<DocumentClient.UpdateItemOutput> => {
  const results = await db.update(params).promise()
  return results
}

// Put
const dynamodbPut = async (
  db: DocumentClient,
  params: DocumentClient.PutItemInput,
): Promise<DocumentClient.PutItemOutput> => {
  const results = await db.put(params).promise()
  return results
}

// =========================================== Complicated Functions

// Batch Get
const dynamodbBatchGetItems = async (
  db: DocumentClient,
  TableName: string,
  pkName: string | null,
  pkVal: any | null,
  skName: string,
  skValIDs: string[],
) => {
  // Map & Format syntax for BatchGetItemInput - Keys  understand
  const keyID = skValIDs.map((_ele: string) => {
    if (pkName && pkVal) return { [pkName]: pkVal, [skName]: _ele }
    else return { [skName]: _ele }
  })

  // Batch Get Items with Key of Table, TagTable ~ PK:companyID & SK:tagID
  const params: DocumentClient.BatchGetItemInput = { RequestItems: { [TableName]: { Keys: keyID } } }

  // Response
  const batchGet = await db.batchGet(params).promise()
  const batchRes = batchGet.Responses as DocumentClient.BatchGetResponseMap
  const results = batchRes[TableName]

  // Return
  return results
}

// Get
const getSingleItem = async <Type>(
  db: DocumentClient,
  TableName: string,
  IndexName: string | null = null,
  partitionKeyName: string,
  partitionKeyValue: string | number,
  sortKeyName: string | null = null,
  sortKeyValue: string | number | null = null,
): Promise<Type> => {
  const KeyConditionExpression = `${partitionKeyName} = :${partitionKeyName}`
  const ExpressionAttributeValues = {
    [`:${partitionKeyName}`]: partitionKeyValue,
  }
  if (sortKeyName && sortKeyValue) {
    KeyConditionExpression + `AND ${sortKeyName} = :${sortKeyName}`
    ExpressionAttributeValues[`:${sortKeyName}`] = sortKeyValue
  }

  const params: DocumentClient.QueryInput = {
    TableName,
    KeyConditionExpression,
    ExpressionAttributeValues,
  }

  if (IndexName) params['IndexName'] = IndexName

  const get = (await dynamodbQuery(db, params)) as DocumentClient.AttributeMap
  const results = get.Items[0] as Type

  return results
}

// Get Multiple
const getMultipleItems = async (
  dynamoDb: DocumentClient,
  TableName: string,
  IndexName: string | null = null,
  nextToken: string,
  pageSize: number,
  partitionKeyName: string,
  partitionKeyValue: string | number,
  sortKeyName: string | null = null,
  sortKeyValue: string | number | null = null,
  sortKeyCondition: ICondition | null = null, // Case BETWEEN not Cover in this function
  filterExpression: Record<string, IValueFilterExpression> | null = null,
  scanIndexForward: boolean | null = true,
): Promise<{ items: DocumentClient.ItemList; newNextToken: string }> => {
  const dataList: DocumentClient.ItemList = []

  let ExclusiveStartKey = null
  if (nextToken) {
    ExclusiveStartKey = decode(nextToken)
    ExclusiveStartKey = JSON.parse(ExclusiveStartKey)
  }

  const params = {
    TableName,
    Limit: pageSize,
    KeyConditionExpression: `#${partitionKeyName} = :${partitionKeyName}`,
    ExpressionAttributeNames: {
      [`#${partitionKeyName}`]: `${partitionKeyName}`,
    },
    ExpressionAttributeValues: {
      [`:${partitionKeyName}`]: partitionKeyValue,
    },
    ExclusiveStartKey: ExclusiveStartKey,
  } as DocumentClient.QueryInput & {
    ExpressionAttributeNames: Record<string, string>
    ExpressionAttributeValues: Record<string, string>
  }

  if (IndexName) params['IndexName'] = IndexName
  if (scanIndexForward) params['ScanIndexForward'] = scanIndexForward

  if (sortKeyValue) {
    if (sortKeyCondition === 'begins_with' || sortKeyCondition === 'contains') {
      params.KeyConditionExpression = `#${partitionKeyName} = :${partitionKeyName} AND ${sortKeyCondition}(#${sortKeyName}, :${sortKeyName})`
    } else {
      params.KeyConditionExpression = `#${partitionKeyName} = :${partitionKeyName} AND #${sortKeyName} ${sortKeyCondition} :${sortKeyName}`
    }
    params.ExpressionAttributeNames[`#${sortKeyName}`] = `${sortKeyName}`
    params.ExpressionAttributeValues[`:${sortKeyName}`] = sortKeyValue
  }

  let i = 0
  let tempFilterExpression: string | any
  if (typeof filterExpression === 'object') {
    for (const key in filterExpression) {
      const filterKey = key
      const filterCon = filterExpression[filterKey].condition
      const filterVal = filterExpression[filterKey].value

      if (filterKey && filterVal) {
        i++

        if (filterCon === 'begins_with' || filterCon === 'contains') {
          if (i === 1) tempFilterExpression = `${filterCon}(#${filterKey}, :${filterKey})`
          if (i > 1) tempFilterExpression = tempFilterExpression + ` AND ${filterCon}(#${filterKey}, :${filterKey})`
        }
        //
        else {
          if (i === 1) tempFilterExpression = `#${filterKey} ${filterCon} :${filterKey}`
          if (i > 1) tempFilterExpression = tempFilterExpression + ` AND #${filterKey} ${filterCon} :${filterKey}`
        }
        params.ExpressionAttributeNames[`#${filterKey}`] = `${filterKey}`
        params.ExpressionAttributeValues[`:${filterKey}`] = filterVal
      }
    }

    params['FilterExpression'] = tempFilterExpression
  }

  if (!IndexName) delete params.IndexName

  let res = await dynamodbQuery(dynamoDb, params)
  dataList.push(...(res.Items as any))

  while (dataList.length < pageSize && Object.prototype.hasOwnProperty.call(res, 'LastEvaluatedKey')) {
    const newParams = {
      ...params,
      ExclusiveStartKey: res.LastEvaluatedKey,
    }

    res = await dynamodbQuery(dynamoDb, newParams)
    dataList.push(...(res.Items as any))
  }

  // => [Encode] nextToken
  let _nextToken = null
  if (res?.LastEvaluatedKey) {
    _nextToken = encode(JSON.stringify(res.LastEvaluatedKey))
  }

  return { items: dataList, newNextToken: _nextToken as string }
}

// Scan Multiple
const scanMultipleItems = async (
  dynamoDb: DocumentClient,
  TableName: string,
  nextToken: string,
  pageSize: number,
  filterExpression: Record<string, IValueFilterExpression> | null = null,
): Promise<{ items: DocumentClient.ItemList; newNextToken: string }> => {
  const dataList: DocumentClient.ItemList = []

  let ExclusiveStartKey = null
  if (nextToken) {
    ExclusiveStartKey = decode(nextToken)
    ExclusiveStartKey = JSON.parse(ExclusiveStartKey)
  }

  const params = {
    TableName,
    Limit: pageSize,
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: {},
    ExclusiveStartKey: ExclusiveStartKey,
  } as DocumentClient.QueryInput & {
    ExpressionAttributeNames: Record<string, string> | any
    ExpressionAttributeValues: Record<string, string> | any
  }

  let i = 0
  let tempFilterExpression: string | any
  if (typeof filterExpression === 'object') {
    for (const key in filterExpression) {
      const filterKey = key
      const filterCon = filterExpression[filterKey].condition
      const filterVal = filterExpression[filterKey].value

      if (filterKey && filterVal) {
        i++
        if (filterCon === 'begins_with' || filterCon === 'contains') {
          if (i === 1) tempFilterExpression = `${filterCon}(#${filterKey}, :${filterKey})`
          if (i > 1) tempFilterExpression = tempFilterExpression + ` AND ${filterCon}(#${filterKey}, :${filterKey})`
        } else {
          if (i === 1) tempFilterExpression = `#${filterKey} ${filterCon} :${filterKey}`
          if (i > 1) tempFilterExpression = tempFilterExpression + ` AND #${filterKey} ${filterCon} :${filterKey}`
        }
        params.ExpressionAttributeNames[`#${filterKey}`] = `${filterKey}`
        params.ExpressionAttributeValues[`:${filterKey}`] = filterVal
      }
    }

    params['FilterExpression'] = tempFilterExpression
  }

  if (
    Object.keys(params.ExpressionAttributeNames).length === 0 &&
    Object.keys(params.ExpressionAttributeValues).length === 0
  ) {
    delete params.ExpressionAttributeNames
    delete params.ExpressionAttributeValues
  }

  let res = await dynamodbScan(dynamoDb, params)
  dataList.push(...(res.Items as any))

  while (dataList.length < pageSize && Object.prototype.hasOwnProperty.call(res, 'LastEvaluatedKey')) {
    const newParams = {
      ...params,
      ExclusiveStartKey: res.LastEvaluatedKey,
    }

    res = await dynamodbScan(dynamoDb, newParams)
    dataList.push(...(res.Items as any))
  }

  // => [Encode] nextToken
  let _nextToken = null
  if (res?.LastEvaluatedKey) {
    _nextToken = encode(JSON.stringify(res.LastEvaluatedKey))
  }

  return { items: dataList, newNextToken: _nextToken as string }
}

// Query Until Done
const queryUntilDone = async (
  dynamoDb: DocumentClient,
  TableName: string,
  IndexName: string | null = null,
  partitionKeyName: string,
  partitionKeyValue: string | number,
  sortKeyName: string | null = null,
  sortKeyValue: string | number | null = null,
  sortKeyCondition: ICondition | null = null, // Case BETWEEN not Cover in this function
  filterExpression: Record<string, IValueFilterExpression> | null = null,
  scanIndexForward: boolean | null = true,
): Promise<DocumentClient.ItemList> => {
  const dataList: DocumentClient.ItemList = []

  const params = {
    TableName,
    KeyConditionExpression: `#${partitionKeyName} = :${partitionKeyName}`,
    ExpressionAttributeNames: {
      [`#${partitionKeyName}`]: `${partitionKeyName}`,
    },
    ExpressionAttributeValues: {
      [`:${partitionKeyName}`]: partitionKeyValue,
    },
  } as DocumentClient.QueryInput & {
    ExpressionAttributeNames: Record<string, string> | any
    ExpressionAttributeValues: Record<string, string> | any
  }

  if (IndexName) params['IndexName'] = IndexName
  if (scanIndexForward) params['ScanIndexForward'] = scanIndexForward

  if (sortKeyValue) {
    if (sortKeyCondition === 'begins_with' || sortKeyCondition === 'contains') {
      params.KeyConditionExpression = `#${partitionKeyName} = :${partitionKeyName} AND ${sortKeyCondition}(#${sortKeyName}, :${sortKeyName})`
    } else {
      params.KeyConditionExpression = `#${partitionKeyName} = :${partitionKeyName} AND #${sortKeyName} ${sortKeyCondition} :${sortKeyName}`
    }
    params.ExpressionAttributeNames[`#${sortKeyName}`] = `${sortKeyName}`
    params.ExpressionAttributeValues[`:${sortKeyName}`] = sortKeyValue
  }

  let i = 0
  let tempFilterExpression: string | any
  if (typeof filterExpression === 'object') {
    for (const key in filterExpression) {
      const filterKey = key
      const filterCon = filterExpression[filterKey].condition
      const filterVal = filterExpression[filterKey].value

      if (filterKey && filterVal) {
        i++
        if (filterCon === 'begins_with' || filterCon === 'contains') {
          if (i === 1) tempFilterExpression = `${filterCon}(#${filterKey}, :${filterKey})`
          if (i > 1) tempFilterExpression = tempFilterExpression + ` AND ${filterCon}(#${filterKey}, :${filterKey})`
        } else {
          if (i === 1) tempFilterExpression = `#${filterKey} ${filterCon} :${filterKey}`
          if (i > 1) tempFilterExpression = tempFilterExpression + ` AND #${filterKey} ${filterCon} :${filterKey}`
        }
        params.ExpressionAttributeNames[`#${filterKey}`] = `${filterKey}`
        params.ExpressionAttributeValues[`:${filterKey}`] = filterVal
      }
    }

    params['FilterExpression'] = tempFilterExpression
  }

  if (!IndexName) delete params.IndexName

  let data = await dynamoDb.query(params).promise()
  dataList.push(...(data.Items as any))
  while (Object.prototype.hasOwnProperty.call(data, 'LastEvaluatedKey')) {
    const newParams = {
      ...params,
      ExclusiveStartKey: data.LastEvaluatedKey,
    }
    data = await dynamoDb.query(newParams).promise()
    dataList.push(...(data.Items as any))
  }
  return dataList
}

// Delete Single
const deleteSingleItem = async (
  dynamoDb: DocumentClient,
  TableName: string,
  partitionKeyName: string,
  partitionKeyValue: string | number,
  sortKeyName: string | null = null,
  sortKeyValue: string | number | null = null,
): Promise<DocumentClient.DeleteItemOutput> => {
  const Key = {
    [partitionKeyName]: partitionKeyValue,
  }
  if (sortKeyName && sortKeyValue) Key[sortKeyName] = sortKeyValue
  const paramsGet: DocumentClient.DeleteItemInput = {
    TableName,
    Key,
  }
  return await dynamoDb.delete(paramsGet).promise()
}

// Transaction Write
const transactWrite = async (dynamoDb: DocumentClient, params: DocumentClient.TransactWriteItemsInput) => {
  const chunkSize = 50
  const transactWritePromise: Promise<PromiseResult<DocumentClient.TransactWriteItemsOutput, AWSError>>[] = []

  for (let i = 0; i < params.TransactItems.length; i += chunkSize) {
    const chunk = params.TransactItems.slice(i, i + chunkSize)
    transactWritePromise.push(
      dynamoDb
        .transactWrite({
          TransactItems: chunk,
        })
        .promise(),
    )
  }
  await Promise.all(transactWritePromise)
}

// Update From Attribute
const dynamoDBUpdateFromAttributes = (input: any, ignoreKeyList: string[] = []): UpdateSubParams => {
  let UpdateExpression = 'SET'
  const ExpressionAttributeValues: any = {}
  const ExpressionAttributeNames: any = {}

  for (const [key, value] of Object.entries(input)) {
    if (ignoreKeyList.includes(key)) continue
    UpdateExpression += ` #${key} = :${key},`
    ExpressionAttributeNames[`#${key}`] = key
    ExpressionAttributeValues[`:${key}`] = value
  }
  UpdateExpression = UpdateExpression.substr(0, UpdateExpression.length - 1)

  return {
    UpdateExpression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
  }
}

export {
  dynamodbQuery,
  dynamodbScan,
  dynamodbDelete,
  dynamodbUpdate,
  dynamodbPut,
  dynamodbBatchGetItems,
  getSingleItem,
  getMultipleItems,
  scanMultipleItems,
  queryUntilDone,
  deleteSingleItem,
  transactWrite,
  dynamoDBUpdateFromAttributes,
}

// 1. Dùng cú pháp IMPORT thay vì REQUIRE
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "DynamoDBCLoudJobs";
const PARTITION_KEY = "Ngoctri22071@";

export const handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

  let body;
  let statusCode = 200;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  try {
    const method = event.httpMethod || event.requestContext?.http?.method;

    switch (method) {
      case "GET":
        // Nếu có path parameter (job ID), lấy chi tiết job
        const jobId = event.pathParameters?.id || event.pathParameters?.jobId;

        if (jobId) {
          // GET /jobs/:id - Lấy chi tiết job
          const keyParams = {};
          keyParams[PARTITION_KEY] = jobId;

          const getCmd = new GetCommand({
            TableName: TABLE_NAME,
            Key: keyParams,
          });

          const item = await docClient.send(getCmd);

          if (!item.Item) {
            statusCode = 404;
            body = { error: "Job không tồn tại" };
          } else {
            body = item.Item;
          }
        } else {
          // GET /jobs - Lấy danh sách jobs
          const scanCmd = new ScanCommand({ TableName: TABLE_NAME });
          const data = await docClient.send(scanCmd);

          // Filter out các item không phải job (có title hoặc _id)
          const jobs = (data.Items || []).filter(
            (item) => item.title || item._id || item.id
          );

          body = jobs;
        }
        break;

      case "POST":
        if (!event.body) throw new Error("Body is empty");

        let requestJSON =
          typeof event.body === "string" ? JSON.parse(event.body) : event.body;

        // Nếu client gửi lên {_id: "1", title: "..."} thì code sẽ tạo thêm cột "Ngoctri22071@": "1"
        const idValue = requestJSON.id || requestJSON._id;

        if (!idValue) {
          throw new Error(`Dữ liệu thiếu ID (cần trường 'id' hoặc '_id')`);
        }

        // Gán giá trị vào đúng tên Partition Key lạ của bạn
        requestJSON[PARTITION_KEY] = idValue;

        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: requestJSON,
          })
        );

        body = { message: "Success", item: requestJSON };
        break;

      case "PUT":
        // UPDATE job
        if (!event.body) throw new Error("Body is empty");

        let updateJSON =
          typeof event.body === "string" ? JSON.parse(event.body) : event.body;

        // Lấy ID từ path parameter hoặc body
        const updateId =
          event.pathParameters?.id ||
          event.pathParameters?.jobId ||
          updateJSON.id ||
          updateJSON._id;

        if (!updateId) {
          throw new Error(
            `Dữ liệu thiếu ID (cần trường 'id' hoặc '_id' hoặc path parameter)`
          );
        }

        // Tạo key để update
        const updateKeyParams = {};
        updateKeyParams[PARTITION_KEY] = updateId;

        // Build update expression
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        // Update các field (trừ PARTITION_KEY và id/_id)
        Object.keys(updateJSON).forEach((key, index) => {
          if (key !== PARTITION_KEY && key !== "id" && key !== "_id") {
            const attrName = `#attr${index}`;
            const attrValue = `:val${index}`;
            updateExpressions.push(`${attrName} = ${attrValue}`);
            expressionAttributeNames[attrName] = key;
            expressionAttributeValues[attrValue] = updateJSON[key];
          }
        });

        if (updateExpressions.length === 0) {
          throw new Error("Không có field nào để update");
        }

        await docClient.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: updateKeyParams,
            UpdateExpression: `SET ${updateExpressions.join(", ")}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
          })
        );

        // Lấy lại item sau khi update
        const getUpdatedCmd = new GetCommand({
          TableName: TABLE_NAME,
          Key: updateKeyParams,
        });
        const updatedItem = await docClient.send(getUpdatedCmd);

        body = { message: "Updated successfully", item: updatedItem.Item };
        break;

      case "DELETE":
        // Lấy ID từ path parameter hoặc query string
        const deleteId =
          event.pathParameters?.id ||
          event.pathParameters?.jobId ||
          event.queryStringParameters?.id;

        if (!deleteId) {
          throw new Error(
            `Thiếu ID (cần path parameter :id hoặc query ?id=...)`
          );
        }

        // Tạo key xóa đúng với tên cột đặc biệt của bạn
        const deleteKeyParams = {};
        deleteKeyParams[PARTITION_KEY] = deleteId;

        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: deleteKeyParams,
          })
        );

        body = {
          message: `Deleted item with ID: ${deleteId}`,
          deletedId: deleteId,
        };
        break;

      default:
        throw new Error(`Method ${method} not supported`);
    }
  } catch (err) {
    console.error("Error:", err);
    statusCode = 400;
    body = { error: err.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers,
  };
};

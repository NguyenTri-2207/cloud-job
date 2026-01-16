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
        // Nếu có query parameter id hoặc _id, lấy chi tiết job
        // Frontend dùng id, nên ưu tiên id trước
        let jobId =
          event.queryStringParameters?.id ||
          event.queryStringParameters?._id ||
          event.pathParameters?.id ||
          event.pathParameters?.jobId;

        // Remove quotes nếu có (trường hợp ?_id="value")
        if (jobId) {
          jobId = jobId
            .toString()
            .replace(/^["']|["']$/g, "")
            .trim();
        }

        if (jobId) {
          // GET /jobs?_id=... - Lấy chi tiết job
          console.log("Getting job with ID:", jobId);
          console.log("Query params:", event.queryStringParameters);

          const keyParams = {};
          keyParams[PARTITION_KEY] = jobId;

          console.log("DynamoDB Key:", JSON.stringify(keyParams));
          console.log("Partition Key name:", PARTITION_KEY);

          const getCmd = new GetCommand({
            TableName: TABLE_NAME,
            Key: keyParams,
          });

          const item = await docClient.send(getCmd);

          console.log("DynamoDB result:", item.Item ? "Found" : "Not found");

          if (!item.Item) {
            // Debug: Scan table để xem items có gì
            console.log("Item not found, scanning table for debugging...");
            const scanCmd = new ScanCommand({ TableName: TABLE_NAME });
            const scanResult = await docClient.send(scanCmd);
            console.log("Total items in table:", scanResult.Items?.length || 0);

            // Log một vài items đầu tiên để xem structure
            if (scanResult.Items && scanResult.Items.length > 0) {
              console.log("Sample items (first 3):");
              scanResult.Items.slice(0, 3).forEach((item, index) => {
                console.log(`Item ${index + 1}:`, {
                  partitionKey: item[PARTITION_KEY],
                  _id: item._id,
                  id: item.id,
                  title: item.title,
                });
              });
            }

            statusCode = 404;
            body = {
              error: "Job không tồn tại",
              searchedId: jobId,
              partitionKey: PARTITION_KEY,
              totalItemsInTable: scanResult.Items?.length || 0,
            };
          } else {
            body = item.Item;
          }
        } else {
          // GET /jobs - Lấy danh sách jobs
          const scanCmd = new ScanCommand({ TableName: TABLE_NAME });
          const data = await docClient.send(scanCmd);

          // Filter out các item không phải job (có title hoặc id)
          // Frontend dùng id, nên ưu tiên check id trước
          const jobs = (data.Items || []).filter(
            (item) => item.title || item.id || item._id
          );

          body = jobs;
        }
        break;

      case "POST":
        if (!event.body) throw new Error("Body is empty");

        let requestJSON =
          typeof event.body === "string" ? JSON.parse(event.body) : event.body;

        // Frontend dùng id, nên ưu tiên id trước _id
        // Nếu client gửi lên {id: "1", title: "..."} thì code sẽ tạo thêm cột "Ngoctri22071@": "1"
        const idValue = requestJSON.id || requestJSON._id;

        if (!idValue) {
          throw new Error(`Dữ liệu thiếu ID (cần trường 'id' hoặc '_id')`);
        }

        // Normalize ID
        const normalizedId = String(idValue).trim();

        // Gán giá trị vào đúng tên Partition Key - partition key = id
        requestJSON[PARTITION_KEY] = normalizedId;

        // Đảm bảo cả id và _id đều có cùng giá trị (normalized)
        requestJSON.id = normalizedId;
        requestJSON._id = normalizedId;

        console.log("Creating job with ID:", idValue);
        console.log("Item to save:", JSON.stringify(requestJSON));

        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: requestJSON,
          })
        );

        console.log(
          "Job created successfully with partition key:",
          PARTITION_KEY,
          "=",
          idValue
        );

        body = { message: "Success", item: requestJSON };
        break;

      case "PUT":
        // UPDATE job
        if (!event.body) throw new Error("Body is empty");

        let updateJSON =
          typeof event.body === "string" ? JSON.parse(event.body) : event.body;

        // Lấy ID từ query parameter id hoặc path parameter
        // Frontend dùng id, nên ưu tiên id trước
        const updateId =
          event.queryStringParameters?.id ||
          event.queryStringParameters?._id ||
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
        // Lấy ID từ query parameter id hoặc path parameter
        // Frontend dùng id, nên ưu tiên id trước
        let deleteId =
          event.queryStringParameters?.id ||
          event.queryStringParameters?._id ||
          event.pathParameters?.id ||
          event.pathParameters?.jobId;

        console.log("DELETE - Raw deleteId from event:", deleteId);
        console.log(
          "DELETE - queryStringParameters:",
          JSON.stringify(event.queryStringParameters)
        );
        console.log(
          "DELETE - pathParameters:",
          JSON.stringify(event.pathParameters)
        );

        // Remove quotes và normalize
        if (deleteId) {
          deleteId = String(deleteId)
            .replace(/^["']|["']$/g, "")
            .trim();
          console.log("DELETE - Normalized deleteId:", deleteId);
        }

        if (!deleteId) {
          throw new Error(
            `Thiếu ID (cần path parameter :id hoặc query ?id=...)`
          );
        }

        // Tạo key xóa đúng với tên cột đặc biệt của bạn
        // CHỈ dùng id làm partition key, KHÔNG dùng title
        const deleteKeyParams = {};
        deleteKeyParams[PARTITION_KEY] = deleteId;

        console.log(
          "DELETE - DeleteCommand Key:",
          JSON.stringify(deleteKeyParams)
        );

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

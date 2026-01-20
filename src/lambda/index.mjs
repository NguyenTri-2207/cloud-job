import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

// 1. CONFIGURATION 
const TABLE_NAME = process.env.TABLE_NAME || "DynamoDBCLoudJobs";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "Ngoctri22071@";

// 2. INIT DYNAMODB CLIENT
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// 3. MAIN HANDLER 
export const handler = async (event) => {
  console.log("Event:", event.httpMethod, event.path);

  try {
    const method = event.httpMethod || event.requestContext?.http?.method;

    // Handle CORS Preflight
    if (method === "OPTIONS") return sendResponse(200, "");

    switch (method) {
      case "GET":
        return await handleGet(event);
      case "POST":
        return await handlePost(event);
      case "PUT":
        return await handlePut(event);
      case "DELETE":
        return await handleDelete(event);
      default:
        return sendResponse(405, { error: `Method ${method} not allowed` });
    }
  } catch (err) {
    console.error("Handler Error:", err);
    return sendResponse(500, { error: err.message });
  }
};

// ---------------------------------------------------------
// 4. BUSINESS LOGIC FUNCTIONS 
// ---------------------------------------------------------

async function handleGet(event) {
  const id = extractId(event);

  if (id) {
    // Get 1 id Job details
    const params = {
      TableName: TABLE_NAME,
      Key: { [PRIMARY_KEY]: id },
    };
    const { Item } = await docClient.send(new GetCommand(params));
    
    if (!Item) return sendResponse(404, { error: "Job not found", id });
    return sendResponse(200, Item);
  } else {
    // Lấy danh sách Jobs
    const { Items } = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    // Lọc rác (chỉ lấy item có title hoặc id)
    const jobs = (Items || []).filter((item) => item.title || item.id);
    return sendResponse(200, jobs);
  }
}

async function handlePost(event) {
  const body = parseBody(event);
  if (!body.id) throw new Error("Missing 'id' in body");

  // Chuẩn hóa dữ liệu
  const id = String(body.id).trim();
  const newItem = { 
    ...body, 
    id: id, 
    [PRIMARY_KEY]: id // Mapping ID vào Partition Key
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: newItem,
  }));

  return sendResponse(201, { message: "Created", item: newItem });
}

async function handlePut(event) {
  const body = parseBody(event);
  const id = extractId(event) || body.id; // Ưu tiên ID trên URL
  
  if (!id) throw new Error("Missing ID for update");

  // Build Dynamic Update Expression (Tự động tạo câu update dựa trên body gửi lên)
  const updateKey = { [PRIMARY_KEY]: String(id).trim() };
  let updateExp = "SET";
  const expAttrNames = {};
  const expAttrValues = {};
  
  const fields = Object.keys(body).filter(k => k !== "id" && k !== PRIMARY_KEY);
  if (fields.length === 0) throw new Error("No fields to update");

  fields.forEach((key, idx) => {
    updateExp += ` #key${idx} = :val${idx},`;
    expAttrNames[`#key${idx}`] = key;
    expAttrValues[`:val${idx}`] = body[key];
  });
  
  // Xóa dấu phẩy cuối cùng
  updateExp = updateExp.slice(0, -1);

  const { Attributes } = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: updateKey,
    UpdateExpression: updateExp,
    ExpressionAttributeNames: expAttrNames,
    ExpressionAttributeValues: expAttrValues,
    ReturnValues: "ALL_NEW",
  }));

  return sendResponse(200, { message: "Updated", item: Attributes });
}

async function handleDelete(event) {
  const id = extractId(event);
  if (!id) throw new Error("Missing ID for delete");

  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { [PRIMARY_KEY]: id },
  }));

  return sendResponse(200, { message: "Deleted", id });
}

// ---------------------------------------------------------
// 5. HELPER FUNCTIONS (Các hàm tiện ích dùng chung)
// ---------------------------------------------------------

// Helper: Trả về JSON Response chuẩn CORS
const sendResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Quan trọng cho Frontend gọi vào
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  },
  body: JSON.stringify(body),
});

// Helper: Lấy ID từ mọi nguồn (Query, Path) và làm sạch
const extractId = (event) => {
  const rawId = event.queryStringParameters?.id || event.pathParameters?.id || event.pathParameters?.jobId;
  if (!rawId) return null;
  return String(rawId).replace(/^["']|["']$/g, "").trim();
};

// Helper: Parse Body an toàn
const parseBody = (event) => {
  if (!event.body) return {};
  return typeof event.body === "string" ? JSON.parse(event.body) : event.body;
};
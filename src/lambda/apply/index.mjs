// Lambda handler riêng cho Apply API
// Endpoint: POST /jobs/{jobId}/apply
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "DynamoDBCLoudJobs";
const PARTITION_KEY = "Ngoctri22071@";

export const handler = async (event) => {
  console.log("Apply event received:", JSON.stringify(event));

  let body;
  let statusCode = 200;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
  };

  try {
    const method = event.httpMethod || event.requestContext?.http?.method;

    // Handle CORS preflight (OPTIONS request)
    if (method === "OPTIONS") {
      return {
        statusCode: 200,
        body: "",
        headers,
      };
    }

    // Chỉ xử lý POST request
    if (method !== "POST") {
      throw new Error(`Method ${method} not allowed. Only POST is supported.`);
    }

    // Validate body
    if (!event.body) {
      throw new Error("Body is required");
    }

    let requestJSON =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    // Get jobId from path parameter
    const path = event.path || event.requestContext?.http?.path || "";
    const applyJobId =
      event.pathParameters?.jobId ||
      event.pathParameters?.id ||
      path.split("/").slice(-2, -1)[0]; // Extract from path like /jobs/{jobId}/apply

    if (!applyJobId) {
      throw new Error("Job ID is required in path parameter");
    }

    if (!requestJSON.cvFileKey) {
      throw new Error("CV file key is required");
    }

    // Generate application ID
    const applicationId = `app_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Prepare application data
    const applicationData = {
      [PARTITION_KEY]: applicationId,
      id: applicationId,
      jobId: applyJobId,
      cvFileKey: requestJSON.cvFileKey,
      coverLetter: requestJSON.coverLetter || "",
      allowSearch: requestJSON.allowSearch || false,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    // Save application to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: applicationData,
      })
    );

    console.log("Application submitted successfully:", applicationId);

    body = {
      success: true,
      applicationId,
      jobId: applyJobId,
      cvFileKey: requestJSON.cvFileKey,
      submittedAt: applicationData.submittedAt,
    };

    statusCode = 200;
  } catch (err) {
    console.error("Error in apply handler:", err);
    statusCode = 400;
    body = { error: err.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers,
  };
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "DynamoDBCLoudJobs";

export const handler = async (event) => {
  console.log("Apply API event:", JSON.stringify(event));

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };

  try {
    const method = event.httpMethod || event.requestContext?.http?.method;

    // Handle CORS
    if (method === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    if (method !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: "Only POST is allowed" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }

    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { jobId, cvFileKey, coverLetter = "" } = body;

    if (!jobId || !cvFileKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "jobId and cvFileKey are required",
        }),
      };
    }

    const applicationId = `app_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    const item = {
      ["Ngoctri22071@"]: applicationId, 
      applicationId,
      jobId,
      cvFileKey,
      coverLetter,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        applicationId,
        jobId,
      }),
    };
  } catch (error) {
    console.error("Apply job error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Internal Server Error", 
      }),
    };
  }
};

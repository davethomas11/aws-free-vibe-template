// AWS Lambda Function URL Handler (Node.js 20+ ESM)
// Zero npm dependencies required: @aws-sdk/* is built into the AWS Lambda runtime,
// and when running locally without TABLE_NAME set, it falls back to an in-memory store.

const TABLE_NAME = process.env.TABLE_NAME || "";
const memoryStore = new Map();

// Lazy-load AWS SDK only when running against a real DynamoDB table
let docClient = null;
let ddbLib = null;

async function getDynamoClient() {
  if (!TABLE_NAME) return null;
  if (!docClient) {
    const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
    ddbLib = await import("@aws-sdk/lib-dynamodb");
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-west-2" });
    docClient = ddbLib.DynamoDBDocumentClient.from(client);
  }
  return docClient;
}

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

export async function handler(event) {
  const method = event?.requestContext?.http?.method || event?.httpMethod || "GET";
  const path = event?.rawPath || event?.path || "/";

  // Handle CORS preflight if not already handled by FunctionUrlConfig
  if (method === "OPTIONS") {
    return { statusCode: 204, body: "" };
  }

  try {
    // GET / or GET /health — Health & mode check
    if (method === "GET" && (path === "/" || path === "/health")) {
      return jsonResponse(200, {
        ok: true,
        service: "web-vibe-starter-api",
        storageMode: TABLE_NAME ? `dynamodb (${TABLE_NAME})` : "local-memory",
        timestamp: new Date().toISOString(),
      });
    }

    // GET /items — List items
    if (method === "GET" && path === "/items") {
      const client = await getDynamoClient();
      if (client) {
        const res = await client.send(
          new ddbLib.QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk",
            ExpressionAttributeValues: { ":pk": "ITEM" },
          })
        );
        return jsonResponse(200, { items: res.Items || [] });
      }
      return jsonResponse(200, { items: Array.from(memoryStore.values()) });
    }

    // POST /items — Create an item
    if (method === "POST" && path === "/items") {
      const body = event.body ? JSON.parse(event.body) : {};
      const id = body.id || crypto.randomUUID();
      const item = {
        pk: "ITEM",
        sk: `ITEM#${id}`,
        id,
        text: body.text || "Untitled item",
        createdAt: new Date().toISOString(),
      };

      const client = await getDynamoClient();
      if (client) {
        await client.send(
          new ddbLib.PutCommand({
            TableName: TABLE_NAME,
            Item: item,
          })
        );
      } else {
        memoryStore.set(item.sk, item);
      }

      return jsonResponse(201, { item });
    }

    return jsonResponse(404, { error: `Route not found: ${method} ${path}` });
  } catch (err) {
    console.error("Handler error:", err);
    return jsonResponse(500, { error: err.message || "Internal Server Error" });
  }
}
